"use client";

import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  ShaderMaterial,
  Vector3,
  type CatmullRomCurve3,
} from "three";

import tokens from "@useless/design-tokens/tokens.json";
import { MAX_SPARKLES, type HeroConfig } from "./hero-config";
import type { HeroMotion } from "./hero-motion";

// The badge colours of the rarities a claim can give.
const RARITY_COLORS = ["rare", "epic", "legendary", "secret"].map(
  (name) =>
    new Color(
      tokens.color.rarity[name as keyof typeof tokens.color.rarity].badgeStart,
    ),
);

// A soft dot with a faint four-point glint. Normal blending, not additive,
// because additive light vanishes on the hero's pale background.
const vertexShader = /* glsl */ `
  attribute float alpha;
  attribute float size;
  attribute vec3 color;
  uniform float pixelRatio;
  uniform float focusDistance;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * pixelRatio * (focusDistance / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = alpha;
    vColor = color;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float d = length(p);
    float core = smoothstep(0.32, 0.0, d);
    float glint = max(
      smoothstep(0.06, 0.0, abs(p.x)) * smoothstep(0.5, 0.0, abs(p.y)),
      smoothstep(0.06, 0.0, abs(p.y)) * smoothstep(0.5, 0.0, abs(p.x))
    );
    float a = max(core * core, glint * 0.7) * vAlpha;

    if (a < 0.01) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

interface Sparkle {
  /** Where along the path it starts, 0–1. */
  start: number;
  /** Its own pace, around 1. */
  pace: number;
  offset: Vector3;
  phase: number;
  twinkle: number;
  size: number;
}

interface SparklesProps {
  config: HeroConfig;
  motion: HeroMotion;
  /** The stream's current path, once built. */
  getPath: () => CatmullRomCurve3 | null;
}

/** Layer 6: a few small sparkles drifting along the path. */
export function Sparkles({ config, motion, getPath }: SparklesProps) {
  const { camera, gl } = useThree();
  const point = useMemo(() => new Vector3(), []);

  const sparkles = useMemo<Sparkle[]>(
    () =>
      Array.from({ length: MAX_SPARKLES }, (_, i) => ({
        // Evenly spread along the path, so they never clump at the start.
        start: (i * 0.618034) % 1,
        pace: 0.75 + Math.random() * 0.5,
        offset: new Vector3(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
        ),
        phase: Math.random() * Math.PI * 2,
        twinkle: 0.6 + Math.random() * 1.2,
        size: 0.6 + Math.random() * 0.8,
      })),
    [],
  );

  const geometry = useMemo(() => {
    const shape = new BufferGeometry();
    const colors = new Float32Array(MAX_SPARKLES * 3);

    sparkles.forEach((_, i) => {
      RARITY_COLORS[i % RARITY_COLORS.length]!.toArray(colors, i * 3);
    });

    shape.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(MAX_SPARKLES * 3), 3),
    );
    shape.setAttribute("color", new BufferAttribute(colors, 3));
    shape.setAttribute(
      "alpha",
      new BufferAttribute(new Float32Array(MAX_SPARKLES), 1),
    );
    shape.setAttribute(
      "size",
      new BufferAttribute(new Float32Array(MAX_SPARKLES), 1),
    );

    return shape;
  }, [sparkles]);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        uniforms: {
          pixelRatio: { value: 1 },
          focusDistance: { value: 6.5 },
        },
      }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);

  useFrame(({ clock }) => {
    const path = getPath();
    const settings = config.particles;
    const count = config.layers.particles
      ? Math.min(MAX_SPARKLES, Math.max(0, Math.round(settings.count)))
      : 0;

    geometry.setDrawRange(0, count);

    if (!path || count === 0) return;

    const visible = motion.ambient * motion.fade;
    const positions = geometry.attributes.position as BufferAttribute;
    const alphas = geometry.attributes.alpha as BufferAttribute;
    const sizes = geometry.attributes.size as BufferAttribute;
    const time = clock.elapsedTime;
    const lap = time / Math.max(4, settings.seconds);

    material.uniforms.pixelRatio!.value = gl.getPixelRatio();
    material.uniforms.focusDistance!.value = camera.position.z - 0.5;

    for (let i = 0; i < count; i++) {
      const sparkle = sparkles[i]!;
      const t = (((sparkle.start + lap * sparkle.pace) % 1) + 1) % 1;

      path.getPointAt(t, point);
      point.addScaledVector(sparkle.offset, settings.spread);
      // A slow wander, so they never look like they're on rails.
      point.y += Math.sin(time * 0.4 + sparkle.phase) * 0.08;
      point.x += Math.cos(time * 0.3 + sparkle.phase) * 0.06;
      positions.setXYZ(i, point.x, point.y, point.z);

      // Fade in after the entry and out before the end of the path.
      const ends = Math.min(1, t / 0.15, (1 - t) / 0.15);
      const glow = 0.5 + 0.5 * Math.sin(time * sparkle.twinkle + sparkle.phase);

      alphas.setX(i, settings.opacity * ends * (0.35 + 0.65 * glow) * visible);
      sizes.setX(i, settings.size * sparkle.size);
    }

    positions.needsUpdate = true;
    alphas.needsUpdate = true;
    sizes.needsUpdate = true;
  });

  // Drawn first, so they sit behind the cards like dust in the air.
  return (
    <points
      geometry={geometry}
      material={material}
      renderOrder={-1}
      frustumCulled={false}
    />
  );
}
