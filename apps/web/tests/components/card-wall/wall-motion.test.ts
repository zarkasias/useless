import { describe, expect, it } from "vitest";

import {
  MOTION,
  createMotionState,
  layerOffset,
  onPointer,
  onTouchMove,
  onTouchStart,
  step,
  type MotionState,
} from "@/components/card-wall/wall-motion";

/** Runs the wall for `ms` at `hz`, starting at `from` ms. Returns the end time. */
function run(state: MotionState, ms: number, hz: number, from = 0) {
  const frame = 1000 / hz;
  let now = from;

  for (let elapsed = 0; elapsed < ms; elapsed += frame) {
    now += frame;
    step(state, now, frame);
  }

  return now;
}

describe("wall motion", () => {
  it("drifts slowly sideways and down when nothing is happening", () => {
    const state = createMotionState();

    run(state, 1000, 60);

    // About 0.35 and 0.18 px per frame: ~21 and ~11 px a second.
    expect(state.x).toBeCloseTo(MOTION.driftX * 60, 0);
    expect(state.y).toBeCloseTo(MOTION.driftY * 60, 0);
  });

  it("moves the same distance on 60 Hz and 120 Hz screens", () => {
    const slow = createMotionState();
    const fast = createMotionState();

    // Include a change of speed, so the easing is exercised too.
    onPointer(slow, 1400, 450, 1440, 900, 0);
    onPointer(fast, 1400, 450, 1440, 900, 0);
    run(slow, 2000, 60);
    run(fast, 2000, 120);

    expect(Math.abs(fast.x - slow.x)).toBeLessThan(Math.abs(slow.x) * 0.02);
  });

  it("pans away from the cursor, faster the further it is from the centre", () => {
    const edge = createMotionState();
    const near = createMotionState();

    // Cursor at the right edge and slightly right of centre, a little low.
    onPointer(edge, 1440, 900, 1440, 900, 0);
    onPointer(near, 900, 450, 1440, 900, 0);
    run(edge, 1500, 60);
    run(near, 1500, 60);

    expect(edge.vx).toBeLessThan(0);
    expect(edge.vy).toBeLessThan(0);
    expect(edge.vx).toBeGreaterThanOrEqual(-MOTION.followX);
    expect(edge.vy).toBeGreaterThanOrEqual(-MOTION.followY);
    expect(Math.abs(edge.vx)).toBeGreaterThan(Math.abs(near.vx));
  });

  it("eases back to the slow drift 2.5 seconds after the mouse stops", () => {
    const state = createMotionState();

    onPointer(state, 0, 0, 1440, 900, 0);
    run(state, 2400, 60);
    expect(state.vx).toBeGreaterThan(MOTION.followX * 0.9);

    run(state, 3000, 60, 2400);
    expect(state.vx).toBeCloseTo(MOTION.driftX, 1);
    expect(state.vy).toBeCloseTo(MOTION.driftY, 1);
  });

  it("follows a finger drag, mostly sideways, then coasts", () => {
    const state = createMotionState();

    onTouchStart(state, 200, 400);
    onTouchMove(state, 220, 380, 0);

    expect(state.vx).toBeCloseTo(20 * MOTION.dragX);
    expect(state.vy).toBeCloseTo(-20 * MOTION.dragY);

    // Coasting: still moving the drag's way a moment later, but slowing.
    run(state, 250, 60);
    expect(state.vx).toBeGreaterThan(MOTION.driftX);
    expect(state.vx).toBeLessThan(20 * MOTION.dragX);
  });

  it("never leaps after a stall, such as a background tab", () => {
    const state = createMotionState();

    step(state, 60_000, 60_000);

    expect(state.x).toBeCloseTo(MOTION.driftX * MOTION.maxFrames);
  });
});

describe("layerOffset", () => {
  it("shifts a quarter of the page scroll, moving up as the page scrolls down", () => {
    const state = createMotionState();

    expect(layerOffset(state, 0, 1000, 1000).y).toBe(0);
    expect(layerOffset(state, 400, 1000, 1000).y).toBe(1000 - 100);
  });

  it("always stays inside one repeat block", () => {
    const state = createMotionState();

    for (const [x, y, scroll] of [
      [0, 0, 0],
      [5321, -777, 4000],
      [-12_000, 9_000, 120],
    ]) {
      state.x = x!;
      state.y = y!;
      const offset = layerOffset(state, scroll!, 3100, 3510);

      expect(offset.x).toBeGreaterThanOrEqual(0);
      expect(offset.x).toBeLessThan(3100);
      expect(offset.y).toBeGreaterThanOrEqual(0);
      expect(offset.y).toBeLessThan(3510);
    }
  });
});
