import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  from: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/stripe-server", () => ({
  stripe: {
    subscriptions: {
      retrieve: mocks.retrieve,
      update: mocks.update,
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import { changeSubscriptionPlanAction } from "@/app/actions/subscription-actions";

let db: ReturnType<typeof database>;
const redirectSignal = new Error("Redirect");

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  db = database();
  mocks.from.mockImplementation(db.from);
  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });

  mocks.retrieve.mockResolvedValue({
    id: "sub_123",
    items: { data: [{ id: "si_123" }] },
    metadata: {
      existing_key: "preserved",
      user_id: "old-user",
      billing_interval: "old-interval",
    },
  });
  mocks.update.mockResolvedValue({ id: "sub_123" });
  mocks.redirect.mockImplementation(() => {
    throw redirectSignal;
  });

  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_monthly");
  vi.stubEnv("STRIPE_PRICE_YEARLY", "price_yearly");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function enqueueSubscription(priceId = "price_previous") {
  return db.enqueue("subscriptions", {
    data: {
      provider_subscription_id: "sub_123",
      provider_price_id: priceId,
      status: "active",
    },
  });
}

describe("changeSubscriptionPlanAction", () => {
  it.each([
    { interval: "month" as const, price: "price_monthly" },
    { interval: "year" as const, price: "price_yearly" },
  ])(
    "changes to the $interval plan with prorations",
    async ({ interval, price }) => {
      const query = enqueueSubscription();

      await expect(changeSubscriptionPlanAction(interval)).resolves.toEqual({
        changed: true,
        interval,
      });

      expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(query.maybeSingle).toHaveBeenCalledOnce();
      expect(query.select).toHaveBeenCalledWith(
        expect.stringContaining("provider_subscription_id"),
      );
      expect(mocks.retrieve).toHaveBeenCalledExactlyOnceWith("sub_123");
      expect(mocks.update).toHaveBeenCalledExactlyOnceWith("sub_123", {
        items: [{ id: "si_123", price }],
        metadata: {
          existing_key: "preserved",
          user_id: "user-1",
          billing_interval: interval,
        },
        proration_behavior: "create_prorations",
      });
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );

  it.each([
    { interval: "month" as const, price: "price_monthly" },
    { interval: "year" as const, price: "price_yearly" },
  ])(
    "skips Stripe updates when already on the $interval plan",
    async ({ interval, price }) => {
      enqueueSubscription(price);

      await expect(changeSubscriptionPlanAction(interval)).resolves.toEqual({
        changed: false,
        interval,
      });

      expect(mocks.retrieve).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it("redirects signed-out users before loading a subscription", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    await expect(changeSubscriptionPlanAction("month")).rejects.toBe(
      redirectSignal,
    );

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/login");
    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    { interval: "month" as const, variable: "STRIPE_PRICE_MONTHLY" },
    { interval: "year" as const, variable: "STRIPE_PRICE_YEARLY" },
  ])(
    "rejects missing $interval pricing before querying data",
    async ({ interval, variable }) => {
      vi.stubEnv(variable, undefined);

      await expect(changeSubscriptionPlanAction(interval)).rejects.toThrow(
        `Missing Stripe price for billing interval: ${interval}`,
      );

      expect(db.from).not.toHaveBeenCalled();
      expect(mocks.retrieve).not.toHaveBeenCalled();
      expect(mocks.update).not.toHaveBeenCalled();
    },
  );

  it("reports subscription lookup errors", async () => {
    const error = { message: "Lookup failed" };
    db.enqueue("subscriptions", { error });

    await expect(changeSubscriptionPlanAction("month")).rejects.toThrow(
      "Unable to load subscription.",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error loading subscription",
      error,
    );
    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it.each([
    { label: "missing record", data: null },
    {
      label: "missing subscription ID",
      data: { provider_subscription_id: null },
    },
  ])("rejects a $label", async ({ data }) => {
    db.enqueue("subscriptions", { data });

    await expect(changeSubscriptionPlanAction("month")).rejects.toThrow(
      "No active Stripe subscription found.",
    );

    expect(mocks.retrieve).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects a Stripe subscription without an item", async () => {
    enqueueSubscription();
    mocks.retrieve.mockResolvedValue({
      id: "sub_123",
      items: { data: [] },
      metadata: {},
    });

    await expect(changeSubscriptionPlanAction("month")).rejects.toThrow(
      "Stripe subscription has no subscription item.",
    );

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("propagates authentication failures", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getAuthenticatedUser.mockRejectedValue(error);

    await expect(changeSubscriptionPlanAction("month")).rejects.toBe(error);

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("propagates Stripe retrieval failures without updating", async () => {
    const error = new Error("Stripe retrieval failed");
    enqueueSubscription();
    mocks.retrieve.mockRejectedValue(error);

    await expect(changeSubscriptionPlanAction("month")).rejects.toBe(error);

    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("propagates Stripe update failures", async () => {
    const error = new Error("Stripe update failed");
    enqueueSubscription();
    mocks.update.mockRejectedValue(error);

    await expect(changeSubscriptionPlanAction("month")).rejects.toBe(error);

    expect(mocks.update).toHaveBeenCalledOnce();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
