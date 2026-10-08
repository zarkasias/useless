// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteAccount: vi.fn(),
  toastError: vi.fn(),
}));

vi.mock("@/app/actions/account-actions", () => ({
  deleteAccountAction: mocks.deleteAccount,
}));

vi.mock("sonner", () => ({
  toast: { error: mocks.toastError },
}));

import DeleteAccount from "@/components/settings/delete-section";

let container: HTMLDivElement;
let root: Root;

beforeEach(async () => {
  mocks.deleteAccount.mockReset();
  mocks.toastError.mockReset();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);

  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);

  await act(async () => {
    root.render(createElement(DeleteAccount));
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
  const element = Array.from(document.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim() === label,
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

function confirmationInput() {
  const input = document.querySelector<HTMLInputElement>(
    'input[placeholder="DELETE"]',
  );

  if (!input) {
    throw new Error("Missing deletion confirmation input");
  }

  return input;
}

async function confirm(value: string) {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  if (!setter) {
    throw new Error("Missing native input setter");
  }

  await act(async () => {
    const input = confirmationInput();
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

describe("DeleteAccount", () => {
  it("opens confirmation without deleting the account", async () => {
    expect(document.querySelector('[role="alertdialog"]')).toBeNull();

    await click("Delete Account");

    expect(document.querySelector('[role="alertdialog"]')).not.toBeNull();
    expect(document.body.textContent).toContain("Type DELETE to confirm");
    expect(button("Permanently delete account").disabled).toBe(true);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it.each([
    { value: "" },
    { value: "delete" },
    { value: "DELETE " },
    { value: " DELETE" },
  ])("does not accept confirmation '$value'", async ({ value }) => {
    await click("Delete Account");
    await confirm(value);

    expect(button("Permanently delete account").disabled).toBe(true);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("enables deletion only after exact confirmation", async () => {
    await click("Delete Account");
    await confirm("DELETE");

    expect(button("Permanently delete account").disabled).toBe(false);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("clears confirmation when the dialog is canceled", async () => {
    await click("Delete Account");
    await confirm("DELETE");
    await click("Cancel");

    expect(document.querySelector('[role="alertdialog"]')).toBeNull();

    await click("Delete Account");

    expect(confirmationInput().value).toBe("");
    expect(button("Permanently delete account").disabled).toBe(true);
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
  });

  it("submits deletion and displays an action failure", async () => {
    mocks.deleteAccount.mockResolvedValue({
      success: false,
      error: "Unable to delete your account.",
    });

    await click("Delete Account");
    await confirm("DELETE");
    await click("Permanently delete account");

    expect(mocks.deleteAccount).toHaveBeenCalledExactlyOnceWith();
    expect(mocks.toastError).toHaveBeenCalledWith(
      "Unable to delete your account.",
    );

    await click("Delete Account");
    await confirm("DELETE");

    expect(button("Permanently delete account").disabled).toBe(false);
  });

  it("keeps deletion disabled while the action remains pending", async () => {
    let finish!: (result: { success: false; error: string }) => void;

    mocks.deleteAccount.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );

    await click("Delete Account");
    await confirm("DELETE");
    await click("Permanently delete account");

    // The dialog action closes the dialog when clicked.
    await click("Delete Account");
    await confirm("DELETE");

    expect(button("Deleting...").disabled).toBe(true);
    expect(mocks.deleteAccount).toHaveBeenCalledOnce();

    await act(async () => {
      finish({ success: false, error: "Please try again." });
    });

    expect(mocks.toastError).toHaveBeenCalledWith("Please try again.");
    expect(button("Permanently delete account").disabled).toBe(false);
  });
});
