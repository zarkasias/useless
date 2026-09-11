import { beforeEach, expect, it, vi } from "vitest";
import { database } from "./helpers/database";
const mocks = vi.hoisted(() => ({
  from: vi.fn(), getUser: vi.fn(), access: vi.fn(), entitlements: vi.fn(), anonymous: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: mocks.from }) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: async () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/lib/services/achievement-access-service-server", () => ({ getAchievementPackFilter: mocks.access }));
vi.mock("@/lib/services/entitlement-service-server", () => ({ getUserEntitlements: mocks.entitlements }));
vi.mock("@/lib/anonymous-user", () => ({ getAnonymousUser: mocks.anonymous }));
import {
  getCollectionAchievements, getAuthenticatedUserAchievements,
  claimDailyAchievementForAuthenticatedUser, claimDailyAchievementForAnonymousUser,
  mergeAnonymousAchievementsIntoCurrentUser,
} from "@/lib/services/achievement-service-server";

let db: ReturnType<typeof database>;
const filter = "pack_id.is.null,pack_id.in.(core,owned-pack)";
const now = "2026-09-08T12:00:00.000Z";
beforeEach(() => {
  db = database(); mocks.from.mockImplementation(db.from);
  mocks.getUser.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  mocks.access.mockResolvedValue(filter);
  mocks.entitlements.mockResolvedValue({ canClaimAchievement: true });
  mocks.anonymous.mockResolvedValue({ id: "anon-1", timezone: "UTC" });
  vi.useFakeTimers(); vi.setSystemTime(new Date(now));
  vi.spyOn(console, "error").mockImplementation(() => {});
});
it.each([
  [10, false, 0],
  [9, false, 1],
  [8, false, 2],
  [10, true, 2],
])("migration with %s awards and subscribed=%s imports %s", async (count, subscribed, expected) => {
  mocks.entitlements.mockResolvedValue({
    isSubscribed: subscribed,
    remainingFreeAchievements: Math.max(10 - count, 0),
  });
  db.enqueue("anonymous_achievements", { data: [
    { achievement_id: "first", achievement_date: "2026-09-06", created_at: now },
    { achievement_id: "second", achievement_date: "2026-09-07", created_at: now },
  ] });
  for (let i = 0; i < expected; i++) {
    db.enqueue("user_achievements", { data: [] });
    db.enqueue("user_achievements", {});
  }
  db.enqueue("anonymous_achievements", {});
  db.enqueue("anonymous_users", {});
  expect(await mergeAnonymousAchievementsIntoCurrentUser("browser-1")).toEqual({
    migrated: expected, skipped: 2 - expected,
  });
  expect(mocks.entitlements).toHaveBeenCalledWith("user-1");
  expect(db.queries.reduce((total, query) => total + query.insert.mock.calls.length, 0)).toBe(expected);
});

it("does not migrate or clean up claims when entitlement lookup fails", async () => {
  db.enqueue("anonymous_achievements", { data: [{ achievement_id: "first" }] });
  mocks.entitlements.mockRejectedValueOnce(new Error("Entitlements unavailable"));
  await expect(mergeAnonymousAchievementsIntoCurrentUser("browser-1")).rejects.toThrow("Entitlements unavailable");
  expect(db.queries.every(query => query.insert.mock.calls.length === 0 && query.delete.mock.calls.length === 0)).toBe(true);
});
it("scopes the published collection catalog to the user's accessible packs", async () => {
  const catalog = db.enqueue("achievements", { data: [{ id: "visible" }] });
  expect(await getCollectionAchievements("user-1")).toEqual([{ id: "visible" }]);
  expect(mocks.access).toHaveBeenCalledWith("user-1");
  expect(catalog.or).toHaveBeenCalledWith(filter);
  expect(catalog.eq).toHaveBeenCalledWith("status", "published");
});
it("filters collected records at the joined achievement so inaccessible rows are excluded", async () => {
  const owned = db.enqueue("user_achievements", { data: [{ user_id: "user-1", created_at: now, achievements: { id: "visible" } }] });
  expect(await getAuthenticatedUserAchievements()).toEqual([expect.objectContaining({ id: "visible", created_at: now })]);
  expect(owned.select).toHaveBeenCalledWith(expect.stringContaining("achievements!inner"));
  expect(owned.or).toHaveBeenCalledWith(filter, { referencedTable: "achievements" });
  expect(owned.eq).toHaveBeenCalledWith("user_id", "user-1");
});
it("rejects unauthenticated claims without reading the database", async () => {
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe("unavailable");
  expect(db.from).not.toHaveBeenCalled();
});
function beginClaim(existing: unknown = null, last: unknown = null) {
  db.enqueue("profiles", { data: { timezone: "UTC" } });
  const today = db.enqueue("user_achievements", { data: existing });
  if (!existing) db.enqueue("user_achievements", { data: last });
  return today;
}
function finishClaim(previous: string[] = [], available = [{ id: "new" }]) {
  db.enqueue("user_achievements", { data: previous.map(achievement_id => ({ achievement_id })) });
  return db.enqueue("achievements", { data: available });
}
it("blocks a second daily claim", async () => {
  const today = beginClaim({ id: "existing" });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe("already_claimed");
  expect(today.eq).toHaveBeenCalledWith("achievement_date", "2026-09-08");
  expect(mocks.entitlements).not.toHaveBeenCalled();
});
it("blocks claims at the free limit", async () => {
  beginClaim(); mocks.entitlements.mockResolvedValue({ canClaimAchievement: false });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe("subscription_required");
  expect(mocks.access).not.toHaveBeenCalled();
});
it.each([
  ["America/New_York", 19, "already_claimed"],
  ["America/New_York", 20, "claimed"],
  ["UTC", 1, "claimed"],
])("previous timezone %s, %s hours elapsed => %s", async (timezone, hours, expected) => {
  beginClaim(null, { claim_timezone: timezone, created_at: new Date(Date.now() - hours * 3600000).toISOString() });
  if (expected === "claimed") {
    finishClaim(); db.enqueue("user_achievements", { data: { created_at: now } });
  }
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe(expected);
});
it("awards an unused published daily achievement from eligible packs", async () => {
  beginClaim();
  const pool = finishClaim(["old"], [{ id: "old" }, { id: "new" }]);
  const insert = db.enqueue("user_achievements", { data: { created_at: now } });
  const result = await claimDailyAchievementForAuthenticatedUser();
  expect(result).toMatchObject({ status: "claimed", achievement: { id: "new", user_id: "user-1" } });
  expect(pool.or).toHaveBeenCalledWith(filter);
  expect(pool.eq).toHaveBeenCalledWith("status", "published");
  expect(pool.eq).toHaveBeenCalledWith("is_daily", true);
  expect(mocks.access).toHaveBeenCalledWith("user-1");
  expect(insert.insert).toHaveBeenCalledWith({ user_id: "user-1", achievement_id: "new", achievement_date: "2026-09-08", claim_timezone: "UTC" });
});
it("does not award duplicates when the eligible pool is exhausted", async () => {
  beginClaim(); finishClaim(["old"], [{ id: "old" }]);
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe("unavailable");
  expect(db.queries.every(query => query.insert.mock.calls.length === 0)).toBe(true);
});
it("does not report a claim as successful when the insert fails", async () => {
  beginClaim(); finishClaim(); db.enqueue("user_achievements", { error: { code: "23505" } });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe("unavailable");
});
it("reports subscription required if another request fills the last slot", async () => {
  beginClaim(); finishClaim();
  db.enqueue("user_achievements", { error: { code: "23514", message: "Free achievement limit reached" } });
  expect((await claimDailyAchievementForAuthenticatedUser()).status).toBe("subscription_required");
});

it("counts a database-rejected migration award as skipped", async () => {
  mocks.entitlements.mockResolvedValue({ isSubscribed: false, remainingFreeAchievements: 1 });
  db.enqueue("anonymous_achievements", { data: [
    { achievement_id: "first", achievement_date: "2026-09-06", created_at: now },
  ] });
  db.enqueue("user_achievements", { data: [] });
  db.enqueue("user_achievements", { error: { code: "23514", message: "Free achievement limit reached" } });
  db.enqueue("anonymous_achievements", {});
  db.enqueue("anonymous_users", {});
  expect(await mergeAnonymousAchievementsIntoCurrentUser("browser-1")).toEqual({ migrated: 0, skipped: 1 });
});
it("uses anonymous pack eligibility for anonymous daily claims", async () => {
  db.enqueue("anonymous_achievements", { data: null });
  db.enqueue("anonymous_achievements", { data: null });
  db.enqueue("anonymous_achievements", { data: [] });
  const pool = db.enqueue("achievements", { data: [{ id: "core-achievement" }] });
  db.enqueue("anonymous_achievements", { data: { created_at: now } });
  expect(await claimDailyAchievementForAnonymousUser("browser-1")).toMatchObject({ id: "core-achievement" });
  expect(mocks.access).toHaveBeenCalledWith(undefined);
  expect(pool.or).toHaveBeenCalledWith(filter);
});
it("blocks anonymous claims from a browser already linked to an account", async () => {
  mocks.anonymous.mockResolvedValue({ linked_user_id: "user-1" });
  expect(await claimDailyAchievementForAnonymousUser("browser-1")).toBeNull();
  expect(db.from).not.toHaveBeenCalled();
});
