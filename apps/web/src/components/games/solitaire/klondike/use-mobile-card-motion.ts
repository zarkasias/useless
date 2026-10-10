import { useLayoutEffect, useRef } from "react";
import type { KlondikeBoardState } from "@/lib/games/solitaire/klondike/klondike-types";

interface CardPosition {
  left: number;
  top: number;
  width: number;
  height: number;
}

// Animate the real destination cards from their previous positions. The move
// commits immediately, so animation never delays scoring or queues stale moves.
export function useMobileCardMotion(board: KlondikeBoardState) {
  const boardRef = useRef<HTMLDivElement>(null);
  const previousPositions = useRef(new Map<string, CardPosition>());

  useLayoutEffect(() => {
    const root = boardRef.current;
    if (!root) return;

    const animations: Animation[] = [];
    const cleanups: (() => void)[] = [];
    const reducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const measure = () => {
      const origin = root.getBoundingClientRect();
      const positions = new Map<string, CardPosition>();
      root
        .querySelectorAll<HTMLElement>("[data-mobile-card-id]")
        .forEach((element) => {
          const rect = element.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          positions.set(element.dataset.mobileCardId!, {
            left: rect.left - origin.left,
            top: rect.top - origin.top,
            width: rect.width,
            height: rect.height,
          });
        });
      return positions;
    };

    const nextPositions = measure();
    root
      .querySelectorAll<HTMLElement>("[data-mobile-card-id]")
      .forEach((element) => {
        const id = element.dataset.mobileCardId!;
        const from = previousPositions.current.get(id);
        const to = nextPositions.get(id);

        if (!from || !to || reducedMotion || !element.animate) return;

        const dx = from.left - to.left;

        const dy = from.top - to.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;

        const oldZIndex = element.style.zIndex;
        element.style.zIndex = "30";
        const restore = () => {
          element.style.zIndex = oldZIndex;
        };
        const animation = element.animate(
          [
            {
              transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width}, ${from.height / to.height})`,
              transformOrigin: "top left",
            },
            { transform: "none", transformOrigin: "top left" },
          ],
          { duration: 240, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
        animation.onfinish = restore;
        animation.oncancel = restore;
        animations.push(animation);
        cleanups.push(restore);
      });
    previousPositions.current = nextPositions;

    // A rotation or breakpoint change establishes fresh coordinates without
    // animating a layout resize as if it were a card move.
    const onResize = () => {
      animations.forEach((animation) => animation.cancel());
      previousPositions.current = measure();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      animations.forEach((animation) => animation.cancel());
      cleanups.forEach((restore) => restore());
    };
  }, [board]);

  return boardRef;
}
