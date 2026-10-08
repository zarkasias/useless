// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
  push: vi.fn(),
}));

// Keep the client identity stable across renders.
const client = {
  auth: {
    getUser: mocks.getUser,
    updateUser: mocks.updateUser,
    signOut: mocks.signOut,
  },
};

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => client,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

import { ResetPasswordForm } from "@/components/auth/resetpassword-form";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    mock.mockReset();
  }

  mocks.getUser.mockResolvedValue({
    data: { user: { id: "user-1" } },
    error: null,
  });
  mocks.updateUser.mockResolvedValue({ error: null });
  mocks.signOut.mockResolvedValue({ error: null });

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
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

async function render() {
  await act(async () => {
    root.render(createElement(ResetPasswordForm));
  });
}

async function enter(id: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(`#${id}`);
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;

  if (!input || !setter) {
    throw new Error(`Missing input: ${id}`);
  }

  await act(async () => {
    setter.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function submit(password = "newpassword", confirmation = password) {
  await enter("password", password);
  await enter("confirmPassword", confirmation);

  const form = container.querySelector("form");

  if (!form) {
    throw new Error("Missing reset form");
  }

  await act(async () => {
    form.dispatchEvent(
      new Event("submit", { bubbles: true, cancelable: true }),
    );
  });
}

describe("ResetPasswordForm", () => {
  it.each([
    {
      label: "missing user",
      result: { data: { user: null }, error: null },
    },
    {
      label: "session error",
      result: {
        data: { user: { id: "user-1" } },
        error: { message: "Expired" },
      },
    },
  ])("rejects a $label and offers a new reset link", async ({ result }) => {
    mocks.getUser.mockResolvedValue(result);
    await render();

    expect(container.textContent).toContain("Reset link unavailable");
    expect(container.querySelector("form")).toBeNull();

    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
    });

    expect(mocks.push).toHaveBeenCalledWith("/forgot-password");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("rejects mismatched passwords before updating the user", async () => {
    await render();
    await submit("newpassword", "differentpassword");

    expect(container.textContent).toContain("Your passwords do not match.");
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("rejects passwords shorter than six characters", async () => {
    await render();
    await submit("short");

    expect(container.textContent).toContain(
      "Your password must be at least 6 characters.",
    );
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("toggles visibility independently for both password fields", async () => {
    await render();

    for (const id of ["password", "confirmPassword"]) {
      const input = container.querySelector<HTMLInputElement>(`#${id}`);
      const wrapper = input?.parentElement;

      expect(input?.type).toBe("password");

      await act(async () => {
        wrapper?.querySelector("button")?.click();
      });

      expect(input?.type).toBe("text");
      expect(wrapper?.querySelector("button")?.getAttribute("aria-label")).toBe(
        "Hide password",
      );

      await act(async () => {
        wrapper?.querySelector("button")?.click();
      });

      expect(input?.type).toBe("password");
    }
  });

  it("updates the password, signs out, and redirects after 1500 milliseconds", async () => {
    await render();
    await submit();

    expect(mocks.updateUser).toHaveBeenCalledExactlyOnceWith({
      password: "newpassword",
    });
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(container.textContent).toContain("Password updated");
    expect(mocks.push).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1499);
    });

    expect(mocks.push).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
    });

    expect(mocks.push).toHaveBeenCalledExactlyOnceWith("/login");
  });

  it("shows update errors without signing out or redirecting", async () => {
    mocks.updateUser.mockResolvedValue({
      error: { message: "Password update failed" },
    });
    await render();
    await submit();

    expect(container.textContent).toContain("Password update failed");
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(false);
  });

  it("continues after a reported sign-out error", async () => {
    const error = { message: "Sign-out failed" };
    mocks.signOut.mockResolvedValue({ error });
    await render();
    await submit();

    expect(console.error).toHaveBeenCalledWith(
      "Error signing out after password reset:",
      error,
    );
    expect(container.textContent).toContain("Password updated");

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(mocks.push).toHaveBeenCalledWith("/login");
  });

  it("disables submission while updating the password", async () => {
    let finish!: (value: { error: null }) => void;
    mocks.updateUser.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await render();
    await submit();

    expect(container.textContent).toContain("Updating password...");
    expect(
      container.querySelector<HTMLButtonElement>('button[type="submit"]')
        ?.disabled,
    ).toBe(true);

    await act(async () => {
      finish({ error: null });
    });

    expect(container.textContent).toContain("Password updated");
  });
});
