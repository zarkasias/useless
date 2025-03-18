'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { UserProfile } from '@/lib/supabase';
import { getLeaderboardUsers, getUserProfile } from '@/lib/achievement-service';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LoginForm } from '@/components/auth/login-form';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

export default function LeaderboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [leaderboardUsers, setLeaderboardUsers] = useState<Array<UserProfile & { achievementCount: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Get leaderboard data
        const users = await getLeaderboardUsers(20);
        setLeaderboardUsers(users);
        
        // Check logged in user
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const profile = await getUserProfile(data.session.user.id);
          if (profile) {
            setUser(profile);
          }
        }
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        toast.error('Failed to load leaderboard data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const profile = await getUserProfile(session.user.id);
          if (profile) {
            setUser(profile);
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogin = () => {
    setIsAuthSheetOpen(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const handleLoginSuccess = () => {
    setIsAuthSheetOpen(false);
    toast.success('Logged in successfully');
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Achievement Leaderboard</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            The most dedicated collectors of pointless achievements. Will you join their ranks?
          </p>
        </div>
        
        <LeaderboardTable users={leaderboardUsers} isLoading={isLoading} />
      </div>
      
      {/* Auth sheet */}
      <Sheet open={isAuthSheetOpen} onOpenChange={setIsAuthSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Login</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}