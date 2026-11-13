/**
 * The card wall's motion (HANDOFF.md §2 "Motion"). Pure, so it can be tested
 * without a browser; use-wall-motion.ts feeds it input and frames.
 *
 * Speeds are in pixels per 60 Hz frame. Every step is scaled by the real
 * frame time, so the wall moves at the same speed on 60 Hz and 120 Hz
 * screens. These are the design's starting values; tune them on devices.
 */
import { wrapOffset } from "./wall-tiling";

export const MOTION = {
  /** Slow drift when nothing is happening. */
  driftX: 0.35,
  driftY: 0.18,
  /** Top speed panning away from the cursor, at the screen's edge. */
  followX: 6,
  followY: 4.5,
  /** How long after the last input the wall eases back to the drift. */
  idleMs: 2500,
  /** How quickly the speed eases toward its target, per frame. */
  ease: 0.06,
  /** Slower easing after a finger drag, so the wall coasts. */
  coastEase: 0.03,
  /** How much of a finger drag the wall follows. */
  dragX: 0.9,
  dragY: 0.35,
  /** How far the wall shifts per pixel of page scroll, so it seems further away. */
  scroll: 0.25,
  /** One 60 Hz frame. */
  frameMs: 1000 / 60,
  /** Longest step after a stall, in frames, so the wall never leaps. */
  maxFrames: 3,
} as const;

export interface MotionState {
  /** Free-running offset; wrapped by the block size when drawn. */
  x: number;
  y: number;
  /** Current speed, in px per frame. */
  vx: number;
  vy: number;
  /** Cursor position, -1 to 1 from the screen centre. */
  pointerX: number;
  pointerY: number;
  /** When the last mouse or finger input happened (ms). */
  lastInputAt: number;
  /** True from a finger drag until the wall settles back to the drift. */
  touching: boolean;
  touchX: number;
  touchY: number;
}

export function createMotionState(): MotionState {
  return {
    x: 0,
    y: 0,
    vx: MOTION.driftX,
    vy: MOTION.driftY,
    pointerX: 0,
    pointerY: 0,
    lastInputAt: Number.NEGATIVE_INFINITY,
    touching: false,
    touchX: 0,
    touchY: 0,
  };
}

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

/** A mouse moved. Position and screen size in CSS pixels. */
export function onPointer(
  state: MotionState,
  clientX: number,
  clientY: number,
  width: number,
  height: number,
  now: number,
) {
  state.pointerX = clamp((clientX / width - 0.5) * 2);
  state.pointerY = clamp((clientY / height - 0.5) * 2);
  state.lastInputAt = now;
}

export function onTouchStart(state: MotionState, clientX: number, clientY: number) {
  state.touchX = clientX;
  state.touchY = clientY;
}

/** A finger moved: the wall follows the drag directly. */
export function onTouchMove(
  state: MotionState,
  clientX: number,
  clientY: number,
  now: number,
) {
  state.vx = (clientX - state.touchX) * MOTION.dragX;
  state.vy = (clientY - state.touchY) * MOTION.dragY;
  state.touchX = clientX;
  state.touchY = clientY;
  state.lastInputAt = now;
  state.touching = true;
}

/** Advances the wall by one frame of `elapsedMs`. */
export function step(state: MotionState, now: number, elapsedMs: number) {
  const frames = Math.min(Math.max(elapsedMs, 0) / MOTION.frameMs, MOTION.maxFrames);
  const active = now - state.lastInputAt < MOTION.idleMs;

  if (!active) state.touching = false;

  let targetX: number = MOTION.driftX;
  let targetY: number = MOTION.driftY;

  if (active && !state.touching) {
    // Pan away from the cursor.
    targetX = -state.pointerX * MOTION.followX;
    targetY = -state.pointerY * MOTION.followY;
  }

  // Ease toward the target, scaled by frame time so 120 Hz matches 60 Hz.
  const ease = 1 - Math.pow(1 - (state.touching ? MOTION.coastEase : MOTION.ease), frames);

  state.vx += (targetX - state.vx) * ease;
  state.vy += (targetY - state.vy) * ease;
  state.x += state.vx * frames;
  state.y += state.vy * frames;
}

/**
 * Where to draw the layer: the offset plus a quarter of the page scroll
 * (moving up as the page scrolls down, slower than the content), wrapped
 * into one repeat block so it never leaves a gap.
 */
export function layerOffset(
  state: MotionState,
  scrollY: number,
  blockWidth: number,
  blockHeight: number,
): { x: number; y: number } {
  return {
    x: wrapOffset(state.x, blockWidth),
    y: wrapOffset(state.y - scrollY * MOTION.scroll, blockHeight),
  };
}
