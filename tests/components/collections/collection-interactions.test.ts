// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Achievement } from "@/lib/supabase";

vi.mock("@/components/navbar", () => ({
  Navbar: () => null,
}));

vi.mock("@/components/achievement-card-updated", () => ({
  AchievementCard: ({
    achievement,
    isCollected,
  }: {
    achievement: Achievement;
    isCollected: boolean;
  }) =>
    createElement(
      "article",
      {
        "data-id": achievement.id,
        "data-collected": String(isCollected),
      },
      achievement.title,
    ),
}));

// Select itself has separate tests. Use a native select here to
// exercise the collection's category callback directly.
vi.mock("@/components/ui/select", async () => {
  const React = await import("react");

  const SelectionContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
  }>({
    value: "all",
    onValueChange: () => {},
  });

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value: string;
      onValueChange: (value: string) => void;
      children: React.ReactNode;
    }) =>
      React.createElement(
        SelectionContext.Provider,
        { value: { value, onValueChange } },
        children,
      ),

    SelectTrigger: () => null,
    SelectValue: () => null,

    SelectContent: ({ children }: { children: React.ReactNode }) => {
      const { value, onValueChange } = React.useContext(SelectionContext);

      return React.createElement(
        "select",
        {
          "aria-label": "Category",
          value,
          onChange: (event: React.ChangeEvent<HTMLSelectElement>) =>
            onValueChange(event.target.value),
        },
        children,
      );
    },

    SelectItem: ({
      value,
      children,
    }: {
      value: string;
      children: React.ReactNode;
    }) => React.createElement("option", { value }, children),
  };
});

import AchievementsClient from "@/app/collection/achievements-client";

type Props = Parameters<typeof AchievementsClient>[0];

let container: HTMLDivElement;
let root: Root;

function achievement(
  id: string,
  type: Achievement["type"] = "COMMON",
  description = "An unnecessary accomplishment.",
): Achievement {
  return {
    id,
    title: id,
    description,
    type,
    emoji: "🏆",
    created_at: "2026-10-07T12:00:00.000Z",
    status: "published",
    is_secret: type === "SECRET",
    trigger_type: null,
    trigger_config: {},
  };
}

async function render(
  allAchievements: Achievement[],
  collectedAchievements = allAchievements,
) {
  const props: Props = {
    initialProfile: {
      id: "user-id",
      username: "Alice",
      role: "user",
      created_at: "2026-10-07T12:00:00.000Z",
      streak_count: 0,
    },
    allAchievements,
    collectedAchievements,
    initialEntitlements: {
      achievementCount: collectedAchievements.length,
      freeAchievementLimit: 10,
      remainingFreeAchievements: 0,
      isSubscribed: false,
      subscriptionStatus: null,
      billingInterval: null,
      hasReachedFreeLimit: false,
      canClaimAchievement: true,
    },
  };

  await act(async () => {
    root.render(createElement(AchievementsClient, props));
  });
}

function button(label: string): HTMLButtonElement {
  const element = Array.from(
    container.querySelectorAll<HTMLButtonElement>("button"),
  ).find((candidate) => candidate.textContent?.trim().startsWith(label));

  if (!element) throw new Error(`Missing button: ${label}`);
  return element;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

function ids() {
  return Array.from(container.querySelectorAll("article")).map((element) =>
    element.getAttribute("data-id"),
  );
}

async function search(value: string) {
  const input = container.querySelector<HTMLInputElement>(
    'input[placeholder="Search achievements..."]',
  );
  if (!input) throw new Error("Missing search input");

  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  if (!setter) throw new Error("Missing input value setter");

  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function selectCategory(value: string) {
  const select = container.querySelector("select");
  if (!select) throw new Error("Missing category select");

  await act(async () => {
    select.value = value;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function largeCollection() {
  return Array.from({ length: 25 }, (_, index) =>
    achievement(`Award ${String(index + 1).padStart(2, "0")}`),
  );
}

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

describe("Collection interactions", () => {
  it("defaults to collected achievements and sorts them by title", async () => {
    const zebra = achievement("Zebra");
    const apple = achievement("Apple");
    const missing = achievement("Missing");

    await render([zebra, missing, apple], [zebra, apple]);

    expect(ids()).toEqual(["Apple", "Zebra"]);
    expect(container.textContent).toContain("2 of 3 collected");

    for (const card of container.querySelectorAll("article")) {
      expect(card.getAttribute("data-collected")).toBe("true");
    }
  });

  it("switches between all, uncollected, and collected achievements", async () => {
    const owned = achievement("Owned");
    const missing = achievement("Missing");
    await render([owned, missing], [owned]);

    await click("All");
    expect(ids()).toEqual(["Missing", "Owned"]);
    expect(
      container
        .querySelector('article[data-id="Missing"]')
        ?.getAttribute("data-collected"),
    ).toBe("false");

    await click("Uncollected");
    expect(ids()).toEqual(["Missing"]);

    await click("Collected");
    expect(ids()).toEqual(["Owned"]);
  });

  it.each(["COMMON", "RARE", "EPIC", "LEGENDARY", "SECRET", "GAME"] as const)(
    "filters by the %s category",
    async (type) => {
      await render([
        achievement("Matching", type),
        achievement("Other", type === "COMMON" ? "RARE" : "COMMON"),
      ]);

      await selectCategory(type);

      expect(ids()).toEqual(["Matching"]);

      await selectCategory("all");
      expect(ids()).toEqual(["Matching", "Other"]);
    },
  );

  it("searches titles without case sensitivity and trims whitespace", async () => {
    await render([
      achievement("Coffee Collector"),
      achievement("Sleep Champion"),
    ]);

    await search("  COFFEE  ");

    expect(ids()).toEqual(["Coffee Collector"]);
  });

  it("searches descriptions", async () => {
    await render([
      achievement("First", "COMMON", "Found a hidden pineapple."),
      achievement("Second", "COMMON", "Nothing unusual happened."),
    ]);

    await search("pineapple");

    expect(ids()).toEqual(["First"]);
  });

  it("combines ownership, category, and search filters", async () => {
    const owned = achievement("Owned Rare", "RARE");
    const match = achievement("Missing Rare", "RARE");
    const common = achievement("Missing Common");

    await render([owned, match, common], [owned]);
    await click("Uncollected");
    await selectCategory("RARE");
    await search("missing");

    expect(ids()).toEqual(["Missing Rare"]);
  });

  it("shows the empty state when search finds nothing", async () => {
    await render([achievement("Coffee Collector")]);

    await search("no match");

    expect(ids()).toEqual([]);
    expect(container.textContent).toContain("No matching achievements");
    expect(container.textContent).toContain("Nothing here yet.");

    await search("");

    expect(ids()).toEqual(["Coffee Collector"]);
  });

  it("paginates and disables navigation at the boundaries", async () => {
    await render(largeCollection());

    expect(ids()).toHaveLength(12);
    expect(ids()[0]).toBe("Award 01");
    expect(button("Previous").disabled).toBe(true);
    expect(container.textContent).toContain("Showing 1–12 of 25");

    await click("Next");

    expect(ids()[0]).toBe("Award 13");
    expect(container.textContent).toContain("Page 2 of 3");

    await click("Next");

    expect(ids()).toEqual(["Award 25"]);
    expect(button("Next").disabled).toBe(true);

    await click("Previous");

    expect(ids()[0]).toBe("Award 13");
    expect(container.textContent).toContain("Page 2 of 3");
  });

  it("resets the page when searching", async () => {
    await render(largeCollection());
    await click("Next");

    await search("Award 01");

    expect(ids()).toEqual(["Award 01"]);
    expect(container.textContent).toContain(
      "Showing 1–1 of 1 matching achievements",
    );
  });

  it("resets the page when changing category", async () => {
    const awards = largeCollection();
    awards[0].type = "RARE";
    await render(awards);
    await click("Next");

    await selectCategory("RARE");

    expect(ids()).toEqual(["Award 01"]);
  });

  it("resets to the first page when Collected is selected", async () => {
    await render(largeCollection());
    await click("Next");

    await click("Collected");

    expect(ids()[0]).toBe("Award 01");
    expect(container.textContent).toContain("Page 1 of 3");
  });

  it("clamps the page when a filter reduces the available pages", async () => {
    const awards = largeCollection();
    await render(awards, awards.slice(0, 24));
    await click("All");
    await click("Next");
    await click("Next");

    expect(container.textContent).toContain("Page 3 of 3");

    await click("Uncollected");

    expect(ids()).toEqual(["Award 25"]);
    expect(container.textContent).toContain(
      "Showing 1–1 of 1 matching achievements",
    );
  });
});
