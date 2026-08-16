import { Suspense, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment, Html } from '@react-three/drei';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
// Loading spinner overlay
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
// Bone Material Builder — Clinical PBR & Diagnostic Overlays
// ─────────────────────────────────────────────────────────────
function createBoneMaterial({ heatmap, wireframe, xray }) {
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
    // Metabolic risk heatmap material — warm gradient with diagnostic glow
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color('#f59e0b'),
      emissive: new THREE.Color('#dc2626'),
      emissiveIntensity: 0.35,
      roughness: 0.45,
      metalness: 0.08,
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
// Normalized Bone Model
// Automatically scales, reorients, and centers any medical GLB
// ─────────────────────────────────────────────────────────────
function NormalizedBoneModel({ modelPath, heatmap, wireframe, xray, autoRotate }) {
  const { scene } = useGLTF(modelPath);
  const rootGroupRef = useRef();

  // Process geometry: calculate normals, fix DICOM Z-up orientation, and normalize scale
  const { processedGroup } = useMemo(() => {
    const clone = scene.clone(true);

    // Compute normals & bounding box for every mesh
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

    // Measure initial bounds
    const initialBox = new THREE.Box3().setFromObject(inner);
    const initialSize = initialBox.getSize(new THREE.Vector3());

    // NIH 3D DICOM orientation adjustment:
    // If longitudinal length is on Z, rotate -90° around X to stand upright in Three.js (Y-up)
    if (initialSize.z > initialSize.y && initialSize.z > initialSize.x) {
      inner.rotation.x = -Math.PI / 2;
    }

    wrapper.add(inner);

    // Measure final oriented bounds
    const orientedBox = new THREE.Box3().setFromObject(wrapper);
    const center = orientedBox.getCenter(new THREE.Vector3());
    const size = orientedBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;

    // Normalize to fit comfortably in a 2.2-unit radius viewport
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
    const mat = createBoneMaterial({ heatmap, wireframe, xray });
    processedGroup.traverse((child) => {
      if (child.isMesh) {
        child.material = mat;
      }
    });
  }, [processedGroup, heatmap, wireframe, xray]);

  // Idle rotation animation
  useFrame((_, delta) => {
    if (autoRotate && rootGroupRef.current) {
      rootGroupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={rootGroupRef}>
      <primitive object={processedGroup} />
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
      case 'coronal': // Anterior / Front view
        camera.position.set(0, 0, 3.4);
        break;
      case 'sagittal': // Lateral / Side view
        camera.position.set(3.4, 0, 0);
        break;
      case 'axial': // Superior / Top-down view
        camera.position.set(0, 3.4, 0.001);
        break;
      case '3d':
      default: // Perspective 3/4 view
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
// Main 3D Canvas Export
// ─────────────────────────────────────────────────────────────
export default function BoneModelViewer({
  modelPath,
  modelLabel = 'Bone Structure',
  viewAngle = '3d',
  heatmap = false,
  wireframe = false,
  xray = false,
  autoRotate = false,
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

        {/* Key light — warm top right */}
        <directionalLight
          position={[4, 6, 4]}
          intensity={1.4}
          color="#ffffff"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />

        {/* Fill light — cool blue left */}
        <directionalLight position={[-4, 2, -2]} intensity={0.6} color="#93c5fd" />

        {/* Rim / Back light for crisp bone contours */}
        <directionalLight position={[0, -4, -4]} intensity={0.5} color="#38bdf8" />
        <pointLight position={[0, 4, -2]} intensity={0.4} color="#60a5fa" />

        {/* Subtle ground reflection */}
        <Environment preset="city" />

        {/* View Angle & Orbit Controls */}
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

        {/* GLB Model Scene */}
        <Suspense fallback={<ModelLoader label={modelLabel} />}>
          <NormalizedBoneModel
            modelPath={modelPath}
            heatmap={heatmap}
            wireframe={wireframe}
            xray={xray}
            autoRotate={autoRotate}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
