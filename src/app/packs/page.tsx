import { Navbar } from "@/components/navbar";

import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import { getStoreAchievementPacks } from "@/lib/services/pack-store-service-server";

import { AchievementPackCard } from "@/components/packs/achievement-pack-card";

export default async function PacksPage() {
  const user = await getAuthenticatedUser();

  const [profile, packs, entitlements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getStoreAchievementPacks(),
    user ? getUserEntitlements(user.id) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen">
      {profile && entitlements && (
        <Navbar
          user={profile}
          isSubscribed={entitlements.isSubscribed}
          subscriptionStatus={entitlements.subscriptionStatus}
        />
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-10">
          <p className="text-sm font-bold uppercase tracking-wider text-violet-600">
            Achievement Packs
          </p>

          <h1 className="mt-2 text-4xl font-black tracking-tight text-gray-700 sm:text-5xl">
            More useless things to collect.
          </h1>

          <p className="mt-4 max-w-2xl text-muted-foreground">
            Unlock themed achievement packs and keep track of the completely
            unnecessary collections you already own.
          </p>
        </header>

        {packs.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {packs.map((pack) => (
              <AchievementPackCard key={pack.id} pack={pack} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <p className="font-bold">No achievement packs yet.</p>

            <p className="mt-2 text-sm text-muted-foreground">
              New packs will appear here when they become available.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
