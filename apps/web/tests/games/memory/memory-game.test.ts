// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GameAchievement } from "@/lib/types/games";

const mocks = vi.hoisted(() => ({
  record: vi.fn(),
  recorded: vi.fn(),
}));

vi.mock("@/lib/services/utils/game-utils", () => ({
  shuffleAchievements: <T>(items: T[]) => items,
}));

vi.mock("@/app/actions/game-actions", () => ({
  recordMemoryGameResultAction: mocks.record,
}));

vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: ({ achievement }: { achievement: { title: string } }) =>
    createElement("article", null, achievement.title),
}));

import { MemoryGame } from "@/components/games/memory/memory-game";
import { calculateMemoryScore } from "@/lib/games/memory/memory-scoring";

let container: HTMLDivElement;
let root: Root;

const achievements: GameAchievement[] = [
  {
    id: "a",
    title: "Award A",
    emoji: "🏆",
    icon_path: null,
    type: "COMMON",
  },
  {
    id: "b",
    title: "Award B",
    emoji: "⭐",
    icon_path: null,
    type: "RARE",
  },
];

beforeEach(() => {
  mocks.record.mockReset();
  mocks.recorded.mockReset();
  mocks.record.mockResolvedValue({
    success: true,
    unlockedAchievements: [],
  });

  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-07T12:00:00.000Z"));
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function render() {
  await act(async () => {
    root.render(
      createElement(MemoryGame, {
        achievements,
        onGameRecorded: mocks.recorded,
      }),
    );
  });
}

function cards() {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>("button[aria-label]"),
  );
}

async function flip(index: number) {
  await act(async () => {
    cards()[index].click();
  });
}

async function advance(milliseconds: number) {
  await act(async () => {
    vi.advanceTimersByTime(milliseconds);
  });
}

async function click(label: string) {
  const button = Array.from(container.querySelectorAll("button")).find(
    (element) => element.textContent?.trim() === label,
  );

  if (!button) {
    throw new Error(`Missing button: ${label}`);
  }

  await act(async () => {
    button.click();
  });
}

async function win() {
  await flip(0);
  await flip(1);
  await advance(450);
  await flip(2);
  await flip(3);
}

describe("MemoryGame", () => {
  it("creates two hidden cards per achievement", async () => {
    await render();

    expect(cards()).toHaveLength(4);
    expect(cards().every((card) => !card.disabled)).toBe(true);
    expect(
      cards().every(
        (card) => card.getAttribute("aria-label") === "Hidden achievement card",
      ),
    ).toBe(true);
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("does not match a card with itself", async () => {
    await render();

    await flip(0);
    await flip(0);

    expect(cards()[0].getAttribute("aria-label")).toBe("Award A");
    expect(cards()[0].disabled).toBe(false);
    expect(cards()[1].getAttribute("aria-label")).toBe(
      "Hidden achievement card",
    );
    expect(mocks.record).not.toHaveBeenCalled();
  });

  it("keeps matched cards revealed and disabled", async () => {
    await render();

    await flip(0);
    await flip(1);
    await advance(450);

    expect(cards()[0].disabled).toBe(true);
    expect(cards()[1].disabled).toBe(true);
    expect(cards()[0].getAttribute("aria-label")).toBe("Award A");
    expect(cards()[1].getAttribute("aria-label")).toBe("Award A");
    expect(cards()[2].disabled).toBe(false);
  });

  it("blocks a third flip while a mismatched pair is visible", async () => {
    await render();

    await flip(0);
    await flip(2);
    await flip(3);

    expect(cards()[3].getAttribute("aria-label")).toBe(
      "Hidden achievement card",
    );

    await advance(850);

    expect(cards()[0].getAttribute("aria-label")).toBe(
      "Hidden achievement card",
    );
    expect(cards()[2].getAttribute("aria-label")).toBe(
      "Hidden achievement card",
    );
  });

  it("records a completed game once with the calculated score", async () => {
    await render();
    await win();

    const durationSeconds = 1;
    const score = calculateMemoryScore({
      pairs: 2,
      moves: 2,
      mistakes: 0,
      durationSeconds,
    });

    expect(mocks.record).toHaveBeenCalledExactlyOnceWith({
      result: "win",
      pairs: 2,
      moves: 2,
      mistakes: 0,
      durationSeconds,
      achievementIds: ["a", "b"],
      score,
    });
    expect(mocks.recorded).toHaveBeenCalledOnce();
    expect(container.textContent).toContain(
      "You've got a great Useless Memory!!",
    );

    await advance(1000);

    expect(mocks.record).toHaveBeenCalledOnce();
  });

  it("includes mismatches in the recorded result", async () => {
    await render();

    await flip(0);
    await flip(2);
    await advance(850);
    await win();

    expect(mocks.record).toHaveBeenCalledWith(
      expect.objectContaining({
        moves: 3,
        mistakes: 1,
        pairs: 2,
      }),
    );
  });

  it("shows achievements unlocked by the recorded game", async () => {
    mocks.record.mockResolvedValue({
      success: true,
      unlockedAchievements: [{ id: "reward-1", title: "Memory master" }],
    });
    await render();

    await win();

    expect(container.querySelector("article")?.textContent).toBe(
      "Memory master",
    );
  });

  it("does not notify the parent when recording fails", async () => {
    mocks.record.mockResolvedValue({ success: false });
    await render();

    await win();

    expect(mocks.record).toHaveBeenCalledOnce();
    expect(mocks.recorded).not.toHaveBeenCalled();
    expect(container.querySelector("article")).toBeNull();
  });

  it("restarts a completed game and allows another result to be recorded", async () => {
    await render();
    await win();

    await click("Play again");

    expect(cards().every((card) => !card.disabled)).toBe(true);
    expect(
      cards().every(
        (card) => card.getAttribute("aria-label") === "Hidden achievement card",
      ),
    ).toBe(true);

    await win();

    expect(mocks.record).toHaveBeenCalledTimes(2);
  });

  it("restarts an unfinished game without recording it", async () => {
    await render();
    await flip(0);

    await click("Restart");

    expect(
      cards().every(
        (card) => card.getAttribute("aria-label") === "Hidden achievement card",
      ),
    ).toBe(true);
    expect(mocks.record).not.toHaveBeenCalled();
  });
});
