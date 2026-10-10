import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { database } from "../helpers/database";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  from: vi.fn(),
  createCheckout: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: mocks.from }),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("stripe", () => ({
  default: class Stripe {
    checkout = {
      sessions: { create: mocks.createCheckout },
    };
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

let createPackCheckoutAction: typeof import("@/app/packs/actions").createPackCheckoutAction;
let db: ReturnType<typeof database>;

const redirectSignal = new Error("Redirect");
const now = "2026-10-07T12:00:00.000Z";

const pack = {
  id: "pack-1",
  name: "Unnecessary Achievements",
  slug: "unnecessary",
  stripe_price_id: "price_pack",
  status: "active",
  starts_at: null,
  ends_at: null,
};

function form(packId?: string) {
  const data = new FormData();

  if (packId !== undefined) {
    data.set("packId", packId);
  }

  return data;
}

function enqueueAvailablePack() {
  const query = db.enqueue("achievement_packs", { data: pack });
  const ownership = db.enqueue("user_achievement_packs", { data: null });
  return { query, ownership };
}

beforeEach(async () => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_placeholder");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
  vi.useFakeTimers();
  vi.setSystemTime(new Date(now));

  db = database();
  mocks.from.mockImplementation(db.from);
  mocks.getAuthenticatedUser.mockResolvedValue({
    id: "user-1",
    email: "player@example.com",
  });
  mocks.createCheckout.mockResolvedValue({
    url: "https://checkout.example.com/session",
  });
  mocks.redirect.mockImplementation(() => {
    throw redirectSignal;
  });

  ({ createPackCheckoutAction } = await import("@/app/packs/actions"));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

describe("createPackCheckoutAction", () => {
  it("creates checkout using the trimmed pack ID and redirects", async () => {
    const { query, ownership } = enqueueAvailablePack();

    await expect(createPackCheckoutAction(form("  pack-1  "))).rejects.toBe(
      redirectSignal,
    );

    expect(query.eq).toHaveBeenCalledWith("id", "pack-1");
    expect(query.single).toHaveBeenCalledOnce();

    expect(ownership.select).toHaveBeenCalledWith("id");
    expect(ownership.eq.mock.calls).toEqual([
      ["user_id", "user-1"],
      ["pack_id", "pack-1"],
      ["purchase_status", "owned"],
    ]);
    expect(ownership.maybeSingle).toHaveBeenCalledOnce();

    expect(mocks.createCheckout).toHaveBeenCalledExactlyOnceWith({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: "price_pack", quantity: 1 }],
      customer_email: "player@example.com",
      metadata: {
        userId: "user-1",
        packId: "pack-1",
        packSlug: "unnecessary",
      },
      success_url: "https://example.com/packs/unnecessary?purchase=success",
      cancel_url: "https://example.com/packs?purchase=cancelled",
    });
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "https://checkout.example.com/session",
    );
  });

  it("allows checkout when the user has no email", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({
      id: "user-1",
      email: null,
    });
    enqueueAvailablePack();

    await expect(createPackCheckoutAction(form("pack-1"))).rejects.toBe(
      redirectSignal,
    );

    expect(mocks.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ customer_email: undefined }),
    );
  });

  it("redirects signed-out users before querying packs", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    await expect(createPackCheckoutAction(form("pack-1"))).rejects.toBe(
      redirectSignal,
    );

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/login");
    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it.each([
    { label: "missing", value: undefined },
    { label: "empty", value: "" },
    { label: "whitespace", value: "   " },
  ])("rejects a $label pack ID", async ({ value }) => {
    await expect(createPackCheckoutAction(form(value))).rejects.toThrow(
      "Pack id is required.",
    );

    expect(db.from).not.toHaveBeenCalled();
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it.each([
    { label: "missing pack", result: { data: null } },
    {
      label: "query error",
      result: { error: { message: "Lookup failed" } },
    },
  ])("rejects a $label", async ({ result }) => {
    db.enqueue("achievement_packs", result);

    await expect(createPackCheckoutAction(form("pack-1"))).rejects.toThrow(
      "Achievement pack not found.",
    );

    expect(db.from).toHaveBeenCalledTimes(1);
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "inactive pack",
      changes: { status: "draft" },
      message: "This achievement pack is not currently available.",
    },
    {
      label: "missing price",
      changes: { stripe_price_id: null },
      message: "This achievement pack does not have a Stripe price.",
    },
    {
      label: "future start",
      changes: { starts_at: "2026-10-08T12:00:00.000Z" },
      message: "This achievement pack is not available yet.",
    },
    {
      label: "past end",
      changes: { ends_at: "2026-10-06T12:00:00.000Z" },
      message: "This achievement pack is no longer available.",
    },
  ])(
    "rejects a $label before checking ownership",
    async ({ changes, message }) => {
      db.enqueue("achievement_packs", {
        data: { ...pack, ...changes },
      });

      await expect(createPackCheckoutAction(form("pack-1"))).rejects.toThrow(
        message,
      );

      expect(db.from).toHaveBeenCalledTimes(1);
      expect(mocks.createCheckout).not.toHaveBeenCalled();
    },
  );

  it("allows checkout exactly at the start and end timestamps", async () => {
    db.enqueue("achievement_packs", {
      data: { ...pack, starts_at: now, ends_at: now },
    });
    db.enqueue("user_achievement_packs", { data: null });

    await expect(createPackCheckoutAction(form("pack-1"))).rejects.toBe(
      redirectSignal,
    );

    expect(mocks.createCheckout).toHaveBeenCalledOnce();
  });

  it("redirects owners to the pack without creating checkout", async () => {
    db.enqueue("achievement_packs", { data: pack });
    db.enqueue("user_achievement_packs", {
      data: { id: "ownership-1" },
    });

    await expect(createPackCheckoutAction(form("pack-1"))).rejects.toBe(
      redirectSignal,
    );

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith(
      "/packs/unnecessary",
    );
    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("rejects a missing site URL", async () => {
    enqueueAvailablePack();
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined);

    await expect(createPackCheckoutAction(form("pack-1"))).rejects.toThrow(
      "Missing NEXT_PUBLIC_SITE_URL",
    );

    expect(mocks.createCheckout).not.toHaveBeenCalled();
  });

  it("rejects a checkout response without a URL", async () => {
    enqueueAvailablePack();
    mocks.createCheckout.mockResolvedValue({ url: null });

    await expect(createPackCheckoutAction(form("pack-1"))).rejects.toThrow(
      "Stripe did not return a checkout URL.",
    );

    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates Stripe checkout failures", async () => {
    const error = new Error("Checkout unavailable");
    enqueueAvailablePack();
    mocks.createCheckout.mockRejectedValue(error);

    await expect(createPackCheckoutAction(form("pack-1"))).rejects.toBe(error);

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
