import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  requireAdmin: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

import {
  getAchievementPackById,
  getAchievementPackCount,
  getAchievementPacks,
  getAchievementsForPack,
} from "@/lib/services/achievement-pack-service-server";

let db: ReturnType<typeof database>;

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.requireAdmin.mockReset();
  mocks.requireAdmin.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("achievement-pack authorization", () => {
  it.each([
    { name: "listing", run: () => getAchievementPacks() },
    { name: "counting", run: () => getAchievementPackCount() },
    {
      name: "pack achievements",
      run: () => getAchievementsForPack("pack-1"),
    },
  ])(
    "stops $name before querying when authorization fails",
    async ({ run }) => {
      mocks.requireAdmin.mockRejectedValue(new Error("Access denied"));

      await expect(run()).rejects.toThrow("Access denied");
      expect(db.from).not.toHaveBeenCalled();
    },
  );
});

describe("getAchievementPacks", () => {
  it("returns packs ordered newest first", async () => {
    const packs = [{ id: "pack-1", name: "Pointless Pack" }];
    const query = db.enqueue("achievement_packs", { data: packs });

    await expect(getAchievementPacks()).resolves.toEqual(packs);

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
  });

  it.each([
    { label: "null", data: null },
    { label: "empty", data: [] },
  ])("returns an empty list for $label data", async ({ data }) => {
    db.enqueue("achievement_packs", { data });

    await expect(getAchievementPacks()).resolves.toEqual([]);
  });

  it("throws and logs a lookup failure", async () => {
    const error = { message: "Read failed" };
    db.enqueue("achievement_packs", { error });

    // Preserve the service's existing error message, including its spelling.
    await expect(getAchievementPacks()).rejects.toThrow(
      "Unable to load achhievement packs.",
    );
    expect(console.error).toHaveBeenCalledWith(
      "Error fetching achievement packs",
      error,
    );
  });
});

describe("getAchievementPackById", () => {
  it("returns the requested pack", async () => {
    const pack = { id: "pack-1", name: "Pointless Pack" };
    const query = db.enqueue("achievement_packs", { data: pack });

    await expect(getAchievementPackById("pack-1")).resolves.toEqual(pack);

    expect(query.eq).toHaveBeenCalledWith("id", "pack-1");
    expect(query.maybeSingle).toHaveBeenCalledOnce();
  });

  it("returns null when no pack matches", async () => {
    db.enqueue("achievement_packs", { data: null });

    await expect(getAchievementPackById("missing")).resolves.toBeNull();
  });

  it("throws and logs a lookup failure", async () => {
    const error = { message: "Read failed" };
    db.enqueue("achievement_packs", { error });

    await expect(getAchievementPackById("pack-1")).rejects.toThrow(
      "Unable to load achievement pack.",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error fetching achievement pack:",
      error,
    );
  });
});

describe("getAchievementPackCount", () => {
  it("requests an exact count without retrieving pack rows", async () => {
    const query = db.enqueue("achievement_packs", { count: 12 });

    await expect(getAchievementPackCount()).resolves.toBe(12);

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(query.select).toHaveBeenCalledWith("*", {
      count: "exact",
      head: true,
    });
  });

  it.each([
    { label: "null", count: null },
    { label: "missing", count: undefined },
    { label: "zero", count: 0 },
  ])("returns zero for a $label count", async ({ count }) => {
    db.enqueue("achievement_packs", { count });

    await expect(getAchievementPackCount()).resolves.toBe(0);
  });

  it("throws and logs a count failure", async () => {
    const error = { message: "Count failed" };
    db.enqueue("achievement_packs", { error });

    await expect(getAchievementPackCount()).rejects.toThrow(
      "Unable to load achievement pack count.",
    );
    expect(console.error).toHaveBeenCalledWith(
      "Error loading achievement pack count:",
      error,
    );
  });
});

describe("getAchievementsForPack", () => {
  it("returns achievements scoped to the requested pack", async () => {
    const achievements = [
      { id: "award-1", pack_id: "pack-1", title: "An achievement" },
    ];
    const query = db.enqueue("achievements", { data: achievements });

    await expect(getAchievementsForPack("pack-1")).resolves.toEqual(
      achievements,
    );

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(query.eq).toHaveBeenCalledWith("pack_id", "pack-1");
    expect(query.order).toHaveBeenNthCalledWith(1, "type");
    expect(query.order).toHaveBeenNthCalledWith(2, "title");
  });

  it.each([
    { label: "null", data: null },
    { label: "empty", data: [] },
  ])("returns an empty list for $label data", async ({ data }) => {
    db.enqueue("achievements", { data });

    await expect(getAchievementsForPack("pack-1")).resolves.toEqual([]);
  });

  it("throws and logs a lookup failure", async () => {
    const error = { message: "Read failed" };
    db.enqueue("achievements", { error });

    await expect(getAchievementsForPack("pack-1")).rejects.toThrow(
      "Unable to load achievements for pack.",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error fetching achievements for pack:",
      error,
    );
  });
});
