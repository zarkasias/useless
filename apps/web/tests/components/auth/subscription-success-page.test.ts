// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getEntitlements: vi.fn(),
  redirect: vi.fn(),
  navbar: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getUser,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getProfile,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getEntitlements,
}));

vi.mock("@/components/navbar", () => ({
  Navbar: (props: unknown) => {
    mocks.navbar(props);
    return null;
  },
}));

import SubscriptionSuccessPage from "@/app/subscriptions/success/page";

const profile = { id: "user-1", username: "Alice" };
const entitlements = {
  isSubscribed: true,
  subscriptionStatus: "active",
};

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getEntitlements.mockResolvedValue(entitlements);
  mocks.redirect.mockImplementation(() => {
    throw new Error("TEST_REDIRECT");
  });
});

async function render(): Promise<HTMLDivElement> {
  const element = await SubscriptionSuccessPage();
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("SubscriptionSuccessPage", () => {
  it("loads account details and renders the confirmation", async () => {
    const container = await render();

    expect(container.querySelector("h1")?.textContent).toBe(
      "You're officially Pro.",
    );
    expect(container.textContent).toContain("Unlimited uselessness unlocked");

    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({
      user: profile,
      isSubscribed: true,
      subscriptionStatus: "active",
    });
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("links to the dashboard and collection", async () => {
    const container = await render();

    expect(container.querySelector('a[href="/dashboard"]')?.textContent).toBe(
      "Go to dashboard",
    );
    expect(container.querySelector('a[href="/collection"]')?.textContent).toBe(
      "View my collection",
    );
  });

  it("redirects unauthenticated visitors before requesting account data", async () => {
    mocks.getUser.mockResolvedValue(null);

    await expect(render()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/login");
    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.navbar).not.toHaveBeenCalled();
  });

  it("passes a missing profile through to the navbar", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await render();

    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({
      user: null,
      isSubscribed: true,
      subscriptionStatus: "active",
    });
  });

  it("propagates authentication failures before loading account data", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(render()).rejects.toBe(error);

    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
  });

  it.each(["profile", "entitlements"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      const loader =
        service === "profile" ? mocks.getProfile : mocks.getEntitlements;

      loader.mockRejectedValue(error);

      await expect(render()).rejects.toBe(error);
      expect(mocks.redirect).not.toHaveBeenCalled();
      expect(mocks.navbar).not.toHaveBeenCalled();
    },
  );
});
