"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  updateUsernameAction,
  updateAvatarAction,
} from "@/app/actions/profile-actions";

import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/supabase";
import type { UserEntitlements } from "@/lib/services/entitlement-service-server";

import { Navbar } from "@/components/navbar";
import Profile from "@/components/profile/profile-section";
import Subscription from "@/components/profile/subscription-section";

interface ProfileClientProps {
  initialProfile: UserProfile;

  initialEntitlements: UserEntitlements;
  email: string;
}

export default function ProfileClient({
  initialProfile,
  initialEntitlements,
  email,
}: ProfileClientProps) {
  const [profile, setProfile] = useState(initialProfile);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [username, setUsername] = useState(initialProfile.username ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      setIsUploadingAvatar(true);

      const supabase = createClient();

      const fileExtension = file.name.split(".").pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, {
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const result = await updateAvatarAction(publicUrl);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setProfile((current) => ({
        ...current,
        avatar_url: result.avatarUrl,
      }));

      toast.success("Avatar updated");
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast.error("Unable to update avatar.");
    } finally {
      setIsUploadingAvatar(false);

      event.target.value = "";
    }
  };

  const handleSaveUsername = async () => {
    try {
      setIsSaving(true);

      const result = await updateUsernameAction(username);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const updatedUsername = result.username;

      setProfile((current) => ({
        ...current,
        username: updatedUsername,
      }));

      setUsername(updatedUsername);
      setIsEditing(false);

      toast.success("Profile Updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Something went wrong updating profile.");
    } finally {
      setIsSaving(false);
    }
  };

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
            username={username}
            isEditing={isEditing}
            isSaving={isSaving}
            email={email}
            isUploadingAvatar={isUploadingAvatar}
            setUsername={setUsername}
            setIsEditing={setIsEditing}
            handleAvatarUpload={handleAvatarUpload}
            handleSaveUsername={handleSaveUsername}
          />

          <Subscription initialEntitlements={initialEntitlements} />
        </div>
      </div>
    </div>
  );
}
