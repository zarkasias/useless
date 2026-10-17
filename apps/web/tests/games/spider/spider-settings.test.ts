// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SpiderDifficulty } from "@/lib/games/solitaire/spider/spider-types";

import {
  SpiderInfo,
  SpiderSettings,
} from "@/components/games/solitaire/spider/spider-settings";

let container: HTMLDivElement;
let root: Root;
const onStartGame = vi.fn();

beforeEach(() => {
  onStartGame.mockReset();
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
  vi.unstubAllGlobals();
});

async function renderSettings(difficulty: SpiderDifficulty = 1) {
  await act(async () => {
    root.render(
      createElement(SpiderSettings, {
        difficulty,
        onStartGame,
      }),
    );
  });
}

function button(label: string) {
  const element = Array.from(document.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label,
  );

  if (!element) {
    throw new Error(`Missing button: ${label}`);
  }

  return element;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

function select() {
  const element = document.querySelector("select");

  if (!element) {
    throw new Error("Missing difficulty selector");
  }

  return element;
}

async function choose(difficulty: SpiderDifficulty) {
  await act(async () => {
    select().value = String(difficulty);
    select().dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("SpiderSettings", () => {
  it("opens with the current difficulty and explains replacing the game", async () => {
    await renderSettings(2);

    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await click("Change difficulty");

    expect(select().value).toBe("2");
    expect(Array.from(select().options, (option) => option.value)).toEqual([
      "1",
      "2",
      "4",
    ]);
    expect(document.body.textContent).toContain("replaces your current game");
    expect(onStartGame).not.toHaveBeenCalled();
  });

  it.each([
    { difficulty: 1 as const },
    { difficulty: 2 as const },
    { difficulty: 4 as const },
  ])(
    "starts a new game with difficulty $difficulty",
    async ({ difficulty }) => {
      await renderSettings();
      await click("Change difficulty");
      await choose(difficulty);

      expect(onStartGame).not.toHaveBeenCalled();

      await click("Start New Game");

      expect(onStartGame).toHaveBeenCalledExactlyOnceWith(difficulty);
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    },
  );

  it("restores the current difficulty when reopening after cancellation", async () => {
    await renderSettings(1);
    await click("Change difficulty");
    await choose(4);

    await click("Close");

    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await click("Change difficulty");

    expect(select().value).toBe("1");
    expect(onStartGame).not.toHaveBeenCalled();
  });

  it("uses an updated difficulty prop when the dialog reopens", async () => {
    await renderSettings(1);
    await renderSettings(4);

    await click("Change difficulty");

    expect(select().value).toBe("4");
  });
});

describe("SpiderInfo", () => {
  it("opens help with the objective and difficulty guidance", async () => {
    await act(async () => {
      root.render(createElement(SpiderInfo));
    });

    expect(document.querySelector('[role="dialog"]')).toBeNull();

    await click("How to play");

    const dialog = document.querySelector('[role="dialog"]');

    expect(dialog?.textContent).toContain("How to play Spider Solitaire");
    expect(dialog?.textContent).toContain(
      "Complete eight runs of cards from King down to Ace",
    );
    expect(dialog?.textContent).toContain("1 suit is Easy");
    expect(dialog?.textContent).toContain("2 suits is Medium");
    expect(dialog?.textContent).toContain("4 suits is Hard.");
    expect(dialog?.textContent).toContain(
      "Your selection applies when you start a new game.",
    );
  });
});
