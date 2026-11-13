"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";

import { useReducedMotion } from "@/components/hero/use-reduced-motion";
import type { Achievement } from "@/lib/supabase";
import styles from "./card-wall.module.css";
import { WallCard } from "./wall-card";
import { useWallMotion } from "./use-wall-motion";
import { cellIndex, wallGeometry } from "./wall-tiling";

interface Viewport {
  width: number;
  height: number;
}

/**
 * The viewport size the wall is built for. Phones resize the viewport as
 * the address bar shows and hides while scrolling; the wall only grows for
 * that, so scrolling never rebuilds it. A width change (rotation, a desktop
 * window resize) rebuilds it.
 */
function useWallViewport(): Viewport | null {
  const [viewport, setViewport] = useState<Viewport | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const measure = () =>
      setViewport((previous) => {
        const width = window.innerWidth;
        const height =
          previous && previous.width === width
            ? Math.max(previous.height, window.innerHeight)
            : window.innerHeight;

        return previous?.width === width && previous.height === height
          ? previous
          : { width, height };
      });

    const onResize = () => {
      clearTimeout(timer);
      timer = setTimeout(measure, 150);
    };

    // Building the wall is the page's biggest render. As a transition, React
    // can split it up, so the page answers taps before the wall is in.
    startTransition(measure);
    window.addEventListener("resize", onResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return viewport;
}

export interface CardWallProps {
  catalog: Achievement[];
  /** True when this card shows the locked look on the wall. */
  isLocked: (achievement: Achievement) => boolean;
  onOpen?: (achievement: Achievement, card: HTMLButtonElement) => void;
  /** True while a card is zoomed: the wall holds still. */
  paused?: boolean;
}

/**
 * A fixed, viewport-sized wall of achievement cards behind the page, moving
 * as one layer. It renders after mount, once the viewport size is known, so
 * the server and the first client render agree.
 */
export function CardWall({
  catalog,
  isLocked,
  onOpen,
  paused = false,
}: CardWallProps) {
  const viewport = useWallViewport();
  const layerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const geometry = useMemo(
    () =>
      viewport && catalog.length > 0
        ? wallGeometry(catalog.length, viewport.width, viewport.height)
        : null,
    [catalog.length, viewport],
  );

  useWallMotion({ layerRef, geometry, paused, reducedMotion });

  const cells = useMemo(() => {
    if (!geometry) return [];

    const list: { key: string; achievement: Achievement; odd: boolean }[] = [];

    for (let row = 0; row < geometry.rows; row += 1) {
      for (let col = 0; col < geometry.cols; col += 1) {
        const achievement = catalog[cellIndex(geometry, col, row)];

        list.push({ key: `${col}:${row}`, achievement, odd: col % 2 === 1 });
      }
    }

    return list;
  }, [catalog, geometry]);

  return (
    <div
      className={styles.wall}
      role="region"
      aria-label="Wall of achievements"
      data-card-wall
    >
      {geometry && (
        <div
          ref={layerRef}
          className={styles.layer}
          style={
            {
              left: geometry.originX,
              top: geometry.originY,
              width: geometry.cols * geometry.cellWidth,
              gridTemplateColumns: `repeat(${geometry.cols}, ${geometry.cellWidth}px)`,
              gridAutoRows: `${geometry.cellHeight}px`,
              "--half-cell": `${geometry.cellHeight / 2}px`,
            } as React.CSSProperties
          }
        >
          {cells.map(({ key, achievement, odd }) => (
            <WallCard
              key={key}
              achievement={achievement}
              locked={isLocked(achievement)}
              odd={odd}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
