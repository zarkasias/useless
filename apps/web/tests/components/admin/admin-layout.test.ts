// @vitest-environment jsdom

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  redirect: vi.fn(),
  adminNav: vi.fn(),
}));

vi.mock("@/lib/auth/require-admin", () => ({
  requireAdmin: mocks.requireAdmin,
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/components/admin/admin-nav", () => ({
  AdminNav: () => {
    mocks.adminNav();
    return createElement("nav", { "aria-label": "Admin navigation" });
  },
}));

import AdminLayout from "@/app/admin/layout";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockReset();
  mocks.redirect.mockReset();

  mocks.requireAdmin.mockResolvedValue({
    user: { id: "admin-1" },
    profile: { id: "admin-1", role: "admin" },
  });

  mocks.redirect.mockImplementation(() => {
    throw new Error("TEST_REDIRECT");
  });
});

describe("AdminLayout", () => {
  it("renders the admin header, navigation, and protected content", async () => {
    const element = await AdminLayout({
      children: createElement("main", null, "Protected admin content"),
    });

    const container = document.createElement("div");
    container.innerHTML = renderToStaticMarkup(element);

    expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).not.toHaveBeenCalled();

    const homeLink = container.querySelector("header a");
    expect(homeLink?.textContent).toBe("Useless Achievements Admin");
    expect(homeLink?.getAttribute("href")).toBe("/admin");

    expect(
      container.querySelector('nav[aria-label="Admin navigation"]'),
    ).not.toBeNull();
    expect(container.querySelector("main")?.textContent).toBe(
      "Protected admin content",
    );
    expect(mocks.adminNav).toHaveBeenCalledTimes(1);
  });

  it.each(["Unauthorized", "Forbidden", "Unable to verify administrator."])(
    "redirects to the dashboard when verification fails: %s",
    async (message) => {
      mocks.requireAdmin.mockRejectedValue(new Error(message));

      await expect(
        AdminLayout({
          children: createElement("main", null, "Protected admin content"),
        }),
      ).rejects.toThrow("TEST_REDIRECT");

      expect(mocks.requireAdmin).toHaveBeenCalledTimes(1);
      expect(mocks.redirect).toHaveBeenCalledExactlyOnceWith("/dashboard");
      expect(mocks.adminNav).not.toHaveBeenCalled();
    },
  );

  it("waits for admin verification before returning the layout", async () => {
    let finishVerification!: () => void;

    mocks.requireAdmin.mockReturnValue(
      new Promise<void>((resolve) => {
        finishVerification = resolve;
      }),
    );

    const completed = vi.fn();
    const pendingLayout = AdminLayout({ children: "Admin content" }).then(
      (element) => {
        completed();
        return element;
      },
    );

    await Promise.resolve();

    expect(completed).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();

    finishVerification();
    await pendingLayout;

    expect(completed).toHaveBeenCalledTimes(1);
    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});
