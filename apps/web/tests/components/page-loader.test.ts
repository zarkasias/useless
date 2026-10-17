// @vitest-environment jsdom

import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PageLoader } from "@/components/ui/page-loader";
import DashboardLoading from "@/app/dashboard/loading";
import CollectionLoading from "@/app/collection/loading";
import FriendsLoading from "@/app/friends/loading";
import GamesLoading from "@/app/games/loading";
import LeaderboardLoading from "@/app/leaderboard/loading";
import PacksLoading from "@/app/packs/loading";
import PackDetailLoading from "@/app/packs/[slug]/loading";
import ProfileLoading from "@/app/profile/[username]/loading";
import ProLoading from "@/app/pro/loading";
import SettingsLoading from "@/app/settings/loading";

function render(element: React.ReactElement): HTMLDivElement {
  const container = document.createElement("div");
  container.innerHTML = renderToStaticMarkup(element);
  return container;
}

describe("PageLoader", () => {
  it("renders the default loading message and supporting text", () => {
    const container = render(createElement(PageLoader));

    expect(container.querySelector("p")?.textContent).toBe("Loading...");
    expect(container.textContent).toContain(
      "Unearthing something wonderfully useless...",
    );
  });

  it("renders a custom loading message", () => {
    const container = render(
      createElement(PageLoader, { message: "Loading your collection..." }),
    );

    expect(container.querySelector("p")?.textContent).toBe(
      "Loading your collection...",
    );
  });

  it("renders an animated loading icon", () => {
    const container = render(createElement(PageLoader));

    expect(container.querySelector("svg.animate-spin")).not.toBeNull();
  });
});

const routes: {
  route: string;
  component: ComponentType;
  message: string;
}[] = [
  {
    route: "dashboard",
    component: DashboardLoading,
    message: "Loading the dashboard...",
  },
  {
    route: "collection",
    component: CollectionLoading,
    message: "Loading the achievement collection...",
  },
  {
    route: "friends",
    component: FriendsLoading,
    message: "Loading your friends list...",
  },
  {
    route: "games",
    component: GamesLoading,
    message: "Loading the games...",
  },
  {
    route: "leaderboard",
    component: LeaderboardLoading,
    message: "Loading the leaderboard...",
  },
  {
    route: "packs",
    component: PacksLoading,
    message: "Loading the achievement packs...",
  },
  {
    route: "pack detail",
    component: PackDetailLoading,
    message: "Loading pack progress...",
  },
  {
    route: "profile",
    component: ProfileLoading,
    message: "Loading user profile...",
  },
  {
    route: "pro",
    component: ProLoading,
    message: "Loading subscription page...",
  },
  {
    route: "settings",
    component: SettingsLoading,
    message: "Loading your settings...",
  },
];

describe("Route loading pages", () => {
  it.each(routes)(
    "renders the shared loader for $route",
    ({ component, message }) => {
      const container = render(createElement(component));

      expect(container.querySelector("p")?.textContent).toBe(message);
      expect(container.querySelector("svg.animate-spin")).not.toBeNull();
      expect(container.textContent).toContain(
        "Unearthing something wonderfully useless...",
      );
    },
  );
});
