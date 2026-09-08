import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "./helpers/database";
import { achievementPackFilter } from "@/lib/achievements/pack-access";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => mocks }));
import { getAchievementPackFilter } from "@/lib/services/achievement-access-service-server";
import { grantAchievementPackToUser } from "@/lib/services/user-achievement-pack-service-server";

let db: ReturnType<typeof database>;
beforeEach(() => { db = database(); mocks.from.mockImplementation(db.from); });

describe("pack access", () => {
  it("supports legacy achievements with no packs and deduplicates pack IDs", () => {
    expect(achievementPackFilter([])).toBe("pack_id.is.null");
    expect(achievementPackFilter(["core", "core"])).toBe("pack_id.is.null,pack_id.in.(core)");
  });
  it("gives anonymous users only core and unassigned achievements", async () => {
    const core = db.enqueue("achievement_packs", { data: [{ id: "core" }] });
    expect(await getAchievementPackFilter()).toBe("pack_id.is.null,pack_id.in.(core)");
    expect(core.eq).toHaveBeenCalledWith("pack_type", "core");
    expect(db.from).toHaveBeenCalledTimes(1);
  });
  it.each([true, false])("uses only owned purchases for the requested user (buyer=%s)", async (buyer) => {
    db.enqueue("achievement_packs", { data: [{ id: "core" }] });
    const purchases = db.enqueue("user_achievement_packs", { data: buyer ? [{ pack_id: "halloween" }] : [] });
    expect(await getAchievementPackFilter("user-1")).toBe(
      buyer ? "pack_id.is.null,pack_id.in.(core,halloween)" : "pack_id.is.null,pack_id.in.(core)",
    );
    expect(purchases.eq).toHaveBeenCalledWith("user_id", "user-1");
    // Refunded/revoked rows must not be returned by the database query.
    expect(purchases.eq).toHaveBeenCalledWith("purchase_status", "owned");
  });
  it.each(["core", "ownership"])("fails closed on %s lookup errors", async (failure) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    db.enqueue("achievement_packs", failure === "core" ? { error: { message: "offline" } } : { data: [] });
    db.enqueue("user_achievement_packs", failure === "ownership" ? { error: { message: "offline" } } : { data: [] });
    await expect(getAchievementPackFilter("user-1")).rejects.toThrow();
  });
  it("upserts repeated grants against the same user/pack unique key", async () => {
    for (let i = 0; i < 2; i++) {
      const grant = db.enqueue("user_achievement_packs", { data: { user_id: "user-1", pack_id: "halloween" } });
      await grantAchievementPackToUser({ userId: "user-1", packId: "halloween", stripeCheckoutSessionId: "cs_1" });
      expect(grant.upsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: "user-1", pack_id: "halloween", purchase_status: "owned", stripe_checkout_session_id: "cs_1",
      }), { onConflict: "user_id,pack_id" });
    }
  });
});
