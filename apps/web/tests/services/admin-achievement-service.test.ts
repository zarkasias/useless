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
  getAdminAchievementById,
  getAdminAchievements,
  getAdminDashboardStats,
} from "@/lib/services/admin-achievement-service-server";

let db: ReturnType<typeof database>;

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.requireAdmin.mockReset();
  mocks.requireAdmin.mockResolvedValue(undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("admin authorization", () => {
  it.each([
    {
      name: "catalog",
      run: () => getAdminAchievements(),
    },
    {
      name: "individual achievement",
      run: () => getAdminAchievementById("award-1"),
    },
    {
      name: "dashboard",
      run: () => getAdminDashboardStats(),
    },
  ])("does not query $name when admin authorization fails", async ({ run }) => {
    mocks.requireAdmin.mockRejectedValue(new Error("Access denied"));

    await expect(run()).rejects.toThrow("Access denied");

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(db.from).not.toHaveBeenCalled();
  });
});

describe("admin achievement catalog", () => {
  it("returns the catalog newest first without optional filters", async () => {
    const achievements = [{ id: "award-1", title: "An achievement" }];
    const query = db.enqueue("achievements", { data: achievements });

    await expect(getAdminAchievements()).resolves.toEqual(achievements);

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(query.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(query.eq).not.toHaveBeenCalled();
    expect(query.neq).not.toHaveBeenCalled();
    expect(query.is).not.toHaveBeenCalled();
  });

  it.each(["draft", "review", "published", "archived"] as const)(
    "filters the catalog by %s status",
    async (status) => {
      const query = db.enqueue("achievements", { data: [] });

      await getAdminAchievements(status);

      expect(query.eq).toHaveBeenCalledWith("status", status);
    },
  );

  it("excludes archived records when filtering for missing icons", async () => {
    const query = db.enqueue("achievements", { data: [] });

    await getAdminAchievements(undefined, true);

    expect(query.neq).toHaveBeenCalledWith("status", "archived");
    expect(query.is).toHaveBeenCalledWith("icon_path", null);
  });

  it("combines the status and missing-icon filters", async () => {
    const query = db.enqueue("achievements", { data: [] });

    await getAdminAchievements("draft", true);

    expect(query.eq).toHaveBeenCalledWith("status", "draft");
    expect(query.neq).toHaveBeenCalledWith("status", "archived");
    expect(query.is).toHaveBeenCalledWith("icon_path", null);
  });

  it("returns an empty list for null catalog data", async () => {
    db.enqueue("achievements", { data: null });

    await expect(getAdminAchievements()).resolves.toEqual([]);
  });

  it("throws and logs a catalog lookup failure", async () => {
    const error = { message: "Read failed" };
    db.enqueue("achievements", { error });

    await expect(getAdminAchievements()).rejects.toThrow(
      "Unable to load achievements.",
    );
    expect(console.error).toHaveBeenCalledWith(
      "Error loading admin achievements:",
      error,
    );
  });
});

describe("individual admin achievement lookup", () => {
  it("returns the requested achievement", async () => {
    const achievement = { id: "award-1", title: "An achievement" };
    const query = db.enqueue("achievements", { data: achievement });

    await expect(getAdminAchievementById("award-1")).resolves.toEqual(
      achievement,
    );

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(query.eq).toHaveBeenCalledWith("id", "award-1");
    expect(query.maybeSingle).toHaveBeenCalledOnce();
  });

  it("returns null when the achievement does not exist", async () => {
    db.enqueue("achievements", { data: null });

    await expect(getAdminAchievementById("missing")).resolves.toBeNull();
  });

  it("throws and logs a lookup failure", async () => {
    const error = { message: "Read failed" };
    db.enqueue("achievements", { error });

    await expect(getAdminAchievementById("award-1")).rejects.toThrow(
      "Unable to load achievement.",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error loading achievement:",
      error,
    );
  });
});

describe("admin dashboard counts", () => {
  it("returns all five counts with the correct query filters", async () => {
    const queries = [2, 5, 3, 4, 7].map((count) =>
      db.enqueue("achievements", { count }),
    );

    await expect(getAdminDashboardStats()).resolves.toEqual({
      drafts: 2,
      published: 5,
      archived: 3,
      missingIcons: 4,
      aiGenerated: 7,
    });

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();

    for (const query of queries) {
      expect(query.select).toHaveBeenCalledWith("*", {
        count: "exact",
        head: true,
      });
    }

    expect(queries[0].eq).toHaveBeenCalledWith("status", "draft");
    expect(queries[1].eq).toHaveBeenCalledWith("status", "published");
    expect(queries[2].eq).toHaveBeenCalledWith("status", "archived");
    expect(queries[3].neq).toHaveBeenCalledWith("status", "archived");
    expect(queries[3].is).toHaveBeenCalledWith("icon_path", null);
    expect(queries[4].eq).toHaveBeenCalledWith("generated_by", "ai");
    expect(db.from).toHaveBeenCalledTimes(5);
  });

  it("defaults missing counts to zero", async () => {
    for (let index = 0; index < 5; index += 1) {
      db.enqueue("achievements", {
        count: index % 2 === 0 ? null : undefined,
      });
    }

    await expect(getAdminDashboardStats()).resolves.toEqual({
      drafts: 0,
      published: 0,
      archived: 0,
      missingIcons: 0,
      aiGenerated: 0,
    });
  });

  it.each([
    { label: "drafts", index: 0 },
    { label: "published", index: 1 },
    { label: "archived", index: 2 },
    { label: "missing icons", index: 3 },
    { label: "AI generated", index: 4 },
  ])("throws when the $label count fails", async ({ index }) => {
    const error = { message: "Count failed" };

    for (let queryIndex = 0; queryIndex < 5; queryIndex += 1) {
      db.enqueue(
        "achievements",
        queryIndex === index ? { error } : { count: 1 },
      );
    }

    await expect(getAdminDashboardStats()).rejects.toThrow(
      "Unable to load admin dashboard stats.",
    );
    expect(console.error).toHaveBeenCalledWith(
      "Error loading admin dashboard stats:",
      [error],
    );
  });
});
