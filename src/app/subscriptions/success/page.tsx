import Link from "next/link";
import { CheckCircle2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";
import { getAuthenticatedUser } from "@/lib/services/achievement-service-server";
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { redirect } from "next/navigation";

export default async function SubscriptionSuccessPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const [profile, entitlements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getUserEntitlements(user.id),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-blue-50 to-background">
      <Navbar
        user={profile}
        isSubscribed={entitlements.isSubscribed}
        subscriptionStatus={entitlements.subscriptionStatus}
      />

      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-violet-100 shadow-lg">
            <CheckCircle2 className="size-10 text-violet-600" />
          </div>

          <div className="mt-6 inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-violet-200 bg-white px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
            <Sparkles className="size-4" />
            Unlimited uselessness unlocked
          </div>

          <h1 className="mt-6 text-4xl font-black tracking-tight text-gray-800 sm:text-5xl">
            You&apos;re officially{" "}
            <span className="bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Pro.
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-md text-base leading-7 text-muted-foreground">
            Your subscription is active. You can now keep collecting ridiculous
            achievements without worrying about that pesky five-achievement
            limit.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-full bg-gradient-to-r from-violet-600 to-blue-500 px-7 font-bold text-white"
            >
              <Link href="/dashboard">Go to dashboard</Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-full bg-white px-7"
            >
              <Link href="/collection">View my collection</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
