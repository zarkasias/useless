import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUserAchievements: vi.fn(),
  getPackFilter: vi.fn(),
}));

vi.mock("@/lib/services/achievement-access-service-server", () => ({
  getAchievementPackFilter: mocks.getPackFilter,
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/services/utils/trigger-context", () => ({
  supabaseAdmin: { from: mocks.from },
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserAchievements: mocks.getUserAchievements,
}));

import {
  getWallCatalog,
  getWallUnlockedIds,
} from "@/lib/services/wall-catalog-service-server";

let db: ReturnType<typeof database>;

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.getUserAchievements.mockReset();
  mocks.getPackFilter.mockReset();
  mocks.getPackFilter.mockResolvedValue("pack_id.is.null,pack_id.in.(core)");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getWallCatalog", () => {
  it("reads published, public achievements from everyone's packs with icons, in a fixed order", async () => {
    const query = db.enqueue("achievements", {
      data: [
        {
          id: "a",
          type: "COMMON",
          icon_path: " /achievement_icons/webp/a.webp ",
        },
        { id: "b", type: "EPIC", icon_path: "/achievement_icons/webp/b.webp" },
      ],
    });

    await expect(getWallCatalog()).resolves.toEqual([
      { id: "a", type: "COMMON", icon_path: "/achievement_icons/webp/a.webp" },
      { id: "b", type: "EPIC", icon_path: "/achievement_icons/webp/b.webp" },
    ]);

    expect(query.in).toHaveBeenCalledWith("type", [
      "COMMON",
      "RARE",
      "EPIC",
      "LEGENDARY",
    ]);
    expect(query.eq).toHaveBeenCalledWith("status", "published");
    expect(query.eq).toHaveBeenCalledWith("is_secret", false);
    // Everyone's packs only: no user, so no paid or seasonal packs.
    expect(mocks.getPackFilter).toHaveBeenCalledExactlyOnceWith();
    expect(query.or).toHaveBeenCalledWith("pack_id.is.null,pack_id.in.(core)");
    expect(query.not).toHaveBeenCalledWith("icon_path", "is", null);
    expect(query.order).toHaveBeenNthCalledWith(1, "created_at", {
      ascending: true,
    });
    expect(query.order).toHaveBeenNthCalledWith(2, "id", { ascending: true });
  });

  it("drops entries whose icon is only whitespace", async () => {
    db.enqueue("achievements", {
      data: [{ id: "a", type: "RARE", icon_path: "   " }],
    });

    await expect(getWallCatalog()).resolves.toEqual([]);
  });

  it("returns an empty wall when the query fails", async () => {
    db.enqueue("achievements", { error: { message: "down" } });

    await expect(getWallCatalog()).resolves.toEqual([]);
    expect(console.error).toHaveBeenCalled();
  });
});

describe("getWallUnlockedIds", () => {
  it("is empty for logged-out visitors without querying", async () => {
    await expect(getWallUnlockedIds(false)).resolves.toEqual([]);
    expect(mocks.getUserAchievements).not.toHaveBeenCalled();
  });

  it("returns each unlocked id once for signed-in users", async () => {
    mocks.getUserAchievements.mockResolvedValue([
      { id: "a" },
      { id: "b" },
      { id: "a" },
    ]);

    await expect(getWallUnlockedIds(true)).resolves.toEqual(["a", "b"]);
  });
});
