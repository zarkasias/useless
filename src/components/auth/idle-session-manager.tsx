"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

const IDLE_TIMEOUT = 4 * 60 * 60 * 1000;
const WARNING_TIME = 5 * 60 * 1000;

const LAST_ACTIVITY_KEY = "useless-achievements-last-activity";

export function IdleSessionManager() {
  const router = useRouter();

  const [showWarning, setShowWarning] = useState(false);

  const warningOpenRef = useRef(false);

  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleTimersRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const clearTimers = () => {
      if (logoutTimeoutRef.current) {
        clearTimeout(logoutTimeoutRef.current);
        logoutTimeoutRef.current = null;
      }

      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = null;
      }
    };

    const openWarning = () => {
      warningOpenRef.current = true;
      setShowWarning(true);
    };

    const closeWarning = () => {
      warningOpenRef.current = false;
      setShowWarning(false);
    };

    const logoutUser = async () => {
      clearTimers();
      closeWarning();

      setShowWarning(false);

      localStorage.removeItem(LAST_ACTIVITY_KEY);

      await supabase.auth.signOut();

      router.replace("/");
      router.refresh();
    };

    const scheduleTimers = () => {
      clearTimers();

      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));

      if (!lastActivity) {
        return;
      }

      const elapsed = Date.now() - lastActivity;
      const remaining = IDLE_TIMEOUT - elapsed;

      if (remaining <= 0) {
        void logoutUser();
        return;
      }

      if (remaining <= WARNING_TIME) {
        openWarning();
      } else {
        const warningDelay = remaining - WARNING_TIME;

        warningTimeoutRef.current = setTimeout(() => {
          openWarning();
        }, warningDelay);
      }

      logoutTimeoutRef.current = setTimeout(() => {
        void logoutUser();
      }, remaining);
    };

    scheduleTimersRef.current = scheduleTimers;

    const recordActivity = () => {
      if (warningOpenRef.current) {
        return;
      }

      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

      scheduleTimers();
    };

    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
        clearTimers();
        return;
      }

      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

      if (!lastActivity) {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }

      scheduleTimers();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        scheduleTimers();
      }
    };

    const events = ["mousedown", "keydown", "touchstart", "scroll"];

    events.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);

    void checkSession();

    return () => {
      clearTimers();

      events.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });

      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  const handleStaySignedIn = () => {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

    warningOpenRef.current = false;
    setShowWarning(false);
    scheduleTimersRef.current?.();
  };

  return (
    <Dialog open={showWarning} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md bg-gray-100"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onPointerDownOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-gray-700">
            Your session is about to expire
          </DialogTitle>

          <DialogDescription className="text-gray-700">
            You&apos;ve been inactive for a while. You&apos;ll be signed out in
            about 5 minutes unless you choose to stay signed in.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button className="bg-gray-700" onClick={handleStaySignedIn}>
            Stay signed in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
