import { describe, expect, it } from "vitest";

import {
  cellIndex,
  wallGeometry,
  wallPeriod,
  wrapOffset,
} from "@/components/card-wall/wall-tiling";

describe("wallPeriod", () => {
  it.each([1, 2, 7, 11, 36, 40, 84, 210])(
    "gives an even column count and a block that holds all %i entries",
    (count) => {
      const { p, q, step } = wallPeriod(count);

      expect(p % 2).toBe(0);
      expect(p * q).toBeGreaterThanOrEqual(count);

      // The step shares no factor with the count.
      const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
      expect(gcd(step, count)).toBe(1);
    },
  );

  it("matches the design for the 11-entry starter catalog", () => {
    expect(wallPeriod(11)).toEqual({ p: 4, q: 3, step: 7 });
  });
});

describe("cellIndex", () => {
  it.each([11, 84])("shows every one of %i entries in one block", (count) => {
    const geometry = { ...wallPeriod(count), count };
    const seen = new Set<number>();

    for (let row = 0; row < geometry.q; row += 1) {
      for (let col = 0; col < geometry.p; col += 1) {
        seen.add(cellIndex(geometry, col, row));
      }
    }

    expect(seen.size).toBe(count);
  });

  it("repeats exactly one block over, so wrapping never jumps", () => {
    const geometry = { ...wallPeriod(84), count: 84 };

    for (let row = 0; row < 20; row += 1) {
      for (let col = 0; col < 20; col += 1) {
        const here = cellIndex(geometry, col, row);

        expect(cellIndex(geometry, col + geometry.p, row)).toBe(here);
        expect(cellIndex(geometry, col, row + geometry.q)).toBe(here);
      }
    }
  });

  it("never puts the same card next to itself in a row", () => {
    const geometry = { ...wallPeriod(84), count: 84 };

    for (let col = 0; col < geometry.p * 2; col += 1) {
      expect(cellIndex(geometry, col, 0)).not.toBe(
        cellIndex(geometry, col + 1, 0),
      );
    }
  });
});

describe("wallGeometry", () => {
  it("uses the phone sizes at 720px and under", () => {
    expect(wallGeometry(84, 720, 800).cellWidth).toBe(228);
    expect(wallGeometry(84, 721, 800).cellWidth).toBe(380);
  });

  it.each([
    [84, 1440, 900],
    [84, 390, 844],
    [11, 1920, 1080],
    [11, 360, 640],
  ])(
    "covers the whole %ix… viewport at every wrapped offset (count %i)",
    (count, width, height) => {
      const g = wallGeometry(count, width, height);

      for (let x = 0; x < g.blockWidth; x += g.cellWidth / 4) {
        for (let y = 0; y < g.blockHeight; y += g.cellHeight / 4) {
          const left = g.originX + x;
          const right = left + g.cols * g.cellWidth;
          // Odd columns drop by half a cell, so their top is the worst case.
          const top = g.originY + y + g.cellHeight / 2;
          const bottom = g.originY + y + g.rows * g.cellHeight;

          expect(left).toBeLessThanOrEqual(0);
          expect(right).toBeGreaterThanOrEqual(width);
          expect(top).toBeLessThanOrEqual(0);
          expect(bottom).toBeGreaterThanOrEqual(height);
        }
      }
    },
  );
});

describe("wrapOffset", () => {
  it("keeps any offset inside one block", () => {
    expect(wrapOffset(0, 100)).toBe(0);
    expect(wrapOffset(250, 100)).toBe(50);
    expect(wrapOffset(-30, 100)).toBe(70);
  });
});
