// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getStats: vi.fn(),
  getPackCount: vi.fn(),
}));

vi.mock("@/lib/services/admin-achievement-service-server", () => ({
  getAdminDashboardStats: mocks.getStats,
}));

vi.mock("@/lib/services/achievement-pack-service-server", () => ({
  getAchievementPackCount: mocks.getPackCount,
}));

import AdminPage from "@/app/admin/page";

beforeEach(() => {
  mocks.getStats.mockReset();
  mocks.getPackCount.mockReset();

  mocks.getStats.mockResolvedValue({
    drafts: 11,
    published: 22,
    archived: 33,
    missingIcons: 44,
    aiGenerated: 55,
  });
  mocks.getPackCount.mockResolvedValue(66);
});

async function render(): Promise<HTMLDivElement> {
  const element = await AdminPage();
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

function countFor(container: HTMLElement, title: string): string {
  const heading = Array.from(
    container.querySelectorAll('[data-slot="card-title"]'),
  ).find((element) => element.textContent?.trim() === title);

  const card = heading?.closest('[data-slot="card"]');
  const value = card?.querySelector('[data-slot="card-content"] p');

  if (!value) throw new Error(`Missing dashboard count: ${title}`);
  return value.textContent ?? "";
}

describe("AdminPage", () => {
  it("fetches and displays all dashboard statistics", async () => {
    const container = await render();

    expect(mocks.getStats).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getPackCount).toHaveBeenCalledExactlyOnceWith();
    expect(container.querySelector("h1")?.textContent).toBe("Admin Dashboard");

    expect(countFor(container, "Drafts")).toBe("11");
    expect(countFor(container, "Published")).toBe("22");
    expect(countFor(container, "Archived")).toBe("33");
    expect(countFor(container, "Missing Icons")).toBe("44");
    expect(countFor(container, "AI Generated")).toBe("55");
    expect(countFor(container, "Packs")).toBe("66");
  });

  it("links statistic cards to their corresponding filters", async () => {
    const container = await render();

    const destinations = [
      ["/admin/achievements?status=draft", "Drafts"],
      ["/admin/achievements?status=published", "Published"],
      ["/admin/achievements?status=archived", "Archived"],
      ["/admin/achievements?missingIcon=true", "Missing Icons"],
      ["/admin/achievement-packs", "Packs"],
    ];

    for (const [href, label] of destinations) {
      const link = Array.from(container.querySelectorAll("a")).find(
        (element) =>
          element.getAttribute("href") === href &&
          element.textContent?.includes(label),
      );

      expect(link, `Missing ${label} link`).toBeDefined();
    }
  });

  it("provides links for managing achievements, packs, and generated drafts", async () => {
    const container = await render();

    for (const [label, href] of [
      ["View Achievements", "/admin/achievements"],
      ["Manage Packs", "/admin/achievement-packs"],
      ["Generate Drafts", "/admin/achievement-generator"],
    ]) {
      const link = Array.from(container.querySelectorAll("a")).find(
        (element) => element.textContent?.trim() === label,
      );

      expect(link?.getAttribute("href")).toBe(href);
    }
  });

  it("displays zero counts for an empty dashboard", async () => {
    mocks.getStats.mockResolvedValue({
      drafts: 0,
      published: 0,
      archived: 0,
      missingIcons: 0,
      aiGenerated: 0,
    });
    mocks.getPackCount.mockResolvedValue(0);

    const container = await render();

    for (const title of [
      "Drafts",
      "Published",
      "Archived",
      "Missing Icons",
      "AI Generated",
      "Packs",
    ]) {
      expect(countFor(container, title)).toBe("0");
    }
  });

  it.each(["statistics", "pack count"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);

      if (service === "statistics") {
        mocks.getStats.mockRejectedValue(error);
      } else {
        mocks.getPackCount.mockRejectedValue(error);
      }

      await expect(AdminPage()).rejects.toBe(error);
    },
  );
});
