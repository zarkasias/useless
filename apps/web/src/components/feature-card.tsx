import { fredoka, nunito } from "@/components/utils/title-fonts";
import {
  typeBorderColors,
  typeBadgeColors,
  typeNames,
  rarityTagClass,
} from "@/components/achievement-styles";

import { CalendarDays, Flame, Trophy, Gamepad2 } from "lucide-react";

type FeatureVariant =
  | "daily"
  | "streak"
  | "collection"
  | "leaderboard"
  | "games";

const featureStyles: Record<FeatureVariant, string> = {
  daily: typeBorderColors.RARE,
  streak: "from-gray-100 to-orange-500",
  collection: typeBorderColors.EPIC,
  leaderboard: typeBorderColors.LEGENDARY,
  games: "from-emerald-200 to-lime-500",
};

export function FeatureCard({
  variant,
  title,
  description,
  rotate = "left",
}: {
  variant: FeatureVariant;
  title: string;
  description: string;
  rotate?: "left" | "right";
}) {
  return (
    <div
      className={`h-full rounded-lg bg-gradient-to-br p-[1px] ${rotate === "left" ? "sm:-rotate-1" : "sm:rotate-1"} shadow-sm ${featureStyles[variant]}`}
    >
      <div className="flex h-full flex-col rounded-[8px] bg-gray-50/80 p-3 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex h-26 shrink-0 items-center justify-center">
          <FeatureVisual variant={variant} />
        </div>

        <h3
          className={`${fredoka.className} mt-2 text-lg font-semibold tracking-tight text-gray-700`}
        >
          {title}
        </h3>

        <p
          className={`${nunito.className} mt-2 text-sm leading-[0.975rem] text-gray-600`}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

function FeatureVisual({ variant }: { variant: FeatureVariant }) {
  switch (variant) {
    case "daily":
      return (
        <div
          aria-hidden="true"
          className="-rotate-6 overflow-hidden rounded-xl border-2 border-blue-200 bg-white"
        >
          <div className="bg-blue-100 px-6 py-1 text-center text-xs font-bold uppercase tracking-wider text-blue-700">
            Today
          </div>

          <div className="flex flex-col items-center gap-1 px-6 py-3">
            <CalendarDays className="size-7 text-blue-500" />
            <span className="text-xs font-semibold text-blue-700">
              One tiny win
            </span>
          </div>
        </div>
      );

    case "streak":
      return (
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <Flame className="size-5 text-orange-400/80" aria-hidden="true" />
            <span className="text-sm font-bold text-orange-800">
              3-day streak
            </span>
          </div>

          <div aria-hidden="true" className="mt-3 flex justify-center gap-2">
            {[1, 2, 3].map((day) => (
              <div
                key={day}
                className="flex size-7 items-center justify-center rounded-full border border-green-600 bg-green-500 text-sm font-bold text-white"
              >
                {day}
              </div>
            ))}
          </div>

          <p className="mt-2 text-xs text-orange-800">Example streak</p>
        </div>
      );

    case "collection":
      return (
        <ul
          aria-label="Achievement rarities"
          className="flex flex-wrap justify-center gap-1 max-w-48"
        >
          {(["COMMON", "RARE", "EPIC", "LEGENDARY"] as const).map((rarity) => (
            <li key={rarity}>
              <span className={`${rarityTagClass} ${typeBadgeColors[rarity]}`}>
                {typeNames[rarity]}
              </span>
            </li>
          ))}
        </ul>
      );

    case "leaderboard":
      return (
        <div
          aria-hidden="true"
          className="flex h-full items-end justify-center gap-2 pb-1"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-t-lg border border-amber-200 bg-white font-bold text-amber-800">
            2
          </div>

          <div className="flex flex-col items-center">
            <Trophy className="mb-2 size-6 -rotate-6 text-amber-600" />
            <div className="flex h-16 w-12 items-center justify-center rounded-t-lg border border-amber-300 bg-amber-200 text-xl font-black text-amber-900">
              1
            </div>
          </div>

          <div className="flex h-9 w-12 items-center justify-center rounded-t-lg border border-amber-200 bg-white font-bold text-amber-800">
            3
          </div>
        </div>
      );

    case "games":
      return (
        <div className="text-center">
          <div
            aria-hidden="true"
            className="
          mx-auto
          flex
          size-16
          -rotate-3
          items-center
          justify-center
          rounded-2xl
          border-2
          border-emerald-200
          bg-gradient-to-br
          from-emerald-50
          to-lime-100
          shadow-sm
        "
          >
            <Gamepad2 className="size-8 text-emerald-600" />
          </div>

          <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Pro Games
          </div>
        </div>
      );
  }
}
