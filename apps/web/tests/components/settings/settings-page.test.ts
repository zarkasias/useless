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

vi.mock("@/app/settings/settings_client", () => ({
  default: () => null,
}));

import SettingsPage from "@/app/settings/page";
import SettingsClient from "@/app/settings/settings_client";

const profile = { id: "user-1", username: "Alice" };
const entitlements = { isSubscribed: true };

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({
    id: "user-1",
    email: "alice@example.com",
  });
  mocks.getProfile.mockResolvedValue(profile);
  mocks.getEntitlements.mockResolvedValue(entitlements);

  mocks.redirect.mockImplementation(() => {
    throw new Error("TEST_REDIRECT");
  });
});

describe("SettingsPage", () => {
  it("passes the profile, entitlements, and email to SettingsClient", async () => {
    const element = await SettingsPage();

    expect(element.type).toBe(SettingsClient);
    expect(element.props).toEqual({
      initialProfile: profile,
      initialEntitlements: entitlements,
      email: "alice@example.com",
    });

    expect(mocks.getUser).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getProfile).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.getEntitlements).toHaveBeenCalledExactlyOnceWith("user-1");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("redirects unauthenticated visitors before loading account data", async () => {
    mocks.getUser.mockResolvedValue(null);

    await expect(SettingsPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
    expect(mocks.getProfile).not.toHaveBeenCalled();
    expect(mocks.getEntitlements).not.toHaveBeenCalled();
  });

  it("redirects when the authenticated user has no profile", async () => {
    mocks.getProfile.mockResolvedValue(null);

    await expect(SettingsPage()).rejects.toThrow("TEST_REDIRECT");

    expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/");
  });

  it("defaults to an empty email when the user has no email", async () => {
    mocks.getUser.mockResolvedValue({ id: "user-1" });

    const element = await SettingsPage();

    expect(element.props.email).toBe("");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("propagates authentication failures before loading account data", async () => {
    const error = new Error("Authentication unavailable");
    mocks.getUser.mockRejectedValue(error);

    await expect(SettingsPage()).rejects.toBe(error);

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

      await expect(SettingsPage()).rejects.toBe(error);
      expect(mocks.redirect).not.toHaveBeenCalled();
    },
  );
});
