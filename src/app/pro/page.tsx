import type { Metadata } from "next";
import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import ProClient from "./pro-client";

export const metadata: Metadata = {
  title: "Pro",
  description:
    "Upgrade to Useless Achievements Pro for unlimited achievements, streaks, full collection access, and leaderboard participation.",
};

export default async function ProPage() {
  const user = await getAuthenticatedUser();

  const profile = user ? await getAuthenticatedUserProfile() : null;

  const entitlements = user ? await getUserEntitlements(user.id) : null;

  return (
    <ProClient initialProfile={profile} initialEntitlements={entitlements} />
  );
}
