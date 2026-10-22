import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  getProfile: vi.fn(),
}));

vi.mock("next/cache", () => ({
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getUser,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getProfile,
}));

import {
  getPublishedAchievementsForPack,
  getStoreAchievementPacks,
} from "@/lib/services/pack-store-service-server";

const NOW = "2026-10-07T12:00:00.000Z";
const BEFORE = "2026-10-07T11:59:59.999Z";
const AFTER = "2026-10-07T12:00:00.001Z";

let db: ReturnType<typeof database>;

function pack(
  overrides: Partial<{
    id: string;
    status: string;
    price_cents: number | null;
    starts_at: string | null;
    ends_at: string | null;
  }> = {},
) {
  return {
    id: "pack-1",
    name: "Pointless Pack",
    slug: "pointless-pack",
    description: "More unnecessary achievements",
    cover_image_path: "/packs/pointless.webp",
    theme_key: "violet",
    price_cents: 499,
    currency: "usd",
    starts_at: null,
    ends_at: null,
    status: "active",
    ...overrides,
  };
}

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  mocks.getUser.mockReset();
  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.getProfile.mockReset();
  mocks.getProfile.mockResolvedValue({ role: "user" });

  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

function enqueueStore({
  packs = [pack()],
  achievements = [{ id: "award-1", pack_id: "pack-1" }],
  owned = [],
  collected = [],
}: {
  packs?: ReturnType<typeof pack>[];
  achievements?: Array<{ id: string; pack_id: string }> | null;
  owned?: Array<{ pack_id: string }> | null;
  collected?: Array<{ achievement_id: string }> | null;
} = {}) {
  db.enqueue("achievement_packs", { data: packs });
  db.enqueue("achievements", { data: achievements });
  db.enqueue("user_achievement_packs", { data: owned });
  db.enqueue("user_achievements", { data: collected });
}

describe("store visibility and availability", () => {
  it("lists an active purchasable pack and scopes its supporting queries", async () => {
    enqueueStore();

    const result = await getStoreAchievementPacks();

    expect(result).toEqual([
      {
        ...pack(),
        owned: false,
        availableForPurchase: true,
        isUpcoming: false,
        hasEnded: false,
        totalAchievements: 1,
        collectedAchievements: 0,
        completed: false,
      },
    ]);

    expect(db.queries[0].neq).toHaveBeenCalledWith("pack_type", "core");
    expect(db.queries[1].in).toHaveBeenCalledWith("pack_id", ["pack-1"]);
    expect(db.queries[1].eq).toHaveBeenCalledWith("status", "published");
    expect(db.queries[2].eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(db.queries[2].eq).toHaveBeenCalledWith("purchase_status", "owned");
    expect(db.queries[3].eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it.each([
    { label: "starts now", changes: { starts_at: NOW }, visible: true },
    { label: "starts later", changes: { starts_at: AFTER }, visible: false },
    { label: "ends now", changes: { ends_at: NOW }, visible: true },
    { label: "already ended", changes: { ends_at: BEFORE }, visible: false },
    { label: "zero price", changes: { price_cents: 0 }, visible: false },
    { label: "missing price", changes: { price_cents: null }, visible: false },
    { label: "draft", changes: { status: "draft" }, visible: false },
    { label: "archived", changes: { status: "archived" }, visible: false },
  ])("handles $label", async ({ changes, visible }) => {
    enqueueStore({ packs: [pack(changes)] });

    const result = await getStoreAchievementPacks();

    expect(result).toHaveLength(visible ? 1 : 0);

    if (visible) {
      expect(result[0].availableForPurchase).toBe(true);
    }
  });

  it("shows scheduled packs without making them purchasable", async () => {
    enqueueStore({
      packs: [pack({ status: "scheduled", starts_at: AFTER })],
    });

    await expect(getStoreAchievementPacks()).resolves.toEqual([
      expect.objectContaining({
        isUpcoming: true,
        availableForPurchase: false,
        owned: false,
      }),
    ]);
  });

  it("keeps an owned ended pack visible and prevents repurchase", async () => {
    enqueueStore({
      packs: [pack({ ends_at: BEFORE })],
      owned: [{ pack_id: "pack-1" }],
    });

    await expect(getStoreAchievementPacks()).resolves.toEqual([
      expect.objectContaining({
        owned: true,
        hasEnded: true,
        availableForPurchase: false,
      }),
    ]);
  });

  it("lets admins see packs hidden from ordinary viewers", async () => {
    mocks.getProfile.mockResolvedValue({ role: "admin" });
    enqueueStore({
      packs: [pack({ status: "draft", price_cents: null })],
    });

    await expect(getStoreAchievementPacks()).resolves.toEqual([
      expect.objectContaining({
        status: "draft",
        availableForPurchase: false,
      }),
    ]);
  });

  it("lists public packs without reading anonymous ownership or progress", async () => {
    mocks.getUser.mockResolvedValue(null);
    mocks.getProfile.mockResolvedValue(null);

    db.enqueue("achievement_packs", { data: [pack()] });
    db.enqueue("achievements", { data: null });

    await expect(getStoreAchievementPacks()).resolves.toEqual([
      expect.objectContaining({
        owned: false,
        availableForPurchase: true,
        totalAchievements: 0,
        collectedAchievements: 0,
        completed: false,
      }),
    ]);
    expect(db.from).toHaveBeenCalledTimes(2);
  });
});

describe("pack collection progress", () => {
  it("counts published achievements within each pack and deduplicates claims", async () => {
    enqueueStore({
      packs: [pack(), pack({ id: "pack-2" })],
      achievements: [
        { id: "award-1", pack_id: "pack-1" },
        { id: "award-2", pack_id: "pack-1" },
        { id: "award-3", pack_id: "pack-2" },
      ],
      owned: [{ pack_id: "pack-1" }, { pack_id: "pack-2" }],
      collected: [
        { achievement_id: "award-1" },
        { achievement_id: "award-1" },
        { achievement_id: "award-3" },
        { achievement_id: "unrelated-award" },
      ],
    });

    const result = await getStoreAchievementPacks();

    expect(result[0]).toMatchObject({
      totalAchievements: 2,
      collectedAchievements: 1,
      completed: false,
    });
    expect(result[1]).toMatchObject({
      totalAchievements: 1,
      collectedAchievements: 1,
      completed: true,
    });
  });

  it("does not mark an unowned pack completed", async () => {
    enqueueStore({
      collected: [{ achievement_id: "award-1" }],
    });

    await expect(getStoreAchievementPacks()).resolves.toEqual([
      expect.objectContaining({
        owned: false,
        collectedAchievements: 1,
        completed: false,
      }),
    ]);
  });

  it("does not mark an empty owned pack completed", async () => {
    enqueueStore({
      achievements: [],
      owned: [{ pack_id: "pack-1" }],
    });

    await expect(getStoreAchievementPacks()).resolves.toEqual([
      expect.objectContaining({
        totalAchievements: 0,
        completed: false,
      }),
    ]);
  });

  it("handles null achievement, ownership, and progress data", async () => {
    enqueueStore({
      achievements: null,
      owned: null,
      collected: null,
    });

    await expect(getStoreAchievementPacks()).resolves.toEqual([
      expect.objectContaining({
        owned: false,
        totalAchievements: 0,
        collectedAchievements: 0,
        completed: false,
      }),
    ]);
  });
});

describe("store lookup failures", () => {
  it.each([
    { label: "null", data: null },
    { label: "empty", data: [] },
  ])("returns no packs for a $label catalog", async ({ data }) => {
    db.enqueue("achievement_packs", { data });

    await expect(getStoreAchievementPacks()).resolves.toEqual([]);
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      stage: 0,
      message: "Unable to load achievement packs.",
    },
    {
      stage: 1,
      message: "Unable to load pack achievements.",
    },
    {
      stage: 2,
      message: "Unable to load pack ownership.",
    },
    {
      stage: 3,
      message: "Unable to load pack progress.",
    },
  ])("throws when query $stage fails", async ({ stage, message }) => {
    const tables = [
      "achievement_packs",
      "achievements",
      "user_achievement_packs",
      "user_achievements",
    ];
    const results = [
      { data: [pack()] },
      { data: [{ id: "award-1", pack_id: "pack-1" }] },
      { data: [] },
      { data: [] },
    ];

    const lastQueryIndex = stage >= 2 ? 3 : stage;

    for (let index = 0; index <= lastQueryIndex; index += 1) {
      db.enqueue(
        tables[index],
        index === stage
          ? { error: { message: "Database unavailable" } }
          : results[index],
      );
    }

    await expect(getStoreAchievementPacks()).rejects.toThrow(message);
    expect(db.from).toHaveBeenCalledTimes(stage >= 2 ? 4 : stage + 1);
  });
});

describe("published achievements for a pack", () => {
  it("scopes the catalog to the requested pack and published status", async () => {
    const achievements = [{ id: "award-1", pack_id: "pack-1" }];
    const query = db.enqueue("achievements", { data: achievements });

    await expect(getPublishedAchievementsForPack("pack-1")).resolves.toEqual(
      achievements,
    );

    expect(query.eq).toHaveBeenCalledWith("pack_id", "pack-1");
    expect(query.eq).toHaveBeenCalledWith("status", "published");
    expect(query.order).toHaveBeenNthCalledWith(1, "type");
    expect(query.order).toHaveBeenNthCalledWith(2, "title");
  });

  it("returns an empty list for null data", async () => {
    db.enqueue("achievements", { data: null });

    await expect(getPublishedAchievementsForPack("pack-1")).resolves.toEqual(
      [],
    );
  });

  it("throws when the achievement lookup fails", async () => {
    db.enqueue("achievements", {
      error: { message: "Database unavailable" },
    });

    await expect(getPublishedAchievementsForPack("pack-1")).rejects.toThrow(
      "Unable to load pack achievements.",
    );
  });
});
