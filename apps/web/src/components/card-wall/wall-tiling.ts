/**
 * The card wall's grid math. Pure, so it can be tested without a browser.
 *
 * The catalog is laid out in a block of P columns by Q rows, and the block
 * repeats in every direction. The layer only ever moves by less than one
 * block before it wraps, and wrapping by a whole block shows identical
 * content, so the wall can scroll forever without a gap or a jump.
 */

export interface WallSizes {
  /** Grid cell, card included. */
  cellWidth: number;
  cellHeight: number;
}

/** Sizes from HANDOFF.md §2. Phones are 720px wide and under. */
export const DESKTOP_SIZES: WallSizes = { cellWidth: 310, cellHeight: 390 };
export const PHONE_SIZES: WallSizes = { cellWidth: 196, cellHeight: 268 };
export const PHONE_MAX_WIDTH = 720;

export interface WallPeriod {
  /** Columns in one repeat block. Always even, so the stagger repeats too. */
  p: number;
  /** Rows in one repeat block. */
  q: number;
  /** Shares no factor with the entry count, so neighbours differ. */
  step: number;
}

function gcd(a: number, b: number): number {
  return b ? gcd(b, a % b) : a;
}

export function wallPeriod(count: number): WallPeriod {
  const n = Math.max(1, count);
  let p = Math.ceil(Math.sqrt(n));

  if (p % 2) p += 1;

  const q = Math.max(1, Math.ceil(n / p));
  const step = [7, 5, 3, 1].find((candidate) => gcd(candidate, n) === 1) ?? 1;

  return { p, q, step };
}

export interface WallGeometry extends WallPeriod, WallSizes {
  count: number;
  /** One repeat block in pixels; the layer's offset wraps at these. */
  blockWidth: number;
  blockHeight: number;
  /** Cells rendered: enough for the viewport plus one block each way. */
  cols: number;
  rows: number;
  /**
   * Where the layer's top-left corner sits before it is moved. One block to
   * the left, and one block plus a row above, so the half-cell drop on odd
   * columns never opens a gap at the top.
   */
  originX: number;
  originY: number;
}

export function wallGeometry(
  count: number,
  viewportWidth: number,
  viewportHeight: number,
): WallGeometry {
  const sizes =
    viewportWidth <= PHONE_MAX_WIDTH ? PHONE_SIZES : DESKTOP_SIZES;
  const period = wallPeriod(count);
  const blockWidth = period.p * sizes.cellWidth;
  const blockHeight = period.q * sizes.cellHeight;

  return {
    ...period,
    ...sizes,
    count: Math.max(1, count),
    blockWidth,
    blockHeight,
    cols: Math.ceil(viewportWidth / sizes.cellWidth) + period.p,
    rows: Math.ceil(viewportHeight / sizes.cellHeight) + period.q + 2,
    originX: -blockWidth,
    originY: -blockHeight - sizes.cellHeight,
  };
}

/** Which catalog entry sits in a cell. Repeats every P columns and Q rows. */
export function cellIndex(
  geometry: Pick<WallGeometry, "p" | "q" | "step" | "count">,
  col: number,
  row: number,
): number {
  const { p, q, step, count } = geometry;

  return (((col % p) + (row % q) * p) * step) % count;
}

/** Wraps a free-running offset into one block, always positive. */
export function wrapOffset(value: number, block: number): number {
  return ((value % block) + block) % block;
}
