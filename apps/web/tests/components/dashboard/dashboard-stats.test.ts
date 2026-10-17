// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import type { Achievement, AchievementType } from "@/lib/supabase";

function render(types: AchievementType[]): HTMLDivElement {
  const userAchievements: Achievement[] = types.map((type, index) => ({
    id: `achievement-${index}`,
    title: `Achievement ${index}`,
    description: "A test achievement",
    type,
    emoji: "🏆",
    created_at: "2026-10-08T12:00:00.000Z",
    is_secret: type === "SECRET",
    trigger_type: null,
    trigger_config: null,
    status: "published",
  }));

  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(
    createElement(DashboardStats, { userAchievements }),
  );
  return container;
}

function statValue(container: HTMLElement, label: string): string {
  const labelElement = Array.from(container.querySelectorAll("p")).find(
    (element) => element.textContent === label,
  );

  const value = labelElement?.nextElementSibling?.textContent;
  if (value == null) throw new Error(`Missing stat: ${label}`);
  return value;
}

function rarityCount(container: HTMLElement, rarity: string): string {
  const entry = Array.from(container.querySelectorAll("span")).find(
    (element) =>
      element.textContent?.trim().replace(/\s+/g, " ") ===
      `${element.firstElementChild?.textContent} ${rarity}`,
  );

  const count = entry?.firstElementChild?.textContent;
  if (count == null) throw new Error(`Missing rarity count: ${rarity}`);
  return count;
}

describe("DashboardStats", () => {
  it("shows zero totals and no highest rarity for an empty collection", () => {
    const container = render([]);

    expect(statValue(container, "Total achievements")).toBe("0");
    expect(statValue(container, "Highest rarity")).toBe("None");
    expect(rarityCount(container, "rare")).toBe("0");
    expect(rarityCount(container, "epic")).toBe("0");
    expect(rarityCount(container, "legendary")).toBe("0");
  });

  it.each<{ types: AchievementType[]; expected: string }>([
    { types: ["COMMON"], expected: "Common" },
    { types: ["COMMON", "RARE"], expected: "Rare" },
    { types: ["RARE", "EPIC"], expected: "Epic" },
    { types: ["EPIC", "LEGENDARY"], expected: "Legendary" },
    { types: ["LEGENDARY", "SECRET"], expected: "Secret" },
  ])("shows $expected as the highest rarity", ({ types, expected }) => {
    const container = render(types);

    expect(statValue(container, "Highest rarity")).toBe(expected);
    expect(statValue(container, "Total achievements")).toBe(
      String(types.length),
    );
  });

  it("counts repeated rarities separately and includes every achievement", () => {
    const container = render([
      "COMMON",
      "GAME",
      "RARE",
      "RARE",
      "EPIC",
      "EPIC",
      "EPIC",
      "LEGENDARY",
      "SECRET",
    ]);

    expect(statValue(container, "Total achievements")).toBe("9");
    expect(statValue(container, "Highest rarity")).toBe("Secret");
    expect(rarityCount(container, "rare")).toBe("2");
    expect(rarityCount(container, "epic")).toBe("3");
    expect(rarityCount(container, "legendary")).toBe("1");
  });
});
