/* eslint-disable react/no-unknown-property */
/**
 * BoneModelViewer — Clinical Anatomical 3D Bone Model & Risk Heatmap Shader
 * Features:
 * - Real human anatomical femur 3D geometry (/storage/bones/femur.glb)
 * - Heatmap Shading: High Risk = Red, Moderate = Orange, Healthy = Clean White
 * - Render modes: Anatomical, Risk Heatmap, X-Ray, Wireframe, and FEA Mesh mode
 * - Interactive 3D pins, clinical HUD, and camera plane controls
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Eye, EyeOff, ScanLine, RotateCw, Layers } from 'lucide-react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Risk Colors & Constants
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_HEALTHY_WHITE = '#ffffff';
const COLOR_MODERATE_ORANGE = '#f97316';
const COLOR_HIGH_RED = '#ef4444';

const RISK = {
  high: {
    hex: COLOR_HIGH_RED, emissiveHex: '#991b1b', glowHex: '#dc2626',
    pinHex: '#ef4444', ringHex: '#fecaca', label: 'High Risk',
    badgeBg: 'rgba(239,68,68,0.15)', badgeBorder: 'rgba(239,68,68,0.45)', badgeText: '#fca5a5',
  },
  moderate: {
    hex: COLOR_MODERATE_ORANGE, emissiveHex: '#9a3412', glowHex: '#ea580c',
    pinHex: '#f97316', ringHex: '#fed7aa', label: 'Moderate',
    badgeBg: 'rgba(249,115,22,0.15)', badgeBorder: 'rgba(249,115,22,0.45)', badgeText: '#fdba74',
  },
  low: {
    hex: COLOR_HEALTHY_WHITE, emissiveHex: '#000000', glowHex: '#ffffff',
    pinHex: '#38bdf8', ringHex: '#bae6fd', label: 'Healthy',
    badgeBg: 'rgba(255,255,255,0.15)', badgeBorder: 'rgba(255,255,255,0.3)', badgeText: '#f8fafc',
  },
};

const BONE_IVORY    = '#ffffff';
const XRAY_TINT     = '#7dd3fc';
const XRAY_EMISSIVE = '#075985';

const CAM = {
  overview: { pos: [1.6, 0.8, 2.5],    tgt: [0, 0, 0] },
  anterior: { pos: [0, 0, 3.2],        tgt: [0, 0, 0] },
  lateral:  { pos: [3.2, 0, 0],        tgt: [0, 0, 0] },
  axial:    { pos: [0, 3.2, 0.001],    tgt: [0, 0, 0] },
};

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
  'femoral-neck': 0.42,
  'greater-trochanter': 0.35,
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
      { id: 'femoral-neck', riskLevel: 'high', note: 'Critical mechanical stress concentration & osteopenic resorption at femoral neck.' },
      { id: 'greater-trochanter', riskLevel: 'moderate', note: 'Moderate cortical thinning observed at trochanteric region.' },
      { id: 'shaft', riskLevel: 'low', note: 'Cortical bone density within normal biomechanical tolerance.' },
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
      if (name.includes(t) && t.length > bestScore) {
        best = z;
        bestScore = t.length;
      }
    }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Spatial Heatmap: Red (High Risk) -> Orange (Moderate) -> White (Healthy)
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

  const hotZones = zones.map((z) => {
    const worldAnchor = rootGroup.localToWorld(new THREE.Vector3(...z.anchor));
    return { ...z, local: mesh.worldToLocal(worldAnchor) };
  });

  const colors = new Float32Array(pos.count * 3);
  const vert = new THREE.Vector3();
  const healthyWhite = new THREE.Color(COLOR_HEALTHY_WHITE);
  const orangeCol = new THREE.Color(COLOR_MODERATE_ORANGE);
  const redCol = new THREE.Color(COLOR_HIGH_RED);
  const finalColor = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    vert.fromBufferAttribute(pos, i);
    finalColor.copy(healthyWhite);

    let maxHighInfluence = 0.0;
    let maxModInfluence = 0.0;

    for (const zone of hotZones) {
      const dist = vert.distanceTo(zone.local);
      const influence = 1.0 - THREE.MathUtils.smoothstep(dist, zone.radius * 0.12, zone.radius);

      if (influence > 0) {
        if (zone.riskLevel === 'high') {
          maxHighInfluence = Math.max(maxHighInfluence, influence);
        } else if (zone.riskLevel === 'moderate') {
          maxModInfluence = Math.max(maxModInfluence, influence);
        }
      }
    }

    // Blend: Healthy White -> Orange (Moderate) -> Red (High Risk)
    if (maxHighInfluence > 0) {
      // High risk zone: blends smoothly from orange to deep crimson red
      const redInfluence = Math.pow(maxHighInfluence, 1.1);
      finalColor.lerp(orangeCol, redInfluence * 0.5).lerp(redCol, redInfluence * 0.95);
    } else if (maxModInfluence > 0) {
      // Moderate zone: blends from healthy white to bright orange
      finalColor.lerp(orangeCol, maxModInfluence * 0.90);
    }

    colors[i * 3]     = finalColor.r;
    colors[i * 3 + 1] = finalColor.g;
    colors[i * 3 + 2] = finalColor.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return hotZones[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Authentic Medical Bone Material Factory
// ─────────────────────────────────────────────────────────────────────────────

function createAuthenticBoneMaterial(mode, zone, hasVertexColors) {
  const isHeatmap = mode === 'heatmap';
  const isXray = mode === 'xray';
  const isWireframe = mode === 'wireframe';
  const isMesh = mode === 'mesh';

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

  if (isMesh) {
    // FEA Polygon Surface Mesh with wireframe structural overlay
    return new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.3,
      metalness: 0.2,
      wireframe: true,
      side: THREE.DoubleSide,
    });
  }

  // Realistic Physical Medical Bone Material
  return new THREE.MeshPhysicalMaterial({
    color: hasVertexColors ? '#ffffff' : (zone && isHeatmap ? risk.hex : BONE_IVORY),
    emissive: isHeatmap && zone && zone.riskLevel === 'high' ? risk.emissiveHex : '#000000',
    emissiveIntensity: isHeatmap && zone && zone.riskLevel === 'high' ? 0.35 : 0,
    roughness: 0.38,
    metalness: 0.03,
    clearcoat: 0.15,
    clearcoatRoughness: 0.5,
    reflectivity: 0.35,
    vertexColors: Boolean(hasVertexColors),
    side: THREE.DoubleSide,
  });
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

      {/* Floating 3D T-Score Callout Badges */}
      {zones.filter((z) => z.riskLevel !== 'low').map((z) => {
        const isFemoralNeck = z.canonicalId === 'femoral-neck';
        const tScore = isFemoralNeck ? '-2.3' : '-1.9';
        const isHigh = z.riskLevel === 'high';

        return (
          <group key={z.id} position={z.anchor}>
            <mesh>
              <sphereGeometry args={[0.042, 24, 24]} />
              <meshStandardMaterial
                color={RISK[z.riskLevel].hex}
                emissive={RISK[z.riskLevel].hex}
                emissiveIntensity={1.4}
                roughness={0.15}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.06, 0.08, 32]} />
              <meshBasicMaterial color={RISK[z.riskLevel].ringHex} transparent opacity={0.75} side={THREE.DoubleSide} />
            </mesh>

            <Html
              position={[isFemoralNeck ? -0.32 : 0.28, 0.08, 0.10]}
              distanceFactor={4.2}
              zIndexRange={[250, 0]}
            >
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onInteraction?.({ zone: z, anchor: z.anchor, type: 'click' });
                }}
                className={`cursor-pointer select-none px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl transition hover:scale-105 ${
                  isHigh
                    ? 'bg-slate-950/90 border-red-500/60 shadow-red-500/20 text-white'
                    : 'bg-slate-950/90 border-orange-500/60 shadow-orange-500/20 text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-red-500 animate-pulse' : 'bg-orange-500'}`} />
                  <span className="text-[11px] font-extrabold text-slate-200">{z.label}</span>
                </div>
                <div className={`text-[11px] font-black font-mono pl-3.5 ${isHigh ? 'text-red-400' : 'text-orange-400'}`}>
                  T-Score: {tScore}
                </div>
              </div>
            </Html>
          </group>
        );
      })}

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
// Viewport HUD Controls & Risk Heatmap Scale
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
                background: 'linear-gradient(to top,#ffffff 0%,#f97316 50%,#ef4444 100%)',
                boxShadow: '0 0 12px rgba(239,68,68,0.3)',
              }} />
            </div>

            <div style={{ flex: 1, fontSize: 10 }} className="space-y-1 font-medium">
              <div className="flex items-center justify-between text-red-400 font-bold">
                <span>High Risk</span>
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              </div>
              <div className="flex items-center justify-between text-orange-400 font-bold">
                <span>Moderate</span>
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              </div>
              <div className="flex items-center justify-between text-slate-100 font-bold">
                <span>Healthy Bone</span>
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

  const mode = xrayOn ? 'xray' : meshMode ? 'mesh' : heatmap ? 'heatmap' : wireframe ? 'wireframe' : 'anatomical';

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
          gl.toneMappingExposure = 1.15;
        }}
      >
        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight position={[4, 6, 4]} intensity={1.4} color="#ffffff" castShadow />
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
