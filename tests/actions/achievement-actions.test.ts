import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookies: vi.fn(),
  getCookie: vi.fn(),
  setCookie: vi.fn(),
  getAuthenticatedUser: vi.fn(),
  claimAuthenticated: vi.fn(),
  claimAnonymous: vi.fn(),
  merge: vi.fn(),
  getStreak: vi.fn(),
  createAnonymousUser: vi.fn(),
  updateTimezone: vi.fn(),
  linkUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mocks.cookies,
}));

vi.mock("@/lib/services/utils/achievement-utils", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock("@/lib/services/achievement-service-server", () => ({
  claimDailyAchievementForAuthenticatedUser: mocks.claimAuthenticated,
  claimDailyAchievementForAnonymousUser: mocks.claimAnonymous,
  mergeAnonymousAchievementsIntoCurrentUser: mocks.merge,
}));

vi.mock("@/lib/services/streak-service-server", () => ({
  getAuthenticatedUserStreakData: mocks.getStreak,
}));

vi.mock("@/lib/anonymous-user", () => ({
  createAnonymousUser: mocks.createAnonymousUser,
  updateAnonymousUserTimezone: mocks.updateTimezone,
  linkAnonymousUserToAuthenticatedUser: mocks.linkUser,
}));

import {
  claimDailyAchievementAction,
  getStreakDataAction,
  migrateAnonymousAchievementsAction,
} from "@/app/actions/achievement-actions";

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.cookies.mockResolvedValue({
    get: mocks.getCookie,
    set: mocks.setCookie,
  });
  mocks.getCookie.mockReturnValue({ value: "anonymous-existing" });
  mocks.getAuthenticatedUser.mockResolvedValue(null);
  mocks.createAnonymousUser.mockResolvedValue({
    anonymous_id: "anonymous-new",
  });
  mocks.updateTimezone.mockResolvedValue(true);
  mocks.linkUser.mockResolvedValue(undefined);
});

function expectAnonymousCookie() {
  expect(mocks.setCookie).toHaveBeenCalledExactlyOnceWith({
    name: "anonymous_user_id",
    value: "anonymous-new",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

describe("claimDailyAchievementAction: authenticated user", () => {
  beforeEach(() => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
  });

  it("returns a successful claim and links the existing anonymous ID", async () => {
    const result = {
      status: "claimed",
      achievement: { id: "achievement-1" },
      triggeredAchievements: [],
    };
    mocks.claimAuthenticated.mockResolvedValue(result);

    await expect(claimDailyAchievementAction()).resolves.toBe(result);

    expect(mocks.claimAuthenticated).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getCookie).toHaveBeenCalledWith("anonymous_user_id");
    expect(mocks.linkUser).toHaveBeenCalledExactlyOnceWith(
      "anonymous-existing",
      "user-1",
    );
    expect(mocks.createAnonymousUser).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
    expect(mocks.claimAnonymous).not.toHaveBeenCalled();
  });

  it("creates an anonymous cookie and links it after a successful claim", async () => {
    mocks.getCookie.mockReturnValue(undefined);
    mocks.claimAuthenticated.mockResolvedValue({
      status: "claimed",
      achievement: { id: "achievement-1" },
      triggeredAchievements: [],
    });

    await claimDailyAchievementAction();

    expect(mocks.createAnonymousUser).toHaveBeenCalledOnce();
    expectAnonymousCookie();
    expect(mocks.linkUser).toHaveBeenCalledExactlyOnceWith(
      "anonymous-new",
      "user-1",
    );
  });

  it("returns an unsuccessful claim without creating or linking an anonymous user", async () => {
    const result = { status: "already_claimed", achievement: null };
    mocks.claimAuthenticated.mockResolvedValue(result);

    await expect(claimDailyAchievementAction()).resolves.toBe(result);

    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.createAnonymousUser).not.toHaveBeenCalled();
    expect(mocks.linkUser).not.toHaveBeenCalled();
  });

  it("propagates claim failures without linking an anonymous user", async () => {
    const error = new Error("Claim unavailable");
    mocks.claimAuthenticated.mockRejectedValue(error);

    await expect(claimDailyAchievementAction()).rejects.toBe(error);

    expect(mocks.linkUser).not.toHaveBeenCalled();
    expect(mocks.cookies).not.toHaveBeenCalled();
  });
});

describe("claimDailyAchievementAction: anonymous user", () => {
  it("claims using the existing anonymous cookie", async () => {
    const achievement = { id: "achievement-1" };
    mocks.claimAnonymous.mockResolvedValue(achievement);

    await expect(claimDailyAchievementAction()).resolves.toEqual({
      status: "claimed",
      achievement,
      triggeredAchievements: [],
    });

    expect(mocks.claimAnonymous).toHaveBeenCalledExactlyOnceWith(
      "anonymous-existing",
    );
    expect(mocks.createAnonymousUser).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
    expect(mocks.claimAuthenticated).not.toHaveBeenCalled();
    expect(mocks.linkUser).not.toHaveBeenCalled();
  });

  it("creates an anonymous user and cookie when none exists", async () => {
    mocks.getCookie.mockReturnValue(undefined);
    mocks.claimAnonymous.mockResolvedValue({ id: "achievement-1" });

    await claimDailyAchievementAction();

    expect(mocks.createAnonymousUser).toHaveBeenCalledOnce();
    expectAnonymousCookie();
    expect(mocks.claimAnonymous).toHaveBeenCalledExactlyOnceWith(
      "anonymous-new",
    );
  });

  it("updates a valid timezone before claiming", async () => {
    mocks.claimAnonymous.mockResolvedValue({ id: "achievement-1" });

    await claimDailyAchievementAction("America/New_York");

    expect(mocks.updateTimezone).toHaveBeenCalledExactlyOnceWith(
      "anonymous-existing",
      "America/New_York",
    );
    expect(mocks.updateTimezone.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.claimAnonymous.mock.invocationCallOrder[0],
    );
  });

  it.each([
    { timezone: undefined },
    { timezone: "" },
    { timezone: "Definitely/Invalid" },
  ])("skips timezone updates for '$timezone'", async ({ timezone }) => {
    mocks.claimAnonymous.mockResolvedValue(null);

    await claimDailyAchievementAction(timezone);

    expect(mocks.updateTimezone).not.toHaveBeenCalled();
    expect(mocks.claimAnonymous).toHaveBeenCalledOnce();
  });

  it("returns already_claimed when no achievement is awarded", async () => {
    mocks.claimAnonymous.mockResolvedValue(null);

    await expect(claimDailyAchievementAction()).resolves.toEqual({
      status: "already_claimed",
      achievement: null,
    });
  });

  it("still claims when the timezone service returns false", async () => {
    mocks.updateTimezone.mockResolvedValue(false);
    mocks.claimAnonymous.mockResolvedValue({ id: "achievement-1" });

    await expect(claimDailyAchievementAction("UTC")).resolves.toEqual({
      status: "claimed",
      achievement: { id: "achievement-1" },
      triggeredAchievements: [],
    });
  });

  it("propagates anonymous-user creation failures without claiming", async () => {
    const error = new Error("Creation failed");
    mocks.getCookie.mockReturnValue(undefined);
    mocks.createAnonymousUser.mockRejectedValue(error);

    await expect(claimDailyAchievementAction()).rejects.toBe(error);

    expect(mocks.setCookie).not.toHaveBeenCalled();
    expect(mocks.claimAnonymous).not.toHaveBeenCalled();
  });
});

describe("migrateAnonymousAchievementsAction", () => {
  it("requires an authenticated user", async () => {
    await expect(migrateAnonymousAchievementsAction()).rejects.toThrow(
      "User must be logged in before migrating anonymous achievements.",
    );

    expect(mocks.cookies).not.toHaveBeenCalled();
    expect(mocks.merge).not.toHaveBeenCalled();
  });

  it("returns zero counts when no anonymous cookie exists", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.getCookie.mockReturnValue(undefined);

    await expect(migrateAnonymousAchievementsAction()).resolves.toEqual({
      migrated: 0,
      skipped: 0,
    });

    expect(mocks.merge).not.toHaveBeenCalled();
  });

  it("merges achievements using the anonymous cookie", async () => {
    const result = { migrated: 3, skipped: 2 };
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.merge.mockResolvedValue(result);

    await expect(migrateAnonymousAchievementsAction()).resolves.toBe(result);

    expect(mocks.merge).toHaveBeenCalledExactlyOnceWith("anonymous-existing");
  });

  it("propagates migration failures", async () => {
    const error = new Error("Migration failed");
    mocks.getAuthenticatedUser.mockResolvedValue({ id: "user-1" });
    mocks.merge.mockRejectedValue(error);

    await expect(migrateAnonymousAchievementsAction()).rejects.toBe(error);
  });
});

describe("getStreakDataAction", () => {
  it("returns the streak service result", async () => {
    const result = { currentStreak: 3, longestStreak: 5 };
    mocks.getStreak.mockResolvedValue(result);

    await expect(getStreakDataAction()).resolves.toBe(result);

    expect(mocks.getStreak).toHaveBeenCalledExactlyOnceWith();
  });

  it("propagates streak service failures", async () => {
    const error = new Error("Streak unavailable");
    mocks.getStreak.mockRejectedValue(error);

    await expect(getStreakDataAction()).rejects.toBe(error);
  });
});
