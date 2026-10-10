// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  checkout: vi.fn(),
  changePlan: vi.fn(),
  navbar: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
}));

vi.mock("@/app/actions/subscription-actions", () => ({
  createSubscriptionCheckoutAction: mocks.checkout,
  changeSubscriptionPlanAction: mocks.changePlan,
}));

vi.mock("@/components/navbar", () => ({
  Navbar: (props: unknown) => {
    mocks.navbar(props);
    return null;
  },
}));

import ProClient from "@/app/pro/pro-client";

type Props = Parameters<typeof ProClient>[0];
type Entitlements = NonNullable<Props["initialEntitlements"]>;

const profile: NonNullable<Props["initialProfile"]> = {
  id: "user-1",
  username: "Alice",
  role: "user",
  created_at: "2026-10-08T12:00:00.000Z",
  streak_count: 3,
};

const free: Entitlements = {
  achievementCount: 5,
  freeAchievementLimit: 10,
  remainingFreeAchievements: 5,
  isSubscribed: false,
  subscriptionStatus: null,
  billingInterval: null,
  hasReachedFreeLimit: false,
  canClaimAchievement: true,
};

const subscribed: Entitlements = {
  ...free,
  isSubscribed: true,
  subscriptionStatus: "active",
  billingInterval: "month",
};

let container: HTMLDivElement | undefined;
let root: Root | undefined;
let originalUrl: string;

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }
  mocks.checkout.mockResolvedValue(undefined);
  mocks.changePlan.mockResolvedValue({ changed: true, interval: "year" });

  originalUrl = window.location.href;
  window.history.replaceState({}, "", "/pro");
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  try {
    await act(async () => {
      root?.unmount();
    });
  } finally {
    container?.remove();
    container = undefined;
    root = undefined;
    window.history.replaceState({}, "", originalUrl);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  }
});

async function render(overrides: Partial<Props> = {}) {
  const activeRoot = root;
  if (!activeRoot) throw new Error("Missing test root");

  await act(async () => {
    activeRoot.render(
      createElement(ProClient, {
        initialProfile: profile,
        initialEntitlements: free,
        ...overrides,
      }),
    );
  });
}

function button(label: string): HTMLButtonElement {
  const result = Array.from(container?.querySelectorAll("button") ?? []).find(
    (element) => element.textContent?.trim() === label,
  );

  if (!result) throw new Error(`Missing button: ${label}`);
  return result;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

describe("ProClient", () => {
  it("defaults to annual billing and changes pricing without starting checkout", async () => {
    await render();

    expect(container?.textContent).toContain("$24.99");
    expect(container?.textContent).toContain("About $2.08/month");
    expect(button("Subscribe Annually").disabled).toBe(false);

    await click("Monthly");

    expect(container?.textContent).toContain("$2.99");
    expect(container?.textContent).not.toContain("About $2.08/month");
    expect(button("Subscribe Monthly").disabled).toBe(false);
    expect(mocks.checkout).not.toHaveBeenCalled();
    expect(mocks.changePlan).not.toHaveBeenCalled();

    await click("AnnualSave 30%");

    expect(button("Subscribe Annually").disabled).toBe(false);
  });

  it("preserves a guest's selected plan through signup", async () => {
    await render({ initialProfile: null, initialEntitlements: null });
    await click("Monthly");
    await click("Create account to subscribe");

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith(
      "/signup?next=/pro&plan=month",
    );
    expect(mocks.checkout).not.toHaveBeenCalled();
    expect(mocks.changePlan).not.toHaveBeenCalled();
  });

  it("provides guest signup and login navigation", async () => {
    await render({ initialProfile: null, initialEntitlements: null });

    await click("Start free");
    expect(mocks.push).toHaveBeenLastCalledWith("/signup");

    await click("Log in");
    expect(mocks.push).toHaveBeenLastCalledWith("/login?next=/pro");
  });

  it("starts checkout for the explicitly selected plan", async () => {
    await render();
    await click("Monthly");
    await click("Subscribe Monthly");

    expect(mocks.checkout).toHaveBeenCalledExactlyOnceWith("month");
    expect(mocks.changePlan).not.toHaveBeenCalled();
    expect(button("Opening checkout...").disabled).toBe(true);
  });

  it("allows retrying after checkout fails", async () => {
    const error = new Error("Checkout unavailable");
    mocks.checkout.mockRejectedValueOnce(error);

    await render();
    await click("Subscribe Annually");

    expect(button("Subscribe Annually").disabled).toBe(false);
    expect(console.error).toHaveBeenCalledWith(
      "Unable to update subscription:",
      error,
    );
  });

  it("changes an existing subscription only after an explicit click", async () => {
    await render({ initialEntitlements: subscribed });

    expect(button("Current plan").disabled).toBe(true);
    await click("AnnualSave 30%");

    expect(mocks.changePlan).not.toHaveBeenCalled();
    expect(button("Switch to Annual").disabled).toBe(false);

    await click("Switch to Annual");

    expect(mocks.changePlan).toHaveBeenCalledExactlyOnceWith("year");
    expect(mocks.checkout).not.toHaveBeenCalled();
    expect(mocks.refresh).toHaveBeenCalledExactlyOnceWith();
    expect(button("Current plan").disabled).toBe(true);
  });

  it("keeps the original plan when the action reports no change", async () => {
    mocks.changePlan.mockResolvedValue({ changed: false, interval: "month" });

    await render({ initialEntitlements: subscribed });
    await click("AnnualSave 30%");
    await click("Switch to Annual");

    expect(button("Switch to Annual").disabled).toBe(false);
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });

  it("allows retrying after a plan change fails", async () => {
    mocks.changePlan.mockRejectedValue(new Error("Plan update failed"));

    await render({ initialEntitlements: subscribed });
    await click("AnnualSave 30%");
    await click("Switch to Annual");

    expect(button("Switch to Annual").disabled).toBe(false);
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("shows the past-due payment notice and navbar status", async () => {
    await render({
      initialEntitlements: {
        ...subscribed,
        subscriptionStatus: "past_due",
      },
    });

    expect(container?.textContent).toContain(
      "There's a problem with your payment",
    );
    expect(mocks.navbar).toHaveBeenLastCalledWith({
      user: profile,
      isSubscribed: true,
      subscriptionStatus: "past_due",
    });
  });

  it("continues checkout from the URL and removes the automatic checkout flag", async () => {
    window.history.replaceState({}, "", "/pro?plan=month&checkout=1");

    await render();

    expect(mocks.checkout).toHaveBeenCalledExactlyOnceWith("month");
    expect(window.location.search).toBe("?plan=month");
    expect(button("Opening checkout...").disabled).toBe(true);
  });

  it("allows retrying when automatic checkout fails", async () => {
    mocks.checkout.mockRejectedValue(new Error("Checkout failed"));
    window.history.replaceState({}, "", "/pro?plan=year&checkout=1");

    await render();

    expect(button("Subscribe Annually").disabled).toBe(false);
    expect(window.location.search).toBe("?plan=year");
    expect(console.error).toHaveBeenCalled();
  });

  it.each(["/pro?plan=invalid&checkout=1", "/pro?plan=month"])(
    "does not automatically check out for %s",
    async (url) => {
      window.history.replaceState({}, "", url);

      await render();

      expect(mocks.checkout).not.toHaveBeenCalled();
    },
  );

  it("does not automatically check out an existing subscriber", async () => {
    window.history.replaceState({}, "", "/pro?plan=year&checkout=1");

    await render({ initialEntitlements: subscribed });

    expect(mocks.checkout).not.toHaveBeenCalled();
    expect(mocks.changePlan).not.toHaveBeenCalled();
  });
});
