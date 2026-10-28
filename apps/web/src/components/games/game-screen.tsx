import Link from "next/link";
import Image from "next/image";

import { ArrowLeft, Gamepad2, Trophy } from "lucide-react";

import GameStat from "./game-stat";

import type { ReactNode } from "react";

interface GameScreenProps {
  title: string;
  description: string;
  icon: string;

  showBestScore?: boolean;
  gamesPlayed?: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  bestScoreLabel?: string;
  bestScore?: string | number | null;

  children: ReactNode;
}

export function GameScreen({
  title,
  description,
  icon,
  showBestScore = true,
  gamesPlayed = 0,
  wins = 0,
  losses,
  winRate,
  bestScoreLabel = "Best",
  bestScore = null,
  children,
}: GameScreenProps) {
  const columnCount = 2 + Number(losses !== undefined) + Number(winRate !== undefined) + Number(showBestScore);
  const columnClasses: Record<number, string> = {
    2: "grid-cols-2", 3: "grid-cols-3", 4: "grid-cols-4", 5: "grid-cols-5",
  };

  return (
    <div className="space-y-4">
      {/* Game header */}
      <section className="relative overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <div>
                  <Link
                    href="/games"
                    className="mb-2 inline-flex sm:hidden items-center gap-1 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
                  >
                    <ArrowLeft className="size-3.5" />
                    Back
                  </Link>
                </div>
                <div className="flex size-12 sm:size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-orange-50 shadow-inner">
                  <Image
                    src={icon}
                    alt=""
                    width={72}
                    height={72}
                    className="size-10 sm:size-16 object-contain drop-shadow-md"
                  />
                </div>
              </div>

              <div className="w-full">
                <div className="flex sm:flex-col gap-2 sm:gap-0 items-center sm:items-start justify-end sm:justify-start">
                  <Link
                    href="/games"
                    className="hidden mb-2 sm:inline-flex items-center gap-1 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
                  >
                    <ArrowLeft className="size-3.5" />
                    Back
                  </Link>

                  <div className="mb-2 sm:mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-violet-600">
                    <Gamepad2 className="size-3.5" />
                    Useless Games
                  </div>
                </div>

                <h1 className="text-xl font-black tracking-tight text-gray-700 sm:text-3xl">
                  {title}
                </h1>

                <p className="hidden sm:block mt-1 max-w-xl text-xs sm:text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>

            {/* Player stats */}
            <div className={`grid shrink-0 ${columnClasses[columnCount]} overflow-hidden rounded-xl border bg-muted/30`}>
              <GameStat label="Played" value={gamesPlayed} />
              <GameStat label="Wins" value={wins} />
              {losses !== undefined && <GameStat label="Losses" value={losses} />}
              {winRate !== undefined && <GameStat label="Win Rate" value={`${winRate}%`} />}
              {showBestScore && (
                <GameStat label={bestScoreLabel} value={bestScore ?? "—"} icon={<Trophy className="size-3.5" />} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Actual game module */}
      <section className="relative overflow-hidden dark:bg-slate-900/30">
        <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-violet-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-orange-300/10 blur-3xl" />

        <div className="relative">{children}</div>
      </section>
    </div>
  );
}
