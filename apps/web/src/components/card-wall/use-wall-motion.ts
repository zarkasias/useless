"use client";

import { useEffect, useRef, type RefObject } from "react";

import {
  createMotionState,
  layerOffset,
  onPointer,
  onTouchMove,
  onTouchStart,
  step,
} from "./wall-motion";
import type { WallGeometry } from "./wall-tiling";

export interface WallMotionOptions {
  /** The one layer that moves. */
  layerRef: RefObject<HTMLDivElement | null>;
  geometry: WallGeometry | null;
  /** True while a card is zoomed: the wall holds still where it is. */
  paused: boolean;
  /** The visitor asked for reduced motion: the wall never moves. */
  reducedMotion: boolean;
}

/**
 * Moves the wall with one transform on one layer, once per frame: a slow
 * drift, panning away from the mouse, following a finger drag, and a quarter
 * of the page scroll. The loop stops while the tab is hidden.
 */
export function useWallMotion({
  layerRef,
  geometry,
  paused,
  reducedMotion,
}: WallMotionOptions) {
  const state = useRef(createMotionState());
  const geometryRef = useRef(geometry);
  const pausedRef = useRef(paused);

  useEffect(() => {
    geometryRef.current = geometry;
  }, [geometry]);

  useEffect(() => {
    // Coming back from a zoom: carry on drifting from where it stopped.
    if (pausedRef.current && !paused) {
      state.current.lastInputAt = Number.NEGATIVE_INFINITY;
      state.current.touching = false;
    }
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (reducedMotion) {
      // Nothing moves on its own, and the wall doesn't follow the scroll.
      if (layerRef.current) layerRef.current.style.transform = "";
      return;
    }

    const motion = state.current;
    let frame = 0;
    let lastFrameAt: number | null = null;

    const draw = () => {
      const layer = layerRef.current;
      const g = geometryRef.current;

      if (!layer || !g) return;

      const { x, y } = layerOffset(
        motion,
        window.scrollY,
        g.blockWidth,
        g.blockHeight,
      );

      layer.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      const elapsed = lastFrameAt === null ? 0 : now - lastFrameAt;

      lastFrameAt = now;

      // Held still while a card is zoomed, so it closes back onto its card.
      if (pausedRef.current) return;

      step(motion, now, elapsed);
      draw();
    };

    const start = () => {
      if (frame || document.hidden) return;
      lastFrameAt = null;
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };

    const onVisibility = () => (document.hidden ? stop() : start());

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch" || pausedRef.current) return;
      onPointer(
        motion,
        event.clientX,
        event.clientY,
        window.innerWidth,
        window.innerHeight,
        performance.now(),
      );
    };

    const onTouchStartEvent = (event: TouchEvent) => {
      const touch = event.touches[0];

      if (touch) onTouchStart(motion, touch.clientX, touch.clientY);
    };

    // Passive: vertical swipes still scroll the page.
    const onTouchMoveEvent = (event: TouchEvent) => {
      const touch = event.touches[0];

      if (!touch || pausedRef.current) return;
      onTouchMove(motion, touch.clientX, touch.clientY, performance.now());
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("touchstart", onTouchStartEvent, { passive: true });
    window.addEventListener("touchmove", onTouchMoveEvent, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchstart", onTouchStartEvent);
      window.removeEventListener("touchmove", onTouchMoveEvent);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [layerRef, reducedMotion]);
}
