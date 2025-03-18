import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Achievement } from '@/lib/supabase';
import { AchievementCard } from '@/components/achievement-card';
// import Link from 'next/link';

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
  // isLoggedIn = false 
}: UnlockAchievementProps) {
  // Enhanced debugging for modal issues
  useEffect(() => {
    if (isOpen) {
      console.log('Achievement modal should open:', { isOpen, hasAchievement: !!achievement });
      if (achievement) {
        console.log('Achievement data:', achievement);
      }
    }
  }, [isOpen, achievement]);

  // Early return only if modal shouldn't be shown
  if (!isOpen) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          console.log('Modal closing via Dialog onOpenChange');
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
                <span className="font-medium block mb-1">Share your achievement with an image! ✨</span>
              </p>
              <AchievementCard 
                achievement={achievement} 
                showShareButton={true} 
              />
            </div>
          ) : (
            <div className="mb-6 p-4 text-center">
              <p>Achievement data is missing. Please try again.</p>
            </div>
          )}
          
          {/* {!isLoggedIn && achievement && (
            <div className="w-full mb-4 p-4 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg text-center border border-primary/20">
              <p className="mb-2 text-sm font-medium">Create an account to save your achievement and unlock more!</p>
              <div className="flex flex-row gap-2 justify-center">
                <Button asChild variant="outline" size="sm" className="bg-white/10 hover:bg-primary/20 transition-all duration-300">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-all duration-300 text-white">
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </div>
            </div>
          )} */}
          
          <Button 
            onClick={() => {
              console.log('Closing modal via button click');
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