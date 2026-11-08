import { describe, expect, it } from "vitest";

import { createHeroConfig, HERO_CONFIG } from "@/components/hero/hero-config";
import {
  cardProgress,
  createBankTable,
  createSpeedRemap,
  depthAt,
} from "@/components/hero/hero-path";

describe("depthAt", () => {
  const config = createHeroConfig();

  it("starts small and faint at the entry", () => {
    expect(depthAt(config, 0)).toEqual({
      scale: config.entry.scale,
      opacity: config.entry.opacity,
      brightness: config.entry.brightness,
    });
  });

  it("peaks at the focus point", () => {
    expect(depthAt(config, config.focusAt)).toEqual({
      scale: 1,
      opacity: 1,
      brightness: 1,
    });
  });

  it("grows steadily on the approach", () => {
    const steps = [0.1, 0.3, 0.5, config.focusAt].map(
      (t) => depthAt(config, t).scale,
    );

    expect(steps).toEqual([...steps].sort((a, b) => a - b));
  });

  it("stays fully visible until the exit fade, then fades out and shrinks", () => {
    const fadeStart = 1 - config.exit.length;

    expect(depthAt(config, fadeStart).opacity).toBe(1);
    expect(depthAt(config, 1)).toMatchObject({
      opacity: config.exit.opacity,
      scale: config.exit.scale,
    });
    expect(depthAt(config, (fadeStart + 1) / 2).opacity).toBeGreaterThan(0);
    expect(depthAt(config, (fadeStart + 1) / 2).opacity).toBeLessThan(1);
  });
});

describe("cardProgress", () => {
  it("spaces cards evenly along the path", () => {
    const config = createHeroConfig();
    const spacing = config.stream.spacing.desktop;

    expect(cardProgress(config, "desktop", 0, 0)).toBe(0);
    expect(cardProgress(config, "desktop", 0, 2)).toBeCloseTo(spacing * 2);
  });

  it("wraps cards from the exit back to the entry", () => {
    const config = createHeroConfig();

    expect(cardProgress(config, "desktop", 1.05, 0)).toBeCloseTo(0.05);
  });

  it("holds cards off the path when spacing leaves no room for them", () => {
    const config = createHeroConfig();

    config.stream.cardCount = 9;
    config.stream.spacing.mobile = 0.15;

    // 9 cards × 0.15 = a loop of 1.35, so a card at 1.2 waits off the path.
    const index = 8;
    const travel = 1.2 - index * 0.15;

    expect(cardProgress(config, "mobile", travel, index)).toBeNull();
  });

  it("gives each scene its own copy of the config", () => {
    const config = createHeroConfig();

    config.curve.desktop[0]![0] = 99;

    expect(HERO_CONFIG.curve.desktop[0]![0]).not.toBe(99);
  });
});

describe("createSpeedRemap", () => {
  const remap = createSpeedRemap(0.7, 0.5, 0.11);
  // How far along the path a card moves in a small step of travel.
  const paceAt = (u: number) => (remap(u + 0.005) - remap(u - 0.005)) / 0.01;
  // The travel value at which a card reaches path position t.
  const travelAt = (t: number) => {
    let low = 0;
    let high = 1;

    for (let i = 0; i < 40; i++) {
      const middle = (low + high) / 2;

      if (remap(middle) < t) low = middle;
      else high = middle;
    }

    return low;
  };

  it("keeps both ends of the path in place and never runs backwards", () => {
    expect(remap(0)).toBe(0);
    expect(remap(1)).toBe(1);

    const samples = Array.from({ length: 101 }, (_, i) => remap(i / 100));

    expect(samples).toEqual([...samples].sort((a, b) => a - b));
  });

  it("is fast on entry, slow at the focus point and fast again on the exit", () => {
    const atFocus = paceAt(travelAt(0.7));

    expect(paceAt(travelAt(0.15))).toBeGreaterThan(atFocus * 1.6);
    expect(paceAt(travelAt(0.95))).toBeGreaterThan(atFocus * 1.6);
  });

  it("moves evenly when the strength is zero", () => {
    const even = createSpeedRemap(0.7, 0, 0.11);

    expect(even(0.25)).toBeCloseTo(0.25);
    expect(even(0.7)).toBeCloseTo(0.7);
  });
});

describe("createBankTable", () => {
  it("is zero on a straight path", () => {
    const bankAt = createBankTable(() => ({ x: 1, y: -1 }));

    expect(bankAt(0.5)).toBeCloseTo(0);
  });

  it("leans the opposite ways for opposite bends, peaking at 1", () => {
    // Turns one way for the first half of the path, then the other way.
    const bankAt = createBankTable((t) => {
      const angle = t < 0.5 ? t * 2 : 1 - (t - 0.5) * 2;

      return { x: Math.cos(angle), y: Math.sin(angle) };
    });

    expect(bankAt(0.25)).toBeGreaterThan(0);
    expect(bankAt(0.75)).toBeLessThan(0);
    expect(
      Math.max(Math.abs(bankAt(0.25)), Math.abs(bankAt(0.75))),
    ).toBeCloseTo(1);
  });
});
