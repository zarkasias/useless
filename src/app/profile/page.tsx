import { redirect } from "next/navigation";

import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import ProfileClient from "./profile-client";

export default async function ProfilePage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/");
  }

  const [profile, entitlements] = await Promise.all([
    getAuthenticatedUserProfile(),
    getUserEntitlements(user.id),
  ]);

  if (!profile) {
    redirect("/");
  }
  return (
    <ProfileClient
      initialProfile={profile}
      initialEntitlements={entitlements}
      email={user.email ?? ""}
    />
  );
}
