"use client";

import Link from "next/link";
import { Trophy, Share2 } from "lucide-react";

import { ProfileHeader } from "@/components/profile/profile-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import type { UserProfile } from "@/lib/supabase";
import { HeroAchievementCard } from "./hero-achievement-card";
import type { ShowcaseAchievement } from "./home-data";
import styles from "./home.module.css";

interface ProfileStoryProps {
  user: UserProfile | null;
  achievements: ShowcaseAchievement[];
}

const demoProfile = {
  id: "homepage-demo-profile",
  username: "Procrastinator",
  avatar_url: null,
};
const demoStreaks = { currentStreak: 14, longestStreak: 42 };
const demoStats = {
  totalAchievements: 68,
  rareCount: 18,
  epicCount: 9,
  legendaryCount: 3,
  secretCount: 0,
};

export function ProfileStory({ user, achievements }: ProfileStoryProps) {
  const profile = demoProfile;
  const cards = achievements.slice(0, 3);
  const profileHref = user
    ? `/profile/${encodeURIComponent(user.username)}`
    : "/signup";

  return (
    <section
      id="profile"
      className={`${styles.section} ${styles.profileSection}`}
    >
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>03 / Make it yours</p>
        <h2>
          A monument to
          <br />
          your minor victories.
        </h2>
        <p>
          Give your accomplishments a home. Build your streak, grow your
          collection, and see where you stand on the leaderboard.
        </p>
      </div>

      <div className={styles.profilePreview}>
        <p className={styles.profilePreviewLabel}>
          Demo profile · Fictional user and example stats
        </p>
        <ProfileHeader
          profile={profile}
          streakData={demoStreaks}
          headingLevel="h3"
          actions={
            <Link href={profileHref} className={styles.profileSharePrompt}>
              <Share2 aria-hidden="true" />
              <span>
                <strong>Share your profile</strong>
                <span>
                  Your collection, stats, and streak—all worth showing off.
                </span>
              </span>
            </Link>
          }
        />
        <DashboardStats userAchievements={[]} summary={demoStats} />

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold tracking-tight text-gray-700 sm:text-2xl dark:text-gray-200">
                Achievements
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Example achievements from the published collection. The profile
                and stats are fictional.
              </p>
            </div>
            <div className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              {demoStats.totalAchievements} collected · demo
            </div>
          </div>

          {cards.length > 0 ? (
            <div className={styles.profileAchievementGrid}>
              {cards.map((achievement) => (
                <HeroAchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  variant="compact"
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-background p-8 text-center shadow-sm">
              <Trophy className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-medium text-gray-700 dark:text-gray-200">
                Achievement artwork is coming soon
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                This fictional profile shows how your collection will look.
              </p>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <Link className={styles.primaryButton} href={profileHref}>
            {user ? "Open my profile ↗" : "Build my profile ↗"}
          </Link>
          <Link
            className={styles.textLink}
            href={user ? "/leaderboard" : "/login?next=/leaderboard"}
          >
            {user
              ? "Meet the overachievers ↗"
              : "Sign in to view the leaderboard ↗"}
          </Link>
        </div>
      </div>
    </section>
  );
}
