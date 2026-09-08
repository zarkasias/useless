import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ constructEvent: vi.fn(), grant: vi.fn(), sync: vi.fn(), cancel: vi.fn() }));
vi.mock("@/lib/stripe-server", () => ({ stripe: { webhooks: { constructEvent: mocks.constructEvent } } }));
vi.mock("@/lib/services/user-achievement-pack-service-server", () => ({ grantAchievementPackToUser: mocks.grant }));
vi.mock("@/lib/services/subscription-service-server", () => ({ syncStripeSubscription: mocks.sync, markStripeSubscriptionCanceled: mocks.cancel }));
import { POST } from "@/app/api/stripe/webhook/route";
const paid = { id: "cs_1", mode: "payment", payment_status: "paid", metadata: { userId: "user-1", packId: "pack-1" }, payment_intent: "pi_1", customer: "cus_1" };
function request(signature = true) {
  return new Request("https://example.test/api/stripe/webhook", { method: "POST", body: "raw-event", headers: signature ? { "stripe-signature": "signature" } : {} });
}
beforeEach(() => {
  mocks.constructEvent.mockReturnValue({ type: "checkout.session.completed", data: { object: paid } });
  mocks.grant.mockResolvedValue({});
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});
it("requires a signature", async () => {
  expect((await POST(request(false))).status).toBe(400);
  expect(mocks.constructEvent).not.toHaveBeenCalled();
  expect(mocks.grant).not.toHaveBeenCalled();
});
it("rejects an invalid signature", async () => {
  mocks.constructEvent.mockImplementation(() => { throw new Error("invalid"); });
  expect((await POST(request())).status).toBe(400);
  expect(mocks.grant).not.toHaveBeenCalled();
});
it.each([
  { payment_status: "unpaid" }, { mode: "subscription" }, { metadata: {} },
  { metadata: { userId: "user-1" } }, { metadata: { packId: "pack-1" } },
])("does not grant ineligible checkout %j", async (override) => {
  mocks.constructEvent.mockReturnValue({ type: "checkout.session.completed", data: { object: { ...paid, ...override } } });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.grant).not.toHaveBeenCalled();
});
it.each([false, true])("grants a paid pack with expanded Stripe objects=%s", async (expanded) => {
  mocks.constructEvent.mockReturnValue({ type: "checkout.session.completed", data: { object: { ...paid, ...(expanded ? { payment_intent: { id: "pi_1" }, customer: { id: "cus_1" } } : {}) } } });
  expect((await POST(request())).status).toBe(200);
  expect(mocks.constructEvent).toHaveBeenCalledWith("raw-event", "signature", "test-webhook-secret");
  expect(mocks.grant).toHaveBeenCalledWith({ userId: "user-1", packId: "pack-1", stripeCheckoutSessionId: "cs_1", stripePaymentIntentId: "pi_1", stripeCustomerId: "cus_1" });
});
it("propagates persistence failures so Stripe can retry", async () => {
  mocks.grant.mockRejectedValue(new Error("database unavailable"));
  await expect(POST(request())).rejects.toThrow("database unavailable");
});
it.each(["customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted"])("routes %s without granting packs", async (type) => {
  const subscription = { id: "sub_1" };
  mocks.constructEvent.mockReturnValue({ type, data: { object: subscription } });
  expect((await POST(request())).status).toBe(200);
  expect(type.endsWith("deleted") ? mocks.cancel : mocks.sync).toHaveBeenCalledWith(subscription);
  expect(mocks.grant).not.toHaveBeenCalled();
});
