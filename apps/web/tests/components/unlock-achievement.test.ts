// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: ({
    achievement,
    isCollected,
    showShareButton,
    variant,
  }: {
    achievement: Achievement;
    isCollected: boolean;
    showShareButton: boolean;
    variant?: string;
  }) =>
    createElement(
      "article",
      {
        "data-achievement-id": achievement.id,
        "data-collected": String(isCollected),
        "data-share": String(showShareButton),
        "data-variant": variant,
      },
      achievement.title,
    ),
}));

import { UnlockAchievement } from "@/components/unlock-achievement";

type Props = Parameters<typeof UnlockAchievement>[0];

const achievement: Achievement = {
  id: "daily-achievement",
  title: "Successfully Did Nothing",
  description: "An unnecessary accomplishment.",
  type: "COMMON",
  emoji: "🏆",
  created_at: "2026-10-07T12:00:00.000Z",
  is_secret: false,
  trigger_type: "daily_claim",
  trigger_config: {},
  status: "published",
};

let container: HTMLDivElement;
let root: Root;
let onClose = vi.fn<() => void>();

async function render(overrides: Partial<Props> = {}) {
  await act(async () => {
    root.render(
      createElement(UnlockAchievement, {
        achievement,
        isOpen: true,
        onClose,
        ...overrides,
      }),
    );
  });
}

async function clickButton(label: string) {
  const element = Array.from(
    document.querySelectorAll<HTMLButtonElement>("button"),
  ).find((button) => button.textContent?.includes(label));

  if (!element) throw new Error(`Missing button: ${label}`);

  await act(async () => {
    element.click();
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  onClose = vi.fn<() => void>();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.unstubAllGlobals();
});

describe("UnlockAchievement", () => {
  it("renders nothing when closed", async () => {
    await render({ isOpen: false });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("shows the unlocked achievement with sharing enabled", async () => {
    await render({ isLoggedIn: true });

    const dialog = document.querySelector('[role="dialog"]');
    const card = dialog?.querySelector("[data-achievement-id]");

    expect(dialog?.textContent).toContain("Achievement Unlocked!");
    expect(card?.textContent).toBe("Successfully Did Nothing");
    expect(card?.getAttribute("data-achievement-id")).toBe("daily-achievement");
    expect(card?.getAttribute("data-collected")).toBe("true");
    expect(card?.getAttribute("data-share")).toBe("true");
    expect(card?.getAttribute("data-variant")).toBe("stacked");
    expect(dialog?.querySelector('a[href="/signup"]')).toBeNull();
  });

  it("invites signed-out players to create an account", async () => {
    await render();

    const link = document.querySelector('a[href="/signup"]');

    expect(link?.textContent).toBe("Create an account to keep it");
    expect(document.body.textContent).toContain(
      "A completely pointless achievement. Worth keeping.",
    );
  });

  it("shows missing achievement data without a signup prompt", async () => {
    await render({ achievement: null });

    expect(document.body.textContent).toContain(
      "Achievement data is missing. Please try again.",
    );
    expect(document.querySelector("[data-achievement-id]")).toBeNull();
    expect(document.querySelector('a[href="/signup"]')).toBeNull();
  });

  it("calls onClose when Awesome is clicked", async () => {
    await render();
    await clickButton("Awesome!");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when the dialog close button is clicked", async () => {
    await render();
    await clickButton("Close");

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    await render();

    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
          cancelable: true,
        }),
      );
    });

    expect(onClose).toHaveBeenCalledOnce();
  });

  it("removes the dialog when the parent closes it", async () => {
    await render();

    expect(document.querySelector('[role="dialog"]')).not.toBeNull();

    await render({ isOpen: false });

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });
});
