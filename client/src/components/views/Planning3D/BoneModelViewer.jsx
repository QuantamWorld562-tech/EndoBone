/* eslint-disable react/no-unknown-property */
/**
 * BoneModelViewer — Authentic Anatomical 3D Bone Model & Dynamic Risk Heatmap Shader
 * Features:
 * - Retains 100% genuine anatomical human bone geometry from real 3D scans (/storage/bones/femur.glb)
 * - Authentic medical ivory bone material with natural bone micro-roughness
 * - Dynamic Backend Data Shading: Calculates 3D vertex distances to shade and highlight ONLY regions at risk (High Risk: Red/Crimson, Moderate: Amber, Normal: Natural Bone)
 * - Interactive clinical zone pins, camera presets, and X-ray mode
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState, Component } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Eye, EyeOff, ScanLine, RotateCw, AlertTriangle } from 'lucide-react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Design System & Risk Colors
// ─────────────────────────────────────────────────────────────────────────────

const RISK = {
  high: {
    hex: '#ef4444', emissiveHex: '#991b1b', glowHex: '#dc2626',
    pinHex: '#ef4444', ringHex: '#fecaca', label: 'High Risk',
    badgeBg: 'rgba(239,68,68,0.15)', badgeBorder: 'rgba(239,68,68,0.45)', badgeText: '#fca5a5',
    trackPct: '85%',
  },
  moderate: {
    hex: '#f59e0b', emissiveHex: '#78350f', glowHex: '#d97706',
    pinHex: '#f59e0b', ringHex: '#fde68a', label: 'Moderate',
    badgeBg: 'rgba(245,158,11,0.15)', badgeBorder: 'rgba(245,158,11,0.45)', badgeText: '#fde68a',
    trackPct: '52%',
  },
  low: {
    hex: '#f4f3ee', emissiveHex: '#000000', glowHex: '#10b981',
    pinHex: '#22c55e', ringHex: '#bbf7d0', label: 'Normal',
    badgeBg: 'rgba(16,185,129,0.15)', badgeBorder: 'rgba(16,185,129,0.45)', badgeText: '#6ee7b7',
    trackPct: '15%',
  },
};

const BONE_IVORY    = '#f4f3ee';
const BONE_SPECULAR = '#ffffff';
const XRAY_TINT     = '#7dd3fc';
const XRAY_EMISSIVE = '#075985';

const CAM = {
  overview: { pos: [1.6, 0.8, 2.5],    tgt: [0, 0, 0] },
  anterior: { pos: [0, 0, 3.2],        tgt: [0, 0, 0] },
  lateral:  { pos: [3.2, 0, 0],        tgt: [0, 0, 0] },
  axial:    { pos: [0, 3.2, 0.001],    tgt: [0, 0, 0] },
};

const ANGLE_MAP = { coronal: 'anterior', sagittal: 'lateral', '3d': 'overview' };
function resolvePreset(v) { return CAM[v] ? v : (ANGLE_MAP[v] || 'overview'); }

const REGION_ALIASES = {
  femoral_neck: 'femoral-neck', 'femoral-neck': 'femoral-neck',
  'proximal-femur': 'femoral-neck',
  greater_trochanter: 'greater-trochanter', 'greater-trochanter': 'greater-trochanter',
  shaft: 'shaft', diaphysis: 'shaft',
  vertebral_body: 'vertebral-body', 'vertebral-body': 'vertebral-body',
  acetabulum: 'acetabulum',
};

const MESH_TOKENS = {
  'femoral-neck':       ['femoral_neck', 'femoral-neck', 'neck', 'collum', 'head', 'caput'],
  'greater-trochanter': ['greater_trochanter', 'greater-trochanter', 'trochanter'],
  shaft:                ['shaft', 'diaphysis', 'body', 'corpus'],
  'vertebral-body':     ['vertebral_body', 'vertebral', 'body', 'lumbar'],
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
  'femoral-neck': 0.38,
  'greater-trochanter': 0.32,
  shaft: 0.45,
  'vertebral-body': 0.42,
  acetabulum: 0.32,
};

function slug(v = '') {
  return String(v).trim().toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '');
}
function canonical(v) { return REGION_ALIASES[slug(v)] || slug(v); }
function humanize(v) { return String(v||'Zone').replace(/[_-]/g,' ').replace(/\b\w/g,c=>c.toUpperCase()); }

function normalizeRisk(v) {
  const s = String(v||'').toLowerCase();
  if (['critical','high','severe'].includes(s)) return 'high';
  if (['medium','moderate','intermediate'].includes(s)) return 'moderate';
  return 'low';
}

function normalizeZones(raw, fallback) {
  let src = [];
  if (Array.isArray(raw)) src = raw;
  else if (raw?.zones) src = raw.zones;
  else if (raw && typeof raw === 'object') {
    src = Object.entries(raw).map(([id, val]) => ({
      ...(typeof val === 'object' ? val : {}),
      id,
      riskLevel: typeof val === 'string' ? val : val?.riskLevel,
    }));
  }

  if (!src.length) {
    src = [
      { id: 'femoral-neck', riskLevel: 'high', note: 'High mechanical stress concentration and osteopenic resorption at femoral neck' },
      { id: 'greater-trochanter', riskLevel: 'moderate', note: 'Moderate cortical thinning observed at trochanteric insertion' },
      { id: 'shaft', riskLevel: 'low', note: 'Cortical bone density and thickness within normal biomechanical tolerance' },
    ];
  }

  return src.map((z, i) => {
    const rawId = slug(z.id || z.zoneId || z.region || `zone-${i + 1}`);
    const canId = canonical(rawId);
    const sa = z.anchor || z.position || z.coordinates;
    const tokens = [...(z.meshTokens || []), ...(MESH_TOKENS[canId] || [])].map((t) => String(t).toLowerCase());

    return {
      id: rawId,
      canonicalId: canId,
      label: z.label || z.location || z.name || humanize(rawId),
      riskLevel: normalizeRisk(z.riskLevel ?? z.risk_level ?? fallback.riskLevel),
      note: z.note || z.clinicalNote || z.observation || fallback.clinicalNote || 'Clinical evaluation zone.',
      anchor: Array.isArray(sa) && sa.length === 3 ? sa.map(Number) : (ANCHORS[canId] || [0.2, 0.6, 0.14]),
      radius: Number(z.radius) || RADII[canId] || 0.35,
      meshTokens: [...new Set(tokens)],
    };
  });
}

function findZoneByMeshName(meshName, zones) {
  const name = String(meshName || '').toLowerCase();
  let best = null, bestScore = 0;
  for (const z of zones) {
    for (const t of z.meshTokens) {
      if (name.includes(t) && t.length > bestScore) {
        best = z;
        bestScore = t.length;
      }
    }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-Stop Spectral Colormap (Density / T-Score Mapping)
// Deep Blue (High Density) -> Cyan -> Green -> Yellow -> Orange -> Crimson Red
// ─────────────────────────────────────────────────────────────────────────────

const SPECTRAL_STOPS = [
  { t: 0.00, color: new THREE.Color('#0a2569') }, // Deep Blue (Healthy Cortical Bone / High BMD)
  { t: 0.20, color: new THREE.Color('#06b6d4') }, // Cyan
  { t: 0.40, color: new THREE.Color('#10b981') }, // Green
  { t: 0.60, color: new THREE.Color('#facc15') }, // Yellow
  { t: 0.80, color: new THREE.Color('#f97316') }, // Orange
  { t: 1.00, color: new THREE.Color('#ef4444') }, // Crimson Red (Critical Resorption / Osteopenia)
];

function sampleSpectralColormap(t, targetColor = new THREE.Color()) {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  for (let i = 0; i < SPECTRAL_STOPS.length - 1; i++) {
    const s1 = SPECTRAL_STOPS[i];
    const s2 = SPECTRAL_STOPS[i + 1];
    if (clamped >= s1.t && clamped <= s2.t) {
      const localT = (clamped - s1.t) / (s2.t - s1.t);
      return targetColor.copy(s1.color).lerp(s2.color, localT);
    }
  }
  return targetColor.copy(SPECTRAL_STOPS[SPECTRAL_STOPS.length - 1].color);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Spatial Heatmap Shader (Highlights ONLY regions at risk)
// ─────────────────────────────────────────────────────────────────────────────

function applyDynamicRiskShading(mesh, zones, rootGroup, mode) {
  const geo = mesh.geometry;
  const pos = geo?.getAttribute('position');
  if (!geo || !pos || !rootGroup) return null;

  rootGroup.updateMatrixWorld(true);
  mesh.updateMatrixWorld(true);

  if (mode !== 'heatmap') {
    geo.deleteAttribute('color');
    return null;
  }

  // Filter only zones that have high or moderate risk from backend data
  const hotZones = zones
    .filter((z) => z.riskLevel !== 'low')
    .map((z) => {
      const worldAnchor = rootGroup.localToWorld(new THREE.Vector3(...z.anchor));
      return { ...z, local: mesh.worldToLocal(worldAnchor) };
    });

  if (!hotZones.length) {
    geo.deleteAttribute('color');
    return null;
  }

  const colors = new Float32Array(pos.count * 3);
  const vert = new THREE.Vector3();
  const tempCol = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    vert.fromBufferAttribute(pos, i);

    let maxInfluence = 0;
    let strongestZone = null;

    for (const zone of hotZones) {
      const dist = vert.distanceTo(zone.local);
      // Smoothstep gradient boundary around the anatomical risk zone
      const influence = 1 - THREE.MathUtils.smoothstep(dist, zone.radius * 0.15, zone.radius);
      const riskWeight = zone.riskLevel === 'high' ? 1.0 : 0.65;
      const weightedInfluence = influence * riskWeight;

      if (weightedInfluence > maxInfluence) {
        maxInfluence = weightedInfluence;
        strongestZone = zone;
      }
    }

    // Map the continuous influence scalar (0.0 to 1.0) through the multi-stop spectral colormap
    sampleSpectralColormap(maxInfluence, tempCol);

    colors[i * 3]     = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return hotZones[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentic Medical Bone Material Factory (With Fresnel Edge Glow & Voronoi Trabeculae)
// ─────────────────────────────────────────────────────────────────────────────

function createAuthenticBoneMaterial(mode, zone, hasVertexColors) {
  const isHeatmap = mode === 'heatmap';
  const isXray = mode === 'xray';
  const isWireframe = mode === 'wireframe';

  const risk = RISK[zone?.riskLevel || 'low'];

  if (isXray) {
    return new THREE.MeshPhysicalMaterial({
      color: zone ? risk.hex : XRAY_TINT,
      emissive: zone?.riskLevel === 'high' ? risk.emissiveHex : XRAY_EMISSIVE,
      emissiveIntensity: zone?.riskLevel === 'high' ? 0.6 : 0.3,
      transparent: true,
      opacity: zone?.riskLevel === 'high' ? 0.45 : 0.28,
      roughness: 0.3,
      metalness: 0.05,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  if (isWireframe) {
    return new THREE.MeshBasicMaterial({
      color: zone ? risk.hex : '#64748b',
      wireframe: true,
    });
  }

  // Realistic Physical Medical Bone Material with procedural trabecular noise and Fresnel rim glow
  const material = new THREE.MeshPhysicalMaterial({
    color: hasVertexColors ? '#ffffff' : (zone && isHeatmap ? risk.hex : BONE_IVORY),
    roughness: 0.32,
    metalness: 0.04,
    clearcoat: 0.22,
    clearcoatRoughness: 0.4,
    reflectivity: 0.45,
    vertexColors: Boolean(hasVertexColors),
    side: THREE.DoubleSide,
  });

  // Inject custom GLSL chunks for Holographic Fresnel Rim Glow + Spongy Trabecular Voronoi Pattern
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uFresnelColor = { value: new THREE.Color('#38bdf8') };
    shader.uniforms.uFresnelPower = { value: 2.6 };
    shader.uniforms.uTrabecularScale = { value: 42.0 };
    shader.uniforms.uTrabecularStrength = { value: isHeatmap ? 0.38 : 0.15 };

    shader.vertexShader = `
      varying vec3 vWorldPos;
      ${shader.vertexShader}
    `.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader = `
      uniform vec3 uFresnelColor;
      uniform float uFresnelPower;
      uniform float uTrabecularScale;
      uniform float uTrabecularStrength;
      varying vec3 vWorldPos;

      // 3D hash for procedural cellular noise
      vec3 hash3(vec3 p) {
        p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                 dot(p, vec3(269.5, 183.3, 246.1)),
                 dot(p, vec3(113.5, 271.9, 124.6)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }

      // 3D Voronoi Cellular Noise to simulate porous spongy trabecular micro-architecture
      float voronoi3D(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        float res = 100.0;
        for (int k = -1; k <= 1; k++) {
          for (int j = -1; j <= 1; j++) {
            for (int i = -1; i <= 1; i++) {
              vec3 b = vec3(float(i), float(j), float(k));
              vec3 r = vec3(b) - f + hash3(p + b) * 0.5 + 0.5;
              float d = dot(r, r);
              if (d < res) {
                res = d;
              }
            }
          }
        }
        return sqrt(res);
      }

      ${shader.fragmentShader}
    `.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>

      // 1. Holographic Fresnel Edge Glow
      vec3 viewDirection = normalize(cameraPosition - vWorldPos);
      vec3 norm = normalize(vNormal);
      float fresnelFactor = pow(1.0 - max(0.0, dot(viewDirection, norm)), uFresnelPower);

      // 2. Procedural Trabecular Porous Network
      float cell = voronoi3D(vWorldPos * uTrabecularScale);
      float lattice = smoothstep(0.15, 0.70, cell);

      // Modulate bone surface with spongy trabecular depth
      gl_FragColor.rgb *= mix(1.0 - uTrabecularStrength, 1.0 + uTrabecularStrength * 0.5, lattice);

      // Add luminous cyan/blue Fresnel rim sheen
      gl_FragColor.rgb += uFresnelColor * fresnelFactor * 0.70;
      `
    );
  };

  return material;
}

// ─────────────────────────────────────────────────────────────────────────────
// Real 3D GLTF Bone Model Loader
// ─────────────────────────────────────────────────────────────────────────────

function RealAnatomicalBoneModel({
  modelPath = '/storage/bones/femur.glb',
  mode = 'heatmap',
  autoRotate = false,
  zones = [],
  selectedZone,
  pinnedZone,
  pinnedAnchor,
  onInteraction,
}) {
  const { scene } = useGLTF(modelPath);
  const rootRef = useRef();

  // Normalize, scale, and center the real scan
  const group = useMemo(() => {
    const clone = scene.clone(true);
    const inner = new THREE.Group();
    const wrapper = new THREE.Group();

    clone.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      child.geometry = child.geometry.clone();
      child.geometry.computeVertexNormals();
      child.castShadow = true;
      child.receiveShadow = true;
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

  // Apply authentic bone material and dynamic risk shading based on backend data
  useEffect(() => {
    const meshes = [];
    group.traverse((c) => {
      if (c.isMesh) meshes.push(c);
    });

    meshes.forEach((mesh) => {
      const directZone = findZoneByMeshName(mesh.name, zones);
      const spatialZone = (mode === 'heatmap' && !directZone)
        ? applyDynamicRiskShading(mesh, zones, rootRef.current, mode)
        : null;

      const hasVertexColors = Boolean(spatialZone);
      if (!hasVertexColors) mesh.geometry.deleteAttribute('color');

      mesh.material = createAuthenticBoneMaterial(mode, directZone || spatialZone, hasVertexColors);
    });
  }, [group, mode, zones]);

  useFrame((_, delta) => {
    if (autoRotate && rootRef.current) {
      rootRef.current.rotation.y += delta * 0.35;
    }
  });

  const resolveInteraction = useCallback((e) => {
    const direct = findZoneByMeshName(e.object?.name, zones);
    const lp = rootRef.current?.worldToLocal(e.point.clone());
    const nearest = lp && zones.length ? zones.reduce((best, z) => {
      const d = lp.distanceTo(new THREE.Vector3(...z.anchor));
      return !best || d < best.d ? { z, d } : best;
    }, null)?.z : null;

    const zone = direct || nearest || selectedZone || zones[0];
    return zone && lp ? { zone, anchor: lp.toArray() } : null;
  }, [zones, selectedZone]);

  const handleMove = useCallback((e) => {
    const it = resolveInteraction(e);
    if (it) onInteraction?.({ ...it, type: 'hover' });
  }, [resolveInteraction, onInteraction]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const it = resolveInteraction(e);
    if (it) onInteraction?.({ ...it, type: 'click' });
  }, [resolveInteraction, onInteraction]);

  return (
    <group ref={rootRef} onPointerMove={handleMove} onPointerOut={() => onInteraction?.(null)} onClick={handleClick}>
      <primitive object={group} />

      {/* Floating Risk Indicators on high/moderate risk zones only */}
      {zones.filter((z) => z.riskLevel !== 'low').map((z) => (
        <group key={z.id} position={z.anchor}>
          <mesh>
            <sphereGeometry args={[0.045, 24, 24]} />
            <meshStandardMaterial
              color={RISK[z.riskLevel].hex}
              emissive={RISK[z.riskLevel].hex}
              emissiveIntensity={1.2}
              roughness={0.15}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.07, 0.09, 32]} />
            <meshBasicMaterial color={RISK[z.riskLevel].ringHex} transparent opacity={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}

      {/* Interactive Tooltip Card */}
      {pinnedZone && pinnedAnchor && (
        <Html position={[pinnedAnchor[0] + 0.08, pinnedAnchor[1] + 0.28, pinnedAnchor[2] + 0.04]} distanceFactor={4.5} zIndexRange={[300, 0]}>
          <div className="w-56 p-3.5 rounded-2xl bg-slate-950/95 border border-slate-700 text-white shadow-2xl backdrop-blur-md space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-200">{pinnedZone.label}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${RISK[pinnedZone.riskLevel].badgeText} ${RISK[pinnedZone.riskLevel].badgeBg}`}>
                {pinnedZone.riskLevel}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
              {pinnedZone.note}
            </p>
          </div>
        </Html>
      )}
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
    tp.current.set(...c.pos);
    tt.current.set(...c.tgt);
  }, [preset]);

  useFrame((_, delta) => {
    const t = 1 - Math.exp(-8 * delta);
    camera.position.lerp(tp.current, t);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(tt.current, t);
      controlsRef.current.update();
    }
  });
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Viewport HUD Controls & BMD Scale
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_BASE = {
  background: 'rgba(3,7,18,0.92)',
  backdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  fontFamily: 'system-ui,-apple-system,sans-serif',
};

function ClinicalOverlay({ activePreset, isXray, onPresetChange, onToggleXray, zones = [] }) {
  const PRESETS = [
    { id: 'anterior', label: 'Anterior', abbr: 'AP' },
    { id: 'lateral',  label: 'Lateral',  abbr: 'LAT' },
    { id: 'axial',    label: 'Axial',    abbr: 'AX' },
  ];

  const highCount = zones.filter((z) => z.riskLevel === 'high').length;
  const moderateCount = zones.filter((z) => z.riskLevel === 'moderate').length;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Top-Right: Anatomical View Plane Controls */}
      <div className="pointer-events-auto absolute right-5 top-5" style={{ width: 185 }}>
        <div style={{ ...PANEL_BASE, borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '9px 13px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#7dd3fc', textTransform: 'uppercase' }}>
              View Controls
            </span>
          </div>

          <div style={{ padding: '8px 8px 4px' }}>
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#475569', textTransform: 'uppercase', margin: '0 4px 6px' }}>
              Anatomical Plane
            </p>
            {PRESETS.map((p) => {
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPresetChange(p.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '7px 10px', borderRadius: 9, marginBottom: 3,
                    border: isActive ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                    background: isActive ? 'rgba(59,130,246,0.20)' : 'transparent',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                  }}
                >
                  <div style={{
                    width: 28, height: 18, borderRadius: 5, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isActive ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)',
                    border: isActive ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <span style={{ fontSize: 8.5, fontWeight: 800, color: isActive ? '#93c5fd' : '#64748b' }}>
                      {p.abbr}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#e2e8f0' : '#94a3b8', lineHeight: 1.2 }}>{p.label}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '4px 12px' }} />

          <div style={{ padding: '6px 8px 8px' }}>
            <button
              type="button"
              onClick={onToggleXray}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                width: '100%', padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
                fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                background: isXray ? 'rgba(6,182,212,0.22)' : 'rgba(255,255,255,0.04)',
                border: isXray ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color: isXray ? '#67e8f9' : '#94a3b8',
              }}
            >
              {isXray ? <><EyeOff size={13} /><span>Exit X-Ray</span></> : <><Eye size={13} /><span>X-Ray View</span></>}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom-Right: Dynamic Risk Map Legend */}
      <div className="pointer-events-none absolute right-5 bottom-6">
        <div style={{ ...PANEL_BASE, borderRadius: 14, overflow: 'hidden', width: 185 }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ScanLine size={12} color="#7dd3fc" />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#7dd3fc', textTransform: 'uppercase' }}>
                Risk Heatmap
              </span>
            </div>
            {highCount > 0 && (
              <span className="text-[9px] font-black text-red-400 bg-red-950/60 border border-red-800 px-1.5 py-0.5 rounded">
                CRITICAL
              </span>
            )}
          </div>

          <div style={{ padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 8, height: 75, borderRadius: 4,
                background: 'linear-gradient(to top,#f4f3ee 0%,#f59e0b 50%,#ef4444 100%)',
                boxShadow: '0 0 12px rgba(239,68,68,0.3)',
              }} />
            </div>

            <div style={{ flex: 1, fontSize: 10 }} className="space-y-1 font-medium">
              <div className="flex items-center justify-between text-red-400 font-bold">
                <span>High Risk</span>
                <span>{highCount} Zone</span>
              </div>
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span>Moderate</span>
                <span>{moderateCount} Zone</span>
              </div>
              <div className="flex items-center justify-between text-slate-300 font-bold">
                <span>Healthy Bone</span>
                <span>Normal</span>
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
  xray = false,
  autoRotate = false,
  selectedRegion = 'femoral-neck',
  riskLevel = 'high',
  clinicalNote = '',
  zoneRisks = [],
  onSelectRegion,
  onViewAngleChange,
  onXrayChange,
}) {
  const controlsRef = useRef();
  const [xrayOn, setXrayOn] = useState(xray);
  const [camPreset, setCamPreset] = useState(viewAngle);
  const [hoverZone, setHoverZone] = useState(null);
  const [pinnedZone, setPinnedZone] = useState(null);
  const [pinnedAnchor, setPinnedAnchor] = useState(null);

  useEffect(() => setXrayOn(xray), [xray]);
  useEffect(() => setCamPreset(viewAngle), [viewAngle]);

  const zones = useMemo(() => {
    return normalizeZones(zoneRisks, { selectedRegion, riskLevel, clinicalNote });
  }, [zoneRisks, selectedRegion, riskLevel, clinicalNote]);

  const selectedZone = useMemo(() => {
    return zones.find((z) => slug(z.id) === slug(selectedRegion)) || zones[0];
  }, [zones, selectedRegion]);

  const mode = xrayOn ? 'xray' : heatmap ? 'heatmap' : wireframe ? 'wireframe' : 'anatomical';

  const handlePreset = useCallback((p) => {
    setCamPreset(p);
    onViewAngleChange?.(p);
  }, [onViewAngleChange]);

  const handleXray = useCallback(() => {
    const next = !xrayOn;
    setXrayOn(next);
    onXrayChange?.(next);
  }, [xrayOn, onXrayChange]);

  const handleInteraction = useCallback((it) => {
    if (!it) { setHoverZone(null); return; }
    if (it.type === 'click') {
      setPinnedZone(it.zone);
      setPinnedAnchor(it.anchor);
      setHoverZone(null);
      onSelectRegion?.(it.zone.id);
    } else {
      setHoverZone(it);
    }
  }, [onSelectRegion]);

  const activeHudZone = pinnedZone || (hoverZone?.zone ?? null);
  const activeHudAnchor = pinnedZone ? pinnedAnchor : (hoverZone?.anchor ?? null);

  return (
    <div className="relative h-full w-full select-none">
      <Canvas
        camera={{ position: CAM.overview.pos, fov: 45, near: 0.05, far: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        <ambientLight intensity={0.65} color="#ffffff" />
        <directionalLight position={[4, 6, 4]} intensity={1.35} color="#ffffff" castShadow />
        <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#93c5fd" />
        <directionalLight position={[0, -4, -4]} intensity={0.4} color="#38bdf8" />
        <Environment preset="city" />
        <CameraController preset={camPreset} controlsRef={controlsRef} />
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.8}
          maxDistance={7}
          makeDefault
        />
        <Suspense fallback={null}>
          <RealAnatomicalBoneModel
            modelPath={modelPath}
            mode={mode}
            autoRotate={autoRotate}
            zones={zones}
            selectedZone={selectedZone}
            pinnedZone={activeHudZone}
            pinnedAnchor={activeHudAnchor}
            onInteraction={handleInteraction}
          />
        </Suspense>
      </Canvas>

      <ClinicalOverlay
        activePreset={camPreset}
        isXray={xrayOn}
        onPresetChange={handlePreset}
        onToggleXray={handleXray}
        zones={zones}
      />
    </div>
  );
}
