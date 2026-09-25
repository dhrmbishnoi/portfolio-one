/**
 * GLSL used by the artifact.
 * ---------------------------------------------------------------------------
 * Kept in one module so the shaders can be reviewed as a unit. All of them are
 * GLSL ES 1.0 (`three` default) and share a single 3D simplex noise
 * implementation — the canonical Ashima Arts / Stefan Gustavson `snoise`
 * (MIT), included verbatim rather than approximated, because its gradient
 * table is what makes the displacement look like a field rather than jitter.
 */

export const SIMPLEX_3D = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/**
 * The crystal core: an icosahedron pushed around by two octaves of noise. The
 * face normal comes from the undisplaced sphere direction, which is exact
 * enough for a displaced sphere and costs nothing.
 */
export const CORE_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uEnergy;

varying vec3 vNormal;
varying vec3 vView;
varying float vDisp;

${SIMPLEX_3D}

void main() {
  vec3 dir = normalize(position);

  float broad = snoise(dir * 1.15 + vec3(0.0, uTime * 0.11, uTime * 0.05));
  float fine = snoise(dir * 3.4 - vec3(uTime * 0.07, 0.0, uTime * 0.13));
  float ridge = snoise(dir * 7.1 + vec3(uTime * 0.05));

  // Two octaves plus a high-frequency ridge: the surface reads as crystal
  // facets at rest and as turbulence when the story pushes its energy uniform.
  float disp = broad * 0.62 + fine * 0.26 + ridge * 0.12;
  float amp = mix(0.06, 0.42, clamp(uEnergy, 0.0, 1.0));

  vec3 displaced = position * (1.0 + disp * amp);

  vDisp = disp;
  vNormal = normalize(normalMatrix * dir);
  vec4 view = modelViewMatrix * vec4(displaced, 1.0);
  vView = normalize(-view.xyz);

  gl_Position = projectionMatrix * view;
}
`;

export const CORE_FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uOpacity;
uniform float uGlow;

varying vec3 vNormal;
varying vec3 vView;
varying float vDisp;

void main() {
  vec3 normal = normalize(vNormal);
  float fresnel = pow(1.0 - clamp(dot(normal, normalize(vView)), 0.0, 1.0), 2.1);

  // The base colour is a gradient through the displacement field, so the
  // facets that bulge catch one accent and the valleys another.
  vec3 base = mix(uColorA, uColorB, smoothstep(-0.5, 0.6, vDisp));
  base = mix(base, uColorC, fresnel * 0.75);

  vec3 color = base + uColorC * fresnel * uGlow * 0.9;
  float alpha = uOpacity * (0.42 + fresnel * 0.75);

  gl_FragColor = vec4(color, alpha);
}
`;

/**
 * The aurora shell: the same silhouette, rendered from the inside with additive
 * blending. Cheap stand-in for a bloom pass — it hugs the core and is the part
 * that "glows" as the narrative reaches its peaks.
 */
export const SHELL_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uEnergy;

varying vec3 vNormal;
varying vec3 vView;

${SIMPLEX_3D}

void main() {
  vec3 dir = normalize(position);
  float pulse = snoise(dir * 1.6 + vec3(0.0, uTime * 0.09, 0.0));
  vec3 displaced = position * (1.0 + pulse * mix(0.08, 0.5, clamp(uEnergy, 0.0, 1.0)));

  vNormal = normalize(normalMatrix * dir);
  vec4 view = modelViewMatrix * vec4(displaced, 1.0);
  vView = normalize(-view.xyz);
  gl_Position = projectionMatrix * view;
}
`;

export const SHELL_FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorC;
uniform float uOpacity;
uniform float uGlow;

varying vec3 vNormal;
varying vec3 vView;

void main() {
  // BackSide, so the rim of the shell is where the surface turns away.
  float rim = pow(1.0 - abs(dot(normalize(vNormal), normalize(vView))), 2.6);
  vec3 color = mix(uColorA, uColorC, rim);
  gl_FragColor = vec4(color, uOpacity * rim * (0.35 + uGlow));
}
`;
