import * as THREE from 'three';
import { CORE_FRAGMENT, CORE_VERTEX, SHELL_FRAGMENT, SHELL_VERTEX } from './shaders';

/**
 * THE ARTIFACT
 * ---------------------------------------------------------------------------
 * One object, built once, that the whole scroll story choreographs. It is
 * deliberately *one* thing rather than a scene of props: the narrative needs
 * the reader to recognise it in the hero, watch it deform while the story
 * argues, and see it bloom open at the invitation.
 *
 *     core        displaced icosahedron, iridescent fresnel shader
 *     lattice     nested wireframe, counter-rotating (reads as "structure")
 *     shell       additive back-side shell, the glow hugging the silhouette
 *     rings       three hairline orbits on separate tilts
 *     dust        fibonacci particle nebula
 *     bloom       soft billboard behind everything
 *
 * Every part reacts to the same `StageParams` object, tweened by ScrollTrigger,
 * so a section only has to describe the pose it wants — it never touches the
 * scene graph. Damping lives here, which keeps the motion continuous even when
 * two sections hand the object to each other mid-scroll.
 */

/** Normalised pose. `x`/`y` are -1…1 across the viewport, not world units. */
export interface StageParams {
  x: number;
  y: number;
  scale: number;
  /** Rotation speed multiplier, can be negative to reverse the spin. */
  spin: number;
  /** Radians added to the base rotation — a deliberate framing tilt. */
  twist: number;
  /** 0…1 surface turbulence. */
  energy: number;
  /** 0…1 lattice visibility — the "blueprint" register. */
  wire: number;
  /** 0…1 rim glow. */
  glow: number;
  /** 0…1 dust expansion. */
  spread: number;
  /** 0…1 overall presence. */
  opacity: number;
}

export const DEFAULT_PARAMS: StageParams = {
  x: 0,
  y: 0,
  scale: 1,
  spin: 1,
  twist: 0,
  energy: 0.35,
  wire: 0.25,
  glow: 0.45,
  spread: 0.5,
  opacity: 1,
};

export interface ArtifactColors {
  /** Iris — the deep base. */
  a: THREE.Color;
  /** Accent — the warm signal colour. */
  b: THREE.Color;
  /** Aqua — the electric highlight. */
  c: THREE.Color;
}

export interface ArtifactOptions {
  /** Fewer subdivisions, fewer particles: for phones and low-core machines. */
  lowPower: boolean;
  colors: ArtifactColors;
}

export interface PointerState {
  /** -1…1, normalised pointer position. */
  x: number;
  y: number;
}

export interface ArtifactHandle {
  readonly group: THREE.Group;
  /** True when the artifact would put any pixels on screen. */
  readonly drawn: boolean;
  update(
    elapsed: number,
    delta: number,
    params: StageParams,
    pointer: PointerState,
    aspect: number,
  ): void;
  dispose(): void;
}

/** Frame-rate independent damping factor. */
function damping(delta: number, rate: number): number {
  return 1 - Math.exp(-Math.max(0.001, delta) * rate);
}

/** A radial dot, drawn once into a canvas — no image request, no asset. */
function createDotTexture(THREE_: typeof THREE): THREE.Texture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  let context: CanvasRenderingContext2D | null = null;
  try {
    context = canvas.getContext('2d');
  } catch {
    // jsdom has no canvas implementation; the texture then stays blank, which
    // is invisible in a test and never happens in a browser.
    context = null;
  }

  if (context) {
    const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.55)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  const texture = new THREE_.CanvasTexture(canvas);
  texture.colorSpace = THREE_.SRGBColorSpace;
  return texture;
}

/** Points scattered on a fibonacci shell — an even field, not clumpy random. */
function createDustGeometry(count: number, radius: number): THREE.BufferGeometry {
  const positions = new Float32Array(count * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const ring = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * index;
    // A shallow shell rather than a perfect sphere: the field has depth.
    const r = radius * (0.82 + Math.random() * 0.36);

    positions[index * 3] = Math.cos(theta) * ring * r;
    positions[index * 3 + 1] = y * r * 0.78;
    positions[index * 3 + 2] = Math.sin(theta) * ring * r;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return geometry;
}

export function createArtifact(THREE_: typeof THREE, options: ArtifactOptions): ArtifactHandle {
  const { lowPower, colors } = options;
  const group = new THREE_.Group();
  const disposables: Array<{ dispose(): void }> = [];

  // --------------------------------------------------------------- the core ---
  const coreGeometry = new THREE_.IcosahedronGeometry(1, lowPower ? 12 : 24);
  const coreMaterial = new THREE_.ShaderMaterial({
    vertexShader: CORE_VERTEX,
    fragmentShader: CORE_FRAGMENT,
    transparent: true,
    depthWrite: true,
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: DEFAULT_PARAMS.energy },
      uColorA: { value: colors.a.clone() },
      uColorB: { value: colors.b.clone() },
      uColorC: { value: colors.c.clone() },
      uOpacity: { value: 1 },
      uGlow: { value: DEFAULT_PARAMS.glow },
    },
  });
  const core = new THREE_.Mesh(coreGeometry, coreMaterial);
  core.renderOrder = 1;
  group.add(core);
  disposables.push(coreGeometry, coreMaterial);

  // ------------------------------------------------------------ the lattice ---
  // A wireframe icosahedron reads as the underlying structure of the object,
  // which is exactly the register the method section needs.
  // WireframeGeometry copies the positions out of its source, so the source is
  // released immediately rather than held for the life of the artifact.
  const latticeSource = new THREE_.IcosahedronGeometry(1.3, lowPower ? 2 : 3);
  const latticeGeometry = new THREE_.WireframeGeometry(latticeSource);
  latticeSource.dispose();
  const latticeMaterial = new THREE_.LineBasicMaterial({
    color: colors.c.clone(),
    transparent: true,
    opacity: 0.16,
    blending: THREE_.AdditiveBlending,
    depthWrite: false,
  });
  const lattice = new THREE_.LineSegments(latticeGeometry, latticeMaterial);
  lattice.renderOrder = 3;
  group.add(lattice);
  disposables.push(latticeGeometry, latticeMaterial);

  // -------------------------------------------------------------- the shell ---
  const shellGeometry = new THREE_.IcosahedronGeometry(1, lowPower ? 8 : 16);
  const shellMaterial = new THREE_.ShaderMaterial({
    vertexShader: SHELL_VERTEX,
    fragmentShader: SHELL_FRAGMENT,
    transparent: true,
    depthWrite: false,
    side: THREE_.BackSide,
    blending: THREE_.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uEnergy: { value: DEFAULT_PARAMS.energy },
      uColorA: { value: colors.a.clone() },
      uColorC: { value: colors.c.clone() },
      uOpacity: { value: 0.5 },
      uGlow: { value: DEFAULT_PARAMS.glow },
    },
  });
  const shell = new THREE_.Mesh(shellGeometry, shellMaterial);
  shell.scale.setScalar(1.22);
  shell.renderOrder = 4;
  group.add(shell);
  disposables.push(shellGeometry, shellMaterial);

  // --------------------------------------------------------------- the rings ---
  const ringGeometry = new THREE_.TorusGeometry(1, 0.0035, 3, lowPower ? 128 : 320);
  const ringSpecs: Array<{ radius: number; tilt: number; speed: number; opacity: number }> = [
    { radius: 1.72, tilt: 0.42, speed: 0.22, opacity: 0.34 },
    { radius: 2.06, tilt: -0.78, speed: -0.15, opacity: 0.2 },
    { radius: 2.44, tilt: 1.16, speed: 0.09, opacity: 0.12 },
  ];
  const rings = ringSpecs.map((spec) => {
    const material = new THREE_.MeshBasicMaterial({
      color: colors.c.clone(),
      transparent: true,
      opacity: spec.opacity,
      blending: THREE_.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE_.Mesh(ringGeometry, material);
    ring.scale.setScalar(spec.radius);
    ring.rotation.set(Math.PI / 2 + spec.tilt * 0.55, spec.tilt, spec.tilt * 0.4);
    ring.renderOrder = 2;
    group.add(ring);
    disposables.push(material);
    return ring;
  });
  disposables.push(ringGeometry);

  // ---------------------------------------------------------------- the dust ---
  const dustGeometry = createDustGeometry(lowPower ? 900 : 2200, 3.4);
  const dustTexture = createDotTexture(THREE_);
  const dustMaterial = new THREE_.PointsMaterial({
    size: lowPower ? 0.05 : 0.034,
    sizeAttenuation: true,
    map: dustTexture,
    color: colors.c.clone(),
    transparent: true,
    opacity: 0.66,
    depthWrite: false,
    blending: THREE_.AdditiveBlending,
  });
  const dust = new THREE_.Points(dustGeometry, dustMaterial);
  dust.renderOrder = 5;
  group.add(dust);
  disposables.push(dustGeometry, dustMaterial, dustTexture);

  // --------------------------------------------------------------- the bloom ---
  const bloomGeometry = new THREE_.PlaneGeometry(1, 1);
  const bloomMaterial = new THREE_.MeshBasicMaterial({
    map: createDotTexture(THREE_),
    color: colors.a.clone(),
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    blending: THREE_.AdditiveBlending,
  });
  const bloom = new THREE_.Mesh(bloomGeometry, bloomMaterial);
  bloom.scale.setScalar(5.6);
  bloom.position.z = -1.4;
  bloom.renderOrder = 0;
  group.add(bloom);
  disposables.push(bloomGeometry, bloomMaterial, bloomMaterial.map as THREE.Texture);

  // ------------------------------------------------------------------ state ---
  const current: StageParams = { ...DEFAULT_PARAMS };
  let spinPhase = 0;
  let twistPhase = 0;
  let drawn = true;

  const update = (
    elapsed: number,
    delta: number,
    params: StageParams,
    pointer: PointerState,
    aspect: number,
  ): void => {
    // Damped follow of the scroll-authored pose. The scrub sets intent; the
    // render loop supplies the inertia, which is what keeps the object feeling
    // physical instead of keyframed.
    const pose = damping(delta, 6.5);
    current.x += (params.x - current.x) * pose;
    current.y += (params.y - current.y) * pose;
    current.scale += (params.scale - current.scale) * pose;
    current.spin += (params.spin - current.spin) * pose;
    current.twist += (params.twist - current.twist) * pose;
    current.energy += (params.energy - current.energy) * pose;
    current.wire += (params.wire - current.wire) * pose;
    current.glow += (params.glow - current.glow) * pose;
    current.spread += (params.spread - current.spread) * pose;
    current.opacity += (params.opacity - current.opacity) * pose;

    drawn = current.opacity > 0.015;
    group.visible = drawn;
    if (!drawn) {
      return;
    }

    // Perspective framing: fov 45° with the camera on the z axis means the
    // visible height at the origin is 2·tan(22.5°)·distance.
    const viewHeight = 2 * Math.tan((45 * Math.PI) / 360) * 6;
    const viewWidth = viewHeight * Math.max(0.4, aspect);
    const reach = lowPower ? 0.42 : 0.5;

    group.position.x = current.x * viewWidth * reach;
    group.position.y = current.y * viewHeight * reach;
    group.scale.setScalar(Math.max(0.05, current.scale));

    spinPhase += delta * 0.16 * current.spin;
    twistPhase += delta * 0.05 * current.spin;
    group.rotation.y = spinPhase + pointer.x * 0.26;
    group.rotation.x = -pointer.y * 0.2 + Math.sin(elapsed * 0.24) * 0.06;
    group.rotation.z = twistPhase + current.twist;

    core.rotation.y = elapsed * 0.05;
    lattice.rotation.y = -elapsed * 0.11 * current.spin;
    lattice.rotation.x = elapsed * 0.07 * current.spin;
    lattice.rotation.z = -elapsed * 0.03;

    // Vertical breathing: the object is never perfectly still, so a static
    // scroll position still reads as a live render.
    core.scale.setScalar(1 + Math.sin(elapsed * 0.6) * 0.012 * current.energy);

    const uniforms = coreMaterial.uniforms;
    uniforms['uTime']!.value = elapsed;
    uniforms['uEnergy']!.value = current.energy;
    uniforms['uOpacity']!.value = current.opacity;
    uniforms['uGlow']!.value = current.glow;

    const shellUniforms = shellMaterial.uniforms;
    shellUniforms['uTime']!.value = elapsed;
    shellUniforms['uEnergy']!.value = current.energy;
    shellUniforms['uOpacity']!.value = current.opacity * (0.34 + current.glow * 0.4);
    shellUniforms['uGlow']!.value = current.glow;
    shell.scale.setScalar(1.18 + current.energy * 0.14 + Math.sin(elapsed * 0.7) * 0.01);

    latticeMaterial.opacity = current.opacity * (0.05 + current.wire * 0.34);

    rings.forEach((ring, index) => {
      const spec = ringSpecs[index]!;
      ring.rotation.z += spec.speed * delta * 0.35 * current.spin;
      ring.rotation.x = Math.PI / 2 + spec.tilt * 0.55 + Math.sin(elapsed * 0.26 + index) * 0.08;
      (ring.material as THREE.MeshBasicMaterial).opacity =
        spec.opacity * current.opacity * (0.45 + current.glow * 0.8);
    });

    dust.rotation.y = elapsed * 0.024;
    dust.rotation.x = Math.sin(elapsed * 0.13) * 0.09;
    dust.scale.setScalar(0.84 + current.spread * 0.4);
    dustMaterial.opacity = 0.6 * current.opacity;

    bloomMaterial.opacity = current.opacity * (0.07 + current.glow * 0.3);
    bloom.scale.setScalar(4.6 + current.energy * 2.2 + current.glow * 1.4);
    // Billboard: undo the group's rotation so the glow always faces the camera.
    bloom.quaternion.copy(group.quaternion).invert();
  };

  return {
    group,
    get drawn() {
      return drawn;
    },
    update,
    dispose: () => {
      disposables.forEach((item) => item.dispose());
      group.clear();
    },
  };
}
