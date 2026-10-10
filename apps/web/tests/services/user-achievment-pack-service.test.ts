import { beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => mocks,
}));

import {
  getUserOwnedAchievementPacks,
  grantAchievementPackToUser,
  userOwnsAchievementPack,
  type UserAchievementPack,
} from "@/lib/services/user-achievement-pack-service-server";

const NOW = "2026-10-07T12:00:00.000Z";

let db: ReturnType<typeof database>;

function ownedPack(id: string, packId: string): UserAchievementPack {
  return {
    id,
    user_id: "user-1",
    pack_id: packId,
    purchase_status: "owned",
    purchased_at: NOW,
    stripe_checkout_session_id: null,
    stripe_payment_intent_id: null,
    stripe_customer_id: null,
    created_at: NOW,
    updated_at: NOW,
  };
}

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);

  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("userOwnsAchievementPack", () => {
  it.each([
    { data: { id: "purchase-1" }, expected: true },
    { data: null, expected: false },
  ])(
    "returns $expected for ownership data $data",
    async ({ data, expected }) => {
      const query = db.enqueue("user_achievement_packs", { data });

      await expect(userOwnsAchievementPack("user-1", "pack-1")).resolves.toBe(
        expected,
      );

      expect(query.select).toHaveBeenCalledWith("id");
      expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(query.eq).toHaveBeenCalledWith("pack_id", "pack-1");
      expect(query.eq).toHaveBeenCalledWith("purchase_status", "owned");
      expect(query.maybeSingle).toHaveBeenCalledOnce();
      expect(db.from).toHaveBeenCalledTimes(1);
    },
  );

  it("throws when ownership cannot be verified", async () => {
    const error = { message: "Database unavailable" };

    db.enqueue("user_achievement_packs", {
      data: null,
      error,
    });

    await expect(userOwnsAchievementPack("user-1", "pack-1")).rejects.toThrow(
      "Unable to check achievement pack ownership.",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error checking achievement pack ownership:",
      error,
    );
  });
});

describe("getUserOwnedAchievementPacks", () => {
  it("requests owned purchases for the user, newest first", async () => {
    const packs = [
      ownedPack("purchase-2", "pack-2"),
      ownedPack("purchase-1", "pack-1"),
    ];

    const query = db.enqueue("user_achievement_packs", {
      data: packs,
    });

    await expect(getUserOwnedAchievementPacks("user-1")).resolves.toEqual(
      packs,
    );

    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(query.eq).toHaveBeenCalledWith("purchase_status", "owned");
    expect(query.order).toHaveBeenCalledWith("purchased_at", {
      ascending: false,
    });
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it.each([null, []])("returns an empty list for %j", async (data) => {
    db.enqueue("user_achievement_packs", { data });

    await expect(getUserOwnedAchievementPacks("user-1")).resolves.toEqual([]);
  });

  it("throws rather than presenting a lookup failure as no purchases", async () => {
    const error = { message: "Database unavailable" };

    db.enqueue("user_achievement_packs", { error });

    await expect(getUserOwnedAchievementPacks("user-1")).rejects.toThrow(
      "Unable to load owned achievement packs.",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error loading owned achievement packs:",
      error,
    );
  });
});

describe("grantAchievementPackToUser", () => {
  it("saves payment references and returns the persisted purchase", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));

    const saved: UserAchievementPack = {
      ...ownedPack("purchase-1", "pack-1"),
      stripe_checkout_session_id: "cs_1",
      stripe_payment_intent_id: "pi_1",
      stripe_customer_id: "cus_1",
    };

    const query = db.enqueue("user_achievement_packs", {
      data: saved,
    });

    await expect(
      grantAchievementPackToUser({
        userId: "user-1",
        packId: "pack-1",
        stripeCheckoutSessionId: "cs_1",
        stripePaymentIntentId: "pi_1",
        stripeCustomerId: "cus_1",
      }),
    ).resolves.toEqual(saved);

    expect(query.upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        pack_id: "pack-1",
        purchase_status: "owned",
        purchased_at: NOW,
        updated_at: NOW,
        stripe_checkout_session_id: "cs_1",
        stripe_payment_intent_id: "pi_1",
        stripe_customer_id: "cus_1",
      },
      { onConflict: "user_id,pack_id" },
    );
    expect(query.select).toHaveBeenCalledWith("*");
    expect(query.single).toHaveBeenCalledOnce();
  });

  it("stores omitted payment references as null", async () => {
    const query = db.enqueue("user_achievement_packs", {
      data: ownedPack("purchase-1", "pack-1"),
    });

    await grantAchievementPackToUser({
      userId: "user-1",
      packId: "pack-1",
    });

    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_checkout_session_id: null,
        stripe_payment_intent_id: null,
        stripe_customer_id: null,
      }),
      { onConflict: "user_id,pack_id" },
    );
  });

  it("throws when the grant fails", async () => {
    const error = { message: "Write failed" };

    db.enqueue("user_achievement_packs", { error });

    await expect(
      grantAchievementPackToUser({
        userId: "user-1",
        packId: "pack-1",
      }),
    ).rejects.toThrow("Unable to grant achievement pack.");

    expect(console.error).toHaveBeenCalledWith(
      "Error granting achievement pack:",
      error,
    );
  });
});
