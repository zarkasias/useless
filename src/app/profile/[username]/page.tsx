import { notFound } from "next/navigation";
import { ProfileClient } from "./profile-client";
import {
  getPublicProfileByUsername,
  getPublicProfileAchievements,
} from "@/lib/services/profile-service-server";
import { getAuthenticatedUserProfile } from "@/lib/services/achievement-service-server";
import {
  getFriendshipStatus,
  type FriendshipState,
} from "@/lib/services/friend-service-server";
import { getUserEntitlements } from "@/lib/services/entitlement-service-server";
import { getUserStreakData } from "@/lib/services/streak-service-server";

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;

  const profile = await getPublicProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const [achievements, streakData] = await Promise.all([
    getPublicProfileAchievements(profile.id),
    getUserStreakData(profile.id),
  ]);

  const viewer = await getAuthenticatedUserProfile();
  const viewerEntitlements = viewer
    ? await getUserEntitlements(viewer.id)
    : null;

  const friendshipState: FriendshipState =
    viewer && viewer.id !== profile.id
      ? await getFriendshipStatus(viewer.id, profile.id)
      : {
          id: null,
          status: "none",
        };

  return (
    <ProfileClient
      profile={profile}
      achievements={achievements}
      streakData={streakData}
      viewer={viewer}
      viewerEntitlements={viewerEntitlements}
      friendshipState={friendshipState}
    />
  );
}
