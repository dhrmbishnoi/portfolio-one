import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createArtifact,
  DEFAULT_PARAMS,
  type ArtifactHandle,
  type PointerState,
  type StageParams,
} from './artifact';

/**
 * THE ARTIFACT — construction and per-frame maths
 * ---------------------------------------------------------------------------
 * A GPU cannot be exercised here, so this suite deliberately tests the parts
 * that *can* be and that are where the real mistakes live: a three.js API that
 * moved, geometry that never made it into the group, a pose that silently stops
 * following the scroll, resources that leak on teardown.
 *
 * Shader compilation is the browser's business; the contract this suite pins
 * down is the one the sections rely on — write a pose, get that pose.
 */
const COLORS = {
  a: new THREE.Color('#7c5cff'),
  b: new THREE.Color('#d7ff4f'),
  c: new THREE.Color('#37e8d5'),
};

const STILL: PointerState = { x: 0, y: 0 };

function build(): ArtifactHandle {
  return createArtifact(THREE, { lowPower: true, colors: COLORS });
}

/** Run the damped follow forward until it settles on `pose`. */
function settle(
  artifact: ArtifactHandle,
  pose: StageParams,
  frames = 150,
  aspect = 1.6,
): void {
  for (let frame = 0; frame < frames; frame += 1) {
    artifact.update(frame * 0.016, 0.016, pose, STILL, aspect);
  }
}

describe('createArtifact', () => {
  it('assembles a complete object: core, lattice, shell, rings, dust and bloom', () => {
    const artifact = build();
    const kinds = artifact.group.children.map((child) => child.type);
    const meshes = artifact.group.children.filter(
      (child) => (child as THREE.Mesh).geometry?.type === 'TorusGeometry',
    );

    expect(kinds).toContain('Mesh');
    expect(kinds).toContain('LineSegments');
    expect(kinds).toContain('Points');
    expect(meshes).toHaveLength(3);
    expect(artifact.group.children.length).toBeGreaterThanOrEqual(8);

    artifact.dispose();
  });

  it('follows the pose the scroll asks for', () => {
    const artifact = build();
    const pose: StageParams = {
      ...DEFAULT_PARAMS,
      x: -0.5,
      y: 0.3,
      scale: 1.8,
      twist: 0.6,
      opacity: 1,
    };

    settle(artifact, pose);

    expect(artifact.group.scale.x).toBeCloseTo(pose.scale, 2);
    expect(artifact.group.position.x).toBeLessThan(0);
    expect(artifact.group.position.y).toBeGreaterThan(0);
    // The rotation carries the framing twist, so it is demonstrably not zero.
    expect(Math.abs(artifact.group.rotation.z)).toBeGreaterThan(0.1);
    expect(Number.isFinite(artifact.group.position.x)).toBe(true);

    artifact.dispose();
  });

  it('maps a normalised x of 1 to the right-hand edge of the frustum, not off it', () => {
    const artifact = build();
    const aspect = 1.6;
    const viewHeight = 2 * Math.tan((45 * Math.PI) / 360) * 6;
    const halfWidth = (viewHeight * aspect) / 2;

    settle(artifact, { ...DEFAULT_PARAMS, x: 1, opacity: 1 }, 150, aspect);
    const right = artifact.group.position.x;

    settle(artifact, { ...DEFAULT_PARAMS, x: -1, opacity: 1 }, 150, aspect);
    const left = artifact.group.position.x;

    expect(right).toBeGreaterThan(0);
    expect(left).toBeLessThan(0);
    expect(right).toBeCloseTo(-left, 3);
    // The far pose stays inside the frame, so the artifact is never lost.
    expect(Math.abs(right)).toBeLessThan(halfWidth);

    artifact.dispose();
  });

  it('drives each part from its own parameter', () => {
    const artifact = build();
    const lattice = artifact.group.children.find((child) => child.type === 'LineSegments')!;
    const dust = artifact.group.children.find((child) => child.type === 'Points')!;

    settle(artifact, { ...DEFAULT_PARAMS, wire: 0, spread: 0, glow: 0, opacity: 1 });
    // Snapshot the numbers: the material and mesh are mutated in place.
    const quietOpacity = ((lattice as THREE.LineSegments).material as THREE.LineBasicMaterial)
      .opacity;
    const tightDust = dust.scale.x;

    settle(artifact, { ...DEFAULT_PARAMS, wire: 1, spread: 2, glow: 1, opacity: 1 });
    const loudOpacity = ((lattice as THREE.LineSegments).material as THREE.LineBasicMaterial).opacity;

    expect(quietOpacity).toBeLessThan(loudOpacity);
    expect(dust.scale.x).toBeGreaterThan(tightDust);

    artifact.dispose();
  });

  it('keeps the bloom billboard facing the camera whatever the object does', () => {
    const artifact = build();
    // The bloom is the only plane in the group.
    const bloom = artifact.group.children.find(
      (child) => (child as THREE.Mesh).geometry?.type === 'PlaneGeometry',
    ) as THREE.Mesh;

    settle(artifact, { ...DEFAULT_PARAMS, spin: 2, twist: 1.2, opacity: 1 }, 120);

    // bloom.quaternion is the inverse of the group's, so composing them must
    // land back on identity — that is what keeps the glow flat to the camera.
    const composed = artifact.group.quaternion.clone().multiply(bloom.quaternion);
    expect(composed.w).toBeCloseTo(1, 4);
    expect(Math.abs(composed.x) + Math.abs(composed.y) + Math.abs(composed.z)).toBeLessThan(1e-4);

    artifact.dispose();
  });

  it('takes itself off screen when the narrative releases it', () => {
    const artifact = build();

    settle(artifact, { ...DEFAULT_PARAMS, opacity: 0 }, 200);

    expect(artifact.drawn).toBe(false);
    expect(artifact.group.visible).toBe(false);

    artifact.dispose();
  });

  it('disposes cleanly and leaves no children behind', () => {
    const artifact = build();
    expect(() => artifact.dispose()).not.toThrow();
    expect(artifact.group.children).toHaveLength(0);
  });
});
