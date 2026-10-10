import type { ReactNode } from "react";
import { Flame, Trophy } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { PublicUserProfile } from "@/lib/services/profile-service-server";
import type { AchievementStreakData } from "@/lib/services/streak-service-server";

interface ProfileHeaderProps {
  profile: PublicUserProfile;
  streakData: Pick<AchievementStreakData, "currentStreak" | "longestStreak">;
  actions?: ReactNode;
  headingLevel?: "h1" | "h3";
}

export function ProfileHeader({
  profile,
  streakData,
  actions,
  headingLevel = "h1",
}: ProfileHeaderProps) {
  const Heading = headingLevel;
  const initials = profile.username.substring(0, 2).toUpperCase();

  return (
    <section className="overflow-hidden rounded-lg border bg-background shadow-sm">
      <div className="flex flex-col">
        <div className="flex items-start justify-between">
          <div className="min-w-0 px-4 sm:px-6 py-2">
            <div className="flex gap-3 flex-row items-center">
              <Avatar className="size-24 shrink-0 border-4 border-background shadow-md">
                <AvatarImage src={profile.avatar_url || ""} alt={profile.username} />
                <AvatarFallback className="text-2xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-muted-foreground">Useless Achiever</p>
                <Heading className="truncate text-2xl font-bold tracking-tight text-gray-700 sm:text-4xl dark:text-gray-200">
                  {profile.username}
                </Heading>
              </div>
            </div>
          </div>
          {actions}
        </div>

        <div className="grid grid-cols-2 divide-x divide-white/10 bg-gray-600 text-white">
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-400/80">
              <Flame className="size-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold leading-none">{streakData.currentStreak}</div>
              <div className="mt-1 text-xs font-bold text-slate-300">Current streak</div>
            </div>
          </div>
          <div className="flex items-center gap-3 px-4 sm:px-6 py-4">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/80">
              <Trophy className="size-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-lg font-semibold leading-none">{streakData.longestStreak}</div>
              <div className="mt-1 text-xs font-bold text-slate-300">Best streak</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
