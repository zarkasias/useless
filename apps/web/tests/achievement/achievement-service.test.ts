import { beforeEach, expect, it, vi } from "vitest";
import { database } from "../helpers/database";
const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUser: vi.fn(),
  access: vi.fn(),
  entitlements: vi.fn(),
  anonymous: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/services/achievement-access-service-server", () => ({
  getAchievementPackFilter: mocks.access,
}));
vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.entitlements,
}));
vi.mock("@/lib/anonymous-user", () => ({ getAnonymousUser: mocks.anonymous }));
import {
  getCollectionAchievements,
  getAuthenticatedUserAchievements,
  getLatestMetaAchievement,
  claimDailyAchievementForAuthenticatedUser,
  claimDailyAchievementForAnonymousUser,
  mergeAnonymousAchievementsIntoCurrentUser,
} from "@/lib/services/achievement-service-server";

let db: ReturnType<typeof database>;

const filter = "pack_id.is.null,pack_id.in.(core,owned-pack)";
const now = "2026-09-08T12:00:00.000Z";
beforeEach(() => {
  db = database();
  mocks.from.mockImplementation(db.from);
  mocks.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mocks.access.mockResolvedValue(filter);
  mocks.entitlements.mockResolvedValue({ canClaimAchievement: true });
  mocks.anonymous.mockResolvedValue({ id: "anon-1", timezone: "UTC" });
  vi.useFakeTimers();
  vi.setSystemTime(new Date(now));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
it.each([
  [10, false, 0],
  [9, false, 1],
  [8, false, 2],
  [10, true, 2],
])(
  "migration with %s awards and subscribed=%s imports %s",
  async (count, subscribed, expected) => {
    mocks.entitlements.mockResolvedValue({
      isSubscribed: subscribed,
      remainingFreeAchievements: Math.max(10 - count, 0),
    });
    db.enqueue("anonymous_achievements", {
      data: [
        {
          achievement_id: "first",
          achievement_date: "2026-09-06",
          created_at: now,
        },
        {
          achievement_id: "second",
          achievement_date: "2026-09-07",
          created_at: now,
        },
      ],
    });
    for (let i = 0; i < expected; i++) {
      db.enqueue("user_achievements", { data: [] });
      db.enqueue("user_achievements", {});
    }
    db.enqueue("anonymous_achievements", {});
    db.enqueue("anonymous_users", {});
    expect(
      await mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
    ).toEqual({
      migrated: expected,
      skipped: 2 - expected,
    });
    expect(mocks.entitlements).toHaveBeenCalledWith("user-1");
    expect(
      db.queries.reduce(
        (total, query) => total + query.insert.mock.calls.length,
        0,
      ),
    ).toBe(expected);
  },
);

it("does not migrate or clean up claims when entitlement lookup fails", async () => {
  db.enqueue("anonymous_achievements", { data: [{ achievement_id: "first" }] });
  mocks.entitlements.mockRejectedValueOnce(
    new Error("Entitlements unavailable"),
  );
  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).rejects.toThrow("Entitlements unavailable");
  expect(
    db.queries.every(
      (query) =>
        query.insert.mock.calls.length === 0 &&
        query.delete.mock.calls.length === 0,
    ),
  ).toBe(true);
});
it("scopes the published collection catalog to the user's accessible packs", async () => {
  const catalog = db.enqueue("achievements", { data: [{ id: "visible" }] });
  expect(await getCollectionAchievements("user-1")).toEqual([
    { id: "visible" },
  ]);
  expect(mocks.access).toHaveBeenCalledWith("user-1");
  expect(catalog.or).toHaveBeenCalledWith(filter);
  expect(catalog.eq).toHaveBeenCalledWith("status", "published");
});
it("filters collected records at the joined achievement so inaccessible rows are excluded", async () => {
  const owned = db.enqueue("user_achievements", {
    data: [
      { user_id: "user-1", created_at: now, achievements: { id: "visible" } },
    ],
  });
  expect(await getAuthenticatedUserAchievements()).toEqual([
    expect.objectContaining({ id: "visible", created_at: now }),
  ]);
  expect(owned.select).toHaveBeenCalledWith(
    expect.stringContaining("achievements!inner"),
  );
  expect(owned.or).toHaveBeenCalledWith(filter, {
    referencedTable: "achievements",
  });
  expect(owned.eq).toHaveBeenCalledWith("user_id", "user-1");
});
it("rejects unauthenticated claims without reading the database", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe(
    "unavailable",
  );
  expect(db.from).not.toHaveBeenCalled();
});
function beginClaim(existing: unknown = null, last: unknown = null) {
  db.enqueue("profiles", { data: { timezone: "UTC" } });
  const today = db.enqueue("user_achievements", { data: existing });
  if (!existing) db.enqueue("user_achievements", { data: last });
  return today;
}
function finishClaim(previous: string[] = [], available = [{ id: "new" }]) {
  db.enqueue("user_achievements", {
    data: previous.map((achievement_id) => ({ achievement_id })),
  });
  return db.enqueue("achievements", { data: available });
}
function enqueuePostClaimMilestoneChecks() {
  // Shared definitions are loaded first.
  db.enqueue("achievements", {
    data: [],
  });

  // Streak data lookup.
  db.enqueue("user_achievements", {
    data: [{ achievement_date: "2026-09-08" }],
  });

  // Streak timezone lookup.
  db.enqueue("profiles", {
    data: { timezone: "UTC" },
  });

  // Account-age profile lookup.
  db.enqueue("profiles", {
    data: { created_at: "2026-09-01T12:00:00.000Z" },
  });

  // Collection-count ownership lookup.
  db.enqueue("user_achievements", {
    data: [{ achievement_id: "new" }],
  });
}
it("blocks a second daily claim", async () => {
  const today = beginClaim({ id: "existing" });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe(
    "already_claimed",
  );
  expect(today.eq).toHaveBeenCalledWith("achievement_date", "2026-09-08");
  expect(mocks.entitlements).not.toHaveBeenCalled();
});
it("blocks claims at the free limit", async () => {
  beginClaim();
  mocks.entitlements.mockResolvedValue({ canClaimAchievement: false });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe(
    "subscription_required",
  );
  expect(mocks.access).not.toHaveBeenCalled();
});
it.each([
  ["America/New_York", 19, "already_claimed"],
  ["America/New_York", 20, "claimed"],
  ["UTC", 1, "claimed"],
])(
  "previous timezone %s, %s hours elapsed => %s",
  async (timezone, hours, expected) => {
    beginClaim(null, {
      claim_timezone: timezone,
      created_at: new Date(Date.now() - hours * 3600000).toISOString(),
    });
    if (expected === "claimed") {
      finishClaim();
      db.enqueue("user_achievements", { data: { created_at: now } });
      enqueuePostClaimMilestoneChecks();
    }
    expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe(
      expected,
    );
  },
);
it("awards an unused published daily achievement from eligible packs", async () => {
  beginClaim();
  const pool = finishClaim(["old"], [{ id: "old" }, { id: "new" }]);
  const insert = db.enqueue("user_achievements", { data: { created_at: now } });
  enqueuePostClaimMilestoneChecks();
  const result = await claimDailyAchievementForAuthenticatedUser();
  expect(result).toMatchObject({
    status: "claimed",
    achievement: { id: "new", user_id: "user-1" },
  });
  expect(result.triggeredAchievements).toEqual([]);
  expect(pool.or).toHaveBeenCalledWith(filter);
  expect(pool.eq).toHaveBeenCalledWith("status", "published");
  expect(pool.eq).toHaveBeenCalledWith("is_daily", true);
  expect(mocks.access).toHaveBeenCalledWith("user-1");
  expect(insert.insert).toHaveBeenCalledWith({
    user_id: "user-1",
    achievement_id: "new",
    achievement_date: "2026-09-08",
    claim_timezone: "UTC",
  });
});
it("does not award duplicates when the eligible pool is exhausted", async () => {
  beginClaim();
  finishClaim(["old"], [{ id: "old" }]);
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe(
    "unavailable",
  );
  expect(
    db.queries.every((query) => query.insert.mock.calls.length === 0),
  ).toBe(true);
});
it("does not report a claim as successful when the insert fails", async () => {
  beginClaim();
  finishClaim();
  db.enqueue("user_achievements", { error: { code: "23505" } });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe(
    "unavailable",
  );
});
it("reports subscription required if another request fills the last slot", async () => {
  beginClaim();
  finishClaim();
  db.enqueue("user_achievements", {
    error: { code: "23514", message: "Free achievement limit reached" },
  });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe(
    "subscription_required",
  );
});

it("counts a database-rejected migration award as skipped", async () => {
  mocks.entitlements.mockResolvedValue({
    isSubscribed: false,
    remainingFreeAchievements: 1,
  });
  db.enqueue("anonymous_achievements", {
    data: [
      {
        achievement_id: "first",
        achievement_date: "2026-09-06",
        created_at: now,
      },
    ],
  });
  db.enqueue("user_achievements", { data: [] });
  db.enqueue("user_achievements", {
    error: { code: "23514", message: "Free achievement limit reached" },
  });
  db.enqueue("anonymous_achievements", {});
  db.enqueue("anonymous_users", {});
  expect(await mergeAnonymousAchievementsIntoCurrentUser("browser-1")).toEqual({
    migrated: 0,
    skipped: 1,
  });
});
it("uses anonymous pack eligibility for anonymous daily claims", async () => {
  db.enqueue("anonymous_achievements", { data: null });
  db.enqueue("anonymous_achievements", { data: null });
  db.enqueue("anonymous_achievements", { data: [] });
  const pool = db.enqueue("achievements", {
    data: [{ id: "core-achievement" }],
  });
  db.enqueue("anonymous_achievements", { data: { created_at: now } });
  expect(
    await claimDailyAchievementForAnonymousUser("browser-1"),
  ).toMatchObject({ id: "core-achievement" });
  expect(mocks.access).toHaveBeenCalledWith(undefined);
  expect(pool.or).toHaveBeenCalledWith(filter);
});
it("blocks anonymous claims from a browser already linked to an account", async () => {
  mocks.anonymous.mockResolvedValue({ linked_user_id: "user-1" });
  expect(await claimDailyAchievementForAnonymousUser("browser-1")).toBeNull();
  expect(db.from).not.toHaveBeenCalled();
});

function migrationClaim() {
  return {
    achievement_id: "anonymous-award",
    achievement_date: "2026-09-06",
    claim_timezone: "America/New_York",
    created_at: "2026-09-06T15:30:00.000Z",
  };
}

function enqueueMigrationClaims() {
  mocks.entitlements.mockResolvedValue({
    isSubscribed: false,
    remainingFreeAchievements: 5,
  });

  return db.enqueue("anonymous_achievements", {
    data: [migrationClaim()],
  });
}

function expectNoMigrationCleanup() {
  expect(
    db.queries.every(
      (query) =>
        query.delete.mock.calls.length === 0 &&
        query.update.mock.calls.length === 0,
    ),
  ).toBe(true);
}

it("requires authentication before looking up anonymous claims", async () => {
  mocks.getUser.mockResolvedValue({
    data: { user: null },
    error: null,
  });
  mocks.anonymous.mockClear();

  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).rejects.toThrow(
    "User must be authenticated before migrating achievements.",
  );

  expect(mocks.anonymous).not.toHaveBeenCalled();
  expect(db.from).not.toHaveBeenCalled();
});

it("returns zero counts when the anonymous identity does not exist", async () => {
  mocks.anonymous.mockResolvedValue(null);

  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).resolves.toEqual({ migrated: 0, skipped: 0 });

  expect(db.from).not.toHaveBeenCalled();
});

it("preserves anonymous claims when their lookup fails", async () => {
  db.enqueue("anonymous_achievements", {
    error: { message: "Read failed" },
  });

  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).rejects.toThrow("Unable to migrate anonymous achievements.");

  expectNoMigrationCleanup();
  expect(db.from).toHaveBeenCalledTimes(1);
});

it("preserves anonymous claims when conflict lookup fails", async () => {
  enqueueMigrationClaims();
  db.enqueue("user_achievements", {
    error: { message: "Conflict lookup failed" },
  });

  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).rejects.toThrow("Unable to migrate anonymous achievements.");

  expectNoMigrationCleanup();
  expect(db.from).toHaveBeenCalledTimes(2);
});

it.each([
  {
    name: "an achievement already earned",
    existing: {
      id: "existing",
      achievement_id: "anonymous-award",
      achievement_date: "2026-09-01",
    },
  },
  {
    name: "a different achievement on the same date",
    existing: {
      id: "existing",
      achievement_id: "another-award",
      achievement_date: "2026-09-06",
    },
  },
])("skips $name without inserting a duplicate", async ({ existing }) => {
  enqueueMigrationClaims();
  const conflicts = db.enqueue("user_achievements", {
    data: [existing],
  });
  db.enqueue("anonymous_achievements", {});
  db.enqueue("anonymous_users", {});

  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).resolves.toEqual({ migrated: 0, skipped: 1 });

  expect(conflicts.eq).toHaveBeenCalledWith("user_id", "user-1");
  expect(conflicts.or).toHaveBeenCalledWith(
    "achievement_date.eq.2026-09-06,achievement_id.eq.anonymous-award",
  );
  expect(
    db.queries.every((query) => query.insert.mock.calls.length === 0),
  ).toBe(true);
  expect(db.from).toHaveBeenCalledTimes(4);
});

it("preserves the original earning date, time, and timezone", async () => {
  enqueueMigrationClaims();
  db.enqueue("user_achievements", { data: [] });
  const insert = db.enqueue("user_achievements", {});
  const cleanup = db.enqueue("anonymous_achievements", {});
  const link = db.enqueue("anonymous_users", {});

  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).resolves.toEqual({ migrated: 1, skipped: 0 });

  expect(insert.insert).toHaveBeenCalledWith({
    user_id: "user-1",
    ...migrationClaim(),
  });
  expect(cleanup.delete).toHaveBeenCalledOnce();
  expect(cleanup.eq).toHaveBeenCalledWith("anonymous_user_id", "anon-1");
  expect(link.update).toHaveBeenCalledWith({
    linked_user_id: "user-1",
    last_seen_at: now,
  });
  expect(link.eq).toHaveBeenCalledWith("id", "anon-1");
  expect(db.from).toHaveBeenCalledTimes(5);
});

it("preserves anonymous claims after an ordinary migration insert failure", async () => {
  enqueueMigrationClaims();
  db.enqueue("user_achievements", { data: [] });
  db.enqueue("user_achievements", {
    error: { code: "XX000", message: "Write failed" },
  });

  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).rejects.toThrow("Unable to migrate anonymous achievements.");

  expectNoMigrationCleanup();
  expect(db.from).toHaveBeenCalledTimes(3);
});

it("reports cleanup failure without attempting to link the browser", async () => {
  enqueueMigrationClaims();
  db.enqueue("user_achievements", { data: [] });
  db.enqueue("user_achievements", {});
  db.enqueue("anonymous_achievements", {
    error: { message: "Delete failed" },
  });

  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).rejects.toThrow(
    "Achievements migrated, but anonymous claim cleanup failed.",
  );

  expect(
    db.queries.every((query) => query.update.mock.calls.length === 0),
  ).toBe(true);
  expect(db.from).toHaveBeenCalledTimes(4);
});

it("reports browser-link failure after migration and cleanup", async () => {
  enqueueMigrationClaims();
  db.enqueue("user_achievements", { data: [] });
  db.enqueue("user_achievements", {});
  const cleanup = db.enqueue("anonymous_achievements", {});
  db.enqueue("anonymous_users", {
    error: { message: "Link failed" },
  });

  await expect(
    mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
  ).rejects.toThrow(
    "Achievements migrated, but browser identity linking failed.",
  );

  expect(cleanup.delete).toHaveBeenCalledOnce();
  expect(db.from).toHaveBeenCalledTimes(5);
});

it.each([
  { label: "null", data: null },
  { label: "empty array", data: [] },
])(
  "cleans up and links an anonymous identity with no claims: $label",
  async ({ data }) => {
    mocks.entitlements.mockResolvedValue({
      isSubscribed: false,
      remainingFreeAchievements: 5,
    });

    db.enqueue("anonymous_achievements", { data });
    const cleanup = db.enqueue("anonymous_achievements", {});
    const link = db.enqueue("anonymous_users", {});

    await expect(
      mergeAnonymousAchievementsIntoCurrentUser("browser-1"),
    ).resolves.toEqual({ migrated: 0, skipped: 0 });

    expect(cleanup.delete).toHaveBeenCalledOnce();
    expect(link.update).toHaveBeenCalledWith({
      linked_user_id: "user-1",
      last_seen_at: now,
    });
    expect(db.from).toHaveBeenCalledTimes(3);
  },
);

function metaAchievementFixture() {
  return {
    id: "meta-1",
    title: "Questionably dedicated",
    description: "A streak milestone",
    type: "common",
    emoji: "🏆",
    icon_path: null,
    created_at: "2026-01-01T00:00:00.000Z",
    trigger_type: "streak",
    trigger_config: { days: 3 },
    is_daily: false,
    is_secret: false,
    pack_id: null,
    status: "published",
  };
}

it.each([
  { shape: "object", asArray: false },
  { shape: "array", asArray: true },
])(
  "returns the latest meta achievement from an $shape join",
  async ({ asArray }) => {
    const achievement = metaAchievementFixture();
    const earnedAt = "2026-09-07T15:00:00.000Z";

    const query = db.enqueue("user_achievements", {
      data: {
        created_at: earnedAt,
        achievements: asArray ? [achievement] : achievement,
      },
    });

    await expect(getLatestMetaAchievement("user-1")).resolves.toEqual({
      ...achievement,
      user_id: "user-1",
      created_at: earnedAt,
    });

    expect(query.select).toHaveBeenCalledWith(
      expect.stringContaining("achievements!inner"),
    );
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.not).toHaveBeenCalledWith(
      "achievements.trigger_type",
      "is",
      null,
    );
    expect(query.neq).toHaveBeenCalledWith(
      "achievements.trigger_type",
      "daily_claim",
    );
    expect(query.order).toHaveBeenCalledWith("created_at", {
      ascending: false,
    });
    expect(query.limit).toHaveBeenCalledWith(1);
    expect(query.maybeSingle).toHaveBeenCalledOnce();
    expect(db.from).toHaveBeenCalledTimes(1);
  },
);

it.each([
  { label: "no row", data: null },
  {
    label: "missing joined achievement",
    data: { created_at: now },
  },
  {
    label: "null joined achievement",
    data: { created_at: now, achievements: null },
  },
  {
    label: "empty joined array",
    data: { created_at: now, achievements: [] },
  },
])(
  "returns null for the latest meta achievement with $label",
  async ({ data }) => {
    db.enqueue("user_achievements", { data });

    await expect(getLatestMetaAchievement("user-1")).resolves.toBeNull();

    expect(db.from).toHaveBeenCalledTimes(1);
  },
);

it("returns null and logs a latest-meta database error", async () => {
  const error = { message: "Database unavailable" };

  db.enqueue("user_achievements", {
    data: null,
    error,
  });

  await expect(getLatestMetaAchievement("user-1")).resolves.toBeNull();

  expect(console.error).toHaveBeenCalledWith(
    "Error fetching latest meta achievement:",
    error,
  );
});

function expectNoClaimInsert() {
  expect(
    db.queries.every((query) => query.insert.mock.calls.length === 0),
  ).toBe(true);
}

it.each([
  { stage: "today", expectedQueries: 2 },
  { stage: "last claim", expectedQueries: 3 },
  { stage: "owned achievements", expectedQueries: 4 },
])(
  "does not award an authenticated claim after a failed $stage lookup",
  async ({ stage, expectedQueries }) => {
    const error = { message: "Database unavailable" };

    db.enqueue("profiles", { data: { timezone: "UTC" } });

    db.enqueue(
      "user_achievements",
      stage === "today" ? { error } : { data: null },
    );

    if (stage !== "today") {
      db.enqueue(
        "user_achievements",
        stage === "last claim" ? { error } : { data: null },
      );
    }

    if (stage === "owned achievements") {
      db.enqueue("user_achievements", { error });
    }

    await expect(
      claimDailyAchievementForAuthenticatedUser(),
    ).resolves.toMatchObject({
      status: "unavailable",
      achievement: null,
    });

    expect(console.error).toHaveBeenCalled();
    expectNoClaimInsert();
    expect(db.from).toHaveBeenCalledTimes(expectedQueries);
  },
);

it("does not query claims for a missing anonymous identity", async () => {
  mocks.anonymous.mockResolvedValue(null);

  await expect(
    claimDailyAchievementForAnonymousUser("browser-1"),
  ).resolves.toBeNull();

  expect(db.from).not.toHaveBeenCalled();
});

it("does not award a second anonymous claim on the same day", async () => {
  const query = db.enqueue("anonymous_achievements", {
    data: { id: "existing-claim" },
  });

  await expect(
    claimDailyAchievementForAnonymousUser("browser-1"),
  ).resolves.toBeNull();

  expect(query.eq).toHaveBeenCalledWith("anonymous_user_id", "anon-1");
  expect(query.eq).toHaveBeenCalledWith("achievement_date", "2026-09-08");
  expectNoClaimInsert();
  expect(db.from).toHaveBeenCalledTimes(1);
});

it.each([
  { stage: "today", expectedQueries: 1 },
  { stage: "last claim", expectedQueries: 2 },
  { stage: "owned achievements", expectedQueries: 3 },
])(
  "does not award an anonymous claim after a failed $stage lookup",
  async ({ stage, expectedQueries }) => {
    const error = { message: "Database unavailable" };

    db.enqueue(
      "anonymous_achievements",
      stage === "today" ? { error } : { data: null },
    );

    if (stage !== "today") {
      db.enqueue(
        "anonymous_achievements",
        stage === "last claim" ? { error } : { data: null },
      );
    }

    if (stage === "owned achievements") {
      db.enqueue("anonymous_achievements", { error });
    }

    await expect(
      claimDailyAchievementForAnonymousUser("browser-1"),
    ).resolves.toBeNull();

    expect(console.error).toHaveBeenCalled();
    expectNoClaimInsert();
    expect(db.from).toHaveBeenCalledTimes(expectedQueries);
  },
);

const unavailableDailyPools = [
  {
    label: "database error",
    result: {
      data: null,
      error: { message: "Catalog unavailable" },
    },
  },
  {
    label: "null catalog",
    result: { data: null },
  },
  {
    label: "empty catalog",
    result: { data: [] },
  },
  {
    label: "already-owned catalog",
    result: { data: [{ id: "owned-award" }] },
  },
];

it.each(unavailableDailyPools)(
  "returns unavailable for an authenticated claim with $label",
  async ({ result }) => {
    beginClaim();
    db.enqueue("user_achievements", {
      data: [{ achievement_id: "owned-award" }],
    });
    db.enqueue("achievements", result);

    await expect(
      claimDailyAchievementForAuthenticatedUser(),
    ).resolves.toMatchObject({
      status: "unavailable",
      achievement: null,
    });

    expectNoClaimInsert();
    expect(db.from).toHaveBeenCalledTimes(5);
  },
);

it.each(unavailableDailyPools)(
  "returns null for an anonymous claim with $label",
  async ({ result }) => {
    db.enqueue("anonymous_achievements", { data: null });
    db.enqueue("anonymous_achievements", { data: null });
    db.enqueue("anonymous_achievements", {
      data: [{ achievement_id: "owned-award" }],
    });
    db.enqueue("achievements", result);

    await expect(
      claimDailyAchievementForAnonymousUser("browser-1"),
    ).resolves.toBeNull();

    expectNoClaimInsert();
    expect(db.from).toHaveBeenCalledTimes(4);
  },
);

it("does not report an anonymous claim as successful when insertion fails", async () => {
  db.enqueue("anonymous_achievements", { data: null });
  db.enqueue("anonymous_achievements", { data: null });
  db.enqueue("anonymous_achievements", { data: [] });
  db.enqueue("achievements", {
    data: [{ id: "available-award" }],
  });

  const error = { code: "23505", message: "Duplicate claim" };
  const insert = db.enqueue("anonymous_achievements", { error });

  await expect(
    claimDailyAchievementForAnonymousUser("browser-1"),
  ).resolves.toBeNull();

  expect(insert.insert).toHaveBeenCalledWith({
    anonymous_user_id: "anon-1",
    achievement_id: "available-award",
    achievement_date: "2026-09-08",
    claim_timezone: "UTC",
  });
  expect(console.error).toHaveBeenCalledWith(
    "Error claiming anonymous achievement:",
    error,
  );
  expect(db.from).toHaveBeenCalledTimes(5);
});

it("throws when the collection catalog lookup fails", async () => {
  const error = { message: "Catalog unavailable" };
  db.enqueue("achievements", { error });

  await expect(getCollectionAchievements("user-1")).rejects.toThrow(
    "Unable to load achievement catalog",
  );

  expect(console.error).toHaveBeenCalledWith(
    "Error loading achievement catalog:",
    error,
  );
});

it("returns an empty collection when the catalog contains no rows", async () => {
  db.enqueue("achievements", { data: null });

  await expect(getCollectionAchievements("user-1")).resolves.toEqual([]);
});
