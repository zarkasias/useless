"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Navbar } from "@/components/navbar";
import {
  Flame,
  Trophy,
  UserPlus,
  Share2,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AchievementCard } from "@/components/achievement-card-updated";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

import {
  sendFriendRequestAction,
  acceptFriendRequestAction,
  declineFriendRequestAction,
} from "./actions";

import type { Achievement, UserProfile } from "@/lib/supabase";
import type { PublicUserProfile } from "@/lib/services/profile-service-server";
import type { AchievementStreakData } from "@/lib/services/streak-service-server";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import type { FriendshipState } from "@/lib/services/friend-service-server";

interface ProfileClientProps {
  profile: PublicUserProfile;
  achievements: Achievement[];
  streakData: AchievementStreakData;
  viewer: UserProfile | null;
  viewerEntitlements: UserEntitlements | null;
  friendshipState: FriendshipState;
}

export function ProfileClient({
  profile,
  achievements,
  streakData,
  viewer,
  viewerEntitlements,
  friendshipState,
}: ProfileClientProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();

  const pageSize = 10;

  const initials = profile.username.substring(0, 2).toUpperCase();

  const isOwnProfile = viewer?.id === profile.id;

  const friendshipStatus = friendshipState.status;

  const totalPages = Math.max(1, Math.ceil(achievements.length / pageSize));

  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;

  const pageAchievements = achievements.slice(
    startIndex,
    startIndex + pageSize,
  );

  const handleAddFriend = () => {
    startTransition(async () => {
      const result = await sendFriendRequestAction(
        profile.id,
        profile.username,
      );

      if (!result.success) {
        console.error(result.message);
      }

      router.refresh();
    });
  };

  const handleAcceptFriend = () => {
    if (!friendshipState.id) return;

    startTransition(async () => {
      const result = await acceptFriendRequestAction(
        friendshipState.id!,
        profile.username,
      );

      if (!result.success) {
        console.error(result.message);
        return;
      }

      router.refresh();
    });
  };

  const handleDeclineFriend = () => {
    if (!friendshipState.id) return;

    startTransition(async () => {
      const result = await declineFriendRequestAction(
        friendshipState.id!,
        profile.username,
      );

      if (!result.success) {
        console.error(result.message);
        return;
      }

      router.refresh();
    });
  };

  return (
    <div className="min-h-screen bg-transparent">
      <Navbar
        user={viewer}
        isSubscribed={viewerEntitlements?.isSubscribed ?? false}
        subscriptionStatus={viewerEntitlements?.subscriptionStatus ?? null}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-3">
          {viewer && (
            <Link
              href="/leaderboard"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back to Leaderboard
            </Link>
          )}
          {/* Profile Header */}
          <section className="overflow-hidden rounded-lg border bg-background shadow-sm">
            <div className="flex flex-col">
              {/* Profile Information */}
              <div className="flex items-start justify-between">
                <div className="px-6 py-2">
                  <div className="flex gap-5 flex-row items-center">
                    <Avatar className="size-24 border-4 border-background shadow-md">
                      <AvatarImage
                        src={profile.avatar_url || ""}
                        alt={profile.username}
                      />

                      <AvatarFallback className="text-2xl font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Useless Achiever
                      </p>

                      <h1 className="truncate text-3xl font-bold tracking-tight text-gray-700 sm:text-4xl dark:text-gray-200">
                        {profile.username}
                      </h1>
                    </div>
                  </div>
                </div>

                {viewer && (
                  <div className="flex items-center gap-2 mt-2 mr-2">
                    {!isOwnProfile && (
                      <>
                        {friendshipStatus === "none" && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="size-8 shadow-sm"
                            title="Add Friend"
                            aria-label="Add Friend"
                            disabled={isPending}
                            onClick={handleAddFriend}
                          >
                            <UserPlus
                              className={`size-5 ${
                                isPending
                                  ? "animate-pulse text-muted-foreground"
                                  : ""
                              }`}
                            />
                          </Button>
                        )}

                        {friendshipStatus === "pending_sent" && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="size-8 shadow-sm"
                            title="Friend Request Sent"
                            aria-label="Friend Request Sent"
                            disabled
                          >
                            <UserPlus className="size-5 text-amber-500" />
                          </Button>
                        )}

                        {friendshipStatus === "pending_received" && (
                          <>
                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="size-8 shadow-sm"
                              title="Accept Friend Request"
                              aria-label="Accept Friend Request"
                              disabled={isPending}
                              onClick={handleAcceptFriend}
                            >
                              <Check className="size-5 text-green-600" />
                            </Button>

                            <Button
                              type="button"
                              variant="secondary"
                              size="icon"
                              className="size-8 shadow-sm"
                              title="Decline Friend Request"
                              aria-label="Decline Friend Request"
                              disabled={isPending}
                              onClick={handleDeclineFriend}
                            >
                              <X className="size-5 text-red-500" />
                            </Button>
                          </>
                        )}

                        {friendshipStatus === "friends" && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="size-8 shadow-sm"
                            title="Friends"
                            aria-label="Friends"
                            disabled
                          >
                            <UserPlus className="size-5 text-green-600" />
                          </Button>
                        )}
                      </>
                    )}

                    {isOwnProfile && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="size-8 shadow-sm"
                        title="Share Profile"
                        aria-label="Share Profile"
                        onClick={() => {
                          navigator.share?.({
                            title: `${profile.username} on Useless Achievements`,
                            url: window.location.href,
                          });
                        }}
                      >
                        <Share2 className="size-5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Streak footer */}
              <div className="grid grid-cols-2 divide-x divide-white/10 bg-gray-600 text-white">
                <div className="flex items-center gap-3 px-6 py-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-orange-400/80">
                    <Flame className="size-4 text-white" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-lg font-semibold leading-none">
                      {streakData.currentStreak}
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-300">
                      Current streak
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-6 py-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/80">
                    <Trophy className="size-4 text-white" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-lg font-semibold leading-none">
                      {streakData.longestStreak}
                    </div>

                    <div className="mt-1 text-xs font-bold text-slate-300">
                      Best streak
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Achievement Stats */}
          <section>
            <DashboardStats userAchievements={achievements} />
          </section>

          {/* Achievements */}
          <section className="space-y-4 pt-2">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold tracking-tight text-gray-700 sm:text-2xl dark:text-gray-200">
                  Achievements
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  {profile.username}&apos;s completely unnecessary
                  accomplishments.
                </p>
              </div>

              <div className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {achievements.length} collected
              </div>
            </div>

            {achievements.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {pageAchievements.map((achievement) => (
                    <AchievementCard
                      key={achievement.id}
                      achievement={achievement}
                      ingrid={true}
                      showShareButton={false}
                      variant="compact"
                    />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="border-t pt-4">
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}–
                        {Math.min(startIndex + pageSize, achievements.length)}{" "}
                        of {achievements.length} achievements
                      </p>

                      <Pagination aria-label="Achievement pages">
                        <PaginationContent className="w-full justify-between gap-2 sm:w-auto sm:gap-4">
                          <PaginationItem>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11"
                              disabled={currentPage === 1}
                              onClick={() => setPage(currentPage - 1)}
                            >
                              Previous
                            </Button>
                          </PaginationItem>

                          <PaginationItem>
                            <span className="whitespace-nowrap text-sm text-muted-foreground">
                              Page {currentPage} of {totalPages}
                            </span>
                          </PaginationItem>

                          <PaginationItem>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-11"
                              disabled={currentPage === totalPages}
                              onClick={() => setPage(currentPage + 1)}
                            >
                              Next
                            </Button>
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-lg border bg-background p-8 text-center shadow-sm">
                <Trophy className="mx-auto size-8 text-muted-foreground" />

                <p className="mt-3 font-medium text-gray-700 dark:text-gray-200">
                  No achievements yet
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Nothing useless has been accomplished yet.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
