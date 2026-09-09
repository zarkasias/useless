import { useMemo, useState } from "react";
import {
  Gem,
  CalendarArrowDown,
  CalendarArrowUp,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Trophy,
} from "lucide-react";

import { AchievementCard } from "@/components/achievement-card-updated";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Achievement, AchievementType } from "@/lib/supabase";

interface AchievementsGridProps {
  achievements: Achievement[];
}

type SortOption = "newest" | "oldest" | "rarity";

const tabs: Array<{
  value: "all" | AchievementType;
  label: string;
}> = [
  { value: "all", label: "All" },
  { value: "COMMON", label: "Common" },
  { value: "RARE", label: "Rare" },
  { value: "EPIC", label: "Epic" },
  { value: "LEGENDARY", label: "Legendary" },
];

const rarityOrder: Record<AchievementType, number> = {
  COMMON: 1,
  RARE: 2,
  EPIC: 3,
  LEGENDARY: 4,
};

const sortLabels: Record<SortOption, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  rarity: "Highest rarity",
};

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const sortedAchievements = useMemo(() => {
    const filtered = achievements.filter((achievement) => {
      if (activeTab !== "all" && achievement.type !== activeTab) {
        return false;
      }

      if (!search.trim()) {
        return true;
      }

      const query = search.toLowerCase();

      return (
        achievement.title.toLowerCase().includes(query) ||
        achievement.description.toLowerCase().includes(query)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "rarity") {
        return rarityOrder[b.type] - rarityOrder[a.type];
      }

      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();

      return sortBy === "newest" ? bDate - aDate : aDate - bDate;
    });
  }, [achievements, activeTab, search, sortBy]);

  return (
    <div className="space-y-5">
      {/* Search and sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

          <Input
            placeholder="Search your achievements..."
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="justify-between gap-2 sm:min-w-44"
            >
              <SlidersHorizontal className="size-4" />

              <span>{sortLabels[sortBy]}</span>

              <ChevronDown className="ml-auto size-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Sort achievements</DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setSortBy("newest")}
              className="cursor-pointer gap-2"
            >
              <CalendarArrowDown className="size-4" />
              Newest first
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setSortBy("oldest")}
              className="cursor-pointer gap-2"
            >
              <CalendarArrowUp className="size-4" />
              Oldest first
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setSortBy("rarity")}
              className="cursor-pointer gap-2"
            >
              <Gem className="size-4" />
              Highest rarity
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Type filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="shrink-0 px-4 py-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Results */}
      {sortedAchievements.length > 0 ? (
        <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {sortedAchievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              ingrid
              achievement={achievement}
              showShareButton
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Trophy className="size-9 text-muted-foreground" />

          <h3 className="mt-4 text-base font-semibold">
            No achievements found
          </h3>

          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {search
              ? "Try another search term or choose a different category."
              : "You haven't unlocked any achievements in this category yet."}
          </p>
        </div>
      )}
    </div>
  );
}
