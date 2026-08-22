import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal, Flame, Trophy } from "lucide-react";
import type { LeaderboardUser } from "@/lib/leaderboard-service-server";
import React from "react";

interface LeaderboardTableProps {
  users: LeaderboardUser[];
  isLoading?: boolean;
}

export function LeaderboardTable({
  users,
  isLoading = false,
}: LeaderboardTableProps) {
  // Function to determine the user's rank icon
  const getRankIcon = (rank: number): React.ReactNode => {
    switch (rank) {
      case 1:
        return (
          <div className="text-2xl">
            <Medal className="size-6 text-amber-400" />
          </div>
        );
      case 2:
        return (
          <div className="text-2xl">
            <Medal className="size-6 text-gray-400" />
          </div>
        );
      case 3:
        return (
          <div className="text-2xl">
            <Medal className="size-6 text-amber-700" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">
            {rank}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievement Leaders</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Mobile */}
        <div className="divide-y sm:hidden">
          {isLoading
            ? Array(5)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={`mobile-loading-${index}`}
                    className="flex items-center gap-3 p-4"
                  >
                    <Skeleton className="h-8 w-8" />

                    <Skeleton className="h-10 w-10 rounded-full" />

                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))
            : users.map((user, index) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-4 even:bg-gray-200/20"
                >
                  {/* Rank */}
                  <div className="flex w-8 shrink-0 justify-center">
                    {getRankIcon(index + 1)}
                  </div>

                  {/* User */}
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={user.avatar_url || ""} />

                    <AvatarFallback>
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-700 dark:text-gray-200">
                      {user.username}
                    </p>

                    <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Flame className="size-4 text-orange-400" />
                        <span>{user.currentStreak} streak</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Trophy className="size-4 text-amber-400" />
                        <span>{user.achievementCount}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>

        {/* Tablet / Desktop */}
        <div className="hidden overflow-hidden rounded-md sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted">
                <th className="p-4 text-left font-medium">Rank</th>

                <th className="p-4 text-left font-medium">User</th>

                <th className="p-4 text-center font-medium">Streak</th>

                <th className="p-4 text-center font-medium">Achievements</th>
              </tr>
            </thead>

            <tbody>
              {isLoading
                ? Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <tr
                        key={`loading-${index}`}
                        className="border-b last:border-0"
                      >
                        <td className="p-4">
                          <Skeleton className="h-8 w-8" />
                        </td>

                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </td>

                        <td className="p-4 text-center">
                          <Skeleton className="mx-auto h-4 w-8" />
                        </td>

                        <td className="p-4 text-center">
                          <Skeleton className="mx-auto h-4 w-8" />
                        </td>
                      </tr>
                    ))
                : users.map((user, index) => (
                    <tr
                      key={user.id}
                      className="border-b transition-colors last:border-0 hover:bg-muted/60 even:bg-gray-200/20"
                    >
                      <td className="p-4">{getRankIcon(index + 1)}</td>

                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar_url || ""} />

                            <AvatarFallback>
                              {user.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>

                          <p className="font-medium">{user.username}</p>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Flame className="size-5 text-orange-400" />

                          <span className="text-sm">{user.currentStreak}</span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Trophy className="size-5 text-amber-400" />

                          <span className="text-sm">
                            {user.achievementCount}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
