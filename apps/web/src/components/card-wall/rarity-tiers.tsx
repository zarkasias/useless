"use client";

import type { Achievement, AchievementType } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import styles from "./card-wall.module.css";
import { CardFace, rarityClass } from "./wall-card";

const TIERS: AchievementType[] = ["COMMON", "RARE", "EPIC", "LEGENDARY"];

/** The first catalog entry of each rarity, Common to Legendary. */
export function pickTiers(catalog: Achievement[]): Achievement[] {
  return TIERS.flatMap((type) => {
    const match = catalog.find((achievement) => achievement.type === type);

    return match ? [match] : [];
  });
}

/** "From Common to Legendary": one example card per rarity. */
export function RarityTiers({
  catalog,
  className,
}: {
  catalog: Achievement[];
  className?: string;
}) {
  const tiers = pickTiers(catalog);

  if (tiers.length === 0) return null;

  return (
    <section
      id="collection"
      className={cn("flex flex-col gap-9 text-center", className)}
      data-story-reveal
    >
      <div className="flex flex-col gap-3">
        <h2 className="m-0 text-[clamp(30px,4.2vw,48px)] leading-none font-black tracking-[-0.04em] text-gray-800">
          From Common to Legendary.
        </h2>
        <p className="m-0 text-[19px] leading-normal text-gray-600 max-[720px]:text-[17px]">
          Some are rarer than others. All are equally useless.
        </p>
      </div>
      <ul
        className="m-0 grid list-none grid-cols-4 gap-5 p-0 max-[720px]:grid-cols-2 max-[720px]:gap-3.5"
        aria-label="Example achievements by rarity"
      >
        {tiers.map((achievement) => (
          <li
            key={achievement.id}
            className={cn(
              styles.card,
              styles.static,
              rarityClass(achievement.type),
            )}
          >
            <CardFace achievement={achievement} locked={false} iconSize={96} />
          </li>
        ))}
      </ul>
    </section>
  );
}
