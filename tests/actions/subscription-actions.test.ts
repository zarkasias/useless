import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  from: vi.fn(),
  createCheckout: vi.fn(),
  createPortal: vi.fn(),
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
    checkout: { sessions: { create: mocks.createCheckout } },
    billingPortal: { sessions: { create: mocks.createPortal } },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

import {
  createCustomerPortalAction,
  createSubscriptionCheckoutAction,
} from "@/app/actions/subscription-actions";

let db: ReturnType<typeof database>;
const redirectSignal = new Error("Redirect");

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  db = database();
  mocks.from.mockImplementation(db.from);
  mocks.getAuthenticatedUser.mockResolvedValue({
    id: "user-1",
    email: "player@example.com",
  });
  mocks.createCheckout.mockResolvedValue({
    url: "https://checkout.example.com/session",
  });
  mocks.createPortal.mockResolvedValue({
    url: "https://billing.example.com/session",
  });
  mocks.redirect.mockImplementation(() => {
    throw redirectSignal;
  });

  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_monthly");
  vi.stubEnv("STRIPE_PRICE_YEARLY", "price_yearly");

  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("createSubscriptionCheckoutAction", () => {
  it.each([
    { interval: "month" as const, price: "price_monthly" },
    { interval: "year" as const, price: "price_yearly" },
  ])(
    "creates a $interval checkout and redirects",
    async ({ interval, price }) => {
      await expect(createSubscriptionCheckoutAction(interval)).rejects.toBe(
        redirectSignal,
      );

      expect(mocks.createCheckout).toHaveBeenCalledExactlyOnceWith({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price, quantity: 1 }],
        customer_email: "player@example.com",
        metadata: {
          user_id: "user-1",
          billing_interval: interval,
        },
        subscription_data: {
          metadata: {
            user_id: "user-1",
            billing_interval: interval,
          },
        },
        success_url: "https://example.com/subscriptions/success",
        cancel_url: "https://example.com/pro?checkout=cancelled",
      });
      expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
        "https://checkout.example.com/session",
      );
    },
  );

  it.each([
    { interval: "month" as const, variable: "STRIPE_PRICE_MONTHLY" },
    { interval: "year" as const, variable: "STRIPE_PRICE_YEARLY" },
  ])("rejects a missing $interval price", async ({ interval, variable }) => {
    vi.stubEnv(variable, undefined);

    await expect(createSubscriptionCheckoutAction(interval)).rejects.toThrow(
      `Missing Stripe price for billing interval: ${interval}`,
    );

    expect(mocks.createCheckout).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects a checkout response without a URL", async () => {
    mocks.createCheckout.mockResolvedValue({ url: null });

    await expect(createSubscriptionCheckoutAction("month")).rejects.toThrow(
      "Stripe checkout did not return a checkout URL",
    );

    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates Stripe checkout failures", async () => {
    const error = new Error("Stripe unavailable");
    mocks.createCheckout.mockRejectedValue(error);

    await expect(createSubscriptionCheckoutAction("month")).rejects.toBe(error);

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("createCustomerPortalAction", () => {
  it.each([
    {
      returnPath: undefined,
      expectedUrl: "https://example.com/pro",
    },
    {
      returnPath: "/profile",
      expectedUrl: "https://example.com/profile",
    },
  ])(
    "creates a portal returning to $expectedUrl",
    async ({ returnPath, expectedUrl }) => {
      const query = db.enqueue("subscriptions", {
        data: { provider_customer_id: "cus_123" },
      });

      await expect(createCustomerPortalAction(returnPath)).rejects.toBe(
        redirectSignal,
      );

      expect(query.select).toHaveBeenCalledWith("provider_customer_id");
      expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
      expect(query.maybeSingle).toHaveBeenCalledOnce();
      expect(mocks.createPortal).toHaveBeenCalledExactlyOnceWith({
        customer: "cus_123",
        return_url: expectedUrl,
      });
      expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
        "https://billing.example.com/session",
      );
    },
  );

  it("reports a subscription lookup error without creating a portal", async () => {
    const error = { message: "Lookup failed" };
    db.enqueue("subscriptions", { error });

    await expect(createCustomerPortalAction()).rejects.toThrow(
      "Unable to load subscription",
    );

    expect(console.error).toHaveBeenCalledWith(
      "Error loading subscription customer:",
      error,
    );
    expect(mocks.createPortal).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each([
    { label: "missing subscription", data: null },
    {
      label: "missing customer ID",
      data: { provider_customer_id: null },
    },
  ])("rejects a $label", async ({ data }) => {
    db.enqueue("subscriptions", { data });

    await expect(createCustomerPortalAction()).rejects.toThrow(
      "No Stripe customer found for this account.",
    );

    expect(mocks.createPortal).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates Stripe portal failures", async () => {
    const error = new Error("Portal unavailable");
    db.enqueue("subscriptions", {
      data: { provider_customer_id: "cus_123" },
    });
    mocks.createPortal.mockRejectedValue(error);

    await expect(createCustomerPortalAction()).rejects.toBe(error);

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe.each([
  {
    name: "checkout",
    run: () => createSubscriptionCheckoutAction("month"),
  },
  {
    name: "customer portal",
    run: () => createCustomerPortalAction(),
  },
])("$name authentication", ({ run }) => {
  it("redirects signed-out users to login before contacting services", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    await expect(run()).rejects.toBe(redirectSignal);

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/login");
    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.createCheckout).not.toHaveBeenCalled();
    expect(mocks.createPortal).not.toHaveBeenCalled();
  });

  it("propagates authentication failures", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getAuthenticatedUser.mockRejectedValue(error);

    await expect(run()).rejects.toBe(error);

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.createCheckout).not.toHaveBeenCalled();
    expect(mocks.createPortal).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
