"use client";

import { useEffect, useRef } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const COLORS = ["#7c3aed", "#3b82f6", "#f59e0b", "#ec4899", "#10b981"];
const PIECES = 28;

/** A one-off burst of confetti from the card's centre each time `trigger` changes. */
export function ConfettiBurst({ trigger }: { trigger: string | null }) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;

    if (
      !trigger ||
      !host ||
      !host.animate ||
      window.matchMedia(REDUCED_MOTION_QUERY).matches
    ) {
      return;
    }

    const pieces: HTMLSpanElement[] = [];

    for (let i = 0; i < PIECES; i++) {
      const piece = document.createElement("span");
      const angle = (i / PIECES) * Math.PI * 2 + Math.random() * 0.4;
      const distance = 140 + Math.random() * 120;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 60;

      piece.className = "absolute left-1/2 top-1/2 block rounded-[2px]";
      piece.style.width = `${6 + Math.random() * 6}px`;
      piece.style.height = `${10 + Math.random() * 8}px`;
      piece.style.background = COLORS[i % COLORS.length];
      host.appendChild(piece);
      pieces.push(piece);

      piece.animate(
        [
          { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y + 160}px)) rotate(${Math.random() * 720 - 360}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 1100 + Math.random() * 500,
          delay: 250,
          easing: "cubic-bezier(0.15, 0.7, 0.4, 1)",
          fill: "forwards",
        },
      );
    }

    const cleanup = window.setTimeout(
      () => pieces.forEach((piece) => piece.remove()),
      2200,
    );

    return () => {
      window.clearTimeout(cleanup);
      pieces.forEach((piece) => piece.remove());
    };
  }, [trigger]);

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
    />
  );
}
