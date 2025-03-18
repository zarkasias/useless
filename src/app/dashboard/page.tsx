'use client';

import { useState, useEffect } from 'react';
import { Navbar } from '@/components/navbar';
import { DashboardStats } from '@/components/dashboard/dashboard-stats';
import { AchievementsGrid } from '@/components/dashboard/achievements-grid';
import { UnlockAchievement } from '@/components/unlock-achievement';
import { Button } from '@/components/ui/button';
import { Achievement, UserAchievement, UserProfile } from '@/lib/supabase';
import { getUserAchievements, getUserProfile, unlockRandomAchievement } from '@/lib/achievement-service';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LoginForm } from '@/components/auth/login-form';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

  // Check authentication and load data
  useEffect(() => {
    const checkUserAndLoadData = async () => {
      setIsLoading(true);
      const { data } = await supabase.auth.getSession();
      
      if (!data.session?.user) {
        // Not authenticated, redirect to homepage
        redirect('/');
        return;
      }
      
      // Get user profile
      const profile = await getUserProfile(data.session.user.id);
      if (profile) {
        setUser(profile);
        
        // Load user achievements
        const achievements = await getUserAchievements(profile.id);
        setUserAchievements(achievements);
      }
      
      setIsLoading(false);
    };
    
    checkUserAndLoadData();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === 'SIGNED_OUT') {
          // Redirect to homepage when signed out
          redirect('/');
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
    toast.success('Logged out successfully');
  };

  const handleLoginSuccess = () => {
    setIsAuthSheetOpen(false);
    toast.success('Logged in successfully');
  };

  const handleTestAchievement = async () => {
    if (!user) return;
    
    try {
      const achievement = await unlockRandomAchievement(user.id);
      
      if (achievement) {
        setUnlockedAchievement(achievement);
        setShowAchievementModal(true);
        
        // Refresh achievements list
        const achievements = await getUserAchievements(user.id);
        setUserAchievements(achievements);
      }
    } catch (error) {
      console.error('Error unlocking test achievement:', error);
      toast.error('Something went wrong');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} onLogin={handleLogin} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>
        
        <div className="flex flex-col gap-8 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Your Dashboard</h1>
            <Button 
              onClick={handleTestAchievement} 
              variant="outline" 
              className="border-primary/30 bg-white/30 backdrop-blur-sm hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
            >
              <span className="mr-2">🎯</span>
              Unlock Random Achievement
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">→</span>
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block relative">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">Loading your achievements...</p>
              </div>
            </div>
          ) : (
            <>
              <DashboardStats 
                userAchievements={userAchievements}
                currentStreak={user?.streak_count || 0}
              />
              
              <div className="mt-8">
                <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-4 rounded-lg mb-6 backdrop-blur-sm">
                  <h2 className="text-xl font-bold mb-2 flex items-center">
                    <span className="mr-2">🏆</span> Your Achievement Collection
                  </h2>
                </div>
                <AchievementsGrid achievements={userAchievements} />
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Achievement unlock modal */}
      <UnlockAchievement
        achievement={unlockedAchievement}
        isOpen={showAchievementModal}
        onClose={() => setShowAchievementModal(false)}
        isLoggedIn={!!user}
      />
      
      {/* Auth sheet */}
      <Sheet open={isAuthSheetOpen} onOpenChange={setIsAuthSheetOpen}>
        <SheetContent className="bg-gradient-to-br from-background to-muted border-l-primary/20">
          <SheetHeader>
            <SheetTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Login</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <LoginForm onSuccess={handleLoginSuccess} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
} 