import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { GamesStory } from "@/components/home/games-story";

describe("homepage games access", () => {
  it.each([false, true])(
    "shows only a non-playable preview to guests even when subscription is %s",
    (isSubscribed) => {
      const html = renderToStaticMarkup(
        createElement(GamesStory, {
          isLoggedIn: false,
          isSubscribed,
        }),
      );
      expect(html).not.toContain("<button");
      expect(html).toContain('href="/login?next=/games"');
      expect(html).not.toContain('href="/games/memory"');
      expect(html).toContain("Achievement Memory");
      expect(html).toContain("Useless Solitaire");
      expect(html).toContain("Useless Spider Solitaire");
      expect(html).toContain("Useless Guess");
      expect(html).toContain("Coming soon");
    },
  );

  it("routes signed-in non-subscribers to Pro and provides no playable cards", () => {
    const html = renderToStaticMarkup(
      createElement(GamesStory, {
        isLoggedIn: true,
        isSubscribed: false,
      }),
    );
    expect(html).not.toContain("<button");
    expect(html).toContain('href="/pro"');
    expect(html).not.toContain('href="/games/memory"');
  });

  it("links available cabinet cards for signed-in subscribers", () => {
    const html = renderToStaticMarkup(
      createElement(GamesStory, {
        isLoggedIn: true,
        isSubscribed: true,
      }),
    );
    expect(html).toContain('aria-label="Play Achievement Memory"');
    expect(html).not.toContain("Start again");
    expect(html).not.toContain("Reveal card");
    expect(html).not.toContain('href="/games/guess"');
    expect(html).toContain('href="/games/memory"');
    expect(html).toContain('href="/games/solitaire"');
    expect(html).toContain('href="/games/spider"');
  });
});
