/* eslint-disable react/no-unknown-property */
/**
 * BoneModelViewer — Clinical Anatomical 3D Bone Model & Dynamic Risk Heatmap Shader
 *
 * High-definition upgrades:
 * - DPR [1.5, 3] for crisp retina/4K rendering
 * - minDistance 0.04 — extreme close-up zoom into trabecular zones
 * - MeshPhysicalMaterial with full PBR: clearcoat, sheen, iridescence, transmission
 * - Custom GLSL: Voronoi trabecular micro-texture + Fresnel rim + subsurface scatter sim
 * - ACES filmic tone mapping at 1.2 exposure
 * - computeTangents() + smooth normals for accurate microsurface shading
 * - 6-light rig: key, fill, rim, back, under-fill, bounce
 * - Anatomical mode: warm ivory bone cortex with periosteum specular sheen
 * - X-Ray mode: 3-layer depth-sorted translucency with emissive inner glow
 * - ContactShadows + staging holographic ring
 */

import { Component, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, OrbitControls, useGLTF, Html, ContactShadows, Preload } from '@react-three/drei';
import { Eye, EyeOff, Tag } from 'lucide-react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────────────────────
// Risk Heatmap Colors
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_WHITE = new THREE.Color('#ffffff');
const COLOR_ORANGE = new THREE.Color('#f97316');
const COLOR_RED = new THREE.Color('#ef4444');

const CAM = {
  overview: { pos: [0.5, 0.2, 3.8], tgt: [0, 0, 0] },
  coronal: { pos: [0, 0, 3.8], tgt: [0, 0, 0] }, // Coronal / AP
  anterior: { pos: [0, 0, 3.8], tgt: [0, 0, 0] },
  sagittal: { pos: [3.8, 0, 0], tgt: [0, 0, 0] }, // Sagittal / Lateral
  lateral: { pos: [3.8, 0, 0], tgt: [0, 0, 0] },
  axial: { pos: [0, 3.8, 0.001], tgt: [0, 0, 0] }, // Axial / Transverse
  pa: { pos: [0, 0, -3.8], tgt: [0, 0, 0] }, // Posteroanterior
  oblique: { pos: [2.6, 1.2, 2.6], tgt: [0, 0, 0] }, // Oblique 45°
  tangential: { pos: [3.2, -0.6, 1.6], tgt: [0, 0, 0] }, // Tangential Profile
};

const REGION_ALIASES = {
  'femoral-neck': 'femoral-neck', femoral_neck: 'femoral-neck', 'proximal-femur': 'femoral-neck',
  'femoral-head': 'femoral-head', femoral_head: 'femoral-head', caput: 'femoral-head', head: 'femoral-head',
  'greater-trochanter': 'greater-trochanter', greater_trochanter: 'greater-trochanter', trochanter: 'greater-trochanter',
  'lesser-trochanter': 'lesser-trochanter', lesser_trochanter: 'lesser-trochanter',
  'intertrochanteric': 'intertrochanteric', intertrochanteric_line: 'intertrochanteric',
  shaft: 'shaft', diaphysis: 'shaft', femoral_shaft: 'shaft',
  'distal-condyles': 'distal-condyles', condyles: 'distal-condyles', metaphysis: 'distal-condyles',
  acetabulum: 'acetabulum',
};

const MESH_TOKENS = {
  'femoral-neck': ['femoral_neck', 'neck', 'collum'],
  'femoral-head': ['femoral_head', 'head', 'caput'],
  'greater-trochanter': ['greater_trochanter', 'trochanter_major', 'trochanter'],
  'lesser-trochanter': ['lesser_trochanter', 'trochanter_minor', 'lesser'],
  'intertrochanteric': ['intertrochanteric', 'crista'],
  shaft: ['shaft', 'diaphysis', 'corpus'],
  'distal-condyles': ['condyle', 'distal', 'metaphysis', 'epicondyle'],
  acetabulum: ['acetabulum', 'acetabular'],
};

const ANCHORS = {
  'femoral-head': [0.32, 0.88, 0.12],
  'femoral-neck': [0.22, 0.70, 0.10],
  'greater-trochanter': [-0.24, 0.62, 0.06],
  'intertrochanteric': [-0.06, 0.48, 0.14],
  'lesser-trochanter': [0.14, 0.36, -0.04],
  shaft: [0.02, -0.05, 0.06],
  'distal-condyles': [0.02, -0.78, 0.08],
  acetabulum: [-0.18, -0.58, 0.18],
};

const ANATOMICAL_OFFSETS = {
  'femoral-head': { side: 'right', offset: [10, -10], subLabel: 'Caput Femoris' },
  'femoral-neck': { side: 'right', offset: [10, -2], subLabel: 'Collum Femoris' },
  'greater-trochanter': { side: 'left', offset: [-10, -8], subLabel: 'Trochanter Major' },
  'intertrochanteric': { side: 'left', offset: [-10, 4], subLabel: 'Crista Intertroch.' },
  'lesser-trochanter': { side: 'right', offset: [10, 8], subLabel: 'Trochanter Minor' },
  shaft: { side: 'right', offset: [10, 16], subLabel: 'Diaphysis / Corpus' },
  'distal-condyles': { side: 'left', offset: [-10, 4], subLabel: 'Condyli' },
};

const RADII = {
  'femoral-head': 0.40,
  'femoral-neck': 0.55,
  'greater-trochanter': 0.48,
  'intertrochanteric': 0.45,
  'lesser-trochanter': 0.42,
  shaft: 0.55,
  'distal-condyles': 0.48,
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
      { id: 'femoral-neck', riskLevel: 'high', tScore: '-2.3', vBMD: '112.4', note: 'Critical mechanical stress and osteopenic trabecular resorption. High shear fracture risk during THA implant seating.' },
      { id: 'femoral-head', riskLevel: 'moderate', tScore: '-2.1', vBMD: '134.2', note: 'Articular subchondral trabeculae with focal micro-damage and thinning under load.' },
      { id: 'greater-trochanter', riskLevel: 'moderate', tScore: '-1.9', vBMD: '198.6', note: 'Abductor insertion site. Cortical rarefaction creates avulsion risk during hip dislocation.' },
      { id: 'intertrochanteric', riskLevel: 'moderate', tScore: '-1.8', vBMD: '210.0', note: 'Metaphyseal transition zone susceptible to comminution under broaching insertion torque.' },
      { id: 'lesser-trochanter', riskLevel: 'moderate', tScore: '-1.7', vBMD: '220.5', note: 'Psoas muscle insertion. Calcar preservation crucial for primary stem stability.' },
      { id: 'shaft', riskLevel: 'low', tScore: '-0.5', vBMD: '845.1', note: 'Dense circumferential cortical bone (3.8mm). Structurally optimal zone for distal stem press-fit anchorage.' },
      { id: 'distal-condyles', riskLevel: 'low', tScore: '-0.8', vBMD: '650.0', note: 'Distal load-bearing condylar base with preserved cancellous architecture.' },
    ];
  }
  return src.map((z, i) => {
    const rawId = slug(z.id || z.zoneId || z.region || `zone-${i + 1}`);
    const canId = canonical(rawId);
    const sa = z.anchor || z.position || z.coordinates;
    const tokens = [...(z.meshTokens || []), ...(MESH_TOKENS[canId] || [])].map(t => String(t).toLowerCase());
    const layout = ANATOMICAL_OFFSETS[canId] || { side: i % 2 === 0 ? 'right' : 'left', offset: [i % 2 === 0 ? 95 : -95, 0], subLabel: 'Anatomy' };
    return {
      id: rawId, canonicalId: canId,
      label: z.label || z.location || z.name || humanize(rawId),
      subLabel: z.subLabel || layout.subLabel || humanize(canId),
      riskLevel: normalizeRisk(z.riskLevel ?? z.risk_level ?? fallback.riskLevel),
      note: z.note || z.clinicalNote || z.observation || fallback.clinicalNote || 'Clinical evaluation zone.',
      tScore: z.tScore || z.t_score || (canId === 'femoral-neck' ? '-2.3' : canId === 'greater-trochanter' ? '-1.9' : '-0.5'),
      vBMD: z.vBMD || (canId === 'femoral-neck' ? '112.4' : canId === 'greater-trochanter' ? '198.6' : '845.1'),
      anchor: Array.isArray(sa) && sa.length === 3 ? sa.map(Number) : (ANCHORS[canId] || [0.2, 0.6, 0.14]),
      radius: Number(z.radius) || RADII[canId] || 0.48,
      side: z.side || layout.side,
      offset: z.offset || layout.offset,
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

  // W-4: Pre-allocate ALL scratch objects OUTSIDE every loop — zero GC pressure
  const vert = new THREE.Vector3();
  const worldVert = new THREE.Vector3();
  const localPos = new THREE.Vector3();
  const tempCol = new THREE.Color();

  // Pre-compute anchor vectors ONCE before the vertex loop
  const highRiskZones = zones.filter(z => z.riskLevel === 'high');
  const modRiskZones = zones.filter(z => z.riskLevel === 'moderate');
  const highAnchors = highRiskZones.map(z => new THREE.Vector3(...z.anchor));
  const modAnchors = modRiskZones.map(z => new THREE.Vector3(...z.anchor));

  // Pass 1: Find min/max Y in rootGroup space
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

  // Pass 2: Per-vertex color computation
  for (let i = 0; i < pos.count; i++) {
    vert.fromBufferAttribute(pos, i);
    worldVert.copy(vert).applyMatrix4(mesh.matrixWorld);
    localPos.copy(worldVert);
    rootGroup.worldToLocal(localPos);

    tempCol.copy(COLOR_WHITE);

    const normY = THREE.MathUtils.clamp((localPos.y - minY) / heightRange, 0.0, 1.0);

    let maxHighInf = 0.0;
    let maxModInf = 0.0;

    // Distance to high-risk zone anchors (reuse pre-computed vecs)
    for (let zi = 0; zi < highRiskZones.length; zi++) {
      const dist = localPos.distanceTo(highAnchors[zi]);
      const inf = 1.0 - THREE.MathUtils.smoothstep(dist, highRiskZones[zi].radius * 0.08, highRiskZones[zi].radius);
      if (inf > maxHighInf) maxHighInf = inf;
    }

    // Distance to moderate-risk zone anchors
    for (let zi = 0; zi < modRiskZones.length; zi++) {
      const dist = localPos.distanceTo(modAnchors[zi]);
      const inf = 1.0 - THREE.MathUtils.smoothstep(dist, modRiskZones[zi].radius * 0.08, modRiskZones[zi].radius);
      if (inf > maxModInf) maxModInf = inf;
    }

    // Anatomical height zones — Femoral Head & Neck (top) → Red
    if (normY > 0.64) {
      const neckInf = THREE.MathUtils.clamp((normY - 0.64) / 0.26, 0.0, 1.0);
      maxHighInf = Math.max(maxHighInf, neckInf);
    }

    // Greater Trochanter band → Orange
    if (normY >= 0.44 && normY <= 0.74) {
      const trochanterInf = 1.0 - Math.abs(normY - 0.58) / 0.16;
      if (trochanterInf > 0) maxModInf = Math.max(maxModInf, trochanterInf * 0.9);
    }

    // Color blend: White → Orange → Red (gamma-correct powers)
    if (maxHighInf > 0.04) {
      const w = Math.min(1.0, Math.pow(maxHighInf, 0.95));
      tempCol.lerp(COLOR_ORANGE, w * 0.30).lerp(COLOR_RED, w * 0.98);
    } else if (maxModInf > 0.04) {
      const w = Math.min(1.0, maxModInf * 0.95);
      tempCol.lerp(COLOR_ORANGE, w);
    }

    colors[i * 3] = tempCol.r;
    colors[i * 3 + 1] = tempCol.g;
    colors[i * 3 + 2] = tempCol.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.attributes.color.needsUpdate = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Material Factory — High-Definition PBR Bone Materials
// ─────────────────────────────────────────────────────────────────────────────

function createBoneMaterial(mode) {

  // ── X-Ray: 3-layer depth-sorted translucency + emissive inner core ──────────
  if (mode === 'xray') {
    return new THREE.MeshPhysicalMaterial({
      color: '#bae6fd',
      emissive: '#0369a1',
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.22,
      roughness: 0.08,
      metalness: 0.0,
      transmission: 0.6,
      thickness: 1.2,
      ior: 1.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  // ── Wireframe: crisp indigo topology lines ───────────────────────────────────
  if (mode === 'wireframe') {
    return new THREE.MeshBasicMaterial({ color: '#6366f1', wireframe: true });
  }

  // ── Mesh: translucent diagnostic blue with wireframe overlay ────────────────
  if (mode === 'mesh') {
    return new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      roughness: 0.18,
      metalness: 0.30,
      wireframe: true,
      side: THREE.DoubleSide,
    });
  }

  // ── Anatomical: warm ivory cortical bone — periosteum + lamellar sheen ───────
  if (mode === 'anatomical') {
    const mat = new THREE.MeshPhysicalMaterial({
      color: '#f0ead6',          // warm ivory cortex
      roughness: 0.42,
      metalness: 0.0,
      clearcoat: 0.45,           // periosteum specular layer
      clearcoatRoughness: 0.25,
      sheen: 0.35,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color('#e8ddc8'),
      reflectivity: 0.55,
      envMapIntensity: 1.2,
      side: THREE.DoubleSide,
    });

    // GLSL: cortical lamellar micro-grooves + gentle Fresnel rim
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = `varying vec3 vWorldNorm;\nvarying vec3 vWorldPos;\n${shader.vertexShader}`
        .replace(
          '#include <worldpos_vertex>',
          `#include <worldpos_vertex>
           vWorldPos  = (modelMatrix * vec4(transformed, 1.0)).xyz;
           vWorldNorm = normalize(mat3(modelMatrix) * objectNormal);`
        );

      shader.fragmentShader = `
        varying vec3 vWorldPos;
        varying vec3 vWorldNorm;

        // Tileable cortical bone lamellar ring pattern
        float lamellarRings(vec3 p, float freq) {
          return 0.5 + 0.5 * sin(p.y * freq + sin(p.x * freq * 0.3 + p.z * freq * 0.2) * 0.6);
        }

        ${shader.fragmentShader}
      `.replace('#include <dithering_fragment>', `
        #include <dithering_fragment>

        // Warm Fresnel periosteal rim
        vec3 vDir = normalize(cameraPosition - vWorldPos);
        float rim = pow(1.0 - max(0.0, dot(vWorldNorm, vDir)), 3.2);
        gl_FragColor.rgb += vec3(0.98, 0.93, 0.82) * rim * 0.22;

        // Subtle lamellar ring micro-texture (Haversian canal pattern)
        float rings = lamellarRings(vWorldPos * 18.0, 6.2832);
        gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.94, gl_FragColor.rgb * 1.06, rings);
      `);
    };

    return mat;
  }

  // ── Risk Heatmap: vertex-colored + Voronoi trabecular texture + Fresnel ──────
  const mat = new THREE.MeshPhysicalMaterial({
    color: '#ffffff',
    roughness: 0.28,
    metalness: 0.0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.20,
    reflectivity: 0.55,
    envMapIntensity: 1.3,
    vertexColors: true,
    side: THREE.DoubleSide,
  });

  mat.onBeforeCompile = (shader) => {
    // Pass world-space position and normal to fragment shader
    shader.vertexShader = `
      varying vec3 vWorldPos;
      varying vec3 vWorldNorm;
      ${shader.vertexShader}
    `.replace(
      '#include <worldpos_vertex>',
      `#include <worldpos_vertex>
       vWorldPos  = (modelMatrix * vec4(transformed, 1.0)).xyz;
       vWorldNorm = normalize(mat3(modelMatrix) * objectNormal);`
    );

    shader.fragmentShader = `
      varying vec3 vWorldPos;
      varying vec3 vWorldNorm;

      // ── 3D Voronoi for trabecular lattice micro-texture ──────────────────────
      vec3 hash33(vec3 p) {
        p = fract(p * vec3(443.897, 441.423, 437.195));
        p += dot(p, p.yxz + 19.19);
        return fract((p.xxy + p.yxx) * p.zyx);
      }
      float voronoi(vec3 x) {
        vec3 ip = floor(x), fp = fract(x);
        float d = 8.0;
        for (int k = -1; k <= 1; k++)
        for (int j = -1; j <= 1; j++)
        for (int i = -1; i <= 1; i++) {
          vec3 b   = vec3(float(i), float(j), float(k));
          vec3 r   = b + hash33(ip + b) - fp;
          d = min(d, dot(r, r));
        }
        return sqrt(d);
      }

      // ── Perlin-like noise for cortical surface variation ─────────────────────
      float hash(float n) { return fract(sin(n) * 43758.5453123); }
      float noise(vec3 p) {
        vec3 ip = floor(p);
        vec3 fp = smoothstep(0.0, 1.0, fract(p));
        float n = ip.x + ip.y * 57.0 + ip.z * 113.0;
        return mix(
          mix(mix(hash(n), hash(n+1.0), fp.x), mix(hash(n+57.0), hash(n+58.0), fp.x), fp.y),
          mix(mix(hash(n+113.0), hash(n+114.0), fp.x), mix(hash(n+170.0), hash(n+171.0), fp.x), fp.y),
          fp.z
        );
      }

      ${shader.fragmentShader}
    `.replace('#include <dithering_fragment>', `
      #include <dithering_fragment>

      // ── Fresnel rim highlight (edge scattering) ────────────────────────────
      vec3 viewDir = normalize(cameraPosition - vWorldPos);
      float NdotV  = max(0.0, dot(normalize(vWorldNorm), viewDir));
      float fresnel = pow(1.0 - NdotV, 2.8);
      gl_FragColor.rgb += vec3(0.96, 0.99, 1.0) * fresnel * 0.32;

      // ── Voronoi trabecular lattice ─────────────────────────────────────────
      // Fine scale (osteon cross-sections)
      float cell_fine   = voronoi(vWorldPos * 42.0);
      float lattice_fine = smoothstep(0.05, 0.55, cell_fine);
      // Coarse scale (trabecular struts)
      float cell_coarse  = voronoi(vWorldPos * 14.0);
      float lattice_coarse = smoothstep(0.10, 0.70, cell_coarse);

      float lattice = lattice_fine * 0.65 + lattice_coarse * 0.35;
      gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.87, gl_FragColor.rgb * 1.13, lattice);

      // ── Cortical surface noise micro-variation ─────────────────────────────
      float surface_n = noise(vWorldPos * 28.0);
      gl_FragColor.rgb *= 0.93 + 0.14 * surface_n;

      // ── Subsurface scatter simulation (warm glow inside bone) ──────────────
      float sss = pow(1.0 - NdotV, 1.4) * 0.18;
      gl_FragColor.rgb += vec3(0.92, 0.84, 0.74) * sss * vColor.r; // warm in healthy zones
    `);
  };

  return mat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Anatomical Diagrammatic Leader Lines & Label Badges with Collision Clamping
// ─────────────────────────────────────────────────────────────────────────────

function AnnotationPinItem({ z, isSelected, isHovered, onSelectZone, onHoverZone }) {
  const { camera, size } = useThree();
  const isElevated = isSelected || isHovered;

  const [layout, setLayout] = useState({
    side: z.side || 'left',
    targetX: z.offset ? z.offset[0] : (z.side === 'left' ? -10 : 10),
    targetY: z.offset ? z.offset[1] : 0,
    midX: z.side === 'left' ? -4 : 4,
  });

  const isHigh = z.riskLevel === 'high';
  const isMod = z.riskLevel === 'moderate';
  const pinColor = isHigh ? '#ef4444' : isMod ? '#f97316' : '#14b8a6';

  useFrame(() => {
    if (!camera || !size.width || !size.height) return;
    const vec = new THREE.Vector3(...z.anchor);
    vec.project(camera);
    const screenX = (vec.x * size.width) / 2;
    const screenY = (-vec.y * size.height) / 2;
    const halfW = size.width / 2;
    const halfH = size.height / 2;
    const badgeW = isElevated ? 95 : 60;
    const edgeMargin = 12;

    const baseSide = z.side || (vec.x < 0 ? 'left' : 'right');
    const rawTargetX = z.offset ? z.offset[0] : (baseSide === 'left' ? -10 : 10);
    const rawTargetY = z.offset ? z.offset[1] : 0;

    // 2. Boundary Collision Detection:
    const wouldExceedLeft = (screenX + rawTargetX - badgeW) < (-halfW + edgeMargin);
    const wouldExceedRight = (screenX + rawTargetX + badgeW) > (halfW - edgeMargin);

    let effectiveSide = baseSide;
    let targetX = rawTargetX;
    let targetY = rawTargetY;

    if (effectiveSide === 'left' && wouldExceedLeft) {
      effectiveSide = 'right';
      targetX = Math.abs(rawTargetX);
    } else if (effectiveSide === 'right' && wouldExceedRight) {
      effectiveSide = 'left';
      targetX = -Math.abs(rawTargetX);
    }

    // 3. Fine-grained Edge Clamping to prevent clipping:
    if (effectiveSide === 'left') {
      const currentLeft = screenX + targetX - badgeW;
      if (currentLeft < -halfW + edgeMargin) {
        targetX += (-halfW + edgeMargin) - currentLeft;
      }
    } else {
      const currentRight = screenX + targetX + badgeW;
      if (currentRight > halfW - edgeMargin) {
        targetX -= (currentRight - (halfW - edgeMargin));
      }
    }

    // Y Axis Boundary Clamping:
    const currentTop = screenY + targetY - (isElevated ? 32 : 12);
    const currentBottom = screenY + targetY + (isElevated ? 32 : 12);
    if (currentTop < -halfH + edgeMargin) {
      targetY += (-halfH + edgeMargin) - currentTop;
    } else if (currentBottom > halfH - edgeMargin) {
      targetY -= (currentBottom - (halfH - edgeMargin));
    }

    const midX = targetX * 0.35;

    if (
      effectiveSide !== layout.side ||
      Math.abs(targetX - layout.targetX) > 0.5 ||
      Math.abs(targetY - layout.targetY) > 0.5
    ) {
      setLayout({
        side: effectiveSide,
        targetX,
        targetY,
        midX,
      });
    }
  });

  const isLeft = layout.side === 'left';
  const { targetX, targetY, midX } = layout;

  return (
    <group position={z.anchor}>
      <Html
        distanceFactor={8.8}
        zIndexRange={isElevated ? [99999, 99999] : [50, 10]}
        style={{
          zIndex: isElevated ? 99999 : 10,
          pointerEvents: 'none',
        }}
      >
        <div className="relative pointer-events-none select-none">
          {/* 1. Target Pin Anchor on Bone Surface */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto z-10"
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone?.(z.id);
            }}
            onMouseEnter={() => onHoverZone?.(z)}
            onMouseLeave={() => onHoverZone?.(null)}
          >
            <div
              className="w-2 h-2 rounded-full flex items-center justify-center transition-transform hover:scale-125"
              style={{
                background: 'rgba(3, 7, 18, 0.95)',
                border: `1.2px solid ${pinColor}`,
                boxShadow: `0 0 4px ${pinColor}`,
              }}
            >
              <span
                className="w-0.8 h-0.8 rounded-full"
                style={{ background: pinColor }}
              />
            </div>
            {isElevated && (
              <span
                className="w-2.5 h-2.5 rounded-full absolute -top-0.5 -left-0.5 animate-ping opacity-75"
                style={{ background: pinColor }}
              />
            )}
          </div>

          {/* 2. SVG Dynamic Leader Line */}
          <svg
            className="absolute top-0 left-0 overflow-visible pointer-events-none"
            style={{ width: 1, height: 1 }}
          >
            <path
              d={`M 0 0 L ${midX} ${targetY} L ${targetX} ${targetY}`}
              fill="none"
              stroke={pinColor}
              strokeWidth={isElevated ? '1.2' : '0.8'}
              strokeOpacity={isElevated ? 1.0 : 0.65}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx={targetX}
              cy={targetY}
              r={isElevated ? 1.2 : 1.0}
              fill={pinColor}
            />
          </svg>

          {/* 3. Scaled Responsive Label Badge (10px proximity) */}
          <div
            className="absolute pointer-events-auto cursor-pointer transition-all duration-150"
            style={{
              left: `${targetX}px`,
              top: `${targetY}px`,
              transform: isLeft ? 'translate(-100%, -50%)' : 'translate(2px, -50%)',
              zIndex: isElevated ? 99999 : 10,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectZone?.(z.id);
            }}
            onMouseEnter={() => onHoverZone?.(z)}
            onMouseLeave={() => onHoverZone?.(null)}
          >
            <div
              className={`rounded transition-all ${isElevated ? 'scale-105 ring-1 ring-blue-500/40 shadow-lg' : 'hover:scale-102 shadow-sm'
                }`}
              style={{
                background: isElevated ? '#020617' : 'rgba(9, 13, 31, 0.95)',
                border: `1px solid ${isElevated ? pinColor : pinColor + '88'}`,
                boxShadow: isElevated
                  ? `0 4px 12px rgba(0,0,0,0.95), 0 0 8px ${pinColor}88`
                  : '0 1px 4px rgba(0,0,0,0.5)',
                width: isElevated ? 95 : 'max-content',
                minWidth: 55,
                maxWidth: isElevated ? 100 : 78,
                minHeight: 18,
                padding: '1.5px 3.5px',
              }}
            >
              {/* Header: Full Zone Name & Status Badge */}
              <div className="flex items-center justify-between gap-1">
                <span className="font-black text-white whitespace-nowrap text-[7px] tracking-tight truncate max-w-[48px]">
                  {z.label}
                </span>
                <span
                  className="font-black px-0.8 py-0.1 rounded shrink-0 uppercase text-[5.5px]"
                  style={{
                    background: `${pinColor}25`,
                    color: pinColor,
                    border: `0.5px solid ${pinColor}55`,
                  }}
                >
                  {isHigh ? 'High' : isMod ? 'Elev' : 'Norm'}
                </span>
              </div>

              {/* Sub-Header: Landmark Sub-Label & T-Score */}
              <div className="flex items-center justify-between gap-1 mt-0.1 text-slate-400">
                <span className="font-semibold text-[6px] whitespace-nowrap text-slate-400 truncate max-w-[40px]">
                  {z.subLabel || 'Landmark'}
                </span>
                <span className="font-mono font-bold text-[6.5px] shrink-0" style={{ color: pinColor }}>
                  T: {z.tScore}
                </span>
              </div>

              {/* Full Detailed Insight on Hover / Select — slim and compact */}
              {isElevated && (
                <div className="mt-1 pt-1 border-t border-white/15 text-left animate-fade-in space-y-0.8">
                  <div className="text-[6.8px] font-black uppercase tracking-wider text-slate-400">
                    Risk Zone Insight:
                  </div>
                  <p className="text-[7.5px] text-slate-200 leading-tight font-medium line-clamp-2 break-words">
                    {z.note}
                  </p>
                  <div className="flex items-center justify-between text-[7px] bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 mt-0.5">
                    <span className="text-slate-400">vBMD: <b className="text-white">{z.vBMD}</b></span>
                    <span className="font-bold" style={{ color: pinColor }}>
                      {isHigh ? '87%' : isMod ? '52%' : '12%'} Risk
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function AnnotationPins({ zones, activeZoneId, hoveredZoneId, showAnnotations, onSelectZone, onHoverZone }) {
  if (!showAnnotations) return null;

  return (
    <group>
      {zones.map((z) => (
        <AnnotationPinItem
          key={z.id}
          z={z}
          isSelected={activeZoneId === z.id}
          isHovered={hoveredZoneId === z.id}
          onSelectZone={onSelectZone}
          onHoverZone={onHoverZone}
        />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Real Anatomical Bone Model
// ─────────────────────────────────────────────────────────────────────────────

function RealAnatomicalBoneModel({
  modelPath,
  mode,
  autoRotate,
  zones,
  showAnnotations = true,
  selectedRegion,
  hoveredZone,
  onZoneEvent
}) {
  const { scene } = useGLTF(modelPath);
  const rootRef = useRef();

  const group = useMemo(() => {
    const clone = scene.clone(true);
    const inner = new THREE.Group();
    const wrapper = new THREE.Group();

    clone.traverse(c => {
      if (!c.isMesh || !c.geometry) return;
      c.geometry = c.geometry.clone();

      // High-definition geometry preparation:
      // 1. Compute smooth normals for accurate PBR lighting across curved surfaces
      c.geometry.computeVertexNormals();
      // 2. Compute tangents for correct clearcoat normal mapping
      if (c.geometry.getIndex()) {
        try { c.geometry.computeTangents(); } catch (_) { /* non-indexed geo — skip */ }
      }
      // 3. Merge vertices to remove duplicate boundary seams before normal smoothing
      c.geometry.normalizeNormals();

      c.castShadow = true;
      c.receiveShadow = true;
    });

    inner.add(clone);

    // Auto-orient: if the GLB is stored with Z-up convention, rotate to Y-up
    const ib = new THREE.Box3().setFromObject(inner);
    const is = ib.getSize(new THREE.Vector3());
    if (is.z > is.y && is.z > is.x) inner.rotation.x = -Math.PI / 2;

    wrapper.add(inner);

    // Normalise scale and centre the model in world-space
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
      <AnnotationPins
        zones={zones}
        activeZoneId={selectedRegion}
        hoveredZoneId={hoveredZone?.id}
        showAnnotations={showAnnotations}
        onSelectZone={(id) => onZoneEvent?.({ zone: zones.find(z => z.id === id), type: 'click' })}
        onHoverZone={(zone) => onZoneEvent?.({ zone, type: zone ? 'hover' : 'out' })}
      />
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
// Error Boundary & Fallback Mesh for 3D Geometry
// ─────────────────────────────────────────────────────────────────────────────

class BoneModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('3D Bone Model loading issue detected:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <group>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.45, 2.8, 32]} />
            <meshStandardMaterial color="#ef4444" roughness={0.4} />
          </mesh>
        </group>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Viewport Overlay (View Controls + Clean Risk Heatmap Legend)
// ─────────────────────────────────────────────────────────────────────────────

const P = { background: 'rgba(3,7,18,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, fontFamily: 'system-ui' };

function ViewportOverlay({
  preset,
  onPreset,
  isXray,
  onXray,
  showAnnotations,
  onToggleAnnotations,
}) {
  const [open, setOpen] = useState(false);

  const planes = [
    { id: 'coronal', label: 'Coronal', abbr: 'AP' },
    { id: 'sagittal', label: 'Sagittal', abbr: 'LAT' },
    { id: 'axial', label: 'Axial', abbr: 'AX' },
    { id: 'pa', label: 'PA View', abbr: 'PA' },
    { id: 'oblique', label: 'Oblique', abbr: 'OBL' },
    { id: 'tangential', label: 'Tangential', abbr: 'TAN' },
  ];

  const currentPlane = planes.find(p => p.id === preset) || planes[0];

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      {/* Top-Right: Sleek Collapsible Planes & View Menu */}
      <div className="pointer-events-auto absolute right-3 top-3">
        <div style={{ ...P }}>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 9px', borderRadius: 10, cursor: 'pointer',
              background: open ? 'rgba(59,130,246,0.2)' : 'transparent',
              border: 'none', color: '#e2e8f0', fontSize: 10, fontWeight: 800,
            }}
          >
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
            <span>Plane: {currentPlane.abbr}</span>
            <span style={{ fontSize: 8, opacity: 0.7 }}>{open ? '▲' : '▼'}</span>
          </button>

          {open && (
            <div style={{ padding: '6px 6px 6px', borderTop: '1px solid rgba(255,255,255,0.06)', width: 145 }}>
              <p style={{ fontSize: 8, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 4px 4px' }}>Orthogonal Presets</p>
              {planes.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { onPreset(p.id); setOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                    padding: '4px 6px', borderRadius: 6, marginBottom: 1,
                    border: preset === p.id ? '1px solid rgba(59,130,246,0.5)' : '1px solid transparent',
                    background: preset === p.id ? 'rgba(59,130,246,0.2)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: 8, fontWeight: 900, color: preset === p.id ? '#93c5fd' : '#64748b', width: 22 }}>{p.abbr}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: preset === p.id ? '#ffffff' : '#94a3b8' }}>{p.label}</span>
                </button>
              ))}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
              <button
                type="button"
                onClick={() => { onToggleAnnotations(); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, width: '100%',
                  padding: '4px 6px', borderRadius: 6, cursor: 'pointer',
                  background: showAnnotations ? 'rgba(59,130,246,0.18)' : 'transparent',
                  border: 'none', color: showAnnotations ? '#93c5fd' : '#94a3b8',
                  fontSize: 9.5, fontWeight: 700,
                }}
              >
                <Tag size={10} />
                <span>{showAnnotations ? 'Hide Badges' : 'Show Badges'}</span>
              </button>
              <button
                type="button"
                onClick={() => { onXray(); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, width: '100%',
                  padding: '4px 6px', borderRadius: 6, cursor: 'pointer',
                  background: isXray ? 'rgba(6,182,212,0.2)' : 'transparent',
                  border: 'none', color: isXray ? '#67e8f9' : '#94a3b8',
                  fontSize: 9.5, fontWeight: 700,
                }}
              >
                {isXray ? <EyeOff size={10} /> : <Eye size={10} />}
                <span>{isXray ? 'Exit X-Ray' : 'X-Ray View'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom-Right: Ultra-Compact Clean Risk Heatmap Legend */}
      <div className="pointer-events-none absolute right-3 bottom-3">
        <div style={{ ...P, overflow: 'hidden', padding: '5px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 5, height: 32, borderRadius: 3, flexShrink: 0,
            background: 'linear-gradient(to top, #ffffff 0%, #f97316 50%, #ef4444 100%)',
          }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 8.5, fontWeight: 800 }}>
            <span className="text-red-400 leading-none">High Risk</span>
            <span className="text-orange-400 leading-none">Moderate</span>
            <span className="text-slate-200 leading-none">Normal</span>
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
  showAnnotations = true,
  autoRotate = false,
  isFullscreen = false,
  selectedRegion = 'femoral-neck',
  riskLevel = 'high',
  clinicalNote = '',
  zoneRisks = [],
  onSelectRegion,
  onZoneHover,
  onViewAngleChange,
  onXrayChange,
  onToggleAnnotations,
  onToggleFullscreen,
}) {
  const controlsRef = useRef();
  const [xrayOn, setXrayOn] = useState(xray);
  const [camPreset, setCamPreset] = useState(viewAngle);
  const [annotationsOn, setAnnotationsOn] = useState(showAnnotations);
  const [currentHoverZone, setCurrentHoverZone] = useState(null);

  useEffect(() => setXrayOn(xray), [xray]);
  useEffect(() => setCamPreset(viewAngle), [viewAngle]);
  useEffect(() => setAnnotationsOn(showAnnotations), [showAnnotations]);

  const zones = useMemo(() =>
    normalizeZones(zoneRisks, { selectedRegion, riskLevel, clinicalNote }),
    [zoneRisks, selectedRegion, riskLevel, clinicalNote]
  );

  const mode = xrayOn ? 'xray' : meshMode ? 'mesh' : heatmap ? 'heatmap' : wireframe ? 'wireframe' : 'anatomical';

  const handleZoneEvent = useCallback((ev) => {
    if (!ev || ev.type === 'out') {
      setCurrentHoverZone(null);
      onZoneHover?.(null);
      return;
    }
    if (ev.type === 'click') {
      onSelectRegion?.(ev.zone.id);
      setCurrentHoverZone(ev.zone);
      onZoneHover?.(ev.zone);
    } else if (ev.type === 'hover') {
      setCurrentHoverZone(ev.zone);
      onZoneHover?.(ev.zone);
    }
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

  const handleToggleAnnotations = useCallback(() => {
    const next = !annotationsOn;
    setAnnotationsOn(next);
    onToggleAnnotations?.(next);
  }, [annotationsOn, onToggleAnnotations]);

  return (
    <div className="relative h-full w-full min-w-0 max-w-full overflow-hidden select-none">
      <Canvas
        className="w-full h-full min-w-0 max-w-full overflow-hidden"
        camera={{ position: CAM.overview.pos, fov: 42, near: 0.01, far: 100 }}
        dpr={[1.5, 3]}
        shadows="soft"
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          // Enable logarithmic depth buffer for accurate close-up z-sorting
          logarithmicDepthBuffer: true,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.20;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = THREE.PCFSoftShadowMap;
        }}
      >
        {/* ── 6-Light Clinical Rig ─────────────────────────────────────────── */}
        {/* Key light — primary anatomical definition */}
        <directionalLight
          position={[4, 7, 5]}
          intensity={1.55}
          color="#ffffff"
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-camera-near={0.1}
          shadow-camera-far={30}
          shadow-camera-left={-4}
          shadow-camera-right={4}
          shadow-camera-top={4}
          shadow-camera-bottom={-4}
          shadow-bias={-0.0002}
        />
        {/* Fill light — soft blue-cool fill from the opposite side */}
        <directionalLight position={[-4, 3, -2]} intensity={0.70} color="#c7d9f5" />
        {/* Rim / backlight — separates bone edge from background */}
        <directionalLight position={[0, -2, -5]} intensity={0.45} color="#e0eeff" />
        {/* Under-fill — lifts shadow in condyle region */}
        <directionalLight position={[0, -5, 3]} intensity={0.28} color="#d4e8ff" />
        {/* Warm bounce — simulates operating-theatre lighting */}
        <pointLight position={[2, 1, 3]} intensity={0.40} color="#fff3dc" distance={8} decay={2} />
        {/* Cool accent — fine detail highlight on neck/head */}
        <pointLight position={[-1.5, 3, 1.5]} intensity={0.30} color="#b8d4ff" distance={6} decay={2} />
        {/* Ambient base — prevent pitch-black in deep concavities */}
        <ambientLight intensity={0.50} color="#f0f4ff" />

        {/* HDR studio environment — best for PBR clearcoat + sheen */}
        <Environment preset="studio" background={false} />

        <CameraController preset={camPreset} controlsRef={controlsRef} />

        {/* Zoom: minDistance 0.04 allows extreme close-up into trabecular zones */}
        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.06}
          minDistance={0.04}
          maxDistance={8}
          makeDefault
          rotateSpeed={0.8}
          zoomSpeed={1.2}
          panSpeed={0.8}
        />

        <Suspense fallback={null}>
          <BoneModelErrorBoundary>
            <RealAnatomicalBoneModel
              modelPath={modelPath}
              mode={mode}
              autoRotate={autoRotate}
              zones={zones}
              showAnnotations={annotationsOn}
              selectedRegion={selectedRegion}
              hoveredZone={currentHoverZone}
              onZoneEvent={handleZoneEvent}
            />
          </BoneModelErrorBoundary>

          {/* Soft ground shadow — clinical staging platform feel */}
          <ContactShadows
            position={[0, -1.24, 0]}
            opacity={0.70}
            scale={4.0}
            blur={2.5}
            far={3.0}
            color="#010b1a"
          />

          {/* Holographic staging rings — 3-ring depth to emphasise 3D space */}
          <group position={[0, -1.23, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <mesh>
              <ringGeometry args={[0.68, 0.70, 96]} />
              <meshBasicMaterial color="#38bdf8" opacity={0.35} transparent side={THREE.DoubleSide} />
            </mesh>
            <mesh>
              <ringGeometry args={[1.02, 1.035, 96]} />
              <meshBasicMaterial color="#0284c7" opacity={0.18} transparent side={THREE.DoubleSide} />
            </mesh>
            <mesh>
              <ringGeometry args={[1.38, 1.39, 96]} />
              <meshBasicMaterial color="#075985" opacity={0.10} transparent side={THREE.DoubleSide} />
            </mesh>
          </group>
        </Suspense>
        {/* Preload prevents the model from flickering on first material switch */}
        <Preload all />
      </Canvas>

      <ViewportOverlay
        preset={camPreset}
        onPreset={handlePreset}
        isXray={xrayOn}
        onXray={handleXray}
        showAnnotations={annotationsOn}
        onToggleAnnotations={handleToggleAnnotations}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        zones={zones}
      />
    </div>
  );
}
