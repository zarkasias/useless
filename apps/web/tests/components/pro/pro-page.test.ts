import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  getProfile: vi.fn(),
  getEntitlements: vi.fn(),
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

vi.mock("@/app/pro/pro-client", () => ({
  default: () => null,
}));

import ProPage, { metadata } from "@/app/pro/page";
import ProClient from "@/app/pro/pro-client";

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
});

describe("ProPage", () => {
  it("passes the authenticated profile and entitlements to ProClient", async () => {
    const element = await ProPage();

    expect(element.type).toBe(ProClient);
    expect(element.props).toEqual({
      initialProfile: profile,
      initialEntitlements: entitlements,
    });

    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
  });

  it("supports guests without requesting account data", async () => {
    mocks.getUser.mockResolvedValue(null);

    const element = await ProPage();

    expect(element.props).toEqual({
      initialProfile: null,
      initialEntitlements: null,
    });
    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
  });

  it("passes unsubscribed entitlements through to the client", async () => {
    const unsubscribed = {
      isSubscribed: false,
      subscriptionStatus: null,
    };
    mocks.getEntitlements.mockResolvedValue(unsubscribed);

    const element = await ProPage();

    expect(element.props.initialEntitlements).toBe(unsubscribed);
  });

  it("preserves a missing profile for an authenticated user", async () => {
    mocks.getProfile.mockResolvedValue(null);

    const element = await ProPage();

    expect(element.props.initialProfile).toBeNull();
    expect(element.props.initialEntitlements).toBe(entitlements);
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
  });

  it("exports the Pro page metadata", () => {
    expect(metadata.title).toBe("Pro");
    expect(metadata.description).toBe(
      "Upgrade to Useless Achievements Pro for unlimited achievements, streaks, full collection access, and leaderboard participation.",
    );
  });

  it("propagates authentication failures before loading account data", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(ProPage()).rejects.toBe(error);

    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
  });

  it("propagates profile-loading failures before requesting entitlements", async () => {
    const error = new Error("Profile unavailable");
    mocks.getProfile.mockRejectedValue(error);

    await expect(ProPage()).rejects.toBe(error);

    expect(mocks.getEntitlements).not.toHaveBeenCalled();
  });

  it("propagates entitlement-loading failures", async () => {
    const error = new Error("Entitlements unavailable");
    mocks.getEntitlements.mockRejectedValue(error);

    await expect(ProPage()).rejects.toBe(error);
  });
});
