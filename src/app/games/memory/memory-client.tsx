"use client";

import { Navbar } from "@/components/navbar";
import { GameScreen } from "@/components/games/game-screen";
import { MemoryGame } from "@/components/games/memory/memory-game";

import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { GameAchievement } from "@/lib/services/game-service-server";

interface MemoryClientProps {
  initialProfile: UserProfile;
  initialEntitlements: UserEntitlements;
  initialAchievements: GameAchievement[];
}

export default function MemoryClient({
  initialProfile,
  initialEntitlements,
  initialAchievements,
}: MemoryClientProps) {
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
          gamesPlayed={0}
          wins={0}
          bestScoreLabel="Best"
          bestScore={null}
        >
          <MemoryGame achievements={initialAchievements} />
        </GameScreen>
      </main>
    </div>
  );
}
