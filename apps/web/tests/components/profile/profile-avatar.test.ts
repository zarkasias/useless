// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  storageFrom: vi.fn(),
  upload: vi.fn(),
  getPublicUrl: vi.fn(),
  updateAvatar: vi.fn(),
  updated: vi.fn(),
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@/app/actions/profile-actions", () => ({
  updateUsernameAction: vi.fn(),
  updateAvatarAction: mocks.updateAvatar,
}));

vi.mock("sonner", () => ({
  toast: {
    success: mocks.success,
    error: mocks.error,
  },
}));

import Profile from "@/components/settings/profile-section";

let container: HTMLDivElement;
let root: Root;

const profile = {
  id: "user-1",
  username: "Player",
  role: "user" as const,
  created_at: "2026-10-01T12:00:00.000Z",
  streak_count: 3,
};

beforeEach(async () => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.createClient.mockReturnValue({
    storage: { from: mocks.storageFrom },
  });
  mocks.storageFrom.mockReturnValue({
    upload: mocks.upload,
    getPublicUrl: mocks.getPublicUrl,
  });
  mocks.upload.mockResolvedValue({ error: null });
  mocks.getPublicUrl.mockReturnValue({
    data: { publicUrl: "https://example.com/avatar.png" },
  });
  mocks.updateAvatar.mockResolvedValue({
    success: true,
    avatarUrl: "https://example.com/saved-avatar.png",
  });

  vi.spyOn(Date, "now").mockReturnValue(1234567890);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(
      createElement(Profile, {
        profile,
        email: "player@example.com",
        onProfileUpdated: mocks.updated,
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

function input() {
  const element =
    container.querySelector<HTMLInputElement>('input[type="file"]');

  if (!element) {
    throw new Error("Missing avatar file input");
  }

  return element;
}

async function selectFiles(files: File[]) {
  Object.defineProperty(input(), "files", {
    configurable: true,
    value: files,
  });

  await act(async () => {
    input().dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("Profile avatar upload", () => {
  it("uploads the file and saves the returned public URL", async () => {
    const file = new File(["image"], "portrait.photo.png", {
      type: "image/png",
    });

    await selectFiles([file]);

    expect(mocks.createClient).toHaveBeenCalledOnce();
    expect(mocks.storageFrom).toHaveBeenCalledWith("avatars");
    expect(mocks.upload).toHaveBeenCalledExactlyOnceWith(
      "user-1-1234567890.png",
      file,
      { upsert: false },
    );
    expect(mocks.getPublicUrl).toHaveBeenCalledExactlyOnceWith(
      "user-1-1234567890.png",
    );
    expect(mocks.updateAvatar).toHaveBeenCalledExactlyOnceWith(
      "https://example.com/avatar.png",
    );
    expect(mocks.updated).toHaveBeenCalledExactlyOnceWith({
      ...profile,
      avatar_url: "https://example.com/saved-avatar.png",
    });
    expect(mocks.success).toHaveBeenCalledWith("Avatar updated");
    expect(input().disabled).toBe(false);
    expect(input().value).toBe("");
  });

  it("does nothing when file selection is canceled", async () => {
    await selectFiles([]);

    expect(mocks.createClient).not.toHaveBeenCalled();
    expect(mocks.upload).not.toHaveBeenCalled();
    expect(mocks.updateAvatar).not.toHaveBeenCalled();
    expect(mocks.updated).not.toHaveBeenCalled();
  });

  it("reports storage errors without saving the avatar", async () => {
    const error = { message: "Upload failed" };
    mocks.upload.mockResolvedValue({ error });

    await selectFiles([new File(["image"], "avatar.png")]);

    expect(console.error).toHaveBeenCalledWith(
      "Error uploading avatar:",
      error,
    );
    expect(mocks.error).toHaveBeenCalledWith("Unable to update avatar.");
    expect(mocks.getPublicUrl).not.toHaveBeenCalled();
    expect(mocks.updateAvatar).not.toHaveBeenCalled();
    expect(mocks.updated).not.toHaveBeenCalled();
    expect(input().disabled).toBe(false);
  });

  it("shows avatar-action failures without updating the parent", async () => {
    mocks.updateAvatar.mockResolvedValue({
      success: false,
      error: "Unable to save avatar.",
    });

    await selectFiles([new File(["image"], "avatar.png")]);

    expect(mocks.error).toHaveBeenCalledWith("Unable to save avatar.");
    expect(mocks.updated).not.toHaveBeenCalled();
    expect(mocks.success).not.toHaveBeenCalled();
    expect(input().disabled).toBe(false);
  });

  it("handles rejected avatar updates and restores the input", async () => {
    const error = new Error("Save unavailable");
    mocks.updateAvatar.mockRejectedValue(error);

    await selectFiles([new File(["image"], "avatar.png")]);

    expect(console.error).toHaveBeenCalledWith(
      "Error uploading avatar:",
      error,
    );
    expect(mocks.error).toHaveBeenCalledWith("Unable to update avatar.");
    expect(mocks.updated).not.toHaveBeenCalled();
    expect(input().disabled).toBe(false);
  });

  it("handles rejected uploads and allows another attempt", async () => {
    mocks.upload.mockRejectedValue(new Error("Storage unavailable"));

    await selectFiles([new File(["image"], "avatar.png")]);

    expect(mocks.error).toHaveBeenCalledWith("Unable to update avatar.");
    expect(input().disabled).toBe(false);

    mocks.upload.mockResolvedValue({ error: null });
    await selectFiles([new File(["image"], "replacement.jpg")]);

    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.updated).toHaveBeenCalledOnce();
  });

  it("disables file selection while an upload is pending", async () => {
    let finish!: (result: { error: null }) => void;
    mocks.upload.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );

    await selectFiles([new File(["image"], "avatar.png")]);

    expect(input().disabled).toBe(true);
    expect(mocks.updateAvatar).not.toHaveBeenCalled();

    await act(async () => {
      finish({ error: null });
    });

    expect(input().disabled).toBe(false);
    expect(mocks.updated).toHaveBeenCalledOnce();
  });
});
