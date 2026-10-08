// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  createCustomerPortalAction: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/app/actions/subscription-actions", () => ({
  createCustomerPortalAction: mocks.createCustomerPortalAction,
}));

import Subscription from "@/components/settings/subscription-section";

let container: HTMLDivElement;
let root: Root;

const freeEntitlements: UserEntitlements = {
  achievementCount: 3,
  freeAchievementLimit: 10,
  remainingFreeAchievements: 7,
  isSubscribed: false,
  subscriptionStatus: null,
  billingInterval: null,
  hasReachedFreeLimit: false,
  canClaimAchievement: true,
};

beforeEach(() => {
  mocks.push.mockReset();
  mocks.createCustomerPortalAction.mockReset();

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.unstubAllGlobals();
});

async function render(overrides: Partial<UserEntitlements> = {}) {
  await act(async () => {
    root.render(
      createElement(Subscription, {
        initialEntitlements: {
          ...freeEntitlements,
          ...overrides,
        },
      }),
    );
  });
}

function button() {
  const element = container.querySelector("button");

  if (!element) {
    throw new Error("Expected a subscription action button");
  }

  return element;
}

describe("Subscription settings", () => {
  it("shows the free plan and navigates to Pro when Subscribe is clicked", async () => {
    await render();

    expect(container.textContent).toContain("Free plan");
    expect(container.textContent).toContain(
      "You are currently using the free plan.",
    );
    expect(button().textContent).toBe("Subscribe");

    await act(async () => {
      button().click();
    });

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/pro");
    expect(mocks.createCustomerPortalAction).not.toHaveBeenCalled();
    expect(button().disabled).toBe(false);
  });

  it("shows the active Pro subscription", async () => {
    await render({
      isSubscribed: true,
      subscriptionStatus: "active",
    });

    expect(container.textContent).toContain("Pro plan");
    expect(container.textContent).toContain("Your subscription is active.");
    expect(button().textContent).toBe("Manage subscription");
  });

  it("shows billing guidance for a past-due subscription", async () => {
    await render({
      isSubscribed: true,
      subscriptionStatus: "past_due",
    });

    expect(container.textContent).toContain(
      "Your subscription has a billing issue.",
    );
    expect(button().textContent).toBe("Manage billing");
  });

  it("opens the customer portal and disables repeat clicks while pending", async () => {
    let finish!: () => void;

    mocks.createCustomerPortalAction.mockReturnValue(
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
    );

    await render({
      isSubscribed: true,
      subscriptionStatus: "active",
    });

    await act(async () => {
      button().click();
    });

    expect(mocks.createCustomerPortalAction).toHaveBeenCalledExactlyOnceWith(
      "/profile",
    );
    expect(button().disabled).toBe(true);
    expect(mocks.push).not.toHaveBeenCalled();

    await act(async () => {
      button().click();
    });

    expect(mocks.createCustomerPortalAction).toHaveBeenCalledOnce();

    await act(async () => {
      finish();
    });
  });

  it("logs portal failures and enables the button for another attempt", async () => {
    const error = new Error("Portal unavailable");
    mocks.createCustomerPortalAction.mockRejectedValue(error);

    await render({
      isSubscribed: true,
      subscriptionStatus: "active",
    });

    await act(async () => {
      button().click();
    });

    expect(console.error).toHaveBeenCalledWith(
      "Unable to open subscription management:",
      error,
    );
    expect(button().disabled).toBe(false);

    await act(async () => {
      button().click();
    });

    expect(mocks.createCustomerPortalAction).toHaveBeenCalledTimes(2);
  });
});
