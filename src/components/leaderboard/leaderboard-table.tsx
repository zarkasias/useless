import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

interface LeaderboardUser extends UserProfile {
  achievementCount: number;
}

interface LeaderboardTableProps {
  users: LeaderboardUser[];
  isLoading?: boolean;
}

export function LeaderboardTable({ users, isLoading = false }: LeaderboardTableProps) {
  // Function to determine the user's rank icon
  const getRankIcon = (rank: number): React.ReactNode => {
    switch (rank) {
      case 1:
        return <div className="text-2xl">🥇</div>;
      case 2:
        return <div className="text-2xl">🥈</div>;
      case 3:
        return <div className="text-2xl">🥉</div>;
      default:
        return <div className="w-8 h-8 flex items-center justify-center text-muted-foreground">{rank}</div>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Achievement Leaders</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden rounded-md">
          <table className="w-full">
            <thead>
              <tr className="bg-muted border-b">
                <th className="text-left p-4 font-medium">Rank</th>
                <th className="text-left p-4 font-medium">User</th>
                <th className="text-center p-4 font-medium">Streak</th>
                <th className="text-center p-4 font-medium">Achievements</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading state
                Array(5).fill(0).map((_, index) => (
                  <tr key={`loading-${index}`} className="border-b last:border-0">
                    <td className="p-4"><Skeleton className="h-8 w-8" /></td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </td>
                    <td className="p-4 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                    <td className="p-4 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                  </tr>
                ))
              ) : (
                // Actual data
                users.map((user, index) => (
                  <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-4">
                      {getRankIcon(index + 1)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar_url || ''} />
                          <AvatarFallback>{user.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm">{user.streak_count}</span>
                        <span className="text-xs">🔥</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-sm">{user.achievementCount}</span>
                        <span className="text-xs">🏆</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
} 