import { useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Medal, Flame, Trophy, ChevronRight } from "lucide-react";
import type { LeaderboardUser } from "@/lib/services/leaderboard-service-server";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

interface LeaderboardTableProps {
  users: LeaderboardUser[];
  friendIds: string[];
  isLoading?: boolean;
}

export function LeaderboardTable({
  users,
  friendIds,
  isLoading = false,
}: LeaderboardTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<"highest" | "lowest">("highest");
  const [scope, setScope] = useState<"all" | "friends">("all");
  const [page, setPage] = useState(1);

  const pageSize = 10;
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

  const rankedUsers = [...users]
    .sort(
      (a, b) =>
        b.currentStreak - a.currentStreak ||
        b.achievementCount - a.achievementCount ||
        a.id.localeCompare(b.id),
    )
    .map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

  const searchTerm = search.trim().toLowerCase();

  const scopedUsers =
    scope === "friends"
      ? rankedUsers.filter((user) => friendIds.includes(user.id))
      : rankedUsers;

  const matchingUsers = scopedUsers.filter((user) =>
    user.username.toLowerCase().includes(searchTerm),
  );

  const displayUsers =
    sortOrder === "highest" ? matchingUsers : [...matchingUsers].reverse();

  const totalPages = Math.max(1, Math.ceil(displayUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageUsers = displayUsers.slice(startIndex, startIndex + pageSize);

  return (
    <Card className="scroll-py-4 py-0 !rounded-t-xl gap-1">
      <CardHeader className="bg-gray-600 rounded-t-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-2 pt-4 pb-4">
        <CardTitle className="text-white text-md ml-2">
          Select a player to view their profile
        </CardTitle>

        <div className="flex w-full flex-col gap-3 p-1 sm:flex-row sm:items-center sm:justify-end">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <input
              id="leaderboard-search"
              type="search"
              placeholder="Search users..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              className="h-9 w-full rounded-md border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary"
            />
          </div>

          {/* Filters row */}
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <div className="flex flex-1 rounded-md bg-background p-1 shadow-sm sm:flex-none">
              <Button
                type="button"
                size="sm"
                variant={scope === "all" ? "default" : "ghost"}
                className="flex-1 sm:min-w-24"
                onClick={() => {
                  setScope("all");
                  setPage(1);
                }}
              >
                All Users
              </Button>

              <Button
                type="button"
                size="sm"
                variant={scope === "friends" ? "default" : "ghost"}
                className="flex-1 sm:min-w-24"
                onClick={() => {
                  setScope("friends");
                  setPage(1);
                }}
              >
                Friends
              </Button>
            </div>

            <select
              id="leaderboard-sort"
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as "highest" | "lowest");
                setPage(1);
              }}
              className="h-9 w-40 shrink-0 rounded-md border bg-background px-3 text-sm shadow-sm outline-none transition focus:border-primary sm:w-44"
            >
              <option value="highest">Streak: Highest</option>
              <option value="lowest">Streak: Lowest</option>
            </select>
          </div>
        </div>
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
            : pageUsers.map((user) => (
                <div
                  key={user.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/profile/${user.username}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/profile/${user.username}`);
                    }
                  }}
                  className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-muted/60 even:bg-gray-200/20"
                >
                  {/* Rank */}
                  <div className="flex w-8 shrink-0 justify-center">
                    {getRankIcon(user.rank)}
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

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
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
                  <ChevronRight className="size-5 shrink-0 text-gray-400" />
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
                <th className="w-12 p-4">
                  <span className="sr-only">View profile</span>
                </th>
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
                : pageUsers.map((user) => (
                    <tr
                      key={user.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(`/profile/${user.username}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/profile/${user.username}`);
                        }
                      }}
                      className="group cursor-pointer border-b transition-colors last:border-0 hover:bg-muted/60 even:bg-gray-200/20"
                    >
                      <td className="p-3">{getRankIcon(user.rank)}</td>

                      <td className="p-3">
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

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Flame className="size-5 text-orange-400" />

                          <span className="text-sm">{user.currentStreak}</span>
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Trophy className="size-5 text-amber-400" />

                          <span className="text-sm">
                            {user.achievementCount}
                          </span>
                        </div>
                      </td>
                      <td className="w-12 p-3">
                        <ChevronRight
                          className="
      ml-auto size-5
      translate-x-1
      text-gray-400
      opacity-80
      transition-all
      duration-200
      group-hover:translate-x-0
      group-hover:text-gray-600
      group-hover:opacity-100
    "
                        />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!isLoading && (
          <div className="border-t p-4">
            {displayUsers.length === 0 ? (
              <p
                role="status"
                className="text-center text-sm text-muted-foreground"
              >
                {scope === "friends"
                  ? search.trim()
                    ? "No friends match your search."
                    : "None of your friends are on the leaderboard yet."
                  : search.trim()
                    ? "No users match your search."
                    : "No users on the leaderboard yet."}
              </p>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <p role="status" className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}–
                  {Math.min(startIndex + pageSize, displayUsers.length)} of{" "}
                  {displayUsers.length} users
                </p>

                {totalPages > 1 && (
                  <Pagination aria-label="Leaderboard pages">
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
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
