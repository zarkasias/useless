import { getAuthenticatedUser } from "@/lib/services/achievement-service-server";

import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";

import { getLeaderboardUsers } from "@/lib/services/leaderboard-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import LeaderboardClient from "./leaderboard-client";

export default async function LeaderboardPage() {
  const user = await getAuthenticatedUser();

  const [profile, leaderboardUsers, entitlements] = await Promise.all([
    getAuthenticatedUserProfile(),

    getLeaderboardUsers(20),

    user ? getUserEntitlements(user.id) : Promise.resolve(null),
  ]);

  return (
    <LeaderboardClient
      initialProfile={profile}
      initialUsers={leaderboardUsers}
      initialEntitlements={entitlements}
    />
  );
}
