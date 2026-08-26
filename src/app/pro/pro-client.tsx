"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Check, Sparkles } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

import type { UserProfile } from "@/lib/supabase";
import {
  createSubscriptionCheckoutAction,
  changeSubscriptionPlanAction,
  createCustomerPortalAction,
} from "../actions/subscription-actions";

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
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

  const isSubscribed = initialEntitlements?.isSubscribed ?? false;

  const subscriptionStatus = initialEntitlements?.subscriptionStatus ?? null;

  const [currentBillingInterval, setCurrentBillingInterval] = useState<
    string | null
  >(initialEntitlements?.billingInterval ?? null);

  const isPastDue = subscriptionStatus === "past_due";

  const isCurrentPlan =
    isSubscribed && currentBillingInterval === billingInterval;

  const handleManageSubscription = async () => {
    try {
      setIsCheckingOut(true);

      await createCustomerPortalAction();
    } catch (error) {
      console.error("Unable to open subscription management:", error);

      setIsCheckingOut(false);
    }
  };

  const handlePlanAction = async () => {
    try {
      setIsCheckingOut(true);

      if (isSubscribed) {
        const result = await changeSubscriptionPlanAction(billingInterval);

        if (result.changed) {
          setCurrentBillingInterval(result.interval);
        }

        router.refresh();

        return;
      }

      await createSubscriptionCheckoutAction(billingInterval);
    } catch (error) {
      console.error("Unable to update subscription:", error);
    } finally {
      if (isSubscribed) {
        setIsCheckingOut(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar
        user={initialProfile}
        isSubscribed={isSubscribed}
        subscriptionStatus={initialEntitlements?.subscriptionStatus}
      />

      <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="text-center mx-auto">
          <div className="flex flex-col gap-3 items-center justify-center sm:flex-row">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gray-200/40">
              <Sparkles className="size-5 text-purple-700" />
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

        {isSubscribed && (
          <div
            className="mx-auto mt-8 flex max-w-xl items-center justify-between gap-4 rounded-lg border bg-background p-4 shadow-sm 
  sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-700">
                Your subscription
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                You&apos;re currently subscribed to the{" "}
                <span className="font-medium text-gray-700">
                  {currentBillingInterval === "year" ? "Annual" : "Monthly"}
                </span>{" "}
                plan.
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={isCheckingOut}
              className="shrink-0"
            >
              Manage subscription
            </Button>
          </div>
        )}

        {isPastDue && (
          <div className="mx-auto mt-8 max-w-xl rounded-lg border border-amber-300 bg-amber-50 p-4 text-center">
            <p className="text-sm font-semibold text-amber-800">
              There&apos;s a problem with your payment
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Your subscription is still active for now, but your payment method
              needs attention.
            </p>
          </div>
        )}

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

            <Button
              className="mt-8 w-full"
              disabled={isCurrentPlan || isCheckingOut}
              onClick={handlePlanAction}
            >
              {isCheckingOut
                ? "Opening checkout..."
                : isCurrentPlan
                  ? "Current plan"
                  : isSubscribed
                    ? billingInterval === "month"
                      ? "Switch to Monthly"
                      : "Switch to Annual"
                    : billingInterval === "month"
                      ? "Subscribe Monthly"
                      : "Subscribe Annually"}
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
