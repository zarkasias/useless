// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GameScreen } from "@/components/games/game-screen";

type Props = Parameters<typeof GameScreen>[0];

function render(overrides: Partial<Props> = {}) {
  const container = document.createElement("div");

  const props: Props = {
    title: "Spider Solitaire",
    description: "Build complete runs.",
    icon: "/icons/spider.webp",
    children: createElement("div", { id: "game-content" }, "Game board"),
    ...overrides,
  };

  container.innerHTML = renderToStaticMarkup(
    createElement(GameScreen, props, props.children),
  );

  return container;
}

function stat(container: HTMLDivElement, label: string) {
  const labelElement = Array.from(container.querySelectorAll("div")).find(
    (element) => element.children.length === 0 && element.textContent === label,
  );

  if (!labelElement?.parentElement) {
    throw new Error(`Missing stat: ${label}`);
  }

  return labelElement.parentElement.querySelector("span")?.textContent;
}

describe("GameScreen", () => {
  it("renders the game heading, description, content, and back links", () => {
    const container = render();

    expect(container.querySelector("h1")?.textContent).toBe("Spider Solitaire");
    expect(container.textContent).toContain("Build complete runs.");
    expect(container.querySelector("#game-content")?.textContent).toBe(
      "Game board",
    );
    expect(container.querySelectorAll('a[href="/games"]')).toHaveLength(2);
    expect(container.querySelector("img")?.getAttribute("alt")).toBe("");
  });

  it("displays real losses and can omit unsupported best score without a separate header", () => {
    const container = render({ gamesPlayed: 8, wins: 3, losses: 2, showBestScore: false });
    expect(stat(container, "Played")).toBe("8");
    expect(stat(container, "Wins")).toBe("3");
    expect(stat(container, "Losses")).toBe("2");
    expect(container.textContent).not.toContain("Best");
    expect(container.querySelector("#game-content")?.textContent).toBe("Game board");
  });

  it("defaults to zero plays and wins with no best score", () => {
    const container = render();

    expect(stat(container, "Played")).toBe("0");
    expect(stat(container, "Wins")).toBe("0");
    expect(stat(container, "Best")).toBe("—");
    expect(container.textContent).not.toContain("Win Rate");
  });

  it("shows supplied statistics and a custom best-score label", () => {
    const container = render({
      gamesPlayed: 20,
      wins: 8,
      winRate: 40,
      bestScoreLabel: "Fastest",
      bestScore: "02:35",
    });

    expect(stat(container, "Played")).toBe("20");
    expect(stat(container, "Wins")).toBe("8");
    expect(stat(container, "Win Rate")).toBe("40%");
    expect(stat(container, "Fastest")).toBe("02:35");
  });

  it("preserves zero values for win rate and best score", () => {
    const container = render({
      winRate: 0,
      bestScore: 0,
    });

    expect(stat(container, "Win Rate")).toBe("0%");
    expect(stat(container, "Best")).toBe("0");
  });
});
