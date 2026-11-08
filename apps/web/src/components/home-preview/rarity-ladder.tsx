"use client";

import { AchievementCard } from "@/components/achievement-card-updated";
import type { Achievement, AchievementType } from "@/lib/supabase";

const RARITY_ORDER: AchievementType[] = [
  "COMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "GAME",
];

/**
 * One achievement per rarity, Common first, topped up to `count` cards.
 * `exclude` keeps the hero's card out, so the page never shows it twice.
 */
export function pickLadder(
  achievements: Achievement[],
  exclude?: Achievement,
  count = 4,
): Achievement[] {
  const pool = achievements.filter((item) => item.id !== exclude?.id);
  const picked: Achievement[] = [];

  for (const type of RARITY_ORDER) {
    const match = pool.find((item) => item.type === type);

    if (match) picked.push(match);
  }

  for (const item of pool) {
    if (picked.length >= count) break;
    if (!picked.includes(item)) picked.push(item);
  }

  return picked
    .slice(0, count)
    .sort(
      (a, b) => RARITY_ORDER.indexOf(a.type) - RARITY_ORDER.indexOf(b.type),
    );
}

export function RarityLadder({
  achievements,
}: {
  achievements: Achievement[];
}) {
  if (achievements.length === 0) return null;

  return (
    <section
      id="collection"
      className="overflow-clip bg-slate-50 py-16 md:py-24"
      data-story-reveal
    >
      <div className="mx-auto mb-8 max-w-[640px] px-5 text-center">
        <h2 className="m-0 mb-3 text-[clamp(30px,5vw,52px)] font-black leading-[1.02] tracking-[-0.06em] text-gray-800">
          From Common to Legendary.
        </h2>
        <p className="m-0 text-base text-slate-600">
          Some are rarer than others. All are equally useless.
        </p>
      </div>

      {/* Proximity, not mandatory: WebKit re-snaps mandatory rows on load and
          scrolled the whole page down to this section. */}
      <ul
        className="m-0 flex list-none snap-x snap-proximity gap-4 overflow-x-auto scroll-px-5 px-5 pt-2 pb-8 [scrollbar-width:none] md:mx-auto md:max-w-[1200px] md:justify-center md:gap-5 md:px-8"
        aria-label="Example achievements by rarity"
      >
        {achievements.map((achievement) => (
          <li
            key={achievement.id}
            className="w-[280px] shrink-0 snap-center md:w-[300px] md:shrink"
          >
            <AchievementCard
              achievement={achievement}
              variant="compact"
              ingrid
              showShareButton={false}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
