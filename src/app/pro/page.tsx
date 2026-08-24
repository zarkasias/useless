import {
  getAuthenticatedUser,
  getAuthenticatedUserProfile,
} from "@/lib/services/achievement-service-server";

import { getUserEntitlements } from "@/lib/services/entitlement-service-server";

import ProClient from "./pro-client";

export default async function ProPage() {
  const user = await getAuthenticatedUser();

  const profile = user ? await getAuthenticatedUserProfile() : null;

  const entitlements = user ? await getUserEntitlements(user.id) : null;

  return (
    <ProClient initialProfile={profile} initialEntitlements={entitlements} />
  );
}
