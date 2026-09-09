import { beforeEach, expect, it, vi } from "vitest";
import { database } from "./helpers/database";
const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => mocks }));
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
let db: ReturnType<typeof database>;
beforeEach(() => { db = database(); mocks.from.mockImplementation(db.from); });
it.each([
  [0, null, true, 5], [4, null, true, 1], [5, null, false, 0], [6, null, false, 0],
  [5, "active", true, 0], [5, "trialing", true, 0], [5, "past_due", true, 0],
  [5, "canceled", false, 0], [5, "unpaid", false, 0],
])("count %s / subscription %s => eligible %s", async (count, status, eligible, remaining) => {
  const claims = db.enqueue("user_achievements", { count: count as number });
  const subscription = db.enqueue("subscriptions", { data: status ? { status } : null });
  const result = await getUserEntitlements("user-1");
  expect(result.canClaimAchievement).toBe(eligible);
  expect(result.remainingFreeAchievements).toBe(remaining);
  expect(claims.eq).toHaveBeenCalledWith("user_id", "user-1");
  expect(subscription.eq).toHaveBeenCalledWith("user_id", "user-1");
});
it.each(["count", "subscription"])("fails closed on %s errors", async (failure) => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  db.enqueue("user_achievements", failure === "count" ? { error: {} } : { count: 0 });
  db.enqueue("subscriptions", failure === "subscription" ? { error: {} } : { data: null });
  await expect(getUserEntitlements("user-1")).rejects.toThrow();
});
