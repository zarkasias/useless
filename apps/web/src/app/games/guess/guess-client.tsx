"use client";

import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { GameScreen } from "@/components/games/game-screen";
import { WordGame } from "@/components/games/words/word-game";
import type { UserGameStats } from "@/lib/types/games";
import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

interface GuessClientProps {
  initialProfile: UserProfile;
  initialEntitlements: UserEntitlements;
  initialStats: UserGameStats | null;
}

export default function GuessClient({
  initialProfile,
  initialEntitlements,
  initialStats,
}: GuessClientProps) {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar
        user={initialProfile}
        isSubscribed={initialEntitlements.isSubscribed}
        subscriptionStatus={initialEntitlements.subscriptionStatus}
      />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <GameScreen
          title="Useless Guess"
          description="Five letters. Six guesses. With zero usefulness."
          icon="/game_icons/guess.webp"
          gamesPlayed={initialStats?.games_played ?? 0}
          wins={initialStats?.wins ?? 0}
          losses={initialStats?.losses ?? 0}
          showBestScore={false}
        >
          <WordGame onGameRecorded={() => { router.refresh(); }} />
        </GameScreen>
      </main>
    </div>
  );
}
