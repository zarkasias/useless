// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminAchievement } from "@/lib/services/admin-achievement-service-server";

const mocks = vi.hoisted(() => ({
  getAchievement: vi.fn(),
  getPacks: vi.fn(),
  notFound: vi.fn(),
  copyButton: vi.fn(),
}));

vi.mock("@/lib/services/admin-achievement-service-server", () => ({
  getAdminAchievementById: mocks.getAchievement,
}));

vi.mock("@/lib/services/achievement-pack-service-server", () => ({
  getAchievementPacks: mocks.getPacks,
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
}));

vi.mock("@/app/admin/achievements/actions", () => ({
  updateAdminAchievement: vi.fn(),
  publishAdminAchievement: vi.fn(),
  archiveAdminAchievement: vi.fn(),
  returnAchievementToDraft: vi.fn(),
}));

vi.mock("@/components/admin/copy-text-button", () => ({
  CopyTextButton: (props: unknown) => {
    mocks.copyButton(props);
    return null;
  },
}));

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) =>
    createElement("img", { src, alt }),
}));

import AdminAchievementPage from "@/app/admin/achievements/[id]/page";

function makeAchievement(
  overrides: Partial<AdminAchievement> = {},
): AdminAchievement {
  return {
    id: "achievement-1",
    title: "Tab Collector",
    description: "Browse enthusiastically.",
    type: "RARE",
    emoji: null,
    icon_path: null,
    status: "draft",
    generated_by: "ai",
    category: null,
    trigger_type: null,
    trigger_config: null,
    icon_concept: null,
    image_prompt: null,
    pack_id: null,
    is_daily: false,
    created_at: "2026-10-08T12:00:00.000Z",
    achievement_packs: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAchievement.mockReset();
  mocks.getPacks.mockReset();
  mocks.notFound.mockReset();

  mocks.getAchievement.mockResolvedValue(makeAchievement());
  mocks.getPacks.mockResolvedValue([]);
  mocks.notFound.mockImplementation(() => {
    throw new Error("TEST_NOT_FOUND");
  });
});

async function render(): Promise<HTMLDivElement> {
  const element = await AdminAchievementPage({
    params: Promise.resolve({ id: "achievement-1" }),
  });
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

function findButton(
  container: HTMLElement,
  label: string,
): HTMLButtonElement | undefined {
  return Array.from(container.querySelectorAll("button")).find(
    (button) => button.textContent?.trim() === label,
  );
}

describe("AdminAchievementPage", () => {
  it("loads the requested achievement and populates required fields", async () => {
    const container = await render();

    expect(mocks.getAchievement).toHaveBeenCalledExactlyOnceWith(
      "achievement-1",
    );
    expect(mocks.getPacks).toHaveBeenCalledExactlyOnceWith();
    expect(container.querySelector("h1")?.textContent).toBe("Edit Achievement");

    const title = container.querySelector<HTMLInputElement>("#title");
    expect(title?.value).toBe("Tab Collector");
    expect(title?.required).toBe(true);

    const description =
      container.querySelector<HTMLTextAreaElement>("#description");
    expect(description?.value).toBe("Browse enthusiastically.");
    expect(description?.required).toBe(true);

    expect(container.querySelector<HTMLSelectElement>("#type")?.value).toBe(
      "RARE",
    );
    expect(
      container.querySelector('a[href="/admin/achievements"]'),
    ).not.toBeNull();
  });

  it("uses empty form values and fallback labels for missing metadata", async () => {
    const container = await render();

    for (const id of ["emoji", "icon_path", "icon_concept", "image_prompt"]) {
      expect(
        container.querySelector<HTMLInputElement | HTMLTextAreaElement>(
          `#${id}`,
        )?.value,
      ).toBe("");
    }

    expect(container.querySelector<HTMLSelectElement>("#pack_id")?.value).toBe(
      "",
    );
    expect(container.querySelector<HTMLSelectElement>("#category")?.value).toBe(
      "",
    );

    for (const text of [
      "Uncategorized",
      "Unassigned",
      "Trigger: None",
      "Daily: No",
    ]) {
      expect(container.textContent).toContain(text);
    }
    expect(mocks.copyButton).not.toHaveBeenCalled();
  });

  it("requires an icon before publishing a draft", async () => {
    const container = await render();

    expect(findButton(container, "Publish Achievement")?.disabled).toBe(true);
    expect(container.textContent).toContain(
      "Add an icon path before publishing.",
    );
    expect(container.textContent).toContain("Icon needed");
    expect(findButton(container, "Archive Achievement")).toBeDefined();
  });

  it("shows the icon preview and enables publishing when an icon exists", async () => {
    mocks.getAchievement.mockResolvedValue(
      makeAchievement({ icon_path: "/icons/tab.webp" }),
    );

    const container = await render();

    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://example.supabase.co/storage/v1/object/public/achievement-assets/icons/tab.webp",
    );
    expect(container.querySelector("img")?.getAttribute("alt")).toBe(
      "Tab Collector icon",
    );
    expect(container.textContent).toContain("Icon ready");
    expect(findButton(container, "Publish Achievement")?.disabled).toBe(false);
  });

  it.each([
    { status: "published", label: "Return to Draft", archive: true },
    { status: "archived", label: "Restore as Draft", archive: false },
  ] as const)(
    "shows the correct controls for $status",
    async ({ status, label, archive }) => {
      mocks.getAchievement.mockResolvedValue(makeAchievement({ status }));

      const container = await render();

      expect(findButton(container, label)).toBeDefined();
      expect(findButton(container, "Publish Achievement")).toBeUndefined();
      expect(Boolean(findButton(container, "Archive Achievement"))).toBe(
        archive,
      );

      for (const input of container.querySelectorAll<HTMLInputElement>(
        'input[name="id"]',
      )) {
        expect(input.value).toBe("achievement-1");
      }
    },
  );

  it("allows a review achievement with an icon to be published", async () => {
    mocks.getAchievement.mockResolvedValue(
      makeAchievement({ status: "review", icon_path: "/icons/tab.webp" }),
    );

    const container = await render();

    expect(findButton(container, "Publish Achievement")?.disabled).toBe(false);
    expect(findButton(container, "Archive Achievement")).toBeDefined();
  });

  it("renders trigger configuration and copy controls", async () => {
    mocks.getAchievement.mockResolvedValue(
      makeAchievement({
        emoji: "⭐",
        trigger_type: "daily_claim",
        trigger_config: { count: 3 },
        is_daily: true,
        icon_concept: "A browser trophy",
        image_prompt: "Draw a browser trophy",
      }),
    );

    const container = await render();

    expect(container.querySelector("pre")?.textContent).toBe(
      JSON.stringify({ count: 3 }, null, 2),
    );
    expect(container.textContent).toContain("Daily: Yes");
    expect(container.querySelector<HTMLInputElement>("#emoji")?.value).toBe(
      "⭐",
    );
    expect(mocks.copyButton.mock.calls.map(([props]) => props)).toEqual([
      { text: "A browser trophy", label: "Copy concept" },
      { text: "Draw a browser trophy", label: "Copy prompt" },
    ]);
  });

  it.each(["object", "array"])(
    "renders the related pack supplied as an %s",
    async (shape) => {
      const pack = { id: "pack-1", name: "Internet Habits", slug: "habits" };
      mocks.getPacks.mockResolvedValue([pack]);
      mocks.getAchievement.mockResolvedValue(
        makeAchievement({
          pack_id: pack.id,
          achievement_packs: shape === "array" ? [pack] : pack,
        }),
      );

      const container = await render();

      expect(
        container.querySelector<HTMLSelectElement>("#pack_id")?.value,
      ).toBe("pack-1");
      expect(container.textContent).toContain("Pack: Internet Habits");
    },
  );

  it("returns not found for an unknown achievement", async () => {
    mocks.getAchievement.mockResolvedValue(null);

    await expect(render()).rejects.toThrow("TEST_NOT_FOUND");
    expect(mocks.notFound).toHaveBeenCalledTimes(1);
    expect(mocks.copyButton).not.toHaveBeenCalled();
  });

  it.each(["achievement", "packs"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      if (service === "achievement") {
        mocks.getAchievement.mockRejectedValue(error);
      } else {
        mocks.getPacks.mockRejectedValue(error);
      }

      await expect(render()).rejects.toBe(error);
      expect(mocks.notFound).not.toHaveBeenCalled();
    },
  );
});
