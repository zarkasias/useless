import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  getUserEntitlements: vi.fn(),
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/services/entitlement-service-server", () => ({
  getUserEntitlements: mocks.getUserEntitlements,
}));

import { getCurrentUserEntitlementsAction } from "@/app/actions/entitlement-actions";

beforeEach(() => {
  mocks.getAuthenticatedUser.mockReset();
  mocks.getUserEntitlements.mockReset();

  mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
});

describe("getCurrentUserEntitlementsAction", () => {
  it("returns the authenticated user's entitlements", async () => {
    const entitlements = {
      achievementCount: 3,
      freeAchievementLimit: 10,
      remainingFreeAchievements: 7,
      isSubscribed: false,
      subscriptionStatus: null,
      billingInterval: null,
      hasReachedFreeLimit: false,
      canClaimAchievement: true,
    };
    mocks.getUserEntitlements.mockResolvedValue(entitlements);

    await expect(getCurrentUserEntitlementsAction()).resolves.toBe(
      entitlements,
    );

    expect(mocks.getAuthenticatedUser).toHaveBeenCalledOnce();
    expect(mocks.getUserEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
  });

  it("returns null for a signed-out user without requesting entitlements", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    await expect(getCurrentUserEntitlementsAction()).resolves.toBeNull();

    expect(mocks.getUserEntitlements).not.toHaveBeenCalled();
  });

  it("propagates authentication failures", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getAuthenticatedUser.mockRejectedValue(error);

    await expect(getCurrentUserEntitlementsAction()).rejects.toBe(error);

    expect(mocks.getUserEntitlements).not.toHaveBeenCalled();
  });

  it("propagates entitlement service failures", async () => {
    const error = new Error("Entitlements unavailable");
    mocks.getUserEntitlements.mockRejectedValue(error);

    await expect(getCurrentUserEntitlementsAction()).rejects.toBe(error);

    expect(mocks.getUserEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
  });
});
