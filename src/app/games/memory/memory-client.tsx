"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { GameScreen } from "@/components/games/game-screen";
import { MemoryGame } from "@/components/games/memory/memory-game";

import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { GameAchievement, UserGameStats } from "@/lib/types/games";

interface MemoryClientProps {
  initialProfile: UserProfile;
  initialEntitlements: UserEntitlements;
  initialAchievements: GameAchievement[];
  initialStats: UserGameStats | null;
}

export default function MemoryClient({
  initialProfile,
  initialEntitlements,
  initialAchievements,
  initialStats,
}: MemoryClientProps) {
  const router = useRouter();
  const winRate =
    initialStats && initialStats.games_played > 0
      ? Math.round((initialStats.wins / initialStats.games_played) * 100)
      : 0;
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar
        user={initialProfile}
        isSubscribed={initialEntitlements.isSubscribed}
        subscriptionStatus={initialEntitlements.subscriptionStatus}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <GameScreen
          title="Achievement Memory"
          description="Match pairs made from achievements you've already collected."
          icon="/game_icons/memory.webp"
          gamesPlayed={initialStats?.games_played ?? 0}
          wins={initialStats?.wins ?? 0}
          winRate={winRate}
          bestScoreLabel="Best"
          bestScore={initialStats?.best_score ?? null}
        >
          <MemoryGame
            achievements={initialAchievements}
            onGameRecorded={() => {
              router.refresh();
            }}
          />
        </GameScreen>
      </main>
    </div>
  );
}
