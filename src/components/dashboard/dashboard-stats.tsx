import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAchievement, AchievementType } from '@/lib/supabase';

interface DashboardStatsProps {
  userAchievements: UserAchievement[];
  currentStreak: number;
}

// Card themes with gradients for different stat types
const cardThemes = {
  total: {
    gradient: 'bg-gradient-to-br from-primary/10 to-blue-500/10',
    icon: '🏆',
    iconClass: 'text-2xl text-primary animate-pulse',
    border: 'border-primary/20',
    titleColor: 'text-primary'
  },
  streak: {
    gradient: 'bg-gradient-to-br from-amber-500/10 to-red-500/10',
    icon: '🔥',
    iconClass: 'text-2xl text-amber-500 animate-[bounce_2s_ease-in-out_infinite]',
    border: 'border-amber-500/20',
    titleColor: 'text-amber-500'
  },
  rarest: {
    gradient: 'bg-gradient-to-br from-purple-500/10 to-pink-500/10',
    icon: '💎',
    iconClass: 'text-2xl text-purple-500 animate-pulse',
    border: 'border-purple-500/20',
    titleColor: 'text-purple-500'
  },
  latest: {
    gradient: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10',
    icon: '🎯',
    iconClass: 'text-2xl text-green-500 animate-[ping_3s_ease-in-out_infinite]',
    border: 'border-green-500/20',
    titleColor: 'text-green-500'
  }
};

export function DashboardStats({ userAchievements, currentStreak }: DashboardStatsProps) {
  // Calculate stats
  const totalAchievements = userAchievements.length;
  
  // Count achievements by type
  const achievementsByType = userAchievements.reduce((acc, { achievement }) => {
    if (achievement) {
      acc[achievement.type] = (acc[achievement.type] || 0) + 1;
    }
    return acc;
  }, {} as Record<AchievementType, number>);

  // Calculate completion percentages
  const rareCount = achievementsByType['RARE'] || 0;
  const epicCount = achievementsByType['EPIC'] || 0;
  const legendaryCount = achievementsByType['LEGENDARY'] || 0;

  // Get the most recent achievement
  const mostRecentAchievement = userAchievements.length > 0 
    ? userAchievements.sort((a, b) => 
        new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime()
      )[0]
    : null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className={`${cardThemes.total.gradient} border-2 ${cardThemes.total.border} shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${cardThemes.total.titleColor}`}>Total Achievements</CardTitle>
          <div className={cardThemes.total.iconClass}>{cardThemes.total.icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">{totalAchievements}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Keep unlocking more to boost your score!
          </p>
        </CardContent>
      </Card>

      <Card className={`${cardThemes.streak.gradient} border-2 ${cardThemes.streak.border} shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${cardThemes.streak.titleColor}`}>Current Streak</CardTitle>
          <div className={cardThemes.streak.iconClass}>{cardThemes.streak.icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-red-500">
            {currentStreak} <span className="text-xl">{currentStreak === 1 ? 'day' : 'days'}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Return daily to maintain your streak!
          </p>
        </CardContent>
      </Card>

      <Card className={`${cardThemes.rarest.gradient} border-2 ${cardThemes.rarest.border} shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${cardThemes.rarest.titleColor}`}>Rarest Achievement</CardTitle>
          <div className={cardThemes.rarest.iconClass}>{cardThemes.rarest.icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500">
            {legendaryCount > 0 ? 'Legendary' : epicCount > 0 ? 'Epic' : rareCount > 0 ? 'Rare' : 'Common'}
          </div>
          <div className="flex gap-2 mt-1">
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-500">{legendaryCount} legendary</span>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-500">{epicCount} epic</span>
          </div>
        </CardContent>
      </Card>

      <Card className={`${cardThemes.latest.gradient} border-2 ${cardThemes.latest.border} shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className={`text-sm font-medium ${cardThemes.latest.titleColor}`}>Latest Achievement</CardTitle>
          <div className={cardThemes.latest.iconClass}>{cardThemes.latest.icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-md font-bold truncate">
            {mostRecentAchievement?.achievement 
              ? (
                <div className="flex items-center gap-1">
                  <span>{mostRecentAchievement.achievement.emoji}</span>
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-500">
                    {mostRecentAchievement.achievement.title}
                  </span>
                </div>
              ) 
              : 'None yet'}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-1">
            {mostRecentAchievement?.achievement
              ? mostRecentAchievement.achievement.description.substring(0, 40) + '...'
              : 'Unlock your first achievement!'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
} 