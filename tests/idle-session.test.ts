// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuthSessionMissingError } from "@supabase/supabase-js";

const auth = vi.hoisted(() => ({ getUser: vi.fn(), signOut: vi.fn(), onAuthStateChange: vi.fn() }));
const router = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("@/lib/supabase/client", () => ({ createClient: () => ({ auth }) }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
// Keep the tests focused on session behavior, not Radix portals or animations.
vi.mock("@/components/ui/dialog", () => {
  const wrapper = ({ children }: { children: ReactNode }) => createElement("div", null, children);
  return {
    Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
      open ? createElement("section", { role: "dialog" }, children) : null,
    DialogContent: wrapper,
    DialogDescription: wrapper,
    DialogFooter: wrapper,
    DialogHeader: wrapper,
    DialogTitle: wrapper,
  };
});
import { IdleSessionManager } from "@/components/auth/idle-session-manager";

const IDLE_TIMEOUT = 4 * 60 * 60 * 1000;
const WARNING_TIME = 5 * 60 * 1000;
const KEY = "useless-achievements-last-activity";
let root: Root;
let container: HTMLDivElement;
let authChanged: (event: string, session: { user: { id: string } } | null) => void;
const unsubscribe = vi.fn();

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-13T12:00:00Z"));
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  localStorage.clear();
  auth.getUser.mockReset().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
  auth.signOut.mockReset().mockResolvedValue({ error: null });
  auth.onAuthStateChange.mockImplementation((callback) => {
    authChanged = callback;
    return { data: { subscription: { unsubscribe } } };
  });
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.useRealTimers();
});

async function mount() {
  await act(async () => root.render(createElement(IdleSessionManager)));
}
async function advance(ms: number) {
  await act(async () => vi.advanceTimersByTimeAsync(ms));
}
async function activity() {
  await act(async () => window.dispatchEvent(new Event("mousedown")));
}
async function visible() {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: "visible" });
  await act(async () => document.dispatchEvent(new Event("visibilitychange")));
}
async function pressButton() {
  const button = container.querySelector("button");
  expect(button).not.toBeNull();
  await act(async () => button!.click());
}

it("leaves guests on their page without idle timers", async () => {
  auth.getUser.mockResolvedValue({ data: { user: null }, error: new AuthSessionMissingError() });
  await mount();
  await activity();
  await act(async () => authChanged("SIGNED_OUT", null));
  await advance(IDLE_TIMEOUT);
  expect(localStorage.getItem(KEY)).toBeNull();
  expect(auth.signOut).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(vi.getTimerCount()).toBe(0);
});

it("warns before expiry and redirects once even when signOut emits SIGNED_OUT", async () => {
  await mount();
  auth.signOut.mockImplementation(async () => {
    authChanged("SIGNED_OUT", null);
    return { error: null };
  });
  await advance(IDLE_TIMEOUT - WARNING_TIME);
  expect(container.textContent).toContain("Your session is about to expire");
  await advance(WARNING_TIME);
  expect(auth.signOut).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledExactlyOnceWith("/");
  expect(router.refresh).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(KEY)).toBeNull();
});

it("starts timers on sign-in without further activity", async () => {
  auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  await mount();
  await act(async () => authChanged("SIGNED_IN", { user: { id: "user-1" } }));
  expect(auth.signOut).not.toHaveBeenCalled();
  await advance(IDLE_TIMEOUT);
  expect(auth.signOut).toHaveBeenCalledTimes(1);
});

it("checks the expired deadline before recording the first activity after sleep", async () => {
  await mount();
  vi.setSystemTime(Date.now() + IDLE_TIMEOUT + 1);
  await activity();
  expect(auth.signOut).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledWith("/");
  expect(localStorage.getItem(KEY)).toBeNull();
});

it("checks session validity when returning to the tab", async () => {
  await mount();
  auth.getUser.mockResolvedValue({ data: { user: null }, error: new AuthSessionMissingError() });
  await visible();
  expect(router.replace).toHaveBeenCalledExactlyOnceWith("/");
  expect(auth.signOut).not.toHaveBeenCalled();
});

it("doesn't interpret returned or thrown network errors as logout", async () => {
  await mount();
  auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("Offline") });
  await visible();
  auth.getUser.mockRejectedValueOnce(new Error("Offline"));
  await visible();
  expect(router.replace).not.toHaveBeenCalled();
  expect(localStorage.getItem(KEY)).not.toBeNull();
  // The idle deadline still applies even though the session check failed.
  await advance(IDLE_TIMEOUT);
  expect(auth.signOut).toHaveBeenCalledTimes(1);
});

it("extends a valid session with Stay signed in, but ignores ordinary warning activity", async () => {
  await mount();
  await advance(IDLE_TIMEOUT - WARNING_TIME);
  const lastActivity = localStorage.getItem(KEY);
  await activity();
  expect(localStorage.getItem(KEY)).toBe(lastActivity);
  await pressButton();
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  await advance(WARNING_TIME);
  expect(auth.signOut).not.toHaveBeenCalled();
  await advance(IDLE_TIMEOUT - WARNING_TIME);
  expect(auth.signOut).toHaveBeenCalledTimes(1);
});

it("doesn't revive an expired session through Stay signed in", async () => {
  await mount();
  await advance(IDLE_TIMEOUT - WARNING_TIME);
  vi.setSystemTime(Date.now() + WARNING_TIME + 1);
  await pressButton();
  expect(auth.signOut).toHaveBeenCalledTimes(1);
  expect(router.replace).toHaveBeenCalledTimes(1);
});

it("ignores a session response that arrives after sign-out", async () => {
  await mount();
  let resolve!: (value: unknown) => void;
  auth.getUser.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
  await visible();
  await act(async () => authChanged("SIGNED_OUT", null));
  await act(async () => resolve({ data: { user: { id: "user-1" } }, error: null }));
  await activity();
  expect(router.replace).toHaveBeenCalledTimes(1);
  expect(localStorage.getItem(KEY)).toBeNull();
  await advance(IDLE_TIMEOUT);
  expect(auth.signOut).not.toHaveBeenCalled();
  expect(router.replace).toHaveBeenCalledTimes(1);
});

it("re-reads another tab's activity when a previously scheduled timer fires", async () => {
  await mount();
  await advance(IDLE_TIMEOUT - WARNING_TIME - 1000);
  localStorage.setItem(KEY, String(Date.now()));
  await advance(WARNING_TIME + 1000);
  expect(auth.signOut).not.toHaveBeenCalled();
  expect(container.querySelector('[role="dialog"]')).toBeNull();
});

it("updates deadlines on storage events without making an auth request for every activity", async () => {
  await mount();
  await advance(IDLE_TIMEOUT - WARNING_TIME);
  localStorage.setItem(KEY, String(Date.now()));
  await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: KEY })));
  expect(container.querySelector('[role="dialog"]')).toBeNull();
  expect(auth.getUser).toHaveBeenCalledTimes(1);
  await advance(WARNING_TIME);
  expect(auth.signOut).not.toHaveBeenCalled();
});

it("shows a retry action on logout failure without an automatic retry loop", async () => {
  await mount();
  auth.signOut.mockResolvedValueOnce({ error: new Error("Offline") });
  await advance(IDLE_TIMEOUT);
  expect(router.replace).not.toHaveBeenCalled();
  expect(container.textContent).toContain("Try signing out again");
  await advance(60_000);
  expect(auth.signOut).toHaveBeenCalledTimes(1);
  await pressButton();
  expect(auth.signOut).toHaveBeenCalledTimes(2);
  expect(router.replace).toHaveBeenCalledTimes(1);
});

it("cleans up subscriptions, listeners, timers, and pending checks on unmount", async () => {
  await mount();
  let resolve!: (value: unknown) => void;
  auth.getUser.mockReturnValueOnce(new Promise((done) => { resolve = done; }));
  await visible();
  await act(async () => root.unmount());
  expect(unsubscribe).toHaveBeenCalledTimes(1);
  const requests = auth.getUser.mock.calls.length;
  await act(async () => resolve({ data: { user: null }, error: null }));
  await visible();
  await activity();
  await advance(IDLE_TIMEOUT);
  expect(auth.getUser).toHaveBeenCalledTimes(requests);
  expect(auth.signOut).not.toHaveBeenCalled();
  expect(router.replace).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
