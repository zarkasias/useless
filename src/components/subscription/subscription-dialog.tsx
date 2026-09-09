"use client";

import { useState } from "react";

import { Check, Sparkles } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

type BillingInterval = "month" | "year";

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const plans = {
  month: {
    label: "Monthly",
    price: "$2.99",
    suffix: "/month",
  },

  year: {
    label: "Annual",
    price: "$24.99",
    suffix: "/year",
  },
};

export default function SubscriptionDialog({
  open,
  onOpenChange,
}: SubscriptionDialogProps) {
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("year");

  const selectedPlan = plans[billingInterval];

  const handleSubscribe = () => {
    // Connect Stripe checkout
    console.log("Selected subscription:", billingInterval);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg rounded-lg p-0">
        <div className="p-6 sm:p-7">
          <DialogHeader className="text-left">
            <div className="flex gap-3 items-center mb-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="size-5 text-purple-600" />
              </div>

              <DialogTitle className="text-2xl font-semibold tracking-tight text-gray-700">
                Keep collecting
              </DialogTitle>
            </div>

            <DialogDescription className="text-sm leading-6">
              You&apos;ve collected your 5 free achievements. Upgrade to Pro to
              keep unlocking achievements, continue your streak, and keep
              climbing the leaderboard.
            </DialogDescription>
          </DialogHeader>

          {/* Billing Toggle */}

          <div className="mt-6 grid grid-cols-2 rounded-lg bg-muted p-1">
            <button
              type="button"
              onClick={() => setBillingInterval("month")}
              className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors
                ${
                  billingInterval === "month"
                    ? "bg-background text-gray-700 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingInterval("year")}
              className={`rounded-md px-4 py-2.5 text-sm font-medium transition-colors
                ${
                  billingInterval === "year"
                    ? "bg-background text-gray-700 shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
            >
              Annual
              <span className="ml-2 text-xs text-primary">Save 30%</span>
            </button>
          </div>

          {/* Price */}

          <div className="mt-6">
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold tracking-tight text-gray-700">
                {selectedPlan.price}
              </span>

              <span className="pb-1 text-sm text-muted-foreground">
                {selectedPlan.suffix}
              </span>
            </div>

            {billingInterval === "year" && (
              <p className="mt-1 text-xs text-muted-foreground">
                About $2.08 per month, billed annually.
              </p>
            )}
          </div>

          {/* Benefits */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="size-4 shrink-0 text-primary" />
              Unlimited achievement claims
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="size-4 shrink-0 text-primary" />
              Keep building your daily streak
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="size-4 shrink-0 text-primary" />
              Continue competing on the leaderboard
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Check className="size-4 shrink-0 text-primary" />
              Keep your full achievement collection
            </div>
          </div>
          <Button size="lg" className="mt-7 w-full" onClick={handleSubscribe}>
            Continue with {selectedPlan.label}
          </Button>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
