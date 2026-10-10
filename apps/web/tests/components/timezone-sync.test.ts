// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateTimezone: vi.fn(),
}));

vi.mock("@/app/actions/timezone-actions", () => ({
  updateUserTimezoneAction: mocks.updateTimezone,
}));

import { Timezonesync } from "@/components/timezone-sync";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  mocks.updateTimezone.mockReset();
  mocks.updateTimezone.mockResolvedValue({ success: true });

  const options = new Intl.DateTimeFormat().resolvedOptions();
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
    ...options,
    timeZone: "America/New_York",
  });

  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => {
    root.unmount();
  });

  container.remove();
  vi.unstubAllGlobals();
});

async function render(currentTimezone?: string | null) {
  await act(async () => {
    root.render(createElement(Timezonesync, { currentTimezone }));
  });
}

describe("Timezonesync", () => {
  it.each([
    { currentTimezone: undefined },
    { currentTimezone: null },
    { currentTimezone: "Europe/London" },
  ])(
    "updates a missing or different timezone: $currentTimezone",
    async ({ currentTimezone }) => {
      await render(currentTimezone);

      expect(mocks.updateTimezone).toHaveBeenCalledExactlyOnceWith(
        "America/New_York",
      );
      expect(container.innerHTML).toBe("");
    },
  );

  it("does not update a matching timezone", async () => {
    await render("America/New_York");

    expect(mocks.updateTimezone).not.toHaveBeenCalled();
  });

  it("does not update when the browser provides no timezone", async () => {
    const options = new Intl.DateTimeFormat().resolvedOptions();

    vi.mocked(Intl.DateTimeFormat.prototype.resolvedOptions).mockReturnValue({
      ...options,
      timeZone: "",
    });

    await render("Europe/London");

    expect(mocks.updateTimezone).not.toHaveBeenCalled();
  });

  it("logs rejected updates", async () => {
    const error = new Error("Timezone service unavailable");
    mocks.updateTimezone.mockRejectedValue(error);

    await render("Europe/London");

    expect(console.error).toHaveBeenCalledWith(
      "Unable to sync user timezone:",
      error,
    );
  });

  it("does not repeat an update when the timezone prop is unchanged", async () => {
    await render("Europe/London");
    await render("Europe/London");

    expect(mocks.updateTimezone).toHaveBeenCalledOnce();
  });

  it("rechecks synchronization when the stored timezone changes", async () => {
    await render("America/New_York");

    expect(mocks.updateTimezone).not.toHaveBeenCalled();

    await render("Europe/London");

    expect(mocks.updateTimezone).toHaveBeenCalledExactlyOnceWith(
      "America/New_York",
    );
  });
});
