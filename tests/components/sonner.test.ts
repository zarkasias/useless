import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToasterProps } from "sonner";

const mocks = vi.hoisted(() => ({
  useTheme: vi.fn(),
  toaster: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: mocks.useTheme,
}));

vi.mock("sonner", () => ({
  Toaster: (props: ToasterProps) => {
    mocks.toaster(props);
    return null;
  },
}));

import { Toaster } from "@/components/ui/sonner";

function render(props: ToasterProps = {}): ToasterProps {
  renderToStaticMarkup(createElement(Toaster, props));

  expect(mocks.toaster).toHaveBeenCalledTimes(1);

  return mocks.toaster.mock.calls[0]![0] as ToasterProps;
}

beforeEach(() => {
  mocks.useTheme.mockReset();
  mocks.toaster.mockReset();
  mocks.useTheme.mockReturnValue({ theme: undefined });
});

describe("Toaster", () => {
  it("defaults to the system theme when the theme is undefined", () => {
    const props = render();

    expect(props.theme).toBe("system");
  });

  it.each(["light", "dark", "system"] as const)(
    "passes the active %s theme to Sonner",
    (theme) => {
      mocks.useTheme.mockReturnValue({ theme });

      expect(render().theme).toBe(theme);
    },
  );

  it("supplies the default class and CSS variables", () => {
    const props = render();

    expect(props.className).toBe("toaster group");
    expect(props.style).toEqual({
      "--normal-bg": "var(--popover)",
      "--normal-text": "var(--popover-foreground)",
      "--normal-border": "var(--border)",
    });
  });

  it("forwards toast configuration", () => {
    const toastOptions = {
      duration: 2500,
      className: "custom-toast",
    };

    const props = render({
      position: "bottom-left",
      richColors: true,
      closeButton: true,
      toastOptions,
    });

    expect(props.position).toBe("bottom-left");
    expect(props.richColors).toBe(true);
    expect(props.closeButton).toBe(true);
    expect(props.toastOptions).toBe(toastOptions);
  });

  it("allows callers to override the theme, class, and style", () => {
    mocks.useTheme.mockReturnValue({ theme: "dark" });

    const style = { backgroundColor: "rebeccapurple" };
    const props = render({
      theme: "light",
      className: "custom-toaster",
      style,
    });

    expect(props.theme).toBe("light");
    expect(props.className).toBe("custom-toaster");
    expect(props.style).toBe(style);
  });
});
