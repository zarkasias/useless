"use client";

import { Navbar } from "@/components/navbar";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { UserProfile } from "@/lib/supabase";
import type { LeaderboardUser } from "@/lib/services/leaderboard-service-server";

interface LeaderboardClientProps {
  initialProfile: UserProfile | null;
  initialUsers: LeaderboardUser[];
}

export default function LeaderboardClient({
  initialProfile,
  initialUsers,
}: LeaderboardClientProps) {
  const user = initialProfile;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar user={user} />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <header>
            <p className="text-sm font-medium text-muted-foreground">
              Rankings
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-700 sm:text-4xl">
              Achievement Leaderboard
            </h1>

            <p className="mt-2 max-w-2xl text-xs text-muted-foreground">
              See who has devoted the most effort to accomplishing absolutely
              nothing useful.
            </p>
          </header>

          <LeaderboardTable users={initialUsers} isLoading={false} />
        </div>
      </main>
    </div>
  );
}
