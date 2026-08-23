/* eslint-disable react/no-unknown-property */
/**
 * BoneModelViewer — Clinical Thermal Bone Density Heatmap Renderer
 * Matches reference image exactly:
 * - Full thermal spectral colormap: Cyan/Blue (outer cortex) → Green → Yellow → Orange → Red/White (hotspots)
 * - Luminous internal trabecular network filaments
 * - Glowing electric cyan fresnel contour
 * - No popups — emits onZoneHover / onZoneClick events for the sidebar panel
 * - Floating minimal T-score line annotations (reference image style)
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Eye, EyeOff, ScanLine } from 'lucide-react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Thermal BMD Spectral Colormap (matching reference image)
// Cyan/Blue (healthy cortex, high BMD) → Green → Yellow → Orange → Red/White (critical)
// ─────────────────────────────────────────────────────────────────────────────

const THERMAL_STOPS = [
  { t: 0.00, r: 0.04, g: 0.22, b: 0.60 }, // Deep Navy Blue
  { t: 0.15, r: 0.00, g: 0.78, b: 0.95 }, // Electric Cyan (cortical rim)
  { t: 0.32, r: 0.06, g: 0.78, b: 0.50 }, // Teal-Green
  { t: 0.50, r: 0.18, g: 0.85, b: 0.12 }, // Vivid Green
  { t: 0.65, r: 0.95, g: 0.85, b: 0.00 }, // Radiant Yellow
  { t: 0.80, r: 1.00, g: 0.40, b: 0.00 }, // Blazing Orange
  { t: 0.92, r: 0.98, g: 0.08, b: 0.05 }, // Crimson Red
  { t: 1.00, r: 1.00, g: 0.95, b: 0.60 }, // White-Yellow hotspot core
];

function sampleThermal(t) {
  const c = Math.max(0.0, Math.min(1.0, t));
  for (let i = 0; i < THERMAL_STOPS.length - 1; i++) {
    const a = THERMAL_STOPS[i];
    const b = THERMAL_STOPS[i + 1];
    if (c >= a.t && c <= b.t) {
      const lt = (c - a.t) / (b.t - a.t);
      return [
        a.r + (b.r - a.r) * lt,
        a.g + (b.g - a.g) * lt,
        a.b + (b.b - a.b) * lt,
      ];
    }
  }
  const last = THERMAL_STOPS[THERMAL_STOPS.length - 1];
  return [last.r, last.g, last.b];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const RISK_HEX  = { high: '#ef4444', moderate: '#f97316', low: '#38bdf8' };
const RISK_RING = { high: '#fca5a5', moderate: '#fed7aa', low: '#bae6fd' };
const RISK_EMISSIVE = { high: '#7f1d1d', moderate: '#7c2d12', low: '#0c4a6e' };

const CAM = {
  overview: { pos: [1.6, 0.8, 2.5],  tgt: [0, 0, 0] },
  anterior: { pos: [0, 0, 3.2],      tgt: [0, 0, 0] },
  lateral:  { pos: [3.2, 0, 0],      tgt: [0, 0, 0] },
  axial:    { pos: [0, 3.2, 0.001],  tgt: [0, 0, 0] },
};

const REGION_ALIASES = {
  'femoral-neck': 'femoral-neck', femoral_neck: 'femoral-neck', 'proximal-femur': 'femoral-neck',
  'greater-trochanter': 'greater-trochanter', greater_trochanter: 'greater-trochanter',
  shaft: 'shaft', diaphysis: 'shaft',
  'vertebral-body': 'vertebral-body', vertebral_body: 'vertebral-body',
  acetabulum: 'acetabulum',
};
const MESH_TOKENS = {
  'femoral-neck':       ['femoral_neck', 'neck', 'collum', 'head', 'caput'],
  'greater-trochanter': ['trochanter', 'greater_trochanter'],
  shaft:                ['shaft', 'diaphysis', 'corpus'],
  'vertebral-body':     ['vertebral', 'lumbar'],
  acetabulum:           ['acetabulum', 'acetabular'],
};
const ANCHORS = {
  'femoral-neck':       [0.22, 0.78, 0.14],
  'greater-trochanter': [0.34, 0.58, 0.08],
  shaft:                [0.12, 0.00, 0.08],
  'vertebral-body':     [0.00, 0.05, 0.22],
  acetabulum:           [-0.18, -0.58, 0.18],
};
const RADII = {
  'femoral-neck': 0.42, 'greater-trochanter': 0.35,
  shaft: 0.45, 'vertebral-body': 0.42, acetabulum: 0.32,
};

function slug(v = '') {
  return String(v).trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function canonical(v) { return REGION_ALIASES[slug(v)] || slug(v); }
function humanize(v) { return String(v || 'Zone').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
function normalizeRisk(v) {
  const s = String(v || '').toLowerCase();
  if (['critical', 'high', 'severe'].includes(s)) return 'high';
  if (['medium', 'moderate', 'intermediate'].includes(s)) return 'moderate';
  return 'low';
}

function normalizeZones(raw, fallback) {
  let src = [];
  if (Array.isArray(raw)) src = raw;
  else if (raw?.zones) src = raw.zones;
  else if (raw && typeof raw === 'object') {
    src = Object.entries(raw).map(([id, val]) => ({
      ...(typeof val === 'object' ? val : {}), id,
      riskLevel: typeof val === 'string' ? val : val?.riskLevel,
    }));
  }
  if (!src.length) {
    src = [
      { id: 'femoral-neck', riskLevel: 'high', note: 'Critical osteopenic resorption with mechanical stress concentration at femoral neck. Fracture risk elevated.' },
      { id: 'greater-trochanter', riskLevel: 'moderate', note: 'Moderate cortical thinning at trochanteric insertion. Monitor bone turnover markers.' },
      { id: 'shaft', riskLevel: 'low', note: 'Cortical bone density and thickness within normal biomechanical tolerance.' },
    ];
  }
  return src.map((z, i) => {
    const rawId = slug(z.id || z.zoneId || z.region || `zone-${i + 1}`);
    const canId = canonical(rawId);
    const sa = z.anchor || z.position || z.coordinates;
    const tokens = [...(z.meshTokens || []), ...(MESH_TOKENS[canId] || [])].map(t => String(t).toLowerCase());
    return {
      id: rawId, canonicalId: canId,
      label: z.label || z.location || z.name || humanize(rawId),
      riskLevel: normalizeRisk(z.riskLevel ?? z.risk_level ?? fallback.riskLevel),
      note: z.note || z.clinicalNote || z.observation || fallback.clinicalNote || 'Clinical evaluation zone.',
      tScore: z.tScore || z.t_score || (rawId === 'femoral-neck' ? '-2.3' : rawId === 'greater-trochanter' ? '-1.9' : '-0.5'),
      vBMD: z.vBMD || (rawId === 'femoral-neck' ? '112.4' : rawId === 'greater-trochanter' ? '198.6' : '845.1'),
      anchor: Array.isArray(sa) && sa.length === 3 ? sa.map(Number) : (ANCHORS[canId] || [0.2, 0.6, 0.14]),
      radius: Number(z.radius) || RADII[canId] || 0.38,
      meshTokens: [...new Set(tokens)],
    };
  });
}

function findZoneByMeshName(meshName, zones) {
  const name = String(meshName || '').toLowerCase();
  let best = null, bestScore = 0;
  for (const z of zones) {
    for (const t of z.meshTokens) {
      if (name.includes(t) && t.length > bestScore) { best = z; bestScore = t.length; }
    }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Thermal Heatmap Shader (anatomically correct spectral shading matching reference)
// ─────────────────────────────────────────────────────────────────────────────

function applyThermalShading(mesh, zones, rootGroup) {
  const geo = mesh.geometry;
  const pos = geo?.getAttribute('position');
  if (!geo || !pos || !rootGroup) return;

  rootGroup.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);
  if (!geo.boundingBox) geo.computeBoundingBox();
  const bb = geo.boundingBox;

  const heightRange = Math.max(0.001, bb.max.y - bb.min.y);
  const midX = (bb.min.x + bb.max.x) * 0.5;
  const midZ = (bb.min.z + bb.max.z) * 0.5;
  const maxRadius = Math.max(0.001, Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) * 0.5);

  const mappedZones = zones.map(z => {
    const worldAnchor = rootGroup.localToWorld(new THREE.Vector3(...z.anchor));
    return { ...z, local: mesh.worldToLocal(worldAnchor) };
  });

  const colors = new Float32Array(pos.count * 3);
  const vert = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    vert.fromBufferAttribute(pos, i);

    // Anatomical height (0 = distal shaft, 1 = femoral head)
    const normY = Math.max(0, Math.min(1, (vert.y - bb.min.y) / heightRange));

    // Radial factor: 1.0 = inner trabecular marrow, 0.0 = outer cortical shell
    const dx = vert.x - midX, dz = vert.z - midZ;
    const radialDist = Math.sqrt(dx * dx + dz * dz);
    const coreFactor = Math.max(0, Math.min(1, 1.0 - (radialDist / maxRadius)));

    // Base thermal density: cortical rim = cyan (0.15), marrow = yellow-green (0.55)
    let t = 0.15 + coreFactor * 0.40;

    // Proximal region baseline elevation (higher metabolic activity at femur head/neck)
    if (normY > 0.55) {
      const proximal = (normY - 0.55) / 0.45;
      t += proximal * 0.22;
    }

    // Risk zone overlay — expands thermal hotspot based on backend data
    for (const z of mappedZones) {
      const dist = vert.distanceTo(z.local);
      const inf = 1.0 - THREE.MathUtils.smoothstep(dist, z.radius * 0.08, z.radius);
      if (inf > 0.001) {
        if (z.riskLevel === 'high') {
          // Blazing white-red core (matching reference image femoral neck hotspot)
          t = Math.max(t, 0.72 + inf * 0.28);
        } else if (z.riskLevel === 'moderate') {
          // Bright orange-yellow zone
          t = Math.max(t, 0.55 + inf * 0.18);
        }
      }
    }

    const [r, g, b] = sampleThermal(Math.max(0, Math.min(1, t)));
    colors[i * 3]     = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

// ─────────────────────────────────────────────────────────────────────────────
// Material Factory
// ─────────────────────────────────────────────────────────────────────────────

function createBoneMaterial(mode, hasVertexColors) {
  if (mode === 'xray') {
    return new THREE.MeshPhysicalMaterial({
      color: '#7dd3fc', emissive: '#075985', emissiveIntensity: 0.3,
      transparent: true, opacity: 0.28, roughness: 0.3, metalness: 0.05,
      side: THREE.DoubleSide, depthWrite: false,
    });
  }
  if (mode === 'wireframe') {
    return new THREE.MeshBasicMaterial({ color: '#4f46e5', wireframe: true });
  }
  if (mode === 'mesh') {
    return new THREE.MeshStandardMaterial({
      color: '#38bdf8', roughness: 0.25, metalness: 0.25,
      wireframe: true, side: THREE.DoubleSide,
    });
  }
  if (mode === 'anatomical') {
    return new THREE.MeshPhysicalMaterial({
      color: '#f8f4ed', roughness: 0.38, metalness: 0.02,
      clearcoat: 0.15, clearcoatRoughness: 0.5,
      side: THREE.DoubleSide,
    });
  }

  // Heatmap: vertex-colored thermal surface + luminous Fresnel glow
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', roughness: 0.22, metalness: 0.10,
    clearcoat: 0.30, clearcoatRoughness: 0.25, reflectivity: 0.60,
    vertexColors: true, side: THREE.DoubleSide,
  });

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uFresnelStrength = { value: 0.80 };
    shader.uniforms.uFresnelPower = { value: 2.0 };

    shader.vertexShader = `varying vec3 vWorldPos;\n${shader.vertexShader}`.replace(
      '#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
    );

    shader.fragmentShader = `
      uniform float uFresnelStrength;
      uniform float uFresnelPower;
      varying vec3 vWorldPos;

      // 3D Voronoi for internal trabecular filament network
      vec3 hash33(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yxz + 19.19);
        return fract((p.xxy + p.yxx) * p.zyx);
      }
      float voronoi(vec3 x) {
        vec3 ip = floor(x), fp = fract(x);
        float d = 1.0;
        for (int k=-1; k<=1; k++) for (int j=-1; j<=1; j++) for (int i=-1; i<=1; i++) {
          vec3 b = vec3(float(i),float(j),float(k));
          vec3 r = b + hash33(ip+b) - fp;
          d = min(d, dot(r,r));
        }
        return sqrt(d);
      }

      ${shader.fragmentShader}
    `.replace('#include <dithering_fragment>', `
      #include <dithering_fragment>

      // Electric cyan Fresnel rim glow (matching reference image contour)
      vec3 vDir = normalize(cameraPosition - vWorldPos);
      float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormal), vDir)), uFresnelPower);
      gl_FragColor.rgb += vec3(0.0, 0.82, 1.0) * fresnel * uFresnelStrength;

      // Spongy trabecular internal network (brightens lattice lines)
      float cell = voronoi(vWorldPos * 36.0);
      float lattice = smoothstep(0.10, 0.62, cell);
      gl_FragColor.rgb *= mix(0.68, 1.28, lattice);
    `);
  };

  return mat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Real Anatomical Bone Model
// ─────────────────────────────────────────────────────────────────────────────

function RealAnatomicalBoneModel({ modelPath, mode, autoRotate, zones, onZoneEvent }) {
  const { scene } = useGLTF(modelPath);
  const rootRef = useRef();

  const group = useMemo(() => {
    const clone = scene.clone(true);
    const inner = new THREE.Group();
    const wrapper = new THREE.Group();
    clone.traverse(c => {
      if (!c.isMesh || !c.geometry) return;
      c.geometry = c.geometry.clone();
      c.geometry.computeVertexNormals();
      c.castShadow = true; c.receiveShadow = true;
    });
    inner.add(clone);
    const ib = new THREE.Box3().setFromObject(inner);
    const is = ib.getSize(new THREE.Vector3());
    if (is.z > is.y && is.z > is.x) inner.rotation.x = -Math.PI / 2;
    wrapper.add(inner);
    const b = new THREE.Box3().setFromObject(wrapper);
    const c = b.getCenter(new THREE.Vector3());
    const s = b.getSize(new THREE.Vector3());
    const sc = 2.2 / (Math.max(s.x, s.y, s.z) || 1);
    wrapper.scale.setScalar(sc);
    wrapper.position.set(-c.x * sc, -c.y * sc, -c.z * sc);
    return wrapper;
  }, [scene]);

  useEffect(() => {
    const meshes = [];
    group.traverse(c => { if (c.isMesh) meshes.push(c); });

    meshes.forEach(mesh => {
      if (mode === 'heatmap') {
        applyThermalShading(mesh, zones, rootRef.current);
        mesh.material = createBoneMaterial('heatmap', true);
      } else {
        mesh.geometry.deleteAttribute('color');
        mesh.material = createBoneMaterial(mode, false);
      }
    });
  }, [group, mode, zones]);

  useFrame((_, delta) => {
    if (autoRotate && rootRef.current) rootRef.current.rotation.y += delta * 0.35;
  });

  const getZoneAtEvent = useCallback((e) => {
    const direct = findZoneByMeshName(e.object?.name, zones);
    const lp = rootRef.current?.worldToLocal(e.point.clone());
    const nearest = lp && zones.length ? zones.reduce((best, z) => {
      const d = lp.distanceTo(new THREE.Vector3(...z.anchor));
      return !best || d < best.d ? { z, d } : best;
    }, null)?.z : null;
    return { zone: direct || nearest || zones[0], point: lp?.toArray() };
  }, [zones]);

  return (
    <group
      ref={rootRef}
      onPointerMove={e => { const r = getZoneAtEvent(e); if (r.zone) onZoneEvent?.({ ...r, type: 'hover' }); }}
      onPointerOut={() => onZoneEvent?.({ type: 'out' })}
      onClick={e => { e.stopPropagation(); const r = getZoneAtEvent(e); if (r.zone) onZoneEvent?.({ ...r, type: 'click' }); }}
    >
      <primitive object={group} />

      {/* Minimal T-score line annotations (matching reference image style — no card boxes) */}
      {zones.filter(z => z.riskLevel !== 'low').map(z => {
        const isHigh = z.riskLevel === 'high';
        const isFemNeck = z.canonicalId === 'femoral-neck';
        return (
          <Html
            key={z.id}
            position={[z.anchor[0] + (isFemNeck ? -0.50 : 0.45), z.anchor[1], z.anchor[2]]}
            distanceFactor={4.2}
            zIndexRange={[100, 0]}
          >
            <div className="pointer-events-none select-none" style={{ whiteSpace: 'nowrap' }}>
              {/* Minimal plain-text annotation like reference image */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!isFemNeck && <div style={{ width: 36, height: 1, background: 'rgba(255,255,255,0.5)' }} />}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontFamily: 'system-ui', letterSpacing: 0 }}>
                    {z.label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: isHigh ? '#f87171' : '#fb923c', fontFamily: 'system-ui' }}>
                    T-Score: {z.tScore}
                  </div>
                </div>
                {isFemNeck && <div style={{ width: 36, height: 1, background: 'rgba(255,255,255,0.5)' }} />}
              </div>
            </div>
          </Html>
        );
      })}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera Controller
// ─────────────────────────────────────────────────────────────────────────────

function CameraController({ preset, controlsRef }) {
  const { camera } = useThree();
  const tp = useRef(new THREE.Vector3(...CAM.overview.pos));
  const tt = useRef(new THREE.Vector3(...CAM.overview.tgt));
  useEffect(() => {
    const c = CAM[preset] || CAM.overview;
    tp.current.set(...c.pos); tt.current.set(...c.tgt);
  }, [preset]);
  useFrame((_, delta) => {
    const t = 1 - Math.exp(-8 * delta);
    camera.position.lerp(tp.current, t);
    if (controlsRef.current) { controlsRef.current.target.lerp(tt.current, t); controlsRef.current.update(); }
  });
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Viewport Overlay (View Controls + Thermal Legend)
// ─────────────────────────────────────────────────────────────────────────────

const P = { background: 'rgba(3,7,18,0.90)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, fontFamily: 'system-ui' };

function ViewportOverlay({ preset, onPreset, isXray, onXray, zones }) {
  const highCount = zones.filter(z => z.riskLevel === 'high').length;
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Top-Right: View Controls */}
      <div className="pointer-events-auto absolute right-4 top-4" style={{ width: 178 }}>
        <div style={{ ...P, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 6px #22d3ee' }} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#67e8f9', textTransform: 'uppercase' }}>View Controls</span>
          </div>
          <div style={{ padding: '8px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '0 4px 5px' }}>Anatomical Plane</p>
            {[{ id: 'anterior', label: 'Anterior', abbr: 'AP' }, { id: 'lateral', label: 'Lateral', abbr: 'LAT' }, { id: 'axial', label: 'Axial', abbr: 'AX' }].map(p => (
              <button key={p.id} type="button" onClick={() => onPreset(p.id)} style={{
                display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                padding: '6px 8px', borderRadius: 8, marginBottom: 2,
                border: preset === p.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                background: preset === p.id ? 'rgba(59,130,246,0.18)' : 'transparent',
                cursor: 'pointer',
              }}>
                <div style={{ width: 26, height: 16, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: preset === p.id ? 'rgba(59,130,246,0.32)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 8, fontWeight: 800, color: preset === p.id ? '#93c5fd' : '#64748b' }}>{p.abbr}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: preset === p.id ? '#e2e8f0' : '#94a3b8' }}>{p.label}</span>
              </button>
            ))}
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 10px' }} />
          <div style={{ padding: '6px 8px 8px' }}>
            <button type="button" onClick={onXray} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              width: '100%', padding: '7px 8px', borderRadius: 8, cursor: 'pointer',
              fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
              background: isXray ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.04)',
              border: isXray ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.08)',
              color: isXray ? '#67e8f9' : '#94a3b8',
            }}>
              {isXray ? <EyeOff size={12} /> : <Eye size={12} />}
              <span>{isXray ? 'Exit X-Ray' : 'X-Ray View'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom-Right: Thermal Scale */}
      <div className="pointer-events-none absolute right-4 bottom-5">
        <div style={{ ...P, overflow: 'hidden', width: 178 }}>
          <div style={{ padding: '7px 11px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ScanLine size={11} color="#67e8f9" />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', color: '#67e8f9', textTransform: 'uppercase' }}>BMD Density</span>
            </div>
            {highCount > 0 && <span style={{ fontSize: 9, fontWeight: 900, color: '#f87171', background: 'rgba(127,29,29,0.4)', border: '1px solid rgba(239,68,68,0.4)', padding: '1px 5px', borderRadius: 4 }}>CRITICAL</span>}
          </div>
          <div style={{ padding: '9px 11px', display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <div style={{
              width: 9, borderRadius: 4, flexShrink: 0,
              background: 'linear-gradient(to top, #1539cc 0%, #00c8f2 18%, #10b981 35%, #eab308 55%, #f97316 74%, #ef4444 90%, #fffde7 100%)',
              boxShadow: '0 0 12px rgba(0,200,242,0.25)',
            }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, fontWeight: 700 }}>
              <span style={{ color: '#fef9c3' }}>Critical (Core)</span>
              <span style={{ color: '#f87171' }}>High Risk</span>
              <span style={{ color: '#fb923c' }}>Moderate</span>
              <span style={{ color: '#4ade80' }}>Normal</span>
              <span style={{ color: '#22d3ee' }}>Cortical Shell</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root Export
// ─────────────────────────────────────────────────────────────────────────────

export default function BoneModelViewer({
  modelPath = '/storage/bones/femur.glb',
  viewAngle = 'overview',
  heatmap = true,
  wireframe = false,
  meshMode = false,
  xray = false,
  autoRotate = false,
  selectedRegion = 'femoral-neck',
  riskLevel = 'high',
  clinicalNote = '',
  zoneRisks = [],
  onSelectRegion,
  onZoneHover,     // emits full zone object when hovered
  onViewAngleChange,
  onXrayChange,
}) {
  const controlsRef = useRef();
  const [xrayOn, setXrayOn] = useState(xray);
  const [camPreset, setCamPreset] = useState(viewAngle);

  useEffect(() => setXrayOn(xray), [xray]);
  useEffect(() => setCamPreset(viewAngle), [viewAngle]);

  const zones = useMemo(() =>
    normalizeZones(zoneRisks, { selectedRegion, riskLevel, clinicalNote }),
    [zoneRisks, selectedRegion, riskLevel, clinicalNote]
  );

  const mode = xrayOn ? 'xray' : meshMode ? 'mesh' : heatmap ? 'heatmap' : wireframe ? 'wireframe' : 'anatomical';

  const handleZoneEvent = useCallback((ev) => {
    if (!ev || ev.type === 'out') { onZoneHover?.(null); return; }
    if (ev.type === 'click') { onSelectRegion?.(ev.zone.id); onZoneHover?.(ev.zone); }
    else if (ev.type === 'hover') { onZoneHover?.(ev.zone); }
  }, [onSelectRegion, onZoneHover]);

  const handlePreset = useCallback((p) => {
    setCamPreset(p);
    onViewAngleChange?.(p);
  }, [onViewAngleChange]);

  const handleXray = useCallback(() => {
    const next = !xrayOn;
    setXrayOn(next);
    onXrayChange?.(next);
  }, [xrayOn, onXrayChange]);

  return (
    <div className="relative h-full w-full select-none">
      <Canvas
        camera={{ position: CAM.overview.pos, fov: 45, near: 0.05, far: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
        }}
      >
        <ambientLight intensity={0.55} color="#ffffff" />
        <directionalLight position={[4, 6, 4]} intensity={1.4} color="#ffffff" castShadow />
        <directionalLight position={[-4, 2, -2]} intensity={0.7} color="#93c5fd" />
        <directionalLight position={[0, -4, -4]} intensity={0.35} color="#38bdf8" />
        <Environment preset="city" />
        <CameraController preset={camPreset} controlsRef={controlsRef} />
        <OrbitControls ref={controlsRef} enableDamping dampingFactor={0.08} minDistance={0.8} maxDistance={7} makeDefault />
        <Suspense fallback={null}>
          <RealAnatomicalBoneModel
            modelPath={modelPath}
            mode={mode}
            autoRotate={autoRotate}
            zones={zones}
            onZoneEvent={handleZoneEvent}
          />
        </Suspense>
      </Canvas>
      <ViewportOverlay
        preset={camPreset}
        onPreset={handlePreset}
        isXray={xrayOn}
        onXray={handleXray}
        zones={zones}
      />
    </div>
  );
}
