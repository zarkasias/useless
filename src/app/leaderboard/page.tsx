import { getAuthenticatedUser } from "@/lib/services/utils/achievement-utils";

import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";

import { getLeaderboardUsers } from "@/lib/services/leaderboard-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getFriends } from "@/lib/services/friend-service-server";

import LeaderboardClient from "./leaderboard-client";

export default async function LeaderboardPage() {
  const user = await getAuthenticatedUser();

  const [profile, leaderboardUsers, entitlements, friends] = await Promise.all([
    getAuthenticatedUserProfile(),
    getLeaderboardUsers(),
    user ? getUserEntitlements(user.id) : Promise.resolve(null),
    user ? getFriends(user.id) : Promise.resolve([]),
  ]);

  const friendIds = (friends ?? []).map((item) => item.friend.id);

  return (
    <LeaderboardClient
      initialProfile={profile}
      initialUsers={leaderboardUsers}
      initialEntitlements={entitlements}
      friendIds={friendIds}
    />
  );
}
