"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { UnlockAchievement } from "@/components/unlock-achievement";
import { Achievement, UserProfile } from "@/lib/supabase";
import { claimDailyAchievementAction } from "@/app/actions/achievement-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LoginForm } from "@/components/auth/login-form";
import { toast } from "sonner";
import { logout } from "@/lib/auth-actions";
import Link from "next/link";

interface HomeClientProps {
  initialProfile: UserProfile | null;
}

export default function HomeClient({ initialProfile }: HomeClientProps) {
  const [user, setUser] = useState<UserProfile | null>(initialProfile);
  const [unlockedAchievement, setUnlockedAchievement] =
    useState<Achievement | null>(null);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);

  const handleLogout = async () => {
    setUser(null);
    await logout();
  };

  const handleGetDailyAchievement = async () => {
    try {
      const achievement = await claimDailyAchievementAction();

      if (!achievement) {
        toast.info(
          user
            ? "You've already claimed today's achievement."
            : "No new achievement is available today. If you've used this browser with an account, log in to continue.",
        );

        return;
      }

      setUnlockedAchievement(achievement);
      setShowAchievementModal(true);

      if (user) {
        toast.success("Today's achievement unlocked!");
      } else {
        toast.success("Today's achievement unlocked!", {
          duration: 5000,
          action: {
            label: "Sign Up",
            onClick: () => {
              window.location.href = "/signup";
            },
          },
        });
      }
    } catch (error) {
      console.error("Error claiming daily achievement:", error);

      toast.error("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} onLogout={handleLogout} />

      <section className="px-4 py-24 md:py-32 bg-gradient-to-b from-background via-primary/5 to-blue-500/10 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-10 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
                Unlock{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 animate-pulse">
                  Useless
                </span>{" "}
                Achievements
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground">
                Celebrate the mundane, embrace the absurd! Our achievements
                validate your everyday digital existence with humor and
                absolutely zero practical value.
              </p>
              <p className="text-xl text-red-500 font-bold">
                Updated with brand new achievements!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleGetDailyAchievement}
                  className="group bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 hover:scale-105 transition-all duration-300 text-white border-0 shadow-md hover:shadow-xl hover:shadow-primary/20"
                >
                  <span className="mr-2 text-2xl group-hover:animate-bounce">
                    <img
                      src="/icons/trophy.png"
                      alt="trophy"
                      className="w-8 h-8"
                    />
                  </span>
                  Claim Useless Achievement
                  <span className="ml-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    →
                  </span>
                </Button>
                {!user && (
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90 hover:scale-105 transition-all duration-300 text-white border-0 shadow-md hover:shadow-xl hover:shadow-purple-500/20"
                  >
                    <Link href="/signup">Sign Up to Track Progress</Link>
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-center">
              <div
                className="relative group cursor-pointer transform-gpu hover:scale-102 transition-all duration-500"
                onClick={handleGetDailyAchievement}
              >
                <Card className="rotate-3 transition-all duration-500 group-hover:rotate-6 group-hover:scale-105 bg-gradient-to-br from-blue-100 to-cyan-200 dark:from-blue-900 dark:to-cyan-800 border-blue-400 border-1 shadow-xl shadow-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200 shadow">
                        Rare
                      </span>
                      <span
                        className="text-4xl animate-bounce"
                        role="img"
                        aria-label="achievement emoji"
                      >
                        🧠
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-blue-800 dark:text-blue-200">
                      Digital Explorer
                    </h3>
                    <p className="text-blue-700 dark:text-blue-300">
                      Found this website when you could be doing literally
                      anything else. Click to discover today&apos;s useless
                      achievement!!
                    </p>
                  </CardContent>
                </Card>

                <Card className="absolute top-5 left-5 -rotate-6 transition-all duration-500 group-hover:-rotate-12 group-hover:scale-95 bg-gradient-to-br from-amber-100 to-orange-300 dark:from-amber-900 dark:to-orange-800 border-amber-400 border-1 shadow-xl shadow-amber-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800 dark:bg-amber-700 dark:text-amber-200 shadow">
                        Legendary
                      </span>
                      <span
                        className="text-4xl animate-pulse"
                        role="img"
                        aria-label="achievement emoji"
                      >
                        <img
                          src="/icons/trophy.png"
                          alt="trophy"
                          className="w-10 h-10"
                        />
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-amber-800 dark:text-amber-200">
                      Achievement Hoarder
                    </h3>
                    <p className="text-amber-700 dark:text-amber-300">
                      Come back each day to discover a new useless achievement.
                      No account required to get started.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-background relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/5 to-transparent"></div>
        </div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
            How It Works
          </h2>
          <p className="text-center text-muted-foreground mb-16 max-w-2xl mx-auto">
            Start claiming achievements right away!! Come back daily to claim a
            new achievement!
          </p>

          <div className="grid gap-10 md:grid-cols-3">
            <div className="text-center space-y-4 group hover:scale-105 transition-all duration-300">
              <div className="mx-auto bg-gradient-to-br from-primary/20 to-blue-500/20 w-20 h-20 rounded-full flex items-center justify-center text-2xl group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                <span className="animate-pulse">
                  <img
                    src="/icons/number-1.png"
                    alt="1"
                    className="w-10 h-10"
                  />
                </span>
              </div>
              <h3 className="text-xl font-bold">Sign Up</h3>
              <p className="text-muted-foreground">
                Create a free account to start unlocking and tracking your
                meaningless achievements.
              </p>
            </div>

            <div className="text-center space-y-4 group hover:scale-105 transition-all duration-300">
              <div className="mx-auto bg-gradient-to-br from-blue-500/10 to-purple-500/10 w-20 h-20 rounded-full flex items-center justify-center text-2xl group-hover:shadow-lg group-hover:shadow-blue-500/20 transition-all duration-300">
                <span className="animate-pulse">
                  <img src="/icons/two.png" alt="1" className="w-10 h-10" />
                </span>
              </div>
              <h3 className="text-xl font-bold">Unlock Daily Achievements</h3>
              <p className="text-muted-foreground">
                Visit daily to unlock new achievements and build up your
                collection of digital trophies.
              </p>
            </div>

            <div className="text-center space-y-4 group hover:scale-105 transition-all duration-300">
              <div className="mx-auto bg-gradient-to-br from-purple-500/10 to-amber-500/10 w-20 h-20 rounded-full flex items-center justify-center text-2xl group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all duration-300">
                <span className="animate-pulse delay-100">
                  <img
                    src="/icons/number-3.png"
                    alt="2"
                    className="w-10 h-10"
                  />
                </span>
              </div>
              <h3 className="text-xl font-bold">Share & Compare</h3>
              <p className="text-muted-foreground">
                Show off your achievements to friends on the social media
                platform of your choice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Achievement unlock modal */}
      {unlockedAchievement && (
        <UnlockAchievement
          achievement={unlockedAchievement}
          isOpen={showAchievementModal}
          onClose={() => {
            setShowAchievementModal(false);
            // Optional: clear the achievement after closing
            // setTimeout(() => setUnlockedAchievement(null), 300);
          }}
          isLoggedIn={!!user}
        />
      )}

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
