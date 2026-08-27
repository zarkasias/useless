"use client";

import { Navbar } from "@/components/navbar";

import { Achievement, UserProfile } from "@/lib/supabase";

import type { UserEntitlements } from "@/lib/services/entitlement-service-server";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AchievementCard } from "@/components/achievement-card-updated";
import { Search, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AchievementClientProps {
  initialProfile: UserProfile;
  allAchievements: Achievement[];
  collectedAchievements: Achievement[];
  initialEntitlements: UserEntitlements;
}

type CollectionFilter = "all" | "collected" | "uncollected";

type RarityFilter = "all" | "COMMON" | "RARE" | "EPIC" | "LEGENDARY";

export default function AchievementsClient({
  initialProfile,
  allAchievements,
  collectedAchievements,
  initialEntitlements,
}: AchievementClientProps) {
  const [filter, setFilter] = useState<CollectionFilter>("collected");
  const [searchQuery, setSearchQuery] = useState("");

  const [rarityFilter, setRarityFilter] = useState<RarityFilter>("all");
  const user = initialProfile;

  const collectedIds = useMemo(
    () => new Set(collectedAchievements.map((achievement) => achievement.id)),
    [collectedAchievements],
  );

  const collection = useMemo(
    () =>
      allAchievements.map((achievement) => ({
        achievement,
        isCollected: collectedIds.has(achievement.id),
      })),
    [allAchievements, collectedIds],
  );

  const filteredCollection = useMemo(() => {
    // Step 1: ownership filter
    let results = collection;

    if (filter === "collected") {
      results = results.filter(({ isCollected }) => isCollected);
    }

    if (filter === "uncollected") {
      results = results.filter(({ isCollected }) => !isCollected);
    }

    // Step 2: rarity filter
    if (rarityFilter !== "all") {
      results = results.filter(
        ({ achievement }) => achievement.type === rarityFilter,
      );
    }

    // Step 3: search
    const normalizedSearch = searchQuery.trim().toLowerCase();

    if (normalizedSearch) {
      results = results.filter(
        ({ achievement }) =>
          achievement.title.toLowerCase().includes(normalizedSearch) ||
          achievement.description.toLowerCase().includes(normalizedSearch),
      );
    }

    return results;
  }, [collection, filter, rarityFilter, searchQuery]);

  const collectedCount = collectedAchievements.length;

  const totalCount = allAchievements.length;

  const uncollectedCount = Math.max(totalCount - collectedCount, 0);

  const completionPercentage =
    totalCount > 0 ? Math.round((collectedCount / totalCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar
        user={user}
        isSubscribed={initialEntitlements.isSubscribed}
        subscriptionStatus={initialEntitlements.subscriptionStatus}
      />

      <main className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <header>
            <p className="text-sm font-medium text-muted-foreground">
              Collection
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-700 sm:text-4xl">
              Achievement Collection
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Discover every useless achievement available.
            </p>
          </header>

          {/* Collection Progress */}
          <div>
            <div className="rounded-t-lg bg-gray-600 p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {collectedCount} of {totalCount} collected
                  </p>

                  <p className="mt-1 text-xs text-white">
                    {completionPercentage}% of the collection complete
                  </p>
                </div>

                <p className="text-sm font-medium text-white">
                  {uncollectedCount} remaining
                </p>
              </div>

              {/* Progress Bar */}
              <div className="h-2 mt-2 overflow-hidden rounded-lg bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="rounded-b-lg bg-gray-100/80 p-4 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Button
                    size="sm"
                    variant={filter === "all" ? "default" : "outline"}
                    onClick={() => setFilter("all")}
                    className="w-full sm:w-auto"
                  >
                    All
                    <span className="ml-1.5 opacity-60">{totalCount}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant={filter === "collected" ? "default" : "outline"}
                    onClick={() => setFilter("collected")}
                    className="w-full sm:w-auto"
                  >
                    Collected
                    <span className="ml-1.5 opacity-60">{collectedCount}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant={filter === "uncollected" ? "default" : "outline"}
                    onClick={() => setFilter("uncollected")}
                    className="col-span-2 w-full sm:w-auto"
                  >
                    Uncollected
                    <span className="ml-1.5 opacity-60">
                      {uncollectedCount}
                    </span>
                  </Button>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search achievements..."
                      className="w-full pl-9"
                    />
                  </div>

                  <Select
                    value={rarityFilter}
                    onValueChange={(value) =>
                      setRarityFilter(value as RarityFilter)
                    }
                  >
                    <SelectTrigger className="w-full sm:w-[190px]">
                      <SelectValue placeholder="All rarities" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      <SelectItem value="COMMON">Common</SelectItem>
                      <SelectItem value="RARE">Rare</SelectItem>
                      <SelectItem value="EPIC">Epic</SelectItem>
                      <SelectItem value="LEGENDARY">Legendary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-xs text-muted-foreground">
                  Showing {filteredCollection.length} of {totalCount}{" "}
                  achievements
                </p>
              </div>
            </div>
          </div>

          {/* Collection grid */}

          {filteredCollection.length > 0 ? (
            <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCollection
                .sort((a, b) =>
                  a.achievement.title.localeCompare(b.achievement.title),
                )
                .map(({ achievement, isCollected }) => (
                  <div key={achievement.id} className="relative h-full w-full">
                    <div
                      className={
                        isCollected
                          ? "h-full"
                          : "h-full grayscale opacity-55 transition-all hover:grayscale-[70%] hover:opacity-75"
                      }
                    >
                      <AchievementCard
                        achievement={achievement}
                        isCollected={isCollected}
                        ingrid
                        showShareButton={true}
                      />
                    </div>

                    {!isCollected && (
                      <div className="pointer-events-none absolute right-3 top-3 flex size-10 items-center justify-center rounded-full border bg-gray-300/90 text-muted-foreground shadow-sm backdrop-blur">
                        <Lock className="size-6 text-gray-700" />
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <div className="rounded-lg border bg-background p-10 text-center shadow-sm">
              <p className="font-medium text-gray-700">Nothing here yet.</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Try another collection filter.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
