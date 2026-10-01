"use client";

import { useRouter } from "next/navigation";

import { Navbar } from "@/components/navbar";
import { GameScreen } from "@/components/games/game-screen";
import { SpiderGame } from "@/components/games/solitaire/spider/spider-game";

import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { UserGameStats } from "@/lib/types/games";

interface SpiderClientProps {
  initialProfile: UserProfile;
  initialEntitlements: UserEntitlements;
  initialStats: UserGameStats | null;
}

export default function SpiderClient({
  initialProfile,
  initialEntitlements,
  initialStats,
}: SpiderClientProps) {
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

      <main className="mx-auto w-full max-w-[1440px] px-2 py-4 sm:px-6 sm:py-8 lg:px-8">
        <GameScreen
          title="Useless Spider Solitaire"
          description="Eight legs. Ten columns. Absolutely no reason to be productive."
          icon="/game_icons/spider.webp"
          gamesPlayed={initialStats?.games_played ?? 0}
          wins={initialStats?.wins ?? 0}
          winRate={winRate}
          bestScoreLabel="Best"
          bestScore={initialStats?.best_score ?? null}
        >
          <SpiderGame />
          {/* <KlondikeGame
            onGameRecorded={() => {
              router.refresh();
            }}
          /> */}
        </GameScreen>
      </main>
    </div>
  );
}
