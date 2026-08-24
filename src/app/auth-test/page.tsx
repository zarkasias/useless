"use client";

import { useState } from "react";

import { Achievement } from "@/lib/supabase";
import {
  claimDailyAchievementAction,
  migrateAnonymousAchievementsAction,
} from "@/app/actions/achievement-actions";

import { getCurrentUserEntitlementsAction } from "@/app/actions/entitlement-actions";

import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

export default function AuthTestPage() {
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [entitlements, setEntitlements] = useState<UserEntitlements | null>(
    null,
  );

  const [message, setMessage] = useState("");

  async function handleClaim() {
    setMessage("Claiming...");

    try {
      const result = await claimDailyAchievementAction();

      if (!result) {
        setMessage("You have already claimed today's achievement.");
        return;
      }

      setAchievement(result);
      setMessage("Achievement claimed!");
    } catch (error) {
      console.error(error);
      setMessage("Error claiming achievement.");
    }
  }

  async function handleMigration() {
    setMessage("Migrating anonymous achievements...");

    try {
      const result = await migrateAnonymousAchievementsAction();

      setMessage(
        `Migration complete. Migrated: ${result.migrated}, skipped: ${result.skipped}`,
      );
    } catch (error) {
      console.error("Migration error:", error);
      setMessage("Migration failed.");
    }
  }

  async function handleCheckEntitlements() {
    setMessage("Checking entitlements...");

    try {
      const result = await getCurrentUserEntitlementsAction();

      if (!result) {
        setEntitlements(null);
        setMessage("No authenticated user.");
        return;
      }

      setEntitlements(result);
      setMessage("Entitlements loaded.");
    } catch (error) {
      console.error("Entitlement error:", error);

      setMessage("Unable to load entitlements");
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Achievement Claim Test</h1>

      <button
        onClick={handleClaim}
        className="mt-6 rounded bg-blue-600 px-4 py-2 text-white"
      >
        Claim Todays Achievement
      </button>

      <button
        onClick={handleMigration}
        className="mt-4 rounded border px-4 py-2"
      >
        Migrate Anonymous Achievements
      </button>

      <button
        onClick={handleCheckEntitlements}
        className="mt-4 rounded border px-4 py-2"
      >
        Check Entitlements
      </button>

      <p className="mt-4">{message}</p>

      {achievement && (
        <pre className="mt-6 rounded bg-muted p-4">
          {JSON.stringify(achievement, null, 2)}
        </pre>
      )}

      {entitlements && (
        <pre className="mt-6 rounded bg-muted p-4">
          {JSON.stringify(entitlements, null, 2)}
        </pre>
      )}
    </div>
  );
}
