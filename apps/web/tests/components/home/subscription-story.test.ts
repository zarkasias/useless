// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SubscriptionStory } from "@/components/home/subscription-story";

type Props = Parameters<typeof SubscriptionStory>[0];

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

async function render(overrides: Partial<Props> = {}) {
  await act(async () => {
    root.render(
      createElement(SubscriptionStory, {
        isLoggedIn: false,
        isSubscribed: false,
        isClaiming: false,
        onClaim: vi.fn(),
        ...overrides,
      }),
    );
  });
}

function button(label: string): HTMLButtonElement {
  const found = Array.from(container.querySelectorAll("button")).find((item) =>
    item.textContent?.startsWith(label),
  );

  if (!found) throw new Error(`Missing button: ${label}`);
  return found;
}

function planLink(): HTMLAnchorElement {
  const found = container.querySelector<HTMLAnchorElement>("a");
  if (!found) throw new Error("Missing subscription link");
  return found;
}

describe("homepage subscription story", () => {
  it("defaults to annual pricing and preserves the plan through signup", async () => {
    await render();

    expect(button("Annual").getAttribute("aria-pressed")).toBe("true");
    expect(button("Monthly").getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
      "$24.99/year",
    );
    expect(planLink().getAttribute("href")).toBe("/signup?next=/pro&plan=year");
  });

  it("switches pricing and signup destination to monthly", async () => {
    await render();

    await act(async () => button("Monthly").click());

    expect(button("Monthly").getAttribute("aria-pressed")).toBe("true");
    expect(button("Annual").getAttribute("aria-pressed")).toBe("false");
    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
      "$2.99/month",
    );
    expect(container.textContent).not.toContain("billed annually");
    expect(planLink().getAttribute("href")).toBe(
      "/signup?next=/pro&plan=month",
    );
  });

  it("restores annual pricing after switching back", async () => {
    await render();

    await act(async () => button("Monthly").click());
    await act(async () => button("Annual").click());

    expect(container.querySelector('[aria-live="polite"]')?.textContent).toBe(
      "$24.99/year",
    );
    expect(container.textContent).toContain("billed annually");
    expect(planLink().getAttribute("href")).toBe("/signup?next=/pro&plan=year");
  });

  it("sends signed-in non-subscribers to Pro with their selected plan", async () => {
    await render({ isLoggedIn: true });

    expect(planLink().getAttribute("href")).toBe("/pro?plan=year");

    await act(async () => button("Monthly").click());

    expect(planLink().getAttribute("href")).toBe("/pro?plan=month");
  });

  it("sends existing subscribers to subscription management for either plan", async () => {
    await render({ isLoggedIn: true, isSubscribed: true });

    expect(planLink().getAttribute("href")).toBe("/pro");
    expect(planLink().textContent).toContain("View subscription");

    await act(async () => button("Monthly").click());

    expect(planLink().getAttribute("href")).toBe("/pro");
  });

  it("calls the daily claim action when the claim button is clicked", async () => {
    const onClaim = vi.fn();
    await render({ onClaim });

    await act(async () => button("Claim my").click());

    expect(onClaim).toHaveBeenCalledTimes(1);
  });

  it("disables claiming and exposes the busy state while a claim is pending", async () => {
    const onClaim = vi.fn();
    await render({ isClaiming: true, onClaim });

    const claimButton = button("Claiming");
    expect(claimButton.disabled).toBe(true);
    expect(claimButton.getAttribute("aria-busy")).toBe("true");

    await act(async () => claimButton.click());

    expect(onClaim).not.toHaveBeenCalled();
  });
});
