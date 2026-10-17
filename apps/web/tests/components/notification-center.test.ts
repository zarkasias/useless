// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UserNotification } from "@/lib/types/notifications";

const mocks = vi.hoisted(() => ({
  pathname: "/dashboard",
  load: vi.fn(),
  dismiss: vi.fn(),
  accept: vi.fn(),
  decline: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@/app/actions/notification-actions", () => ({
  getUnreadNotificationsAction: mocks.load,
  markNotificationAsReadAction: mocks.dismiss,
  acceptFriendRequestNotificationAction: mocks.accept,
  declineFriendRequestNotificationAction: mocks.decline,
}));

vi.mock("@/components/ui/popover", () => ({
  Popover: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  PopoverTrigger: ({ children }: { children: ReactNode }) =>
    createElement("div", null, children),
  PopoverContent: ({ children }: { children: ReactNode }) =>
    createElement("section", { "data-testid": "notification-list" }, children),
}));

import { NotificationCenter } from "@/components/notifications/notification-center";

let container: HTMLDivElement;
let root: Root;

function notification(
  overrides: Partial<UserNotification> = {},
): UserNotification {
  return {
    id: "notification-1",
    user_id: "user-1",
    type: "system",
    title: "Site update",
    message: "Something unnecessary happened.",
    actor_id: null,
    reference_id: null,
    read_at: null,
    created_at: "2026-10-07T12:00:00.000Z",
    actor: null,
    ...overrides,
  };
}

function friendRequest(
  overrides: Partial<UserNotification> = {},
): UserNotification {
  return notification({
    type: "friend_request",
    title: "Friend request",
    reference_id: "friendship-1",
    actor_id: "friend-1",
    actor: {
      id: "friend-1",
      username: "Alice",
      avatar_url: null,
    },
    ...overrides,
  });
}

function loadNotifications(items: UserNotification[]) {
  mocks.load.mockResolvedValue({
    success: true,
    notifications: items,
  });
}

async function render(enabled = true) {
  await act(async () => {
    root.render(createElement(NotificationCenter, { enabled }));
  });
}

function button(label: string) {
  const element = Array.from(container.querySelectorAll("button")).find(
    (candidate) =>
      candidate.textContent?.trim() === label ||
      candidate.getAttribute("aria-label") === label,
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

function hasPreview() {
  return (
    container.querySelector(
      'button[aria-label="Close notification preview"]',
    ) !== null
  );
}

beforeEach(() => {
  mocks.pathname = "/dashboard";
  mocks.load.mockReset();
  mocks.dismiss.mockReset();
  mocks.accept.mockReset();
  mocks.decline.mockReset();

  loadNotifications([]);
  mocks.dismiss.mockResolvedValue({ success: true });
  mocks.accept.mockResolvedValue({ success: true });
  mocks.decline.mockResolvedValue({ success: true });

  sessionStorage.clear();
  vi.useFakeTimers();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  sessionStorage.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("NotificationCenter loading", () => {
  it("renders nothing and does not load notifications when disabled", async () => {
    await render(false);

    expect(container.innerHTML).toBe("");
    expect(mocks.load).not.toHaveBeenCalled();
  });

  it("shows the empty state", async () => {
    await render();

    expect(container.textContent).toContain("No notifications");
    expect(container.textContent).toContain("Absolutely nothing is happening.");
    expect(button("Notifications")).toBeDefined();
  });

  it("logs loading failures", async () => {
    mocks.load.mockResolvedValue({
      success: false,
      notifications: [],
      message: "Unable to load notifications.",
    });

    await render();

    expect(console.error).toHaveBeenCalledWith("Unable to load notifications.");
    expect(container.textContent).toContain("No notifications");
  });

  it("reloads notifications when the pathname changes", async () => {
    await render();

    mocks.pathname = "/friends";
    await render();

    expect(mocks.load).toHaveBeenCalledTimes(2);
  });

  it("caps the visual badge at 99+ while retaining the full accessible count", async () => {
    loadNotifications(
      Array.from({ length: 100 }, (_, index) =>
        notification({ id: `notification-${index}` }),
      ),
    );

    await render();

    expect(button("Notifications (100 unread)").textContent).toContain("99+");
  });
});

describe("NotificationCenter previews", () => {
  it("shows a preview once per session and hides it after five seconds", async () => {
    loadNotifications([notification()]);

    await render();

    expect(hasPreview()).toBe(true);
    expect(sessionStorage.getItem("notification-preview-notification-1")).toBe(
      "true",
    );

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(hasPreview()).toBe(false);
    expect(button("Notifications (1 unread)")).toBeDefined();
  });

  it("skips previews already shown in this session", async () => {
    sessionStorage.setItem("notification-preview-notification-1", "true");
    loadNotifications([notification()]);

    await render();

    expect(hasPreview()).toBe(false);
  });

  it("closes a preview without marking the notification read", async () => {
    loadNotifications([notification()]);
    await render();

    await click("Close notification preview");

    expect(hasPreview()).toBe(false);
    expect(mocks.dismiss).not.toHaveBeenCalled();
    expect(button("Notifications (1 unread)")).toBeDefined();
  });

  it("hides the preview when View notification is selected", async () => {
    loadNotifications([notification()]);
    await render();

    await click("View notification");

    expect(hasPreview()).toBe(false);
    expect(mocks.dismiss).not.toHaveBeenCalled();
  });

  it.each([
    { type: "system" as const },
    { type: "achievement" as const },
    { type: "friend_accepted" as const },
  ])("renders $type notifications with their message", async ({ type }) => {
    loadNotifications([notification({ type })]);

    await render();

    expect(container.textContent).toContain("Something unnecessary happened.");
    expect(hasPreview()).toBe(true);
  });
});

describe("NotificationCenter dismissal", () => {
  it("removes a notification and its preview after marking it read", async () => {
    loadNotifications([notification()]);
    await render();

    await click("Mark as read");

    expect(mocks.dismiss).toHaveBeenCalledExactlyOnceWith("notification-1");
    expect(container.textContent).toContain("No notifications");
    expect(hasPreview()).toBe(false);
    expect(button("Notifications")).toBeDefined();
  });

  it("keeps the notification when marking it read fails", async () => {
    loadNotifications([notification()]);
    mocks.dismiss.mockResolvedValue({
      success: false,
      message: "Update failed",
    });
    await render();

    await click("Mark as read");

    expect(console.error).toHaveBeenCalledWith("Update failed");
    expect(button("Notifications (1 unread)")).toBeDefined();
    expect(container.textContent).toContain("Site update");
  });

  it("removes only the selected notification", async () => {
    loadNotifications([
      notification(),
      friendRequest({ id: "notification-2" }),
    ]);
    await render();

    await click("Mark as read");

    expect(button("Notifications (1 unread)")).toBeDefined();
    expect(container.textContent).toContain("Friend request");
    expect(container.textContent).not.toContain("Site update");
  });
});

describe.each([
  { label: "Accept", action: mocks.accept },
  { label: "Decline", action: mocks.decline },
])("NotificationCenter $label", ({ label, action }) => {
  it("processes the request and removes the notification", async () => {
    loadNotifications([friendRequest()]);
    await render();

    expect(container.textContent).toContain("Alice sent you a friend request.");
    expect(container.querySelector("a")?.getAttribute("href")).toBe(
      "/profile/Alice",
    );

    await click(label);

    expect(action).toHaveBeenCalledExactlyOnceWith(
      "friendship-1",
      "notification-1",
    );
    expect(container.textContent).toContain("No notifications");
    expect(hasPreview()).toBe(false);
  });

  it("keeps the notification when the action fails", async () => {
    loadNotifications([friendRequest()]);
    action.mockResolvedValue({
      success: false,
      message: "Friend request update failed",
    });
    await render();

    await click(label);

    expect(console.error).toHaveBeenCalledWith("Friend request update failed");
    expect(button("Notifications (1 unread)")).toBeDefined();
  });

  it("does not submit a request without a friendship reference", async () => {
    loadNotifications([friendRequest({ reference_id: null, actor: null })]);
    await render();

    await click(label);

    expect(action).not.toHaveBeenCalled();
    expect(button("Notifications (1 unread)")).toBeDefined();
    expect(container.querySelector("a")).toBeNull();
  });
});
