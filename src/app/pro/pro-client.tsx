"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Sparkles, Trophy } from "lucide-react";

import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";

import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

import {
  createSubscriptionCheckoutAction,
  changeSubscriptionPlanAction,
} from "../actions/subscription-actions";

interface ProClientProps {
  initialProfile: UserProfile | null;
  initialEntitlements: UserEntitlements | null;
}

type BillingInterval = "month" | "year";

export default function ProClient({
  initialProfile,
  initialEntitlements,
}: ProClientProps) {
  const router = useRouter();

  const isLoggedIn = !!initialProfile;

  const isSubscribed = initialEntitlements?.isSubscribed ?? false;

  const subscriptionStatus = initialEntitlements?.subscriptionStatus ?? null;

  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    initialEntitlements?.billingInterval === "month" ? "month" : "year",
  );

  const [currentBillingInterval, setCurrentBillingInterval] =
    useState<BillingInterval | null>(
      initialEntitlements?.billingInterval === "month" ||
        initialEntitlements?.billingInterval === "year"
        ? initialEntitlements.billingInterval
        : null,
    );

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const isPastDue = subscriptionStatus === "past_due";

  const isCurrentPlan =
    isSubscribed && currentBillingInterval === billingInterval;

  const handlePlanAction = async () => {
    if (!isLoggedIn) {
      router.push("/signup");
      return;
    }

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
    <div className="min-h-screen">
      <Navbar
        user={initialProfile}
        isSubscribed={isSubscribed}
        subscriptionStatus={subscriptionStatus}
      />

      <main className="relative">
        {/* Hero background */}
        <section className="relative bg-gradient-to-b from-violet-50 to-blue-50 px-4 pb-10 pt-10">
          {/* Decorative shapes */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[8%] top-20 size-3 rotate-12 rounded-sm bg-yellow-300 sm:size-4" />
            <div className="absolute right-[10%] top-28 size-4 rotate-45 rounded-sm bg-violet-300 sm:size-5" />
            <div className="absolute left-[18%] bottom-20 size-3 rounded-full bg-blue-300" />
            <div className="absolute right-[16%] bottom-16 size-3 rounded-full bg-pink-300" />

            <div className="absolute left-1/2 top-8 size-72 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl sm:size-96" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl text-center">
            <div className="mx-auto inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-violet-200 bg-white/90 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm backdrop-blur">
              <Sparkles className="size-4" />
              Unlimited uselessness awaits
            </div>

            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-[0.95] tracking-tight text-gray-800 sm:text-5xl lg:text-6xl">
              Unlock{" "}
              <span className="inline-block -rotate-1 bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                unlimited uselessness.
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Collect unlimited ridiculous achievements, protect your streak,
              and climb the leaderboard for absolutely no good reason.
            </p>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-transparent px-4 pb-20 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">
            {isPastDue && (
              <div className="mx-auto mb-8 max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-center shadow-sm">
                <p className="text-sm font-semibold text-amber-800">
                  There&apos;s a problem with your payment
                </p>

                <p className="mt-1 text-sm text-amber-700">
                  Your subscription is still active for now, but your payment
                  method needs attention.
                </p>
              </div>
            )}

            {/* Billing toggle */}
            <div className="mx-auto grid max-w-sm grid-cols-2 rounded-full bg-muted p-1.5 shadow-inner">
              <button
                type="button"
                onClick={() => setBillingInterval("month")}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                  billingInterval === "month"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Monthly
              </button>

              <button
                type="button"
                onClick={() => setBillingInterval("year")}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                  billingInterval === "year"
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Annual
                <span className="ml-2 text-xs font-bold text-violet-600">
                  Save 30%
                </span>
              </button>
            </div>

            {/* Plans */}
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {/* Free */}
              <div className="relative rounded-3xl border bg-white p-6 shadow-sm transition-transform md:hover:-translate-y-1 md:hover:shadow-md sm:p-7">
                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-blue-50">
                  <Trophy className="size-5 text-blue-500" />
                </div>

                <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Free
                </p>

                <div className="mt-3 text-4xl font-black text-gray-800">$0</div>

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Dip a toe into the completely unnecessary world of useless
                  achievements.
                </p>

                <div className="mt-6 space-y-3">
                  <Feature text="5 free achievements" />
                  <Feature text="Achievement collection" />
                  <Feature text="Basic leaderboard access" />
                  <Feature text="Daily streak tracking" />
                </div>

                {!isLoggedIn ? (
                  <Button
                    variant="outline"
                    className="mt-8 h-11 w-full rounded-full font-semibold"
                    onClick={() => router.push("/signup")}
                  >
                    Start free
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="mt-8 h-11 w-full rounded-full font-semibold"
                    disabled
                  >
                    {!isSubscribed ? "Current plan" : "Free plan"}
                  </Button>
                )}
              </div>

              {/* Pro */}
              <div className="relative rounded-3xl border-2 border-violet-300 bg-gradient-to-b from-violet-50 via-white to-blue-50 p-6 shadow-lg shadow-violet-500/10 transition-transform md:hover:-translate-y-1 sm:p-7">
                <div className="absolute -top-3 right-5 rotate-2 rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-md">
                  MOST USELESS
                </div>

                <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-violet-100">
                  <Sparkles className="size-5 text-violet-600" />
                </div>

                <p className="text-sm font-bold uppercase tracking-wide text-violet-600">
                  Pro
                </p>

                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-black text-gray-800">
                    {billingInterval === "month" ? "$2.99" : "$24.99"}
                  </span>

                  <span className="pb-1 text-sm text-muted-foreground">
                    {billingInterval === "month" ? "/month" : "/year"}
                  </span>
                </div>

                {billingInterval === "year" && (
                  <p className="mt-2 text-xs font-medium text-violet-600">
                    About $2.08/month, billed annually.
                  </p>
                )}

                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  For people who refuse to stop accomplishing absolutely
                  nothing.
                </p>

                <div className="mt-6 space-y-3">
                  <Feature text="Unlimited achievements" />
                  <Feature text="Keep building your streak" />
                  <Feature text="Full leaderboard participation" />
                  <Feature text="Full achievement collection" />
                </div>

                <Button
                  className="mt-8 h-11 w-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 font-bold text-white shadow-md shadow-violet-500/20 transition-transform hover:scale-[1.02] hover:opacity-95"
                  disabled={isCurrentPlan || isCheckingOut}
                  onClick={handlePlanAction}
                >
                  {isCheckingOut
                    ? "Opening checkout..."
                    : !isLoggedIn
                      ? "Create account to subscribe"
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

                {!isLoggedIn ? (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Already collecting nonsense?{" "}
                    <button
                      type="button"
                      onClick={() => router.push("/login")}
                      className="font-semibold text-violet-600 underline underline-offset-4"
                    >
                      Log in
                    </button>
                  </p>
                ) : (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    Cancel anytime. Your dignity is already gone.
                  </p>
                )}
              </div>
            </div>

            {/* Bottom reassurance */}
            <div className="mx-auto mt-10 max-w-2xl text-center">
              <p className="text-sm text-muted-foreground">
                No complicated tiers. No mysterious enterprise pricing. Just
                five free achievements or unlimited pointless progress.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-700">
      <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-100">
        <Check className="size-3.5 text-violet-600" />
      </div>

      {text}
    </div>
  );
}
