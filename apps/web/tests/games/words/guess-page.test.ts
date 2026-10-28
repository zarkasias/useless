import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ profile: vi.fn(), entitlements: vi.fn(), stats: vi.fn(), redirect: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/services/achievement-service-server", () => ({ getAuthenticatedUserProfile: mocks.profile }));
vi.mock("@/lib/services/entitlement-service-server", () => ({ getUserEntitlements: mocks.entitlements }));
vi.mock("@/lib/services/game-service-server", () => ({ getAuthenticatedGameStats: mocks.stats }));
vi.mock("@/app/games/guess/guess-client", () => ({ default: () => null }));
import GuessPage from "@/app/games/guess/page";
import GuessClient from "@/app/games/guess/guess-client";

beforeEach(() => {
  mocks.profile.mockReset().mockResolvedValue({ id: "player" });
  mocks.entitlements.mockReset().mockResolvedValue({ isSubscribed: true });
  mocks.stats.mockReset().mockResolvedValue({ game_type: "guess", games_played: 3, wins: 1, losses: 2 });
  mocks.redirect.mockReset().mockImplementation(() => { throw new Error("REDIRECT"); });
});

describe("Guess access and statistics composition", () => {
  it("loads Guess stats and passes them through the same route pattern as Memory", async () => {
    const element = await GuessPage();
    expect(element.type).toBe(GuessClient);
    expect(element.props).toEqual({ initialProfile: { id: "player" }, initialEntitlements: { isSubscribed: true }, initialStats: { game_type: "guess", games_played: 3, wins: 1, losses: 2 } });
    expect(mocks.entitlements).toHaveBeenCalledExactlyOnceWith("player");
    expect(mocks.stats).toHaveBeenCalledExactlyOnceWith("guess");
  });
  it("passes null for a user with no previous Guess sessions", async () => {
    mocks.stats.mockResolvedValue(null);
    expect((await GuessPage()).props.initialStats).toBeNull();
  });
  it("redirects missing profiles to login with return URL", async () => {
    mocks.profile.mockResolvedValue(null);
    await expect(GuessPage()).rejects.toThrow("REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/login?next=/games/guess");
    expect(mocks.entitlements).not.toHaveBeenCalled();
    expect(mocks.stats).not.toHaveBeenCalled();
  });
  it("redirects non-subscribers to games", async () => {
    mocks.entitlements.mockResolvedValue({ isSubscribed: false });
    await expect(GuessPage()).rejects.toThrow("REDIRECT");
    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/games");
  });
  it.each(["profile", "entitlements", "stats"] as const)("propagates %s failures instead of inventing zero statistics", async (source) => {
    const error = new Error("Unavailable");
    mocks[source].mockRejectedValueOnce(error);
    await expect(GuessPage()).rejects.toBe(error);
    expect(mocks.redirect).not.toHaveBeenCalled();
    if (source === "profile") expect(mocks.stats).not.toHaveBeenCalled();
  });
});
