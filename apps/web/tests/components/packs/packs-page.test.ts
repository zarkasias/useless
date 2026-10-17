// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getPacks: vi.fn(),
  getEntitlements: vi.fn(),
  navbar: vi.fn(),
  packCard: vi.fn(),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getUser,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  getAuthenticatedUserProfile: mocks.getProfile,
}));

vi.mock("@/lib/services/pack-store-service-server", () => ({
  getStoreAchievementPacks: mocks.getPacks,
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

vi.mock("@/components/packs/achievement-pack-card", () => ({
  AchievementPackCard: (props: unknown) => {
    mocks.packCard(props);
    return null;
  },
}));

import PacksPage from "@/app/packs/page";

const profile = { id: "user-1", username: "Alice" };
const entitlements = {
  isSubscribed: true,
  subscriptionStatus: "active",
};
const packs = [{ id: "pack-1" }, { id: "pack-2" }];

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({ id: "user-1" });
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getPacks.mockResolvedValue(packs);
  mocks.getEntitlements.mockResolvedValue(entitlements);
});

async function render(): Promise<HTMLDivElement> {
  const element = await PacksPage();
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("PacksPage", () => {
  it("loads store data and renders the heading", async () => {
    const container = await render();

    expect(container.querySelector("h1")?.textContent).toBe(
      "More useless things to collect.",
    );
    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getPacks).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
  });

  it("passes each pack to its card", async () => {
    const container = await render();

    expect(mocks.packCard.mock.calls.map(([props]) => props)).toEqual([
      { pack: packs[0] },
      { pack: packs[1] },
    ]);
    expect(container.textContent).not.toContain("No achievement packs yet.");
  });

  it("passes account subscription details to the navbar", async () => {
    await render();

    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({
      user: profile,
      isSubscribed: true,
      subscriptionStatus: "active",
    });
  });

  it("renders an empty state when no packs are available", async () => {
    mocks.getPacks.mockResolvedValue([]);

    const container = await render();

    expect(container.textContent).toContain("No achievement packs yet.");
    expect(container.textContent).toContain(
      "New packs will appear here when they become available.",
    );
    expect(mocks.packCard).not.toHaveBeenCalled();
  });

  it("supports guests without requesting entitlements", async () => {
    mocks.getUser.mockResolvedValue(null);
    mocks.getProfile.mockResolvedValue(null);

    await render();

    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.navbar).not.toHaveBeenCalled();
    expect(mocks.packCard).toHaveBeenCalledTimes(2);
  });

  it("omits the navbar when the profile is missing", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await render();

    expect(mocks.navbar).not.toHaveBeenCalled();
    expect(mocks.packCard).toHaveBeenCalledTimes(2);
  });

  it("omits the navbar when entitlements are missing", async () => {
    mocks.getEntitlements.mockResolvedValue(null);

    await render();

    expect(mocks.navbar).not.toHaveBeenCalled();
  });

  it("preserves unsubscribed account details in the navbar", async () => {
    mocks.getEntitlements.mockResolvedValue({
      isSubscribed: false,
      subscriptionStatus: "canceled",
    });

    await render();

    expect(mocks.navbar).toHaveBeenCalledExactlyOnceWith({
      user: profile,
      isSubscribed: false,
      subscriptionStatus: "canceled",
    });
  });

  it("propagates pack-loading failures", async () => {
    const error = new Error("Store unavailable");
    mocks.getPacks.mockRejectedValue(error);

    await expect(PacksPage()).rejects.toBe(error);
    expect(mocks.packCard).not.toHaveBeenCalled();
  });
});
