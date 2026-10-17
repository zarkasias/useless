import { AchievementCard } from "@/components/achievement-card-updated";
import type { Achievement } from "@/lib/supabase";

interface GameAchievementsProps {
  achievements: Achievement[];
}

export default function GameAchievements({
  achievements,
}: GameAchievementsProps) {
  if (achievements.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 space-y-3">
      <div className="text-center text-xs font-black uppercase tracking-[0.2em] text-amber-200/70">
        {achievements.length === 1
          ? "Achievement Unlocked"
          : "Achievements Unlocked"}
      </div>

      <div className="mx-auto w-full max-w-xs space-y-3">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            ingrid={true}
            isCollected={true}
            showShareButton={false}
            variant="compact"
          />
        ))}
      </div>
    </div>
  );
}
