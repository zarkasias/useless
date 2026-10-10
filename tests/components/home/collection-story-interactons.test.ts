// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  desktop: false,
}));

vi.mock("@/components/home/home.module.css", () => ({ default: {} }));

vi.mock("gsap", () => ({
  default: { registerPlugin: vi.fn() },
}));

vi.mock("gsap/ScrollTrigger", () => ({
  ScrollTrigger: {},
}));

vi.mock("@gsap/react", () => ({
  useGSAP: vi.fn(),
}));

vi.mock("@/components/utils/isDesktop", () => ({
  useIsDesktop: () => mocks.desktop,
}));

vi.mock("@/components/home/sharing-illustration", () => ({
  SharingIllustration: () => null,
}));

vi.mock("@/components/home/hero-achievement-card", () => ({
  HeroAchievementCard: ({
    achievement,
    variant,
  }: {
    achievement: Achievement;
    variant: string;
  }) =>
    createElement("article", { "data-variant": variant }, achievement.title),
}));

import { CollectionStory } from "@/components/home/collection-story";

function achievement(id: string): Achievement {
  return {
    id,
    title: `Achievement ${id}`,
    description: "A published achievement",
    type: "COMMON",
    emoji: "🏆",
    icon_path: `/icons/${id}.png`,
    created_at: "2026-10-09",
    status: "published",
    is_secret: false,
    trigger_type: null,
    trigger_config: null,
  };
}

const achievements = [achievement("one"), achievement("two")];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mocks.desktop = false;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("homepage collection interactions", () => {
  it.each([
    { desktop: false, variant: "compact" },
    { desktop: true, variant: "enlarged" },
  ])(
    "selects cards and uses $variant cards when desktop=$desktop",
    async ({ desktop, variant }) => {
      mocks.desktop = desktop;
      const onSelect = vi.fn();

      const render = async (selectedIndex: number) => {
        await act(async () => {
          root.render(
            createElement(CollectionStory, {
              achievements,
              selectedIndex,
              onSelect,
              isLoggedIn: false,
            }),
          );
        });
      };

      await render(0);

      const cards = Array.from(
        container.querySelectorAll<HTMLButtonElement>(
          "button[data-collection-card]",
        ),
      );

      expect(cards).toHaveLength(2);
      expect(cards[0].getAttribute("aria-pressed")).toBe("true");
      expect(cards[1].getAttribute("aria-pressed")).toBe("false");

      for (const card of cards) {
        expect(
          card.querySelector("article")?.getAttribute("data-variant"),
        ).toBe(variant);
      }

      await act(async () => cards[1].click());

      expect(onSelect).toHaveBeenCalledExactlyOnceWith(1);

      await render(1);

      expect(cards[0].getAttribute("aria-pressed")).toBe("false");
      expect(cards[1].getAttribute("aria-pressed")).toBe("true");
    },
  );
});
