import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

import {
  markStripeSubscriptionCanceled,
  syncStripeSubscription,
} from "@/lib/services/subscription-service-server";

const NOW = "2026-10-07T12:00:00.000Z";
const START = 1_790_000_000;
const END = START + 2_592_000;

let db: ReturnType<typeof database>;

function subscription({
  userId = "user-1",
  expandedCustomer = false,
  emptyItems = false,
  missingPrice = false,
  missingPeriods = false,
  status = "active",
}: {
  userId?: string;
  expandedCustomer?: boolean;
  emptyItems?: boolean;
  missingPrice?: boolean;
  missingPeriods?: boolean;
  status?: Stripe.Subscription.Status;
} = {}): Stripe.Subscription {
  // Partial provider payload: only fields read by this service are needed.
  return {
    id: "sub_1",
    metadata: userId ? { user_id: userId } : {},
    customer: expandedCustomer ? { id: "cus_1" } : "cus_1",
    status,
    cancel_at_period_end: true,
    items: {
      data: emptyItems
        ? []
        : [
            {
              price: missingPrice
                ? null
                : { id: "price_1", recurring: { interval: "month" } },
              current_period_start: missingPeriods ? undefined : START,
              current_period_end: missingPeriods ? undefined : END,
            },
          ],
    },
  } as unknown as Stripe.Subscription;
}

beforeEach(() => {
  db = database();
  mocks.from.mockReset();
  mocks.from.mockImplementation(db.from);
  vi.useFakeTimers();
  vi.setSystemTime(new Date(NOW));
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("syncStripeSubscription", () => {
  it.each([
    { label: "customer ID", expandedCustomer: false },
    { label: "expanded customer", expandedCustomer: true },
  ])(
    "persists subscription details with a $label",
    async ({ expandedCustomer }) => {
      const query = db.enqueue("subscriptions", {});

      await syncStripeSubscription(subscription({ expandedCustomer }));

      expect(query.upsert).toHaveBeenCalledWith(
        {
          user_id: "user-1",
          provider: "stripe",
          provider_customer_id: "cus_1",
          provider_subscription_id: "sub_1",
          provider_price_id: "price_1",
          status: "active",
          billing_interval: "month",
          current_period_start: new Date(START * 1000).toISOString(),
          current_period_end: new Date(END * 1000).toISOString(),
          cancel_at_period_end: true,
          updated_at: NOW,
        },
        { onConflict: "user_id" },
      );
    },
  );

  it("does not write a subscription without user metadata", async () => {
    await expect(
      syncStripeSubscription(subscription({ userId: "" })),
    ).resolves.toBeUndefined();

    expect(db.from).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      "Stripe subscription is missing user_id metadata:",
      "sub_1",
    );
  });

  it.each([
    { label: "empty items", options: { emptyItems: true } },
    { label: "missing price", options: { missingPrice: true } },
  ])("uses null price fields for $label", async ({ options }) => {
    const query = db.enqueue("subscriptions", {});

    await syncStripeSubscription(subscription(options));

    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        provider_price_id: null,
        billing_interval: null,
      }),
      { onConflict: "user_id" },
    );
  });

  it("uses null dates when billing periods are missing", async () => {
    const query = db.enqueue("subscriptions", {});

    await syncStripeSubscription(subscription({ missingPeriods: true }));

    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        current_period_start: null,
        current_period_end: null,
      }),
      { onConflict: "user_id" },
    );
  });

  it.each(["trialing", "past_due", "canceled"] as const)(
    "preserves the provider status %s",
    async (status) => {
      const query = db.enqueue("subscriptions", {});

      await syncStripeSubscription(subscription({ status }));

      expect(query.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ status }),
        { onConflict: "user_id" },
      );
    },
  );

  it("throws and logs a database sync failure", async () => {
    const error = { message: "Write failed" };
    db.enqueue("subscriptions", { error });

    await expect(syncStripeSubscription(subscription())).rejects.toThrow(
      "Unable to sync subscription.",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error syncing Stripe subscription:",
      error,
    );
  });
});

describe("markStripeSubscriptionCanceled", () => {
  it("cancels only the specified provider subscription", async () => {
    const query = db.enqueue("subscriptions", {});

    await markStripeSubscriptionCanceled(subscription());

    expect(query.update).toHaveBeenCalledWith({
      status: "canceled",
      cancel_at_period_end: false,
      current_period_end: new Date(END * 1000).toISOString(),
      updated_at: NOW,
    });
    expect(query.eq).toHaveBeenCalledWith("provider_subscription_id", "sub_1");
    expect(db.from).toHaveBeenCalledTimes(1);
  });

  it.each([
    { label: "missing periods", options: { missingPeriods: true } },
    { label: "empty items", options: { emptyItems: true } },
  ])("handles $label without throwing", async ({ options }) => {
    const query = db.enqueue("subscriptions", {});

    await expect(
      markStripeSubscriptionCanceled(subscription(options)),
    ).resolves.toBeUndefined();

    expect(query.update).toHaveBeenCalledWith({
      status: "canceled",
      cancel_at_period_end: false,
      current_period_end: null,
      updated_at: NOW,
    });
  });

  it("throws and logs a database cancellation failure", async () => {
    const error = { message: "Update failed" };
    db.enqueue("subscriptions", { error });

    await expect(
      markStripeSubscriptionCanceled(subscription()),
    ).rejects.toThrow("Unable to update canceled subscription.");

    expect(console.error).toHaveBeenCalledWith(
      "Error marking Stripe subscription canceled:",
      error,
    );
  });
});
