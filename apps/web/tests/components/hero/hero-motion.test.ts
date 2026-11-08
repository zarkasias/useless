import { describe, expect, it } from "vitest";

import { cardMotion, createHeroMotion } from "@/components/hero/hero-motion";

describe("cardMotion", () => {
  it("starts each card at rest, back up, with the sheen off the card", () => {
    const motion = createHeroMotion();

    expect(cardMotion(motion, 3)).toEqual({
      pop: 0,
      sheen: -1,
      flip: 0,
      hover: 0,
      settle: 0,
      tease: 0,
    });
  });

  it("returns the same object each time, so GSAP tweens stay attached", () => {
    const motion = createHeroMotion();
    const first = cardMotion(motion, 0);

    first.pop = 0.5;

    expect(cardMotion(motion, 0)).toBe(first);
    expect(cardMotion(motion, 0).pop).toBe(0.5);
  });
});
