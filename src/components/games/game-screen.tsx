import Link from "next/link";
import Image from "next/image";

import { ArrowLeft, Gamepad2, Trophy } from "lucide-react";

import GameStat from "./game-stat";

import type { ReactNode } from "react";

interface GameScreenProps {
  title: string;
  description: string;
  icon: string;

  gamesPlayed?: number;
  wins?: number;
  bestScoreLabel?: string;
  bestScore?: string | number | null;

  children: ReactNode;
}

export function GameScreen({
  title,
  description,
  icon,
  gamesPlayed = 0,
  wins = 0,
  bestScoreLabel = "Best",
  bestScore = null,
  children,
}: GameScreenProps) {
  return (
    <div className="space-y-4">
      {/* Game header */}
      <section className="relative overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400" />

        <div className="p-4 sm:p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-orange-50 shadow-inner">
                <Image
                  src={icon}
                  alt=""
                  width={72}
                  height={72}
                  className="size-16 object-contain drop-shadow-md"
                />
              </div>

              <div className="min-w-0">
                <Link
                  href="/games"
                  className="mb-2 inline-flex items-center gap-1 text-xs font-bold text-muted-foreground transition-colors hover:text-primary"
                >
                  <ArrowLeft className="size-3.5" />
                  Game cabinet
                </Link>

                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-violet-600">
                  <Gamepad2 className="size-3.5" />
                  Useless Games
                </div>

                <h1 className="text-2xl font-black tracking-tight text-gray-700 sm:text-3xl">
                  {title}
                </h1>

                <p className="mt-1 max-w-xl text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            </div>

            {/* Player stats */}
            <div className="grid shrink-0 grid-cols-3 overflow-hidden rounded-xl border bg-muted/30">
              <GameStat label="Played" value={gamesPlayed} />

              <GameStat label="Wins" value={wins} />

              <GameStat
                label={bestScoreLabel}
                value={bestScore ?? "—"}
                icon={<Trophy className="size-3.5" />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Actual game module */}
      <section className="relative overflow-hidden rounded-2xl border bg-slate-50/70 shadow-sm dark:bg-slate-900/30">
        <div className="pointer-events-none absolute -right-24 -top-24 size-64 rounded-full bg-violet-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 size-64 rounded-full bg-orange-300/10 blur-3xl" />

        <div className="relative p-4 sm:p-6">{children}</div>
      </section>
    </div>
  );
}
