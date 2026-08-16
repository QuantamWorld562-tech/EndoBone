import { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// Loading Spinner Overlay
// ─────────────────────────────────────────────────────────────
function ModelLoader({ label }) {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 px-5 py-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 shadow-2xl text-center select-none pointer-events-none min-w-[200px]">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-blue-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-blue-400 animate-spin" />
        </div>
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-white tracking-wide">Loading 3D Anatomy</p>
          <p className="text-[11px] text-blue-300 font-medium">{label || 'Preparing model…'}</p>
        </div>
      </div>
    </Html>
  );
}

// ─────────────────────────────────────────────────────────────
// Material Builder with Clinical PBR & Diagnostic Modes
// ─────────────────────────────────────────────────────────────
function createBoneMaterial({ heatmap, wireframe, xray, riskLevel = 'moderate' }) {
  if (xray) {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#38bdf8'),
      emissive: new THREE.Color('#0369a1'),
      emissiveIntensity: 0.45,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      wireframe: Boolean(wireframe),
      depthWrite: false,
    });
  }

  if (heatmap) {
    // Metabolic risk heatmap material
    const baseColor = riskLevel === 'high' ? '#ef4444' : riskLevel === 'moderate' ? '#f59e0b' : '#10b981';
    const glowColor = riskLevel === 'high' ? '#dc2626' : riskLevel === 'moderate' ? '#d97706' : '#059669';
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color(baseColor),
      emissive: new THREE.Color(glowColor),
      emissiveIntensity: 0.4,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide,
      wireframe: Boolean(wireframe),
    });
  }

  // Clinical ivory-white bone material with realistic subsurface feel
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f4f2ec'),
    roughness: 0.42,
    metalness: 0.04,
    side: THREE.DoubleSide,
    wireframe: Boolean(wireframe),
  });
}

// ─────────────────────────────────────────────────────────────
// 3D Region Highlight Indicator (Pulsing Sphere + Ring Target)
// ─────────────────────────────────────────────────────────────
function RegionHighlightMarker({ selectedRegion, riskLevel }) {
  const meshRef = useRef();
  const ringRef = useRef();

  // Determine 3D coordinates based on anatomical region
  const position = useMemo(() => {
    switch (selectedRegion) {
      case 'proximal-femur':
      case 'femoral-neck':
        return [0.25, 0.75, 0.15];
      case 'vertebral-body':
        return [0, 0.05, 0.25];
      case 'acetabulum':
      case 'distal-radius':
        return [-0.2, -0.7, 0.2];
      default:
        return [0, 0.5, 0.2];
    }
  }, [selectedRegion]);

  const color = riskLevel === 'high' ? '#ef4444' : riskLevel === 'moderate' ? '#f59e0b' : '#10b981';

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      const scale = 1 + Math.sin(t * 4) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.5;
    }
  });

  return (
    <group position={position}>
      {/* Center glowing focal point */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.09, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>

      {/* Target indicator ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.13, 0.16, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Normalized Bone Model with Click-to-Select Raycasting
// ─────────────────────────────────────────────────────────────
function NormalizedBoneModel({
  modelPath,
  heatmap,
  wireframe,
  xray,
  autoRotate,
  riskLevel,
  selectedRegion,
  onSelectRegion,
}) {
  const { scene } = useGLTF(modelPath);
  const rootGroupRef = useRef();

  // Process geometry: calculate normals, fix DICOM Z-up orientation, and normalize scale
  const { processedGroup } = useMemo(() => {
    const clone = scene.clone(true);

    clone.traverse((child) => {
      if (child.isMesh && child.geometry) {
        child.geometry.computeVertexNormals();
        child.geometry.computeBoundingBox();
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    const wrapper = new THREE.Group();
    const inner = new THREE.Group();
    inner.add(clone);

    const initialBox = new THREE.Box3().setFromObject(inner);
    const initialSize = initialBox.getSize(new THREE.Vector3());

    // NIH 3D DICOM orientation adjustment
    if (initialSize.z > initialSize.y && initialSize.z > initialSize.x) {
      inner.rotation.x = -Math.PI / 2;
    }

    wrapper.add(inner);

    const orientedBox = new THREE.Box3().setFromObject(wrapper);
    const center = orientedBox.getCenter(new THREE.Vector3());
    const size = orientedBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    const targetScale = 2.2 / maxDim;

    wrapper.scale.setScalar(targetScale);
    wrapper.position.set(
      -center.x * targetScale,
      -center.y * targetScale,
      -center.z * targetScale
    );

    return { processedGroup: wrapper };
  }, [scene]);

  // Apply materials dynamically
  useEffect(() => {
    const mat = createBoneMaterial({ heatmap, wireframe, xray, riskLevel });
    processedGroup.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
      }
    });
  }, [processedGroup, heatmap, wireframe, xray, riskLevel]);

  // Idle rotation animation
  useFrame((_, delta) => {
    if (autoRotate && rootGroupRef.current) {
      rootGroupRef.current.rotation.y += delta * 0.4;
    }
  });

  // Handle Raycasting click on bone mesh to select ROI
  const handleMeshClick = (e) => {
    e.stopPropagation();
    if (!onSelectRegion) return;

    // Use local vertical intersection point to choose anatomical region
    const clickY = e.point.y;
    if (clickY > 0.4) {
      onSelectRegion('proximal-femur');
    } else if (clickY < -0.4) {
      onSelectRegion('acetabulum');
    } else {
      onSelectRegion('vertebral-body');
    }
  };

  return (
    <group ref={rootGroupRef} onClick={handleMeshClick} cursor="pointer">
      <primitive object={processedGroup} />
      {/* 3D Visual Marker for Selected ROI */}
      <RegionHighlightMarker selectedRegion={selectedRegion} riskLevel={riskLevel} />
    </group>
  );
}

// ─────────────────────────────────────────────────────────────
// Camera View Controller — handles Coronal, Sagittal, Axial, 3D
// ─────────────────────────────────────────────────────────────
function CameraController({ viewAngle, controlsRef }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    switch (viewAngle) {
      case 'coronal':
        camera.position.set(0, 0, 3.4);
        break;
      case 'sagittal':
        camera.position.set(3.4, 0, 0);
        break;
      case 'axial':
        camera.position.set(0, 3.4, 0.001);
        break;
      case '3d':
      default:
        camera.position.set(1.8, 1.2, 2.6);
        break;
    }

    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }, [viewAngle, camera, controlsRef]);

  return null;
}

// ─────────────────────────────────────────────────────────────
// Main 3D Canvas Component Export
// ─────────────────────────────────────────────────────────────
export default function BoneModelViewer({
  modelPath,
  modelLabel = 'Bone Structure',
  viewAngle = '3d',
  heatmap = false,
  wireframe = false,
  xray = false,
  autoRotate = false,
  riskLevel = 'moderate',
  selectedRegion = 'proximal-femur',
  onSelectRegion,
  onResetRef,
}) {
  const controlsRef = useRef();

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [1.8, 1.2, 2.6], fov: 45, near: 0.05, far: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        shadows
        style={{ width: '100%', height: '100%' }}
      >
        {/* Cinematic Studio Lighting Rig */}
        <ambientLight intensity={0.7} color="#f0f6ff" />
        <directionalLight
          position={[4, 6, 4]}
          intensity={1.4}
          color="#ffffff"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#93c5fd" />
        <directionalLight position={[0, -4, -4]} intensity={0.5} color="#38bdf8" />
        <pointLight position={[0, 4, -2]} intensity={0.4} color="#60a5fa" />

        <Environment preset="city" />

        <CameraController viewAngle={viewAngle} controlsRef={controlsRef} />

        <OrbitControls
          ref={(node) => {
            controlsRef.current = node;
            if (onResetRef) onResetRef(node);
          }}
          enableDamping
          dampingFactor={0.08}
          minDistance={0.5}
          maxDistance={8.0}
          makeDefault
        />

        <Suspense fallback={<ModelLoader label={modelLabel} />}>
          <NormalizedBoneModel
            modelPath={modelPath}
            heatmap={heatmap}
            wireframe={wireframe}
            xray={xray}
            autoRotate={autoRotate}
            riskLevel={riskLevel}
            selectedRegion={selectedRegion}
            onSelectRegion={onSelectRegion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
