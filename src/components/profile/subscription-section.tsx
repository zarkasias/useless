"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { createCustomerPortalAction } from "@/app/actions/subscription-actions";

import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

interface SubscriptionProps {
  initialEntitlements: UserEntitlements;
}

export default function Subscription({
  initialEntitlements,
}: SubscriptionProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  const handleSubscriptionAction = async () => {
    if (!initialEntitlements.isSubscribed) {
      router.push("/pro");
      return;
    }

    try {
      setIsLoading(true);

      await createCustomerPortalAction("/profile");
    } catch (error) {
      console.error("Unable to open subscription management:", error);
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-gray-200/80 border border-gray-300/80">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your current plan and billing.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">
              {initialEntitlements.isSubscribed ? "Pro plan" : "Free plan"}
            </p>

            <p className="text-sm text-muted-foreground">
              {initialEntitlements.subscriptionStatus === "past_due"
                ? "Your subscription has a billing issue."
                : initialEntitlements.isSubscribed
                  ? "Your subscription is active."
                  : "You are currently using the free plan."}
            </p>
          </div>

          <Button
            variant="outline"
            onClick={handleSubscriptionAction}
            disabled={isLoading}
          >
            {initialEntitlements.subscriptionStatus === "past_due"
              ? "Manage billing"
              : initialEntitlements.isSubscribed
                ? "Manage subscription"
                : "Subscribe"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
