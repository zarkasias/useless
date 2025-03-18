import React, { useState } from 'react';
import { AchievementCard } from '@/components/achievement-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { UserAchievement, AchievementType } from '@/lib/supabase';
import { ChevronDown, Search } from 'lucide-react';

interface AchievementsGridProps {
  achievements: UserAchievement[];
}

type SortOption = 'newest' | 'oldest' | 'rarity';

// Tab theme styles
const tabStyles: Record<string, { color: string, gradient: string, emoji: string }> = {
  all: {
    color: 'text-primary',
    gradient: 'bg-gradient-to-r from-primary/20 to-blue-500/20',
    emoji: '🌈'
  },
  COMMON: {
    color: 'text-gray-600 dark:text-gray-300',
    gradient: 'bg-gradient-to-r from-gray-300/20 to-gray-400/20',
    emoji: '🔹'
  },
  RARE: {
    color: 'text-blue-600 dark:text-blue-300',
    gradient: 'bg-gradient-to-r from-blue-300/20 to-cyan-400/20',
    emoji: '💫'
  },
  EPIC: {
    color: 'text-purple-600 dark:text-purple-300',
    gradient: 'bg-gradient-to-r from-purple-300/20 to-pink-400/20',
    emoji: '✨'
  },
  LEGENDARY: {
    color: 'text-amber-600 dark:text-amber-300',
    gradient: 'bg-gradient-to-r from-amber-300/20 to-orange-400/20',
    emoji: '🌟'
  }
};

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Filter achievements based on active tab and search
  const filteredAchievements = achievements.filter(({ achievement }) => {
    if (!achievement) return false;
    
    // Filter by type (tab)
    if (activeTab !== 'all' && achievement.type !== activeTab) {
      return false;
    }
    
    // Filter by search term
    if (search && !achievement.title.toLowerCase().includes(search.toLowerCase()) && 
        !achievement.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Sort achievements
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (!a.achievement || !b.achievement) return 0;

    if (sortBy === 'newest') {
      return new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime();
    } else if (sortBy === 'oldest') {
      return new Date(a.unlocked_at).getTime() - new Date(b.unlocked_at).getTime();
    } else if (sortBy === 'rarity') {
      const rarityOrder: Record<AchievementType, number> = {
        COMMON: 1,
        RARE: 2,
        EPIC: 3,
        LEGENDARY: 4
      };
      return rarityOrder[b.achievement.type] - rarityOrder[a.achievement.type];
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-primary/70" />
          <Input
            placeholder="Search achievements..."
            className="pl-8 border-primary/20 focus:border-primary/50 bg-white/50 dark:bg-background/50 backdrop-blur-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              className="flex items-center gap-1 border-primary/30 bg-white/30 backdrop-blur-sm hover:bg-primary/10 transition-all duration-300"
            >
              <span className="mr-1">🔄</span> 
              Sort by: {sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
              <ChevronDown className="h-4 w-4 ml-1 text-primary" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="border-primary/20 bg-background/95 backdrop-blur">
            <DropdownMenuLabel className="text-primary">Sort Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => setSortBy('newest')}
              className="hover:bg-primary/10 cursor-pointer flex items-center gap-2"
            >
              <span className="text-primary text-sm">🕒</span> Newest First
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('oldest')}
              className="hover:bg-primary/10 cursor-pointer flex items-center gap-2"
            >
              <span className="text-primary text-sm">📜</span> Oldest First
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setSortBy('rarity')}
              className="hover:bg-primary/10 cursor-pointer flex items-center gap-2"
            >
              <span className="text-primary text-sm">💎</span> By Rarity
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-8 bg-background/50 backdrop-blur-sm border border-primary/20 p-1">
          {Object.entries(tabStyles).map(([value, style]) => (
            <TabsTrigger 
              key={value} 
              value={value}
              className={`data-[state=active]:${style.gradient} data-[state=active]:${style.color} data-[state=active]:shadow-sm transition-all duration-300 data-[state=active]:border-b-2 data-[state=active]:border-b-primary/50`}
            >
              <span className="mr-1">{style.emoji}</span> 
              {value === 'all' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-0">
          {sortedAchievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedAchievements.map((userAchievement, index) => (
                userAchievement.achievement && (
                  <div 
                    key={userAchievement.id} 
                    className="transform transition-all duration-500"
                    style={{ 
                      animationDelay: `${index * 100}ms`,
                      animation: 'fadeIn 0.5s ease-out forwards'
                    }}
                  >
                    <AchievementCard
                      achievement={userAchievement.achievement}
                      unlockedAt={userAchievement.unlocked_at}
                      showShareButton
                    />
                  </div>
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-background to-primary/5 rounded-lg border-2 border-primary/10">
              <p className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">No achievements found</p>
              <p className="text-muted-foreground mt-2">
                {search ? 'Try a different search term' : 'You haven\'t unlocked any achievements in this category yet'}
              </p>
              <div className="mt-6">
                <span className="text-5xl animate-bounce inline-block">🔍</span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
} 