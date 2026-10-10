"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
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
  const [warningError, setWarningError] = useState<string | null>(null);
  const warningOpenRef = useRef(false);
  const wasSignedInRef = useRef(false);
  const isSigningOutRef = useRef(false);
  const logoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staySignedInRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    let sessionCheckVersion = 0;
    let signOutFailed = false;

    const clearTimers = () => {
      if (logoutTimeoutRef.current) clearTimeout(logoutTimeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      logoutTimeoutRef.current = null;
      warningTimeoutRef.current = null;
    };

    const openWarning = () => {
      warningOpenRef.current = true;
      setShowWarning(true);
    };

    const closeWarning = () => {
      warningOpenRef.current = false;
      setShowWarning(false);
      setWarningError(null);
    };

    const finishSignOut = () => {
      if (!active) return;
      // Invalidate any session check started before this sign-out.
      sessionCheckVersion++;
      const shouldRedirect = wasSignedInRef.current;
      wasSignedInRef.current = false;
      clearTimers();
      closeWarning();
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      if (shouldRedirect) {
        router.replace("/");
        router.refresh();
      }
    };

    const logoutUser = async () => {
      if (!active || !wasSignedInRef.current || isSigningOutRef.current) {
        return;
      }
      isSigningOutRef.current = true;
      sessionCheckVersion++;
      clearTimers();
      closeWarning();
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        finishSignOut();
      } catch {
        if (active && wasSignedInRef.current) {
          signOutFailed = true;
          setWarningError("We couldn't sign you out. Please try again.");
          openWarning();
        }
      } finally {
        isSigningOutRef.current = false;
      }
    };

    const getLastActivity = () => {
      const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
      return Number.isFinite(value) && value > 0 ? value : null;
    };

    const scheduleTimers = () => {
      clearTimers();
      if (!active || !wasSignedInRef.current || isSigningOutRef.current || signOutFailed) {
        return;
      }
      const lastActivity = getLastActivity();
      if (lastActivity === null) return;
      const remaining = IDLE_TIMEOUT - (Date.now() - lastActivity);
      if (remaining <= 0) {
        void logoutUser();
        return;
      }
      if (remaining <= WARNING_TIME) {
        openWarning();
      } else {
        closeWarning();
        warningTimeoutRef.current = setTimeout(
          scheduleTimers,
          remaining - WARNING_TIME,
        );
      }
      // Re-read activity when timers fire: another tab may have extended it.
      logoutTimeoutRef.current = setTimeout(scheduleTimers, remaining);
    };

    const recordActivity = (staySignedIn = false) => {
      if (!active || !wasSignedInRef.current || isSigningOutRef.current || signOutFailed) {
        return;
      }
      const lastActivity = getLastActivity();
      // Check the old deadline before a wake-up click can overwrite it.
      if (lastActivity !== null && Date.now() - lastActivity >= IDLE_TIMEOUT) {
        void logoutUser();
        return;
      }
      if (warningOpenRef.current && !staySignedIn) return;
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      scheduleTimers();
    };

    const checkSession = async () => {
      if (!active || isSigningOutRef.current) return false;
      const version = ++sessionCheckVersion;
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();
        if (!active || version !== sessionCheckVersion) return false;
        const missingSession = error && (
          isAuthSessionMissingError(error) ||
          ["session_not_found", "user_not_found", "user_banned"].includes(error.code ?? "")
        );
        if (error && !missingSession) {
          // Keep the existing idle deadline during temporary network errors.
          scheduleTimers();
          return false;
        }
        if (!user || missingSession) {
          finishSignOut();
          return false;
        }
        wasSignedInRef.current = true;
        if (getLastActivity() === null) {
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        }
        scheduleTimers();
        return true;
      } catch {
        if (active && version === sessionCheckVersion) scheduleTimers();
        return false;
      }
    };

    staySignedInRef.current = async () => {
      if (signOutFailed) {
        await logoutUser();
      } else if (await checkSession()) {
        recordActivity(true);
      }
    };

    const handleActivity = () => recordActivity();
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void checkSession();
    };
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key !== LAST_ACTIVITY_KEY && event.key !== null) return;
      if (getLastActivity() === null) void checkSession();
      else scheduleTimers();
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_OUT") {
        finishSignOut();
      } else if (session?.user && !isSigningOutRef.current) {
        if (!wasSignedInRef.current) {
          sessionCheckVersion++;
          signOutFailed = false;
        }
        wasSignedInRef.current = true;
        if (getLastActivity() === null) {
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
        }
        // Defer scheduling: an expired deadline can call signOut, which must
        // not run inside Supabase's authentication callback.
        clearTimers();
        logoutTimeoutRef.current = setTimeout(scheduleTimers, 0);
      }
    });

    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);
    void checkSession();

    return () => {
      active = false;
      subscription.unsubscribe();
      clearTimers();
      staySignedInRef.current = null;
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [router]);

  const handleStaySignedIn = () => {
    void staySignedInRef.current?.();
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
            {warningError ?? (
              <>You&apos;ve been inactive for a while. You&apos;ll be signed out in
                about 5 minutes unless you choose to stay signed in.</>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button className="bg-gray-700" onClick={handleStaySignedIn}>
            {warningError ? "Try signing out again" : "Stay signed in"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
