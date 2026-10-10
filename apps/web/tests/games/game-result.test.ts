// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import GameResult from "@/components/games/system/game-result";

type ResultProps = Parameters<typeof GameResult>[0];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
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

async function render(props: Partial<ResultProps> = {}) {
  await act(async () => {
    root.render(
      createElement(GameResult, {
        eyebrow: "Game complete",
        title: "You won!",
        ...props,
      }),
    );
  });
}

describe("GameResult", () => {
  it("renders the result heading without optional content or actions", async () => {
    await render();

    expect(container.textContent).toContain("Game complete");
    expect(container.querySelector("h2")?.textContent).toBe("You won!");
    expect(container.querySelector("p")).toBeNull();
    expect(container.querySelector("button")).toBeNull();
  });

  it("renders the description, statistics, and additional content", async () => {
    await render({
      description: "Every card is in its place.",
      stats: createElement("span", { id: "score" }, "Score: 500"),
      children: createElement(
        "p",
        { id: "achievement" },
        "Achievement unlocked",
      ),
    });

    expect(container.textContent).toContain("Every card is in its place.");
    expect(container.querySelector("#score")?.textContent).toBe("Score: 500");
    expect(container.querySelector("#achievement")?.textContent).toBe(
      "Achievement unlocked",
    );
  });

  it("uses the default action label and invokes the primary callback", async () => {
    const onAction = vi.fn();
    await render({ onAction });

    const button = container.querySelector("button");

    expect(button?.textContent).toContain("Play again");

    await act(async () => {
      button?.click();
    });

    expect(onAction).toHaveBeenCalledOnce();
  });

  it("renders custom actions and invokes each callback independently", async () => {
    const onAction = vi.fn();
    const onSecondaryAction = vi.fn();

    await render({
      actionLabel: "New game",
      actionIcon: createElement("span", { id: "primary-icon" }, "↻"),
      onAction,
      secondaryActionLabel: "View results",
      secondaryActionIcon: createElement("span", { id: "secondary-icon" }, "★"),
      onSecondaryAction,
    });

    const buttons = container.querySelectorAll("button");

    expect(buttons).toHaveLength(2);
    expect(buttons[0].textContent).toContain("New game");
    expect(buttons[1].textContent).toContain("View results");
    expect(container.querySelector("#primary-icon")).not.toBeNull();
    expect(container.querySelector("#secondary-icon")).not.toBeNull();

    await act(async () => {
      buttons[0].click();
    });

    expect(onAction).toHaveBeenCalledOnce();
    expect(onSecondaryAction).not.toHaveBeenCalled();

    await act(async () => {
      buttons[1].click();
    });

    expect(onAction).toHaveBeenCalledOnce();
    expect(onSecondaryAction).toHaveBeenCalledOnce();
  });

  it("supports a secondary action without a primary action", async () => {
    const onSecondaryAction = vi.fn();

    await render({
      secondaryActionLabel: "Back to games",
      onSecondaryAction,
    });

    const buttons = container.querySelectorAll("button");

    expect(buttons).toHaveLength(1);
    expect(buttons[0].textContent).toContain("Back to games");

    await act(async () => {
      buttons[0].click();
    });

    expect(onSecondaryAction).toHaveBeenCalledOnce();
  });

  it("does not render a secondary button without its label", async () => {
    await render({ onSecondaryAction: vi.fn() });

    expect(container.querySelector("button")).toBeNull();
  });

  it("does not render buttons from labels alone", async () => {
    await render({
      actionLabel: "New game",
      secondaryActionLabel: "Back to games",
    });

    expect(container.querySelector("button")).toBeNull();
  });
});
