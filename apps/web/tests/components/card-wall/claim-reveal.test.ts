import { describe, expect, it } from "vitest";

import { freeClaimLine } from "@/components/card-wall/claim-reveal";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

function entitlements(
  overrides: Partial<UserEntitlements> = {},
): UserEntitlements {
  return {
    achievementCount: 3,
    freeAchievementLimit: 10,
    remainingFreeAchievements: 7,
    isSubscribed: false,
    subscriptionStatus: null,
    billingInterval: null,
    hasReachedFreeLimit: false,
    canClaimAchievement: true,
    ...overrides,
  };
}

describe("freeClaimLine", () => {
  it("shows a signed-in free user their real count", () => {
    expect(
      freeClaimLine({
        signedIn: true,
        entitlements: entitlements({ remainingFreeAchievements: 9 }),
        includesThisClaim: true,
      }),
    ).toBe("1 of 10 free. Come back tomorrow for the next one.");
  });

  it("counts a claim made just now before the page's entitlements catch up", () => {
    expect(
      freeClaimLine({
        signedIn: true,
        entitlements: entitlements({ remainingFreeAchievements: 10 }),
        includesThisClaim: false,
      }),
    ).toBe("1 of 10 free. Come back tomorrow for the next one.");
  });

  it("never counts past the limit", () => {
    expect(
      freeClaimLine({
        signedIn: true,
        entitlements: entitlements({ remainingFreeAchievements: 0 }),
        includesThisClaim: false,
      }),
    ).toBe("10 of 10 free. Come back tomorrow for the next one.");
  });

  it("shows Pro users no count", () => {
    expect(
      freeClaimLine({
        signedIn: true,
        entitlements: entitlements({ isSubscribed: true }),
        includesThisClaim: true,
      }),
    ).toBe("Come back tomorrow for the next one.");
  });

  it("gives logged-out visitors the general rule", () => {
    expect(
      freeClaimLine({
        signedIn: false,
        entitlements: null,
        includesThisClaim: true,
      }),
    ).toBe("Your first 10 are free. Come back tomorrow for the next one.");
  });
});
