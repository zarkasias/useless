"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { AchievementsGrid } from "@/components/dashboard/achievements-grid";
import { UnlockAchievement } from "@/components/unlock-achievement";
import { Button } from "@/components/ui/button";
import { Achievement, UserProfile } from "@/lib/supabase";
import { getUserAchievements } from "@/lib/achievement-service";

import { unlockRandomAchievementAction } from "@/app/actions/achievement-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoginForm } from "@/components/auth/login-form";
import { toast } from "sonner";
import { logout } from "@/lib/auth-actions";

interface DashboardClientProps {
  initialProfile: UserProfile;
}

export default function DashboardClient({
  initialProfile,
}: DashboardClientProps) {
  const [user] = useState<UserProfile | null>(initialProfile);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unlockedAchievement, setUnlockedAchievement] =
    useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

  useEffect(() => {
    const loadAchievements = async () => {
      setIsLoading(true);

      const achievements = await getUserAchievements(initialProfile.id);

      setUserAchievements(achievements);
      setIsLoading(false);
    };

    loadAchievements();
  }, [initialProfile.id]);

  const handleLogout = async () => {
    await logout();
  };

  const handleTestAchievement = async () => {
    if (!user) return;

    try {
      const achievement = await unlockRandomAchievementAction();

      if (achievement) {
        setUnlockedAchievement(achievement);
        setShowAchievementModal(true);

        // Refresh achievements list
        const achievements = await getUserAchievements(user.id);
        setUserAchievements(achievements);
      }
    } catch (error) {
      console.error("Error unlocking test achievement:", error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} onLogout={handleLogout} />

      <div className="container mx-auto px-4 py-8 max-w-6xl relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        </div>

        <div className="flex flex-col gap-8 relative z-10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              Your Dashboard
            </h1>
            <Button
              onClick={handleTestAchievement}
              variant="outline"
              className="border-primary/30 bg-white/30 backdrop-blur-sm hover:bg-primary/10 hover:text-primary transition-all duration-300 group"
            >
              <span className="mr-2">🎯</span>
              Unlock Random Achievement
              <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-20">
              <div className="inline-block relative">
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="mt-4 text-muted-foreground">
                  Loading your achievements...
                </p>
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
                  <h2 className="text-xl font-bold mb-1 flex items-center">
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
            <SheetTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
              Login
            </SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <LoginForm />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
