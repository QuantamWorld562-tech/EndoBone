/* eslint-disable react/no-unknown-property */
/**
 * BoneModelViewer — Clinical Anatomical 3D Bone Model & Dynamic Risk Heatmap Shader
 * Features:
 * - Real human anatomical femur 3D geometry (/storage/bones/femur.glb)
 * - Shading: High-Risk Femoral Neck = Deep Vibrant Red (#ef4444), Moderate Greater Trochanter = Bright Orange (#f97316), Healthy Shaft & Base = Clean White (#ffffff)
 * - Transform-invariant vertex color calculation: transforms mesh coordinates into unified rootGroup space to guarantee vibrant Red/Orange colors regardless of GLB units
 * - All floating popups removed from 3D canvas; interactive inspection handled in sidebar
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF } from '@react-three/drei';
import { Eye, EyeOff, ScanLine } from 'lucide-react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Risk Heatmap Colors
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_WHITE  = new THREE.Color('#ffffff');
const COLOR_ORANGE = new THREE.Color('#f97316');
const COLOR_RED    = new THREE.Color('#ef4444');

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
  'femoral-neck':       [0.26, 0.74, 0.12],
  'greater-trochanter': [-0.18, 0.54, 0.08],
  shaft:                [0.02, -0.05, 0.06],
  'vertebral-body':     [0.00, 0.05, 0.22],
  acetabulum:           [-0.18, -0.58, 0.18],
};

const RADII = {
  'femoral-neck': 0.55,
  'greater-trochanter': 0.48,
  shaft: 0.55,
  'vertebral-body': 0.42,
  acetabulum: 0.32,
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
      { id: 'greater-trochanter', riskLevel: 'moderate', note: 'Moderate bone thinning at trochanteric insertion. Bone turnover markers elevated.' },
      { id: 'shaft', riskLevel: 'low', note: 'Bone density and structural thickness within normal biomechanical tolerance.' },
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
      radius: Number(z.radius) || RADII[canId] || 0.48,
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
// Dynamic Risk Shading: Red (High Risk), Orange (Moderate), White (Healthy)
// ─────────────────────────────────────────────────────────────────────────────

function applyRiskShading(mesh, zones, rootGroup) {
  const geo = mesh.geometry;
  const pos = geo?.getAttribute('position');
  if (!geo || !pos || !rootGroup) return;

  rootGroup.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);

  const colors = new Float32Array(pos.count * 3);
  const vert = new THREE.Vector3();
  const worldVert = new THREE.Vector3();
  const localPos = new THREE.Vector3();
  const tempCol = new THREE.Color();

  // Find min/max Y of this mesh in unified rootGroup space
  let minY = 9999, maxY = -9999;
  for (let i = 0; i < pos.count; i++) {
    vert.fromBufferAttribute(pos, i);
    worldVert.copy(vert).applyMatrix4(mesh.matrixWorld);
    localPos.copy(worldVert);
    rootGroup.worldToLocal(localPos);
    if (localPos.y < minY) minY = localPos.y;
    if (localPos.y > maxY) maxY = localPos.y;
  }
  const heightRange = Math.max(0.001, maxY - minY);

  const highRiskZones = zones.filter(z => z.riskLevel === 'high');
  const modRiskZones  = zones.filter(z => z.riskLevel === 'moderate');

  for (let i = 0; i < pos.count; i++) {
    vert.fromBufferAttribute(pos, i);
    worldVert.copy(vert).applyMatrix4(mesh.matrixWorld);
    localPos.copy(worldVert);
    rootGroup.worldToLocal(localPos);

    // Normal bone base is clean WHITE
    tempCol.copy(COLOR_WHITE);

    // Height ratio (0 at bottom condyles, 1.0 at top femoral head/neck)
    const normY = THREE.MathUtils.clamp((localPos.y - minY) / heightRange, 0.0, 1.0);

    let maxHighInf = 0.0;
    let maxModInf  = 0.0;

    // 1. Distance to high-risk zone anchors in rootGroup space
    for (const z of highRiskZones) {
      const anchorVec = new THREE.Vector3(...z.anchor);
      const dist = localPos.distanceTo(anchorVec);
      const inf = 1.0 - THREE.MathUtils.smoothstep(dist, z.radius * 0.12, z.radius);
      if (inf > maxHighInf) maxHighInf = inf;
    }

    // 2. Distance to moderate-risk zone anchors in rootGroup space
    for (const z of modRiskZones) {
      const anchorVec = new THREE.Vector3(...z.anchor);
      const dist = localPos.distanceTo(anchorVec);
      const inf = 1.0 - THREE.MathUtils.smoothstep(dist, z.radius * 0.12, z.radius);
      if (inf > maxModInf) maxModInf = inf;
    }

    // 3. Anatomical top elevation for Femoral Head & Neck (Red Hotspot)
    if (normY > 0.64) {
      const neckInf = THREE.MathUtils.clamp((normY - 0.64) / 0.28, 0.0, 1.0);
      maxHighInf = Math.max(maxHighInf, neckInf);
    }

    // 4. Anatomical trochanteric elevation for Greater Trochanter (Orange)
    if (normY >= 0.44 && normY <= 0.74) {
      const trochanterInf = 1.0 - Math.abs(normY - 0.58) / 0.16;
      if (trochanterInf > 0) {
        maxModInf = Math.max(maxModInf, trochanterInf * 0.88);
      }
    }

    // Blend colors: Clean White -> Orange (Moderate) -> Crimson Red (High Risk)
    if (maxHighInf > 0.05) {
      const w = Math.min(1.0, Math.pow(maxHighInf, 1.05));
      tempCol.lerp(COLOR_ORANGE, w * 0.35).lerp(COLOR_RED, w * 0.98);
    } else if (maxModInf > 0.05) {
      const w = Math.min(1.0, maxModInf * 0.92);
      tempCol.lerp(COLOR_ORANGE, w);
    }

    colors[i * 3]     = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.attributes.color.needsUpdate = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Material Factory
// ─────────────────────────────────────────────────────────────────────────────

function createBoneMaterial(mode) {
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
      color: '#ffffff', roughness: 0.38, metalness: 0.02,
      clearcoat: 0.15, clearcoatRoughness: 0.5,
      side: THREE.DoubleSide,
    });
  }

  // Risk Heatmap: Vertex colored (White normal, Orange moderate, Red high risk) with clean medical sheen
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.32,
    metalness: 0.02,
    clearcoat: 0.20,
    clearcoatRoughness: 0.35,
    reflectivity: 0.45,
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = `varying vec3 vWorldPos;\n${shader.vertexShader}`.replace(
      '#include <worldpos_vertex>',
      '#include <worldpos_vertex>\nvWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;'
    );

    shader.fragmentShader = `
      varying vec3 vWorldPos;

      // 3D Voronoi for internal trabecular structural micro-texture
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

      // Soft clean medical Fresnel rim sheen
      vec3 vDir = normalize(cameraPosition - vWorldPos);
      float fresnel = pow(1.0 - max(0.0, dot(normalize(vNormal), vDir)), 2.4);
      gl_FragColor.rgb += vec3(0.95, 0.98, 1.0) * fresnel * 0.25;

      // Subtle porous trabecular texture modulation
      float cell = voronoi(vWorldPos * 34.0);
      float lattice = smoothstep(0.12, 0.65, cell);
      gl_FragColor.rgb *= mix(0.90, 1.10, lattice);
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
        applyRiskShading(mesh, zones, rootRef.current);
        mesh.material = createBoneMaterial('heatmap');
      } else {
        mesh.geometry.deleteAttribute('color');
        mesh.material = createBoneMaterial(mode);
      }
      mesh.material.needsUpdate = true;
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
      {/* 100% clean 3D Canvas — no popups or overlapping boxes on model */}
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
// Viewport Overlay (View Controls + Clean Risk Heatmap Legend)
// ─────────────────────────────────────────────────────────────────────────────

const P = { background: 'rgba(3,7,18,0.90)', backdropFilter: 'blur(18px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, fontFamily: 'system-ui' };

function ViewportOverlay({ preset, onPreset, isXray, onXray, zones }) {
  const highCount = zones.filter(z => z.riskLevel === 'high').length;
  const modCount  = zones.filter(z => z.riskLevel === 'moderate').length;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Top-Right: View Controls */}
      <div className="pointer-events-auto absolute right-4 top-4" style={{ width: 178 }}>
        <div style={{ ...P, overflow: 'hidden' }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#7dd3fc', textTransform: 'uppercase' }}>View Controls</span>
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

      {/* Bottom-Right: Clean Risk Heatmap Legend */}
      <div className="pointer-events-none absolute right-4 bottom-5">
        <div style={{ ...P, overflow: 'hidden', width: 178 }}>
          <div style={{ padding: '7px 11px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ScanLine size={11} color="#7dd3fc" />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.16em', color: '#7dd3fc', textTransform: 'uppercase' }}>Risk Heatmap</span>
            </div>
            {highCount > 0 && <span style={{ fontSize: 9, fontWeight: 900, color: '#f87171', background: 'rgba(127,29,29,0.4)', border: '1px solid rgba(239,68,68,0.4)', padding: '1px 5px', borderRadius: 4 }}>CRITICAL</span>}
          </div>
          <div style={{ padding: '9px 11px', display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <div style={{
              width: 9, borderRadius: 4, flexShrink: 0,
              background: 'linear-gradient(to top, #ffffff 0%, #f97316 50%, #ef4444 100%)',
              boxShadow: '0 0 10px rgba(239,68,68,0.2)',
            }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: 10, fontWeight: 700 }}>
              <div className="flex justify-between text-red-400">
                <span>High Risk</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="flex justify-between text-orange-400">
                <span>Moderate</span>
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              </div>
              <div className="flex justify-between text-slate-100">
                <span>Normal Bone</span>
                <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400" />
              </div>
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
  onZoneHover,
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
        <ambientLight intensity={0.65} color="#ffffff" />
        <directionalLight position={[4, 6, 4]} intensity={1.35} color="#ffffff" castShadow />
        <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#93c5fd" />
        <directionalLight position={[0, -4, -4]} intensity={0.3} color="#cbd5e1" />
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
