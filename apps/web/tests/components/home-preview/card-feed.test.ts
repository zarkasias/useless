// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import gsap from "gsap";

import type { Achievement } from "@/lib/supabase";

vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: ({ achievement }: { achievement: Achievement }) =>
    createElement("div", { "data-testid": "app-card" }, achievement.title),
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

vi.mock("@/components/utils/title-fonts", () => ({
  fredoka: { className: "font-fredoka" },
}));

import { CardFeed } from "@/components/home-preview/card-feed";

const won: Achievement = {
  id: "won",
  title: "Professional Napper",
  description: "Slept.",
  type: "LEGENDARY",
  emoji: "😴",
  icon_path: null,
  created_at: "2026-01-01",
  is_secret: false,
  trigger_type: null,
  trigger_config: null,
  status: "published",
};

let container: HTMLDivElement;
let root: Root;
let reducedMotion: boolean;

beforeEach(() => {
  reducedMotion = false;
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "matchMedia",
    vi.fn((media: string) => ({
      matches: media.includes("reduce") ? reducedMotion : false,
      media,
    })),
  );
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.stubGlobal(
    "IntersectionObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
  vi.spyOn(gsap.ticker, "add");
  vi.spyOn(gsap.ticker, "remove");

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

async function render(props: {
  revealed?: Achievement | null;
  restored?: boolean;
  ready?: boolean;
}) {
  await act(async () => {
    root.render(
      createElement(CardFeed, {
        revealed: props.revealed ?? null,
        restored: props.restored ?? false,
        ready: props.ready ?? true,
        label: "Feed",
      }),
    );
  });
}

const chosenCards = () =>
  container.querySelectorAll("[data-testid=chosen-card]");

describe("CardFeed", () => {
  it("shows only logo backs until an achievement is chosen", async () => {
    await render({});

    expect(container.querySelectorAll("[data-feed-card]")).toHaveLength(5);
    expect(
      container.querySelectorAll("img[src='/icons/golden_trophy_lrg.webp']"),
    ).toHaveLength(5);
    expect(chosenCards()).toHaveLength(0);
  });

  it("loops the cards once the saved claim has been checked", async () => {
    await render({ ready: false });
    expect(gsap.ticker.add).not.toHaveBeenCalled();

    await render({ ready: true });
    expect(gsap.ticker.add).toHaveBeenCalledOnce();
  });

  it("keeps the cards still with reduced motion", async () => {
    reducedMotion = true;

    await render({});

    expect(gsap.ticker.add).not.toHaveBeenCalled();
  });

  it("stops the loop and turns one card over to the in-app achievement card", async () => {
    await render({});
    await render({ revealed: won });

    expect(gsap.ticker.remove).toHaveBeenCalled();
    expect(chosenCards()).toHaveLength(1);
    expect(chosenCards()[0]!.textContent).toBe("Professional Napper");
  });

  it("shows a saved achievement face up straight away", async () => {
    await render({ revealed: won, restored: true });

    const flip = chosenCards()[0]!.parentElement!;

    expect(gsap.ticker.add).not.toHaveBeenCalled();
    expect(gsap.getProperty(flip, "rotationY")).toBe(180);
  });
});
