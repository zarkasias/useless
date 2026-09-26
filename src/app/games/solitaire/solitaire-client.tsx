"use client";

import { Navbar } from "@/components/navbar";
import { GameScreen } from "@/components/games/game-screen";
import { KlondikeGame } from "@/components/games/solitaire/klondike/klondike-game";

import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

interface SolitaireClientProps {
  initialProfile: UserProfile;
  initialEntitlements: UserEntitlements;
}

export default function SolitaireClient({
  initialProfile,
  initialEntitlements,
}: SolitaireClientProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <Navbar
        user={initialProfile}
        isSubscribed={initialEntitlements.isSubscribed}
        subscriptionStatus={initialEntitlements.subscriptionStatus}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <GameScreen
          title="Useless Solitaire"
          description="A completely unnecessary game of Klondike powered by your questionable free time."
          icon="/game_icons/solitaire.webp"
        >
          <KlondikeGame />
        </GameScreen>
      </main>
    </div>
  );
}
