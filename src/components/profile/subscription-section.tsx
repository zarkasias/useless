import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

interface SubscriptionProps {
  initialEntitlements: UserEntitlements;
}

export default function Subscription({
  initialEntitlements,
}: SubscriptionProps) {
  return (
    <Card>
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

          <Button variant="outline">
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
