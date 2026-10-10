"use client";

import { useState } from "react";

import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

import { Navbar } from "@/components/navbar";
import Profile from "@/components/settings/profile-section";
import Subscription from "@/components/settings/subscription-section";
import DeleteAccount from "@/components/settings/delete-section";

interface SettingsClientProps {
  initialProfile: UserProfile;

  initialEntitlements: UserEntitlements;
  email: string;
}

export default function SettingsClient({
  initialProfile,
  initialEntitlements,
  email,
}: SettingsClientProps) {
  const [profile, setProfile] = useState(initialProfile);

  return (
    <div className="min-h-screen bg-muted/20">
      <Navbar
        user={profile}
        isSubscribed={initialEntitlements.isSubscribed}
        subscriptionStatus={initialEntitlements.subscriptionStatus}
      />
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="space-y-6">
          <Profile
            profile={profile}
            email={email}
            onProfileUpdated={setProfile}
          />

          <Subscription initialEntitlements={initialEntitlements} />

          <DeleteAccount />
        </div>
      </div>
    </div>
  );
}
