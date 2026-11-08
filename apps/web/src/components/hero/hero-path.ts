import type { HeroConfig } from "./hero-config";

// Pure maths for the stream, kept apart from three.js so it's easy to test.

export type Layout = "desktop" | "mobile";

export function smoothstep(edge0: number, edge1: number, x: number) {
  if (edge1 <= edge0) return x < edge0 ? 0 : 1;

  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));

  return t * t * (3 - 2 * t);
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/**
 * Faked depth of field. Scale, opacity and brightness peak at the focus
 * point and fall off smoothly on both sides; the exit fade covers the last
 * part of the path so cards never pop out of view.
 */
export function depthAt(config: HeroConfig, t: number) {
  const { entry, focus, exit, focusAt } = config;

  if (t <= focusAt) {
    const k = smoothstep(0, focusAt, t);

    return {
      scale: lerp(entry.scale, focus.scale, k),
      opacity: lerp(entry.opacity, focus.opacity, k),
      brightness: lerp(entry.brightness, focus.brightness, k),
    };
  }

  const after = smoothstep(focusAt, 1, t);
  const fade = smoothstep(1 - exit.length, 1, t);

  return {
    scale: lerp(focus.scale, exit.scale, after),
    opacity: lerp(focus.opacity, exit.opacity, fade),
    brightness: lerp(focus.brightness, entry.brightness, after * 0.35),
  };
}

const REMAP_SAMPLES = 512;
// The slowest pace allowed at focus, so cards never stall completely.
const MIN_PACE = 0.12;

/**
 * Layer 1. Turns even travel (u, 0–1) into position along the path (t, 0–1)
 * so cards move faster on entry, slow down and linger around the focus
 * point, then speed up on the exit. Because the stream still advances
 * evenly in u, one card still passes the focus point every `secondsPerCard`.
 */
export function createSpeedRemap(
  focusAt: number,
  strength: number,
  width: number,
): (u: number) => number {
  // Cumulative time to reach each sample, at a pace that dips near focus.
  const times = new Float64Array(REMAP_SAMPLES + 1);
  let total = 0;

  for (let k = 1; k <= REMAP_SAMPLES; k++) {
    const t = (k - 0.5) / REMAP_SAMPLES;
    const dip = Math.exp(-(((t - focusAt) / Math.max(width, 0.01)) ** 2));
    const pace = Math.max(MIN_PACE, 1 - strength * dip);

    total += 1 / REMAP_SAMPLES / pace;
    times[k] = total;
  }

  for (let k = 1; k <= REMAP_SAMPLES; k++) times[k]! /= total;

  return (u: number) => {
    if (u <= 0) return 0;
    if (u >= 1) return 1;

    // The first sample reached at or after u, then interpolate.
    let low = 0;
    let high = REMAP_SAMPLES;

    while (high - low > 1) {
      const middle = (low + high) >> 1;

      if (times[middle]! < u) low = middle;
      else high = middle;
    }

    const span = times[high]! - times[low]!;
    const fraction = span > 0 ? (u - times[low]!) / span : 0;

    return (low + fraction) / REMAP_SAMPLES;
  };
}

const BANK_SAMPLES = 200;

/**
 * Layer 2. How sharply the path bends at each point on screen, from -1 to 1
 * (1 is the sharpest bend anywhere on the path). `tangentAt` gives the
 * path's direction; only its on-screen x and y matter.
 */
export function createBankTable(
  tangentAt: (t: number) => { x: number; y: number },
): (t: number) => number {
  const angles = Array.from({ length: BANK_SAMPLES + 1 }, (_, k) => {
    const tangent = tangentAt(k / BANK_SAMPLES);

    return Math.atan2(tangent.y, tangent.x);
  });
  const turns = angles.map((_, k) => {
    const before = angles[Math.max(0, k - 1)]!;
    const after = angles[Math.min(BANK_SAMPLES, k + 1)]!;
    let change = after - before;

    // Keep the change in direction within ±π.
    change -= Math.PI * 2 * Math.round(change / (Math.PI * 2));

    return change;
  });
  const sharpest = Math.max(...turns.map(Math.abs), 1e-6);
  const table = turns.map((turn) => turn / sharpest);

  return (t: number) => {
    const position = Math.min(1, Math.max(0, t)) * BANK_SAMPLES;
    const low = Math.floor(position);
    const high = Math.min(BANK_SAMPLES, low + 1);

    return lerp(table[low]!, table[high]!, position - low);
  };
}

/** Where card `index` sits on the path (0–1), or null while it waits. */
export function cardProgress(
  config: HeroConfig,
  layout: Layout,
  travel: number,
  index: number,
) {
  const { cardCount } = config.stream;
  const spacing = config.stream.spacing[layout];
  // With wide spacing the cards don't fill the loop; the rest wait off-path.
  const loop = Math.max(1, cardCount * spacing);
  const u = (((travel + index * spacing) % loop) + loop) % loop;

  return u <= 1 ? u : null;
}
