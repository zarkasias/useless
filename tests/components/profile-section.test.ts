// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserProfile } from "@/lib/supabase";

const mocks = vi.hoisted(() => ({
  updateUsername: vi.fn(),
  updateAvatar: vi.fn(),
  onProfileUpdated: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/app/actions/profile-actions", () => ({
  updateUsernameAction: mocks.updateUsername,
  updateAvatarAction: mocks.updateAvatar,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}));

import Profile from "@/components/settings/profile-section";

let container: HTMLDivElement;
let root: Root;

const profile: UserProfile = {
  id: "user-1",
  username: "Player",
  role: "user",
  created_at: "2026-10-01T12:00:00.000Z",
  streak_count: 3,
};

beforeEach(async () => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(Profile, {
        profile,
        email: "player@example.com",
        onProfileUpdated: mocks.onProfileUpdated,
      }),
    );
  });
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.unstubAllGlobals();
});

function button(label: string) {
  const element = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent === label,
  );

  if (!element) {
    throw new Error(`Missing button: ${label}`);
  }

  return element;
}

async function click(label: string) {
  await act(async () => {
    button(label).click();
  });
}

function usernameInput() {
  const input = container.querySelector<HTMLInputElement>(
    'input:not([type="file"])',
  );

  if (!input) {
    throw new Error("Missing username input");
  }

  return input;
}

async function enterUsername(value: string) {
  const input = usernameInput();
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  if (!setter) {
    throw new Error("Missing native input value setter");
  }

  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("Profile username editing", () => {
  it("shows the current profile and email", () => {
    expect(container.textContent).toContain("Player");
    expect(container.textContent).toContain("player@example.com");
    expect(button("Edit Profile")).toBeDefined();
    expect(container.querySelector('input:not([type="file"])')).toBeNull();
  });

  it("disables saving unchanged or short usernames", async () => {
    await click("Edit Profile");

    expect(usernameInput().value).toBe("Player");
    expect(button("Save").disabled).toBe(true);

    await enterUsername("ab");
    expect(button("Save").disabled).toBe(true);

    await enterUsername("  Player  ");
    expect(button("Save").disabled).toBe(true);

    await enterUsername("NewPlayer");
    expect(button("Save").disabled).toBe(false);
  });

  it("discards unsaved changes when editing is canceled", async () => {
    await click("Edit Profile");
    await enterUsername("UnsavedName");
    await click("Cancel");

    expect(container.querySelector('input:not([type="file"])')).toBeNull();
    expect(mocks.updateUsername).not.toHaveBeenCalled();

    await click("Edit Profile");

    expect(usernameInput().value).toBe("Player");
  });

  it("passes the saved profile to the parent and closes editing", async () => {
    mocks.updateUsername.mockResolvedValue({
      success: true,
      username: "SavedPlayer",
    });

    await click("Edit Profile");
    await enterUsername("  SavedPlayer  ");
    await click("Save");

    expect(mocks.updateUsername).toHaveBeenCalledExactlyOnceWith(
      "  SavedPlayer  ",
    );
    expect(mocks.onProfileUpdated).toHaveBeenCalledExactlyOnceWith({
      ...profile,
      username: "SavedPlayer",
    });
    expect(mocks.toastSuccess).toHaveBeenCalledWith("Profile Updated");
    expect(container.querySelector('input:not([type="file"])')).toBeNull();

    await click("Edit Profile");
    expect(usernameInput().value).toBe("SavedPlayer");
  });

  it("shows action errors and keeps editing available", async () => {
    mocks.updateUsername.mockResolvedValue({
      success: false,
      error: "That username is already taken.",
    });

    await click("Edit Profile");
    await enterUsername("TakenName");
    await click("Save");

    expect(mocks.toastError).toHaveBeenCalledWith(
      "That username is already taken.",
    );
    expect(mocks.onProfileUpdated).not.toHaveBeenCalled();
    expect(usernameInput().value).toBe("TakenName");
    expect(button("Save").disabled).toBe(false);
  });

  it("handles rejected updates and enables another attempt", async () => {
    const error = new Error("Service unavailable");
    mocks.updateUsername.mockRejectedValue(error);

    await click("Edit Profile");
    await enterUsername("NewPlayer");
    await click("Save");

    expect(console.error).toHaveBeenCalledWith(
      "Error updating profile:",
      error,
    );
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Something went wrong updating profile.",
    );
    expect(mocks.onProfileUpdated).not.toHaveBeenCalled();
    expect(button("Save").disabled).toBe(false);
  });
});
