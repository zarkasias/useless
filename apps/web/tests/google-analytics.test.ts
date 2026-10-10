import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  script: vi.fn(),
}));

type ScriptProps = {
  id?: string;
  src?: string;
  strategy?: string;
  children?: ReactNode;
};

vi.mock("next/script", () => ({
  default: (props: ScriptProps) => {
    mocks.script(props);
    return null;
  },
}));

import GoogleAnalytics from "@/components/GoogleAnalytics";

function scripts(): ScriptProps[] {
  return mocks.script.mock.calls.map(([props]) => props as ScriptProps);
}

beforeEach(() => {
  mocks.script.mockReset();
  renderToStaticMarkup(createElement(GoogleAnalytics));
});

describe("GoogleAnalytics", () => {
  it("loads the Google tag script with the configured measurement ID", () => {
    const externalScripts = scripts().filter((script) => script.src);

    expect(externalScripts).toHaveLength(1);
    expect(externalScripts[0]?.src).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-HE5GPF11ZT",
    );
  });

  it("runs both scripts after the page becomes interactive", () => {
    expect(scripts()).toHaveLength(2);

    for (const script of scripts()) {
      expect(script.strategy).toBe("afterInteractive");
    }
  });

  it("initializes the data layer and configures the matching measurement ID", () => {
    const initialization = scripts().find(
      (script) => script.id === "google-analytics",
    );

    expect(initialization).toBeDefined();
    expect(initialization?.children).toEqual(expect.any(String));

    const code = initialization?.children as string;

    expect(code).toContain("window.dataLayer = window.dataLayer || [];");
    expect(code).toContain("function gtag(){dataLayer.push(arguments);}");
    expect(code).toContain("gtag('js', new Date());");
    expect(code).toContain("gtag('config', 'G-HE5GPF11ZT');");
  });
});
