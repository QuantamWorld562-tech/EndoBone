/**
 * BoneModelViewer — Clinical 3D Bone Visualisation
 * Professional medical-grade UI with zone heatmap, floating HUD,
 * risk legend, camera presets, and X-Ray toggle.
 */

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Eye, EyeOff, ScanLine, ChevronRight, Crosshair, Layers } from 'lucide-react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Design system
// ─────────────────────────────────────────────────────────────────────────────

const RISK = {
  high: {
    hex: '#ef4444', emissiveHex: '#7f1d1d', glowHex: '#dc2626',
    pinHex: '#ef4444', ringHex: '#fecaca', opacity: 0.82,
    label: 'High Risk',
    badgeBg: 'rgba(239,68,68,0.15)', badgeBorder: 'rgba(239,68,68,0.45)', badgeText: '#fca5a5',
    trackFill: 'linear-gradient(90deg,#dc2626,#ef4444)',
    trackPct: '85%',
  },
  moderate: {
    hex: '#f59e0b', emissiveHex: '#78350f', glowHex: '#d97706',
    pinHex: '#f59e0b', ringHex: '#fde68a', opacity: 0.96,
    label: 'Moderate',
    badgeBg: 'rgba(245,158,11,0.15)', badgeBorder: 'rgba(245,158,11,0.45)', badgeText: '#fde68a',
    trackFill: 'linear-gradient(90deg,#d97706,#f59e0b)',
    trackPct: '52%',
  },
  low: {
    hex: '#f3f4f6', emissiveHex: '#000000', glowHex: '#10b981',
    pinHex: '#22c55e', ringHex: '#bbf7d0', opacity: 1,
    label: 'Normal',
    badgeBg: 'rgba(16,185,129,0.15)', badgeBorder: 'rgba(16,185,129,0.45)', badgeText: '#6ee7b7',
    trackFill: 'linear-gradient(90deg,#059669,#10b981)',
    trackPct: '15%',
  },
};

const BONE_WHITE    = '#f3f4f6';
const XRAY_TINT     = '#7dd3fc';
const XRAY_EMISSIVE = '#075985';

// ─────────────────────────────────────────────────────────────────────────────
// Camera presets
// ─────────────────────────────────────────────────────────────────────────────

const CAM = {
  overview: { pos: [1.8, 1.2, 2.6],    tgt: [0, 0, 0] },
  anterior: { pos: [0, 0, 3.45],       tgt: [0, 0, 0] },
  lateral:  { pos: [3.45, 0, 0],       tgt: [0, 0, 0] },
  axial:    { pos: [0, 3.45, 0.001],   tgt: [0, 0, 0] },
};
const ANGLE_MAP = { coronal: 'anterior', sagittal: 'lateral', '3d': 'overview' };
function resolvePreset(v) { return CAM[v] ? v : (ANGLE_MAP[v] || 'overview'); }

// ─────────────────────────────────────────────────────────────────────────────
// Region helpers
// ─────────────────────────────────────────────────────────────────────────────

const REGION_ALIASES = {
  femoral_neck: 'femoral-neck', 'femoral-neck': 'femoral-neck',
  'proximal-femur': 'femoral-neck',
  greater_trochanter: 'greater-trochanter', 'greater-trochanter': 'greater-trochanter',
  shaft: 'shaft',
  vertebral_body: 'vertebral-body', 'vertebral-body': 'vertebral-body', lumbar: 'vertebral-body',
  acetabulum: 'acetabulum', acetabular: 'acetabulum',
  distal_radius: 'distal-radius', 'distal-radius': 'distal-radius',
};

const MESH_TOKENS = {
  'femoral-neck':       ['femoral_neck','femoral-neck','femoral neck','neck','collum'],
  'greater-trochanter': ['greater_trochanter','greater-trochanter','trochanter'],
  shaft:                ['shaft','diaphysis'],
  'vertebral-body':     ['vertebral_body','vertebral-body','vertebral','vertebr','lumbar','l1','l2','l3','l4','l5'],
  acetabulum:           ['acetabulum','acetabular'],
  'distal-radius':      ['distal_radius','distal-radius','radius'],
};

const ANCHORS = {
  'femoral-neck':       [0.22, 0.80, 0.14],
  'greater-trochanter': [0.34, 0.58, 0.08],
  shaft:                [0.12, 0.00, 0.08],
  'vertebral-body':     [0.00, 0.05, 0.22],
  acetabulum:           [-0.18, -0.58, 0.18],
  'distal-radius':      [0.25, -0.84, 0.10],
};

const RADII = {
  'femoral-neck': 0.32, 'greater-trochanter': 0.28,
  shaft: 0.38, 'vertebral-body': 0.42,
  acetabulum: 0.32, 'distal-radius': 0.30,
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
function firstSentence(text) {
  const t = String(text||'').trim();
  return t.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() || t || 'No AI observation available.';
}
function sameRegion(a, b) { return slug(a)===slug(b) || canonical(a)===canonical(b); }

function normalizeZones(raw, fallback) {
  let src = [];
  if (Array.isArray(raw)) src = raw;
  else if (raw?.zones) src = raw.zones;
  else if (raw?.target_region||raw?.targetRegion||raw?.region) src = [raw];
  else if (raw && typeof raw==='object')
    src = Object.entries(raw).map(([id,val]) => ({
      ...(typeof val==='object'?val:{}), id,
      riskLevel: typeof val==='string' ? val : val?.riskLevel,
    }));

  if (!src.length)
    src = [{ id: fallback.selectedRegion||'femoral-neck', riskLevel: fallback.riskLevel, note: fallback.clinicalNote }];

  const zones = src.map((z,i) => {
    const rawId = slug(z.id||z.zoneId||z.region||z.target_region||z.targetRegion||`zone-${i+1}`);
    const canId = canonical(rawId);
    const sa = z.anchor||z.position||z.coordinate;
    const tokens = [...(z.meshTokens||z.mesh_tokens||[]), ...(MESH_TOKENS[canId]||[])].map(t=>String(t).toLowerCase());
    return {
      id: rawId, canonicalId: canId,
      label: z.label||z.location||z.name||humanize(rawId),
      riskLevel: normalizeRisk(z.riskLevel??z.risk_level??fallback.riskLevel),
      note: firstSentence(z.note||z.clinicalNote||z.anatomical_observations||z.observation||fallback.clinicalNote),
      anchor: Array.isArray(sa)&&sa.length===3 ? sa.map(Number) : (ANCHORS[canId]||[0,0.4,0.18]),
      radius: Number(z.radius)||RADII[canId]||0.32,
      meshTokens: [...new Set(tokens)],
    };
  });
  return zones.filter((z,i) => zones.findIndex(o=>o.id===z.id)===i);
}

function findZoneByMeshName(meshName, zones) {
  const name = String(meshName||'').toLowerCase();
  let best=null, bestScore=0;
  for (const z of zones)
    for (const t of z.meshTokens)
      if (name.includes(t) && t.length>bestScore) { best=z; bestScore=t.length; }
  return best;
}

// ─────────────────────────────────────────────────────────────────────────────
// Material factory
// ─────────────────────────────────────────────────────────────────────────────

function cloneOrFallback(source) {
  if (source?.isMeshStandardMaterial||source?.isMeshPhysicalMaterial) return source.clone();
  return new THREE.MeshPhysicalMaterial({
    color: BONE_WHITE, roughness: 0.42, metalness: 0.03,
    clearcoat: 0.12, clearcoatRoughness: 0.55, side: THREE.DoubleSide,
  });
}

function applyMode(mat, mode, zone, vertexColors) {
  const risk = RISK[zone?.riskLevel||'low'];
  mat.side = THREE.DoubleSide;
  mat.vertexColors = Boolean(vertexColors);
  mat.roughness = Math.max(0.28, mat.roughness??0.42);
  mat.metalness = Math.min(0.06, mat.metalness??0.03);
  mat.depthWrite = true;
  mat.wireframe = mode==='wireframe';

  if (mode==='xray') {
    mat.color.set(zone ? risk.hex : XRAY_TINT);
    mat.emissive?.set(zone?.riskLevel==='high' ? risk.emissiveHex : XRAY_EMISSIVE);
    mat.emissiveIntensity = zone?.riskLevel==='high' ? 0.5 : 0.28;
    mat.transparent=true; mat.opacity=zone?.riskLevel==='high'?0.38:0.26; mat.depthWrite=false;
  } else if (mode==='wireframe') {
    mat.color.set(zone ? risk.hex : '#64748b');
    mat.emissive?.set('#000000'); mat.emissiveIntensity=0;
    mat.transparent=false; mat.opacity=1;
  } else if (mode==='heatmap' && zone && zone.riskLevel!=='low' && !vertexColors) {
    mat.color.set(risk.hex);
    mat.emissive?.set(risk.emissiveHex);
    mat.emissiveIntensity = zone.riskLevel==='high' ? 0.52 : 0.28;
    mat.transparent = zone.riskLevel==='high';
    mat.opacity = risk.opacity;
    mat.roughness=0.55; mat.metalness=0.02;
  } else {
    mat.color.set(vertexColors ? '#ffffff' : BONE_WHITE);
    mat.emissive?.set('#000000'); mat.emissiveIntensity=0;
    mat.transparent=false; mat.opacity=1;
  }
  mat.userData.endoBoneClinical=true; mat.needsUpdate=true;
  return mat;
}

function buildMat(source, opts) {
  return applyMode(cloneOrFallback(source), opts.mode, opts.zone, opts.vertexColors);
}
function disposeClinical(mat) {
  const list = Array.isArray(mat)?mat:[mat];
  list.forEach(m=>{ if (m?.userData?.endoBoneClinical) m.dispose(); });
}

function applySpatialHeatmap(mesh, zones, rootGroup) {
  const geo=mesh.geometry, pos=geo?.getAttribute('position');
  if (!geo||!pos||!rootGroup) return null;
  rootGroup.updateMatrixWorld(true); mesh.updateMatrixWorld(true);

  const hotZones = zones.filter(z=>z.riskLevel!=='low').map(z => {
    const wa = rootGroup.localToWorld(new THREE.Vector3(...z.anchor));
    return { ...z, local: mesh.worldToLocal(wa) };
  });
  if (!hotZones.length) { geo.deleteAttribute('color'); return null; }

  const colors=new Float32Array(pos.count*3);
  const vert=new THREE.Vector3(), base=new THREE.Color(BONE_WHITE), col=new THREE.Color();
  let strongest=null;

  for (let i=0;i<pos.count;i++) {
    vert.fromBufferAttribute(pos,i); col.copy(base);
    let bestInfl=0, bestZone=null;
    for (const z of hotZones) {
      const d=vert.distanceTo(z.local);
      const infl=1-THREE.MathUtils.smoothstep(d,z.radius*0.18,z.radius);
      if (infl>bestInfl) { bestInfl=infl; bestZone=z; }
    }
    if (bestZone&&bestInfl>0) {
      col.lerp(new THREE.Color(RISK[bestZone.riskLevel].hex), bestInfl*0.9);
      if (!strongest||bestZone.riskLevel==='high') strongest=bestZone;
    }
    colors[i*3]=col.r; colors[i*3+1]=col.g; colors[i*3+2]=col.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  return strongest;
}

// ─────────────────────────────────────────────────────────────────────────────
// Loading spinner
// ─────────────────────────────────────────────────────────────────────────────

function ModelLoader({ label }) {
  return (
    <Html center>
      <div style={{
        pointerEvents:'none', minWidth:220, textAlign:'center',
        borderRadius:16, border:'1px solid rgba(148,163,184,0.12)',
        background:'rgba(2,6,23,0.95)', backdropFilter:'blur(20px)',
        padding:'24px 28px', boxShadow:'0 32px 64px rgba(0,0,0,0.6)',
        fontFamily:'system-ui,-apple-system,sans-serif',
      }}>
        <div style={{
          width:36, height:36, borderRadius:'50%', margin:'0 auto 16px',
          border:'2px solid rgba(96,165,250,0.2)',
          borderTopColor:'#60a5fa', animation:'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{fontSize:12,fontWeight:700,color:'#f1f5f9',marginBottom:4,letterSpacing:'0.02em'}}>
          Loading 3D Anatomy
        </p>
        <p style={{fontSize:11,color:'#93c5fd',fontWeight:500}}>{label||'Preparing model…'}</p>
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Zone pin
// ─────────────────────────────────────────────────────────────────────────────

function ZonePin({ zone, position, subtle=false }) {
  const coreRef=useRef(), ringRef=useRef();
  const r=RISK[zone.riskLevel];

  useFrame(({ clock }) => {
    const t=clock.getElapsedTime();
    if (coreRef.current) coreRef.current.scale.setScalar(1+Math.sin(t*3.2)*(subtle?0.07:0.18));
    if (ringRef.current) ringRef.current.rotation.z=t*0.95;
  });

  return (
    <group position={position} raycast={()=>null}>
      <mesh renderOrder={-1}>
        <sphereGeometry args={[subtle?0.06:0.14,16,16]} />
        <meshBasicMaterial color={r.glowHex} transparent opacity={0.06} depthWrite={false} side={THREE.BackSide} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[subtle?0.04:0.068,28,28]} />
        <meshStandardMaterial color={r.pinHex} emissive={r.pinHex} emissiveIntensity={0.9} roughness={0.1} metalness={0.25} />
      </mesh>
      {!subtle && (
        <mesh ref={ringRef} rotation={[Math.PI/2,0,0]}>
          <ringGeometry args={[0.10,0.128,48]} />
          <meshBasicMaterial color={r.ringHex} transparent opacity={0.75} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Clinical HUD card — premium dark-mode floating tooltip
// ─────────────────────────────────────────────────────────────────────────────

function ClinicalHud({ zone, anchor }) {
  const r = RISK[zone.riskLevel];

  return (
    <group position={anchor} raycast={()=>null}>
      <ZonePin zone={zone} position={[0,0,0]} />
      <Html
        position={[0.08, 0.32, 0.04]}
        distanceFactor={5.0}
        zIndexRange={[200,0]}
        occlude={false}
        style={{ pointerEvents:'none', userSelect:'none' }}
      >
        <div style={{
          width: 248,
          fontFamily: 'system-ui,-apple-system,sans-serif',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'rgba(2,6,23,0.97)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}>
          {/* Risk-colour top bar */}
          <div style={{ height: 3, background: `linear-gradient(90deg, ${r.glowHex} 0%, ${r.hex} 60%, transparent 100%)` }} />

          <div style={{ padding: '14px 15px 15px' }}>
            {/* Zone header */}
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10, marginBottom:12 }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
                  <div style={{ width:4, height:4, borderRadius:'50%', background:r.hex, boxShadow:`0 0 6px ${r.hex}` }} />
                  <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.15em', color:'#7dd3fc', textTransform:'uppercase' }}>
                    Clinical Zone
                  </span>
                </div>
                <h4 style={{ fontSize:14, fontWeight:700, color:'#f8fafc', lineHeight:1.25, margin:0 }}>
                  {zone.label}
                </h4>
              </div>
              <div style={{
                flexShrink:0, marginTop:2,
                padding:'4px 9px', borderRadius:999,
                fontSize:9, fontWeight:800, letterSpacing:'0.1em', textTransform:'uppercase',
                color: r.badgeText, background: r.badgeBg, border:`1px solid ${r.badgeBorder}`,
              }}>
                {r.label}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'0 0 12px' }} />

            {/* AI note */}
            <div style={{ marginBottom:12 }}>
              <p style={{ fontSize:9, fontWeight:700, letterSpacing:'0.14em', color:'#475569', textTransform:'uppercase', marginBottom:6 }}>
                AI Clinical Observation
              </p>
              <p style={{ fontSize:11.5, lineHeight:1.65, color:'#cbd5e1', margin:0 }}>
                {zone.note}
              </p>
            </div>

            {/* Risk meter */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                <span style={{ fontSize:9, fontWeight:700, color:'#475569', letterSpacing:'0.1em', textTransform:'uppercase' }}>Risk Index</span>
                <span style={{ fontSize:9, fontWeight:800, color: r.badgeText }}>
                  {zone.riskLevel==='high'?'85 / 100':zone.riskLevel==='moderate'?'52 / 100':'18 / 100'}
                </span>
              </div>
              <div style={{ height:5, borderRadius:3, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                <div style={{
                  height:'100%', width: r.trackPct, borderRadius:3,
                  background: r.trackFill,
                  boxShadow: `0 0 8px ${r.hex}60`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera controller
// ─────────────────────────────────────────────────────────────────────────────

function CameraController({ preset, controlsRef }) {
  const { camera } = useThree();
  const tp = useRef(new THREE.Vector3(...CAM.overview.pos));
  const tt = useRef(new THREE.Vector3(...CAM.overview.tgt));

  useEffect(() => {
    const c = CAM[preset]||CAM.overview;
    tp.current.set(...c.pos); tt.current.set(...c.tgt);
  }, [preset]);

  useFrame((_, delta) => {
    const t = 1-Math.exp(-8*delta);
    camera.position.lerp(tp.current, t);
    if (controlsRef.current) { controlsRef.current.target.lerp(tt.current,t); controlsRef.current.update(); }
  });
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalised bone model
// ─────────────────────────────────────────────────────────────────────────────

function NormalizedBoneModel({ modelPath, mode, autoRotate, zones, selectedZone, pinnedZone, pinnedAnchor, onInteraction }) {
  const { scene } = useGLTF(modelPath);
  const rootRef = useRef();

  const group = useMemo(() => {
    const clone=scene.clone(true), inner=new THREE.Group(), wrapper=new THREE.Group();
    clone.traverse(child => {
      if (!child.isMesh||!child.geometry) return;
      child.geometry=child.geometry.clone();
      child.geometry.computeVertexNormals();
      child.castShadow=child.receiveShadow=true;
      child.userData.srcMats=(Array.isArray(child.material)?child.material:[child.material]).map(m=>m.clone());
    });
    inner.add(clone);
    const ib=new THREE.Box3().setFromObject(inner), is=ib.getSize(new THREE.Vector3());
    if (is.z>is.y&&is.z>is.x) inner.rotation.x=-Math.PI/2;
    wrapper.add(inner);
    const b=new THREE.Box3().setFromObject(wrapper), c=b.getCenter(new THREE.Vector3()), s=b.getSize(new THREE.Vector3());
    const sc=2.2/(Math.max(s.x,s.y,s.z)||1);
    wrapper.scale.setScalar(sc);
    wrapper.position.set(-c.x*sc,-c.y*sc,-c.z*sc);
    return wrapper;
  }, [scene]);

  useEffect(() => {
    const meshes=[];
    group.traverse(c=>{ if (c.isMesh) meshes.push(c); });
    meshes.forEach(mesh => {
      const directZone=findZoneByMeshName(mesh.name,zones);
      const spatialZone=(mode==='heatmap'&&!directZone)?applySpatialHeatmap(mesh,zones,rootRef.current):null;
      if (!spatialZone) mesh.geometry.deleteAttribute('color');
      disposeClinical(mesh.material);
      const srcs=mesh.userData.srcMats||[null];
      const newMats=srcs.map(src=>buildMat(src,{ mode, zone:directZone||spatialZone, vertexColors:Boolean(spatialZone) }));
      mesh.material=Array.isArray(mesh.material)?newMats:newMats[0];
    });
  }, [group, mode, zones]);

  useEffect(() => () => {
    group.traverse(c => {
      if (!c.isMesh) return;
      disposeClinical(c.material);
      c.userData.srcMats?.forEach(m=>m.dispose());
      c.geometry?.dispose();
    });
  }, [group]);

  useFrame((_,delta) => { if (autoRotate&&rootRef.current) rootRef.current.rotation.y+=delta*0.35; });

  const resolveInteraction = useCallback(e => {
    const direct=findZoneByMeshName(e.object?.name,zones);
    const lp=rootRef.current?.worldToLocal(e.point.clone());
    const nearest=lp&&zones.length ? zones.reduce((best,z) => {
      const d=lp.distanceTo(new THREE.Vector3(...z.anchor));
      return !best||d<best.d?{z,d}:best;
    },null)?.z : null;
    const zone=direct||nearest||selectedZone||zones[0];
    return zone&&lp?{zone,anchor:lp.toArray()}:null;
  },[zones,selectedZone]);

  const handleMove=useCallback(e=>{const it=resolveInteraction(e);if(it)onInteraction?.({...it,type:'hover'});},[resolveInteraction,onInteraction]);
  const handleClick=useCallback(e=>{e.stopPropagation();const it=resolveInteraction(e);if(it)onInteraction?.({...it,type:'click'});},[resolveInteraction,onInteraction]);

  return (
    <group ref={rootRef} onPointerMove={handleMove} onPointerOut={()=>onInteraction?.(null)} onClick={handleClick}>
      <primitive object={group} />
      {selectedZone&&!pinnedZone&&<ZonePin zone={selectedZone} position={selectedZone.anchor} subtle />}
      {pinnedZone&&pinnedAnchor&&<ClinicalHud zone={pinnedZone} anchor={pinnedAnchor} />}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2D Clinical Overlay — professional medical panel design
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_BASE = {
  background: 'rgba(3,7,18,0.94)',
  backdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.07)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)',
  fontFamily: 'system-ui,-apple-system,sans-serif',
};

function ClinicalOverlay({ activePreset, isXray, onPresetChange, onToggleXray, zones }) {
  const PRESETS = [
    { id:'anterior', label:'Anterior',  abbr:'AP',  note:'Frontal plane'  },
    { id:'lateral',  label:'Lateral',   abbr:'LAT', note:'Sagittal plane' },
    { id:'axial',    label:'Axial',     abbr:'AX',  note:'Superior view'  },
  ];

  const peakRisk = zones?.some(z=>z.riskLevel==='high')
    ? 'high' : zones?.some(z=>z.riskLevel==='moderate') ? 'moderate' : 'low';

  const peakColour = RISK[peakRisk].hex;
  const highCount     = zones?.filter(z=>z.riskLevel==='high').length||0;
  const moderateCount = zones?.filter(z=>z.riskLevel==='moderate').length||0;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">

      {/* ── TOP-RIGHT: Camera + X-Ray panel ─────────────────── */}
      <div className="pointer-events-auto absolute right-5 top-5" style={{ width:190 }}>
        <div style={{ ...PANEL_BASE, borderRadius:14, overflow:'hidden' }}>

          {/* Panel header */}
          <div style={{ padding:'9px 13px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', gap:7 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#38bdf8', boxShadow:'0 0 8px #38bdf8' }} />
            <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.18em', color:'#7dd3fc', textTransform:'uppercase' }}>
              View Controls
            </span>
          </div>

          {/* Camera preset buttons */}
          <div style={{ padding:'8px 8px 4px' }}>
            <p style={{ fontSize:9, fontWeight:700, letterSpacing:'0.12em', color:'#475569', textTransform:'uppercase', margin:'0 4px 6px' }}>
              Anatomical Plane
            </p>
            {PRESETS.map((p,i) => {
              const isActive = activePreset===p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={()=>onPresetChange(p.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:10, width:'100%',
                    padding:'8px 10px', borderRadius:9, marginBottom: i<PRESETS.length-1?3:0,
                    border: isActive ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                    background: isActive ? 'rgba(59,130,246,0.20)' : 'transparent',
                    cursor:'pointer', textAlign:'left', transition:'all 0.15s',
                  }}
                  onMouseEnter={e=>{ if(!isActive) e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e=>{ if(!isActive) e.currentTarget.style.background='transparent'; }}
                >
                  {/* Abbr badge */}
                  <div style={{
                    width:30, height:20, borderRadius:5, flexShrink:0,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: isActive ? 'rgba(59,130,246,0.35)' : 'rgba(255,255,255,0.06)',
                    border: isActive ? '1px solid rgba(96,165,250,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <span style={{ fontSize:8.5, fontWeight:800, color: isActive?'#93c5fd':'#64748b', letterSpacing:'0.05em' }}>
                      {p.abbr}
                    </span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:11, fontWeight:700, color: isActive?'#e2e8f0':'#94a3b8', lineHeight:1.2 }}>{p.label}</div>
                    <div style={{ fontSize:9, color: isActive?'#64748b':'#334155', marginTop:1 }}>{p.note}</div>
                  </div>
                  {isActive && (
                    <div style={{ width:5, height:5, borderRadius:'50%', background:'#60a5fa', flexShrink:0, boxShadow:'0 0 6px #60a5fa' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Divider */}
          <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'4px 12px' }} />

          {/* X-Ray toggle */}
          <div style={{ padding:'6px 8px 10px' }}>
            <button
              type="button"
              aria-pressed={isXray}
              onClick={onToggleXray}
              style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                width:'100%', padding:'9px 12px', borderRadius:9, cursor:'pointer',
                fontSize:11, fontWeight:700, transition:'all 0.15s',
                background: isXray ? 'rgba(6,182,212,0.22)' : 'rgba(255,255,255,0.04)',
                border: isXray ? '1px solid rgba(6,182,212,0.5)' : '1px solid rgba(255,255,255,0.08)',
                color: isXray ? '#67e8f9' : '#94a3b8',
                boxShadow: isXray ? '0 0 16px rgba(6,182,212,0.15)' : 'none',
              }}
            >
              {isXray
                ? <><EyeOff size={13} /><span>Exit X-Ray</span></>
                : <><Eye size={13} /><span>X-Ray View</span></>
              }
            </button>
          </div>
        </div>
      </div>

      {/* ── BOTTOM-RIGHT: Risk legend ──────────────────────── */}
      <div className="pointer-events-none absolute right-5 bottom-20">
        <div style={{ ...PANEL_BASE, borderRadius:14, overflow:'hidden', width:190 }}>

          {/* Legend header */}
          <div style={{ padding:'9px 13px 8px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <ScanLine size={11} color="#7dd3fc" />
              <span style={{ fontSize:9, fontWeight:800, letterSpacing:'0.18em', color:'#7dd3fc', textTransform:'uppercase' }}>
                Risk Legend
              </span>
            </div>
            {(highCount>0||moderateCount>0) && (
              <div style={{
                padding:'2px 7px', borderRadius:999,
                fontSize:9, fontWeight:800,
                color: highCount>0?'#fca5a5':'#fde68a',
                background: highCount>0?'rgba(239,68,68,0.15)':'rgba(245,158,11,0.15)',
                border: `1px solid ${highCount>0?'rgba(239,68,68,0.35)':'rgba(245,158,11,0.35)'}`,
              }}>
                {highCount>0 ? `${highCount} CRITICAL` : `${moderateCount} ELEVATED`}
              </div>
            )}
          </div>

          <div style={{ padding:'12px 14px 13px', display:'flex', gap:12, alignItems:'center' }}>
            {/* Gradient bar */}
            <div style={{ position:'relative', flexShrink:0 }}>
              <div style={{
                width:10, height:100, borderRadius:5,
                background:'linear-gradient(to top,#22c55e 0%,#f59e0b 50%,#ef4444 100%)',
                boxShadow:'0 0 20px rgba(239,68,68,0.20)',
              }} />
              {/* Active level tick */}
              <div style={{
                position:'absolute', right:-3,
                top: peakRisk==='high'?4 : peakRisk==='moderate'?44:84,
                width:16, height:2, borderRadius:1,
                background: peakColour,
                boxShadow:`0 0 6px ${peakColour}`,
                transition:'top 0.4s ease',
              }} />
            </div>

            {/* Labels column */}
            <div style={{ flex:1 }}>
              {[
                { rk:'high',     label:'Critical',  sub:'Immediate action', colour:'#fca5a5' },
                { rk:'moderate', label:'Elevated',  sub:'Monitor closely',  colour:'#fde68a' },
                { rk:'low',      label:'Normal',    sub:'Within range',     colour:'#6ee7b7' },
              ].map(({ rk, label, sub, colour }) => {
                const isActive = peakRisk===rk;
                const count = rk==='high' ? highCount : rk==='moderate' ? moderateCount : (zones?.filter(z=>z.riskLevel==='low').length||0);
                return (
                  <div key={rk} style={{ display:'flex', alignItems:'center', gap:7, marginBottom: rk==='low'?0:12 }}>
                    <div style={{
                      width:8, height:8, borderRadius:2, flexShrink:0,
                      background: rk==='low'?'#22c55e': RISK[rk].hex,
                      boxShadow: isActive?`0 0 8px ${rk==='low'?'#22c55e':RISK[rk].hex}`:undefined,
                    }} />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <span style={{ fontSize:10.5, fontWeight: isActive?800:600, color: isActive?colour:'#64748b', lineHeight:1.2 }}>
                          {label}
                        </span>
                        {count>0 && (
                          <span style={{ fontSize:9, fontWeight:700, color: isActive?colour:'#334155' }}>{count}</span>
                        )}
                      </div>
                      <span style={{ fontSize:8.5, color:'#334155' }}>{sub}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI confidence footer */}
          <div style={{ padding:'7px 14px 10px', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:9, color:'#334155', fontWeight:600, letterSpacing:'0.06em' }}>AI CONFIDENCE</span>
              <span style={{ fontSize:9, fontWeight:800, color:'#38bdf8' }}>91%</span>
            </div>
            <div style={{ height:3, borderRadius:2, background:'rgba(255,255,255,0.06)', marginTop:5, overflow:'hidden' }}>
              <div style={{ height:'100%', width:'91%', borderRadius:2, background:'linear-gradient(90deg,#0ea5e9,#38bdf8)' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root export
// ─────────────────────────────────────────────────────────────────────────────

export default function BoneModelViewer({
  modelPath,
  modelLabel   = 'Bone Structure',
  viewAngle    = 'overview',
  heatmap      = true,
  wireframe    = false,
  xray         = false,
  autoRotate   = false,
  riskLevel    = 'moderate',
  selectedRegion = '',
  clinicalNote = '',
  zoneRisks,
  availableZoneIds,
  onSelectRegion,
  onViewAngleChange,
  onXrayChange,
  onResetRef,
}) {
  const controlsRef = useRef();
  const [xrayOn,       setXrayOn]       = useState(xray);
  const [camPreset,    setCamPreset]    = useState(() => resolvePreset(viewAngle));
  const [hoverZone,    setHoverZone]    = useState(null);
  const [pinnedZone,   setPinnedZone]   = useState(null);
  const [pinnedAnchor, setPinnedAnchor] = useState(null);

  useEffect(() => setXrayOn(xray), [xray]);
  useEffect(() => setCamPreset(resolvePreset(viewAngle)), [viewAngle]);
  useEffect(() => { setPinnedZone(null); setPinnedAnchor(null); setHoverZone(null); }, [selectedRegion, modelPath]);

  const allZones = useMemo(() => normalizeZones(zoneRisks, { selectedRegion, riskLevel, clinicalNote }), [zoneRisks, riskLevel, selectedRegion, clinicalNote]);

  const zones = useMemo(() => {
    if (!availableZoneIds?.length) return allZones;
    const allowed=availableZoneIds.map(canonical);
    const filtered=allZones.filter(z=>allowed.includes(z.canonicalId));
    return filtered.length?filtered:allZones;
  }, [allZones, availableZoneIds]);

  const selectedZone = useMemo(() => zones.find(z=>sameRegion(z.id,selectedRegion))||zones[0]||null, [zones,selectedRegion]);
  const mode = xrayOn?'xray':heatmap?'heatmap':wireframe?'wireframe':'anatomical';

  const handleInteraction = useCallback(it => {
    if (!it) { setHoverZone(null); return; }
    if (it.type==='click') {
      setPinnedZone(it.zone); setPinnedAnchor(it.anchor); setHoverZone(null);
      onSelectRegion?.(it.zone.id);
    } else { setHoverZone(it); }
  }, [onSelectRegion]);

  const handlePreset = useCallback(p => { setCamPreset(p); onViewAngleChange?.(p); }, [onViewAngleChange]);
  const handleXray   = useCallback(() => { const n=!xrayOn; setXrayOn(n); onXrayChange?.(n); }, [xrayOn,onXrayChange]);

  const hudZone   = pinnedZone||(hoverZone?.zone??null);
  const hudAnchor = pinnedZone?pinnedAnchor:(hoverZone?.anchor??null);

  return (
    <div className="relative h-full w-full select-none">
      <Canvas
        camera={{ position: CAM.overview.pos, fov:45, near:0.05, far:50 }}
        dpr={[1,2]}
        gl={{ antialias:true, alpha:true, powerPreference:'high-performance' }}
        shadows
        onCreated={({ gl }) => {
          gl.toneMapping=THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure=1.1;
          gl.outputColorSpace=THREE.SRGBColorSpace;
        }}
      >
        <ambientLight intensity={0.60} color="#eff6ff" />
        <directionalLight position={[4,6,4]} intensity={1.35} color="#ffffff" castShadow shadow-mapSize={[1024,1024]} />
        <directionalLight position={[-4,2,-2]} intensity={0.50} color="#93c5fd" />
        <directionalLight position={[0,-4,-4]} intensity={0.38} color="#38bdf8" />
        <pointLight position={[0,3,2]} intensity={0.28} color="#dbeafe" />
        <Environment preset="city" />
        <CameraController preset={camPreset} controlsRef={controlsRef} />
        <OrbitControls
          ref={node=>{ controlsRef.current=node; onResetRef?.(node); }}
          enableDamping dampingFactor={0.08} minDistance={0.5} maxDistance={8} makeDefault
        />
        <Suspense fallback={<ModelLoader label={modelLabel} />}>
          <NormalizedBoneModel
            modelPath={modelPath} mode={mode} autoRotate={autoRotate}
            zones={zones} selectedZone={selectedZone}
            pinnedZone={hudZone}
            pinnedAnchor={hudAnchor ? new THREE.Vector3(...hudAnchor) : null}
            onInteraction={handleInteraction}
          />
        </Suspense>
      </Canvas>
      <ClinicalOverlay
        activePreset={camPreset} isXray={xrayOn}
        onPresetChange={handlePreset} onToggleXray={handleXray} zones={zones}
      />
    </div>
  );
}
