"use client";

import { useState } from "react";

import { Check, Sparkles } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

import type { UserProfile } from "@/lib/supabase";

import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

interface ProClientProps {
  initialProfile: UserProfile | null;
  initialEntitlements: UserEntitlements | null;
}

type BillingInterval = "month" | "year";

export default function ProClient({
  initialProfile,
  initialEntitlements,
}: ProClientProps) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("year");

  const isSubscribed = initialEntitlements?.isSubscribed ?? false;

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar user={initialProfile} isSubscribed={isSubscribed} />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center mx-auto">
          <div className="flex flex-col gap-3 items-center justify-center sm:flex-row">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-5 text-purple-500" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500 sm:text-4xl">
              Keep the uselessness going.
            </h1>
          </div>

          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Keep collecting achievements, protect your streak, and continue
            climbing the leaderboard.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mx-auto mt-8 grid max-w-sm grid-cols-2 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setBillingInterval("month")}
            className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              billingInterval === "month"
                ? "bg-background text-gray-700 shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Monthly
          </button>

          <button
            type="button"
            onClick={() => setBillingInterval("year")}
            className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              billingInterval === "year"
                ? "bg-background text-gray-700 shadow-sm"
                : "text-muted-foreground"
            }`}
          >
            Annual
            <span className="ml-2 text-xs text-primary">Save 30%</span>
          </button>
        </div>

        {/* Plans */}
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-lg border bg-background p-6 shadow-sm">
            <p className="text-sm font-semibold text-muted-foreground">Free</p>

            <div className="mt-4 text-4xl font-bold text-gray-700">$0</div>

            <p className="mt-2 text-sm text-muted-foreground">
              Get started and collect your first five achievements.
            </p>

            <div className="mt-6 space-y-3">
              <Feature text="5 free achievements" />
              <Feature text="Achievement collection" />
              <Feature text="Basic leaderboard access" />
              <Feature text="Daily streak tracking" />
            </div>

            <Button
              variant="outline"
              className="mt-8 w-full"
              disabled={!isSubscribed}
            >
              {!isSubscribed ? "Current plan" : "Free plan"}
            </Button>
          </div>

          {/* Pro */}
          <div className="relative rounded-lg border-2 border-primary bg-secondary p-6 shadow-md">
            <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 px-3 py-1 text-xs font-semibold text-primary-foreground">
              Recommended
            </div>

            <p className="text-sm font-semibold text-primary">Pro</p>

            <div className="mt-4 flex items-end gap-1">
              <span className="text-4xl font-bold text-gray-700">
                {billingInterval === "month" ? "$2.99" : "$24.99"}
              </span>

              <span className="pb-1 text-sm text-muted-foreground">
                {billingInterval === "month" ? "/month" : "/year"}
              </span>
            </div>

            {billingInterval === "year" && (
              <p className="mt-2 text-xs text-muted-foreground">
                About $2.08 per month, billed annually.
              </p>
            )}

            <div className="mt-6 space-y-3">
              <Feature text="Unlimited achievements" />
              <Feature text="Keep building your streak" />
              <Feature text="Full leaderboard participation" />
              <Feature text="Full achievement collection" />
            </div>

            <Button className="mt-8 w-full" disabled={isSubscribed}>
              {isSubscribed
                ? "You're already Pro"
                : billingInterval === "month"
                  ? "Upgrade Monthly"
                  : "Upgrade Annually"}
            </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
              Cancel anytime.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-700">
      <Check className="size-4 shrink-0 text-primary" />
      {text}
    </div>
  );
}
