import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getEntitlements: vi.fn(),
  redirect: vi.fn(),
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

vi.mock("@/app/games/games-client", () => ({
  default: () => null,
}));

import GamesPage from "@/app/games/page";
import GamesClient from "@/app/games/games-client";

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

describe("GamesPage", () => {
  it("passes the authenticated profile and entitlements to GamesClient", async () => {
    const element = await GamesPage();

    expect(element.type).toBe(GamesClient);
    expect(element.props).toEqual({
      initialProfile: profile,
      initialEntitlements: entitlements,
    });

    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated visitors before loading account data", async () => {
    mocks.getUser.mockResolvedValue(null);

    await expect(GamesPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
  });

  it("redirects when the authenticated user has no profile", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await expect(GamesPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("passes unsubscribed entitlements through to the client", async () => {
    const unsubscribed = {
      isSubscribed: false,
      subscriptionStatus: null,
    };
    mocks.getEntitlements.mockResolvedValue(unsubscribed);

    const element = await GamesPage();

    expect(element.props.initialEntitlements).toBe(unsubscribed);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates authentication failures before loading account data", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(GamesPage()).rejects.toBe(error);

    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it.each(["profile", "entitlements"])(
    "propagates a failed %s request",
    async (service) => {
      const error = new Error(`${service} unavailable`);
      const loader =
        service === "profile" ? mocks.getProfile : mocks.getEntitlements;

      loader.mockRejectedValue(error);

      await expect(GamesPage()).rejects.toBe(error);
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
});
