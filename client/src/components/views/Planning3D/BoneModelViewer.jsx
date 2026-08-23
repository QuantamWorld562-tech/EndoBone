/* eslint-disable react/no-unknown-property */
/**
 * BoneModelViewer — High-Fidelity Trabecular Bone Density & BMD Heatmap Renderer
 * Visual matches clinical reference:
 * - Glowing internal trabecular micro-architecture meshwork
 * - BMD color gradient spectrum (Red/Yellow osteopenic head & neck to Cyan/Blue cortical bone)
 * - Luminous edge fresnel glow
 * - Interactive T-score pins & anatomical plane controls
 */

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState, Component } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Eye, EyeOff, ScanLine, RotateCw, Layers } from 'lucide-react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Design System & Constants
// ─────────────────────────────────────────────────────────────────────────────

const RISK = {
  high: {
    hex: '#ef4444', emissiveHex: '#7f1d1d', glowHex: '#dc2626',
    pinHex: '#ef4444', ringHex: '#fecaca', label: 'High Risk',
    badgeBg: 'rgba(239,68,68,0.15)', badgeBorder: 'rgba(239,68,68,0.45)', badgeText: '#fca5a5',
  },
  moderate: {
    hex: '#f59e0b', emissiveHex: '#78350f', glowHex: '#d97706',
    pinHex: '#f59e0b', ringHex: '#fde68a', label: 'Moderate',
    badgeBg: 'rgba(245,158,11,0.15)', badgeBorder: 'rgba(245,158,11,0.45)', badgeText: '#fde68a',
  },
  low: {
    hex: '#38bdf8', emissiveHex: '#0284c7', glowHex: '#0284c7',
    pinHex: '#38bdf8', ringHex: '#bae6fd', label: 'Normal',
    badgeBg: 'rgba(56,189,248,0.15)', badgeBorder: 'rgba(56,189,248,0.45)', badgeText: '#7dd3fc',
  },
};

const CAM = {
  overview: { pos: [1.6, 0.8, 2.5],    tgt: [0, 0, 0] },
  anterior: { pos: [0, 0, 3.2],        tgt: [0, 0, 0] },
  lateral:  { pos: [3.2, 0, 0],        tgt: [0, 0, 0] },
  axial:    { pos: [0, 3.2, 0.001],    tgt: [0, 0, 0] },
};

const REGION_ANCHORS = {
  'proximal-femur': [0.32, 0.82, 0.12],
  'femoral-neck':   [0.26, 0.72, 0.14],
  'greater-trochanter': [-0.15, 0.65, 0.08],
  shaft:            [0.02, 0.00, 0.08],
  'vertebral-body': [0.00, 0.05, 0.22],
  acetabulum:       [-0.18, -0.58, 0.18],
};

// ─────────────────────────────────────────────────────────────────────────────
// Trabecular Texture Generator (Luminous Spongy Micro-Lattice)
// ─────────────────────────────────────────────────────────────────────────────

function generateTrabecularTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, 0, 512, 512);

  // Micro-trabecular lattice network
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 1.4;
  ctx.globalAlpha = 0.75;

  for (let i = 0; i <= 512; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.bezierCurveTo(i + 15, 140, i - 15, 360, i, 512);
    ctx.stroke();
  }
  for (let j = 0; j <= 512; j += 18) {
    ctx.beginPath();
    ctx.moveTo(0, j);
    ctx.bezierCurveTo(140, j + 15, 360, j - 15, 512, j);
    ctx.stroke();
  }

  // Cross struts
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.5;
  for (let k = -512; k <= 512; k += 24) {
    ctx.beginPath();
    ctx.moveTo(k, 0);
    ctx.lineTo(k + 512, 512);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 6);
  return texture;
}

// ─────────────────────────────────────────────────────────────────────────────
// Procedural High-Detail Femur Model with Glowing Trabecular Architecture
// ─────────────────────────────────────────────────────────────────────────────

function LuminousFemurModel({ mode, autoRotate, selectedRegion, onSelectRegion }) {
  const groupRef = useRef();
  const trabecularTex = useMemo(() => generateTrabecularTexture(), []);

  useFrame((_, delta) => {
    if (autoRotate && groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  const isDensityMap = mode === 'heatmap';
  const isXray = mode === 'xray';
  const isWireframe = mode === 'wireframe';

  return (
    <group ref={groupRef} position={[0, -0.2, 0]} scale={[1.15, 1.15, 1.15]}>
      {/* ── 1. FEMORAL HEAD (High-Stress Osteopenic Zone: Radiant Yellow/Red) ── */}
      <group position={[0.42, 0.88, 0]}>
        {/* Core glowing sphere */}
        <mesh>
          <sphereGeometry args={[0.27, 48, 48]} />
          <meshPhysicalMaterial
            color={isDensityMap ? '#ff3b30' : isXray ? '#38bdf8' : '#f8fafc'}
            emissive={isDensityMap ? '#ffcc00' : isXray ? '#0284c7' : '#000000'}
            emissiveIntensity={isDensityMap ? 1.6 : isXray ? 0.6 : 0}
            roughness={0.25}
            metalness={0.1}
            clearcoat={0.3}
            wireframe={isWireframe}
            transparent={isXray}
            opacity={isXray ? 0.4 : 1}
          />
        </mesh>
        {/* Trabecular micro-mesh lattice overlay */}
        {isDensityMap && (
          <mesh scale={[1.02, 1.02, 1.02]}>
            <sphereGeometry args={[0.27, 32, 32]} />
            <meshStandardMaterial
              map={trabecularTex}
              color="#ffe600"
              emissive="#ff5500"
              emissiveIntensity={1.2}
              transparent
              opacity={0.7}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* ── 2. FEMORAL NECK (Critical Resorption Hotspot: Gradient Gold -> Red) ── */}
      <group position={[0.22, 0.70, 0]} rotation={[0, 0, -0.68]}>
        <mesh>
          <cylinderGeometry args={[0.16, 0.20, 0.44, 36]} />
          <meshPhysicalMaterial
            color={isDensityMap ? '#ff9500' : isXray ? '#38bdf8' : '#f8fafc'}
            emissive={isDensityMap ? '#ff3b30' : isXray ? '#0284c7' : '#000000'}
            emissiveIntensity={isDensityMap ? 1.4 : isXray ? 0.5 : 0}
            roughness={0.3}
            wireframe={isWireframe}
            transparent={isXray}
            opacity={isXray ? 0.4 : 1}
          />
        </mesh>
        {isDensityMap && (
          <mesh scale={[1.02, 1.01, 1.02]}>
            <cylinderGeometry args={[0.16, 0.20, 0.44, 24]} />
            <meshStandardMaterial
              map={trabecularTex}
              color="#ffcc00"
              emissive="#ff3300"
              emissiveIntensity={1.0}
              transparent
              opacity={0.65}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* ── 3. GREATER TROCHANTER (Transition Zone: Amber -> Cyan) ── */}
      <group position={[-0.10, 0.62, 0]}>
        <mesh>
          <dodecahedronGeometry args={[0.24, 2]} />
          <meshPhysicalMaterial
            color={isDensityMap ? '#38bdf8' : isXray ? '#38bdf8' : '#f8fafc'}
            emissive={isDensityMap ? '#f59e0b' : isXray ? '#0284c7' : '#000000'}
            emissiveIntensity={isDensityMap ? 0.9 : isXray ? 0.4 : 0}
            roughness={0.35}
            wireframe={isWireframe}
            transparent={isXray}
            opacity={isXray ? 0.4 : 1}
          />
        </mesh>
      </group>

      {/* ── 4. FEMORAL DIAPHYSIS / SHAFT (Cortical Bone: Deep Luminous Cyan/Blue) ── */}
      <group position={[0.02, -0.05, 0]}>
        <mesh>
          <cylinderGeometry args={[0.17, 0.21, 1.45, 36]} />
          <meshPhysicalMaterial
            color={isDensityMap ? '#0284c7' : isXray ? '#38bdf8' : '#f8fafc'}
            emissive={isDensityMap ? '#0369a1' : isXray ? '#075985' : '#000000'}
            emissiveIntensity={isDensityMap ? 0.7 : isXray ? 0.3 : 0}
            roughness={0.28}
            metalness={0.15}
            clearcoat={0.4}
            wireframe={isWireframe}
            transparent={isXray}
            opacity={isXray ? 0.35 : 1}
          />
        </mesh>
        {/* Longitudinal cortical trabecular grain */}
        {isDensityMap && (
          <mesh scale={[1.02, 1.0, 1.02]}>
            <cylinderGeometry args={[0.17, 0.21, 1.45, 24]} />
            <meshStandardMaterial
              map={trabecularTex}
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.6}
              transparent
              opacity={0.45}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )}
      </group>

      {/* ── 5. DISTAL CONDYLES (Knee Articulation Base) ── */}
      <group position={[-0.07, -0.85, 0]}>
        <mesh>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshPhysicalMaterial
            color={isDensityMap ? '#0284c7' : isXray ? '#38bdf8' : '#f8fafc'}
            emissive={isDensityMap ? '#0369a1' : isXray ? '#075985' : '#000000'}
            emissiveIntensity={isDensityMap ? 0.5 : 0}
            wireframe={isWireframe}
          />
        </mesh>
      </group>
      <group position={[0.11, -0.85, 0]}>
        <mesh>
          <sphereGeometry args={[0.22, 32, 32]} />
          <meshPhysicalMaterial
            color={isDensityMap ? '#0284c7' : isXray ? '#38bdf8' : '#f8fafc'}
            emissive={isDensityMap ? '#0369a1' : isXray ? '#075985' : '#000000'}
            emissiveIntensity={isDensityMap ? 0.5 : 0}
            wireframe={isWireframe}
          />
        </mesh>
      </group>

      {/* ── 6. Luminous Edge Fresnel Halo (Glow Rim) ── */}
      {isDensityMap && (
        <mesh position={[0.08, 0.15, 0]} scale={[1.18, 1.15, 1.18]}>
          <cylinderGeometry args={[0.34, 0.38, 2.1, 24]} />
          <meshBasicMaterial
            color="#38bdf8"
            transparent
            opacity={0.06}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* ── 7. Interactive Floating 3D T-Score Pins matching Reference Image 1 ── */}
      <Html position={[0.24, 0.72, 0.18]} distanceFactor={4.2} zIndexRange={[300, 0]}>
        <div
          onClick={() => onSelectRegion?.('femoral-neck')}
          className="cursor-pointer select-none px-2.5 py-1 rounded-lg bg-slate-950/90 text-white border border-red-500/60 shadow-xl shadow-red-500/25 backdrop-blur-md flex items-center gap-1.5 hover:scale-105 transition"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[11px] font-extrabold text-slate-200">Femoral Neck</span>
          <span className="text-[11px] font-black text-red-400 font-mono">T-Score: -2.3</span>
        </div>
      </Html>

      <Html position={[-0.15, 0.65, 0.16]} distanceFactor={4.2} zIndexRange={[300, 0]}>
        <div
          onClick={() => onSelectRegion?.('proximal-femur')}
          className="cursor-pointer select-none px-2.5 py-1 rounded-lg bg-slate-950/90 text-white border border-amber-500/60 shadow-xl shadow-amber-500/25 backdrop-blur-md flex items-center gap-1.5 hover:scale-105 transition"
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-[11px] font-extrabold text-slate-200">Total Hip</span>
          <span className="text-[11px] font-black text-amber-400 font-mono">T-Score: -1.9</span>
        </div>
      </Html>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary Component
// ─────────────────────────────────────────────────────────────────────────────

class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.warn("3D Render fallback active:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <LuminousFemurModel
          mode="heatmap"
          autoRotate={false}
          selectedRegion="femoral-neck"
        />
      );
    }
    return this.props.children;
  }
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
// 2D Viewport Overlay: View Controls & BMD Scale
// ─────────────────────────────────────────────────────────────────────────────

const PANEL_BASE = {
  background: 'rgba(3,7,18,0.92)',
  backdropFilter: 'blur(20px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
  fontFamily: 'system-ui,-apple-system,sans-serif',
};

function ClinicalOverlay({ activePreset, isXray, onPresetChange, onToggleXray }) {
  const PRESETS = [
    { id: 'anterior', label: 'Anterior', abbr: 'AP', note: 'Frontal plane' },
    { id: 'lateral',  label: 'Lateral',  abbr: 'LAT', note: 'Sagittal plane' },
    { id: 'axial',    label: 'Axial',    abbr: 'AX',  note: 'Superior view' },
  ];

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

      {/* Bottom-Right: BMD Density Scale matching Reference Image 1 */}
      <div className="pointer-events-none absolute right-5 bottom-6">
        <div style={{ ...PANEL_BASE, borderRadius: 14, overflow: 'hidden', width: 185 }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ScanLine size={12} color="#7dd3fc" />
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.18em', color: '#7dd3fc', textTransform: 'uppercase' }}>
                BMD Scale
              </span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#38bdf8' }}>T-Score</span>
          </div>

          <div style={{ padding: '10px 12px', display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 8, height: 75, borderRadius: 4,
                background: 'linear-gradient(to top,#0284c7 0%,#10b981 35%,#f59e0b 70%,#ef4444 100%)',
                boxShadow: '0 0 12px rgba(239,68,68,0.3)',
              }} />
            </div>

            <div style={{ flex: 1, fontSize: 10 }} className="space-y-1 font-medium">
              <div className="flex items-center justify-between text-blue-400 font-bold">
                <span>Normal</span>
                <span>&gt; 1.0</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400 font-bold">
                <span>Healthy</span>
                <span>&gt; -1.0</span>
              </div>
              <div className="flex items-center justify-between text-amber-400 font-bold">
                <span>Osteopenia</span>
                <span>-1.0 to -2.5</span>
              </div>
              <div className="flex items-center justify-between text-red-400 font-bold">
                <span>Osteoporosis</span>
                <span>&lt; -2.5</span>
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
  viewAngle = 'overview',
  heatmap = true,
  wireframe = false,
  xray = false,
  autoRotate = false,
  selectedRegion = 'femoral-neck',
  onSelectRegion,
  onViewAngleChange,
  onXrayChange,
}) {
  const controlsRef = useRef();
  const [xrayOn, setXrayOn] = useState(xray);
  const [camPreset, setCamPreset] = useState(viewAngle);

  useEffect(() => setXrayOn(xray), [xray]);
  useEffect(() => setCamPreset(viewAngle), [viewAngle]);

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
        <ambientLight intensity={0.55} color="#eff6ff" />
        <directionalLight position={[4, 6, 4]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-4, 2, -2]} intensity={0.8} color="#38bdf8" />
        <directionalLight position={[0, -4, -4]} intensity={0.4} color="#0284c7" />
        <pointLight position={[0.3, 0.8, 0.5]} intensity={0.6} color="#ffcc00" />
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
        <ModelErrorBoundary>
          <LuminousFemurModel
            mode={mode}
            autoRotate={autoRotate}
            selectedRegion={selectedRegion}
            onSelectRegion={onSelectRegion}
          />
        </ModelErrorBoundary>
      </Canvas>

      <ClinicalOverlay
        activePreset={camPreset}
        isXray={xrayOn}
        onPresetChange={handlePreset}
        onToggleXray={handleXray}
      />
    </div>
  );
}
