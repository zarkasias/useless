import React from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Achievement } from "@/lib/supabase";
import { AchievementCard } from "@/components/achievement-card-updated";

interface UnlockAchievementProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn?: boolean;
}

export function UnlockAchievement({
  achievement,
  isOpen,
  onClose,
  isLoggedIn = false,
}: UnlockAchievementProps) {
  // Early return only if modal shouldn't be shown
  if (!isOpen) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md bg-background border-2 border-primary/20">
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-center text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
            Achievement Unlocked!
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-2 relative z-10">
          {achievement ? (
            <div className="mb-6 w-full max-w-sm">
              <p className="text-center text-sm text-muted-foreground mb-4">
                <span className="font-medium block mb-1">
                  Share your achievement with an image! ✨
                </span>
              </p>
              <AchievementCard
                achievement={achievement}
                isCollected={true}
                showShareButton={true}
              />
            </div>
          ) : (
            <div className="mb-6 p-4 text-center">
              <p>Achievement data is missing. Please try again.</p>
            </div>
          )}

          {!isLoggedIn && achievement && (
            <div className="mb-4 w-full text-center">
              <p className="mb-3 text-sm text-muted-foreground">
                A completely pointless achievement. Worth keeping.
              </p>
              <Button asChild>
                <Link href="/signup">Create an account to keep it</Link>
              </Button>
            </div>
          )}

          <Button
            onClick={() => {
              onClose();
            }}
            className="w-full bg-gradient-to-r from-primary/90 to-blue-500/90 hover:opacity-90 transition-all duration-300 text-white font-medium"
          >
            <span className="mr-2">🎉</span>
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
