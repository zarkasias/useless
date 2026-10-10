"use client";

import { useEffect } from "react";

import { updateUserTimezoneAction } from "@/app/actions/timezone-actions";

interface TimeZoneSyncProps {
  currentTimezone?: string | null;
}

export function Timezonesync({ currentTimezone }: TimeZoneSyncProps) {
  useEffect(() => {
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!detectedTimezone) {
      return;
    }

    if (detectedTimezone === currentTimezone) {
      return;
    }

    updateUserTimezoneAction(detectedTimezone).catch((error) => {
      console.error("Unable to sync user timezone:", error);
    });
  }, [currentTimezone]);

  return null;
}
