/* eslint-disable react/no-unknown-property */
/**
 * SurgicalSiteOverview
 * Light-theme clinical bone viewer matching the demo screenshot:
 * - Soft grey gradient background
 * - White/ivory bone model with blue surgical plane overlays
 * - Floating anatomical annotation labels
 * - Zoom control strip (bottom-left)
 * - ORIENTATION button (bottom-right)
 * - Region badge (top-right)
 * - Title bar with procedure name
 */

import { useRef, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Environment } from '@react-three/drei';
import { ExternalLink, Minus, Plus, RotateCcw } from 'lucide-react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Region config — maps procedure / region keys → labels, badge, annotations
// ─────────────────────────────────────────────────────────────────────────────
const REGION_CONFIG = {
  'vertebral-body': {
    badge: 'L4-L5 Lumbar',
    procedureLabel: 'L4-L5 Discectomy',
    annotations: [
      { id: 'l4v',  pos: [-0.58, 0.52, 0.22],  label: 'L4 Vertebra',            color: '#1d4ed8' },
      { id: 'disc', pos: [ 0.52, 0.04, 0.22],  label: 'L4-L5 Disc',             color: '#1d4ed8' },
      { id: 'l5v',  pos: [-0.52, -0.46, 0.22], label: 'L5 Vertebra',            color: '#1d4ed8' },
      { id: 'pe',   pos: [ 0.60, 0.40, 0.22],  label: 'L4 Pedicle Entry: 52.0mm\nL4-L5 Target Depth: 34.8mm', color: '#1d4ed8', small: true },
    ],
    planeAngle: 0.18,
  },
  'femoral-neck': {
    badge: 'Proximal Femur',
    procedureLabel: 'Femoral Neck Fixation',
    annotations: [
      { id: 'fh',  pos: [-0.52, 0.64, 0.22],  label: 'Femoral Head',   color: '#1d4ed8' },
      { id: 'fn',  pos: [ 0.50, 0.38, 0.22],  label: 'Femoral Neck',   color: '#1d4ed8' },
      { id: 'gt',  pos: [-0.54, 0.18, 0.22],  label: 'Greater Trochanter', color: '#1d4ed8' },
      { id: 'sh',  pos: [ 0.52,-0.28, 0.22],  label: 'Shaft Entry: 48.2mm\nTarget Depth: 82.0mm', color: '#1d4ed8', small: true },
    ],
    planeAngle: -0.22,
  },
  'proximal-femur': {
    badge: 'Hip Region',
    procedureLabel: 'Total Hip Arthroplasty',
    annotations: [
      { id: 'ac',  pos: [-0.54, 0.08, 0.22],  label: 'Acetabulum',     color: '#1d4ed8' },
      { id: 'fh',  pos: [ 0.52, 0.60, 0.22],  label: 'Femoral Head',   color: '#1d4ed8' },
      { id: 'fn',  pos: [-0.50, 0.42, 0.22],  label: 'Femoral Neck',   color: '#1d4ed8' },
      { id: 'cup', pos: [ 0.54,-0.12, 0.22],  label: 'Cup Offset: 44.0mm\nStem Depth: 120.0mm', color: '#1d4ed8', small: true },
    ],
    planeAngle: 0.12,
  },
  shaft: {
    badge: 'Femoral Shaft',
    procedureLabel: 'Intramedullary Nailing',
    annotations: [
      { id: 'prox', pos: [-0.52, 0.62, 0.22],  label: 'Proximal Shaft', color: '#1d4ed8' },
      { id: 'mid',  pos: [ 0.52, 0.04, 0.22],  label: 'Mid Diaphysis',  color: '#1d4ed8' },
      { id: 'dist', pos: [-0.50,-0.54, 0.22],  label: 'Distal Shaft',   color: '#1d4ed8' },
      { id: 'nail', pos: [ 0.58, 0.36, 0.22],  label: 'Nail Entry: 6.5mm\nLocking Depth: 160mm', color: '#1d4ed8', small: true },
    ],
    planeAngle: 0.0,
  },
};

const DEFAULT_CONFIG = REGION_CONFIG['vertebral-body'];

// ─────────────────────────────────────────────────────────────────────────────
// Annotation label (Html overlay inside Canvas)
// ─────────────────────────────────────────────────────────────────────────────
function AnnotationPin({ pos, label, small = false }) {
  return (
    <Html position={pos} distanceFactor={3.8} zIndexRange={[200, 0]} center>
      <div className="pointer-events-none flex items-center gap-1.5 select-none"
        style={{ whiteSpace: 'nowrap' }}>
        {/* dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: '#2563eb',
          boxShadow: '0 0 0 2px rgba(37,99,235,0.25)',
          flexShrink: 0,
        }} />
        {/* line */}
        <div style={{ width: 22, height: 1, background: 'rgba(37,99,235,0.55)', flexShrink: 0 }} />
        {/* text */}
        <div style={{
          fontSize: small ? 8.5 : 10,
          fontWeight: 700,
          color: '#1e3a8a',
          lineHeight: 1.35,
          letterSpacing: '0.01em',
          fontFamily: 'system-ui,-apple-system,sans-serif',
          whiteSpace: 'pre-line',
        }}>
          {label}
        </div>
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Surgical plane slices (the translucent blue cross-section planes in demo)
// ─────────────────────────────────────────────────────────────────────────────
function SurgicalPlanes({ planeAngle = 0 }) {
  return (
    <group rotation={[0, planeAngle, 0]}>
      {/* Main axial cut plane */}
      <mesh position={[0, 0.08, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.1, 0.9]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.13}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Angled entry vector plane */}
      <mesh position={[0.05, 0.08, 0]} rotation={[Math.PI / 2 - 0.38, 0.22, 0]}>
        <planeGeometry args={[0.85, 0.7]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.10}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Trajectory line (thin glowing rod) */}
      <mesh position={[0, 0.08, 0]} rotation={[0.0, 0, Math.PI / 2 - 0.18]}>
        <cylinderGeometry args={[0.008, 0.008, 1.4, 12]} />
        <meshBasicMaterial color="#93c5fd" transparent opacity={0.7} />
      </mesh>
      {/* Entry angle arc highlight */}
      <mesh position={[0, 0.28, 0]} rotation={[Math.PI / 2, 0, 0.22]}>
        <ringGeometry args={[0.18, 0.22, 32, 1, 0, Math.PI * 0.65]} />
        <meshBasicMaterial
          color="#2563eb"
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Vertebral stack model (for lumbar / vertebral-body region)
// ─────────────────────────────────────────────────────────────────────────────
function VertebralModel({ autoRotate }) {
  const groupRef = useRef();
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const boneMat = (
    <meshPhysicalMaterial
      color="#f5f0e8"
      roughness={0.55}
      metalness={0.0}
      clearcoat={0.15}
      clearcoatRoughness={0.4}
    />
  );

  return (
    <group ref={groupRef} position={[0, 0.1, 0]} scale={[1.1, 1.1, 1.1]}>
      {/* L3 vertebra (top) */}
      <group position={[0, 0.72, 0]}>
        <mesh>
          <boxGeometry args={[0.56, 0.28, 0.44]} />
          {boneMat}
        </mesh>
        {/* transverse processes */}
        <mesh position={[-0.44, 0, 0]}>
          <boxGeometry args={[0.28, 0.12, 0.18]} />
          {boneMat}
        </mesh>
        <mesh position={[0.44, 0, 0]}>
          <boxGeometry args={[0.28, 0.12, 0.18]} />
          {boneMat}
        </mesh>
        {/* spinous process */}
        <mesh position={[0, 0.08, -0.32]}>
          <boxGeometry args={[0.12, 0.14, 0.22]} />
          {boneMat}
        </mesh>
      </group>

      {/* L3-L4 disc */}
      <mesh position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.09, 32]} />
        <meshPhysicalMaterial color="#d4c9b4" roughness={0.7} />
      </mesh>

      {/* L4 vertebra (middle — target) */}
      <group position={[0, 0.28, 0]}>
        <mesh>
          <boxGeometry args={[0.58, 0.30, 0.46]} />
          {boneMat}
        </mesh>
        <mesh position={[-0.46, 0, 0]}>
          <boxGeometry args={[0.30, 0.13, 0.18]} />
          {boneMat}
        </mesh>
        <mesh position={[0.46, 0, 0]}>
          <boxGeometry args={[0.30, 0.13, 0.18]} />
          {boneMat}
        </mesh>
        <mesh position={[0, 0.10, -0.34]}>
          <boxGeometry args={[0.12, 0.16, 0.24]} />
          {boneMat}
        </mesh>
      </group>

      {/* L4-L5 disc (surgical target) */}
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.27, 0.27, 0.10, 32]} />
        <meshPhysicalMaterial color="#c9bca6" roughness={0.65} />
      </mesh>

      {/* L5 vertebra (bottom) */}
      <group position={[0, -0.22, 0]}>
        <mesh>
          <boxGeometry args={[0.60, 0.30, 0.48]} />
          {boneMat}
        </mesh>
        <mesh position={[-0.47, 0, 0]}>
          <boxGeometry args={[0.28, 0.13, 0.18]} />
          {boneMat}
        </mesh>
        <mesh position={[0.47, 0, 0]}>
          <boxGeometry args={[0.28, 0.13, 0.18]} />
          {boneMat}
        </mesh>
        <mesh position={[0, 0.10, -0.35]}>
          <boxGeometry args={[0.13, 0.17, 0.25]} />
          {boneMat}
        </mesh>
      </group>

      {/* Sacral base */}
      <mesh position={[0, -0.56, 0]}>
        <boxGeometry args={[0.64, 0.24, 0.50]} />
        {boneMat}
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Femur model (for femur-related regions)
// ─────────────────────────────────────────────────────────────────────────────
function FemurModel({ autoRotate }) {
  const groupRef = useRef();
  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const boneMat = (
    <meshPhysicalMaterial
      color="#f5f0e8"
      roughness={0.55}
      metalness={0.0}
      clearcoat={0.15}
      clearcoatRoughness={0.4}
    />
  );

  return (
    <group ref={groupRef} position={[0, -0.1, 0]} scale={[1.05, 1.05, 1.05]}>
      {/* Head */}
      <mesh position={[0.38, 0.80, 0]}>
        <sphereGeometry args={[0.26, 40, 40]} />
        {boneMat}
      </mesh>
      {/* Neck */}
      <mesh position={[0.20, 0.62, 0]} rotation={[0, 0, -0.65]}>
        <cylinderGeometry args={[0.14, 0.18, 0.42, 32]} />
        {boneMat}
      </mesh>
      {/* Greater trochanter */}
      <mesh position={[-0.10, 0.58, 0]}>
        <dodecahedronGeometry args={[0.22, 1]} />
        {boneMat}
      </mesh>
      {/* Shaft */}
      <mesh position={[0.02, -0.06, 0]}>
        <cylinderGeometry args={[0.16, 0.20, 1.30, 32]} />
        {boneMat}
      </mesh>
      {/* Condyles */}
      <mesh position={[-0.06, -0.80, 0]}>
        <sphereGeometry args={[0.20, 28, 28]} />
        {boneMat}
      </mesh>
      <mesh position={[0.10, -0.80, 0]}>
        <sphereGeometry args={[0.20, 28, 28]} />
        {boneMat}
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene — picks correct bone model & annotations for the active region
// ─────────────────────────────────────────────────────────────────────────────
function SurgicalScene({ region, autoRotate, zoom }) {
  const cfg = REGION_CONFIG[region] || DEFAULT_CONFIG;
  const isSpine = region === 'vertebral-body';

  return (
    <>
      {/* Soft clinical lighting */}
      <ambientLight intensity={1.0} color="#f8fafc" />
      <directionalLight position={[3, 5, 4]} intensity={1.6} color="#ffffff" />
      <directionalLight position={[-3, 2, -2]} intensity={0.6} color="#dbeafe" />
      <directionalLight position={[0, -3, 3]} intensity={0.35} color="#e0f2fe" />

      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        minDistance={1.4 / zoom}
        maxDistance={5.5 / zoom}
        makeDefault
      />

      {/* Bone mesh */}
      {isSpine ? (
        <VertebralModel autoRotate={autoRotate} />
      ) : (
        <FemurModel autoRotate={autoRotate} />
      )}

      {/* Blue surgical planes */}
      <SurgicalPlanes planeAngle={cfg.planeAngle} />

      {/* Floating annotation pins */}
      {cfg.annotations.map((a) => (
        <AnnotationPin key={a.id} pos={a.pos} label={a.label} small={a.small} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export default function SurgicalSiteOverview({ region = 'vertebral-body', procedure }) {
  const cfg = REGION_CONFIG[region] || DEFAULT_CONFIG;
  const [zoom, setZoom] = useState(1.0);
  const [autoRotate, setAutoRotate] = useState(false);
  const controlsRef = useRef();

  const zoomIn  = useCallback(() => setZoom(z => Math.min(parseFloat((z + 0.2).toFixed(1)), 3.0)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(parseFloat((z - 0.2).toFixed(1)), 0.6)), []);

  // Drive Camera FOV based on zoom
  const fov = useMemo(() => Math.round(45 / zoom), [zoom]);

  const procedureLabel = procedure || cfg.procedureLabel;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          {/* 3D cube icon */}
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
              <line x1="12" y1="22.08" x2="12" y2="12"/>
            </svg>
          </div>
          <span className="text-sm font-bold text-slate-800">Surgical Site Overview</span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700">
          {cfg.badge}
        </span>
      </div>

      {/* ── Title bar (matches demo's "Surgical Planning Report: …") ── */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
        <span className="text-xs font-semibold text-slate-600">
          Surgical Planning Report: <span className="text-slate-800 font-bold">{procedureLabel}</span>
        </span>
        <button className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition">
          <ExternalLink size={13} />
        </button>
      </div>

      {/* ── 3D Canvas ── */}
      <div
        className="relative flex-1"
        style={{
          height: 300,
          background: 'radial-gradient(ellipse at 55% 42%, #e8edf5 0%, #d4dae6 55%, #c8cfd9 100%)',
        }}
      >
        <Canvas
          camera={{ position: [1.6, 0.4, 2.6], fov, near: 0.05, far: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          style={{ background: 'transparent' }}
        >
          <SurgicalScene region={region} autoRotate={autoRotate} zoom={zoom} />
        </Canvas>

        {/* ── Angle badge overlay (demo shows "21.5°" on the plane) ── */}
        <div className="pointer-events-none absolute"
          style={{ top: '42%', left: '51%', transform: 'translate(-50%,-50%)' }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: '#1e40af',
            background: 'rgba(219,234,254,0.75)',
            border: '1px solid rgba(59,130,246,0.4)',
            borderRadius: 5, padding: '2px 6px',
            backdropFilter: 'blur(4px)',
            letterSpacing: '0.04em',
          }}>
            21.5°
          </div>
        </div>
      </div>

      {/* ── Bottom Controls ── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white border-t border-slate-100">

        {/* Zoom strip */}
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg px-1 py-1">
          <button
            onClick={zoomOut}
            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Zoom out"
          >
            <Minus size={13} />
          </button>
          <span className="text-xs font-bold text-slate-700 min-w-[32px] text-center tabular-nums">
            {zoom.toFixed(1)}x
          </span>
          <button
            onClick={zoomIn}
            className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Zoom in"
          >
            <Plus size={13} />
          </button>
        </div>

        {/* Orientation button */}
        <button
          onClick={() => setAutoRotate(r => !r)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
            autoRotate
              ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-300'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <RotateCcw size={13} className={autoRotate ? 'animate-spin' : ''} />
          ORIENTATION
        </button>
      </div>
    </div>
  );
}
