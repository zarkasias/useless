import { useState } from "react";
import type { UserProfile } from "@/lib/supabase";
import { toast } from "sonner";
import Image from "next/image";

import {
  updateUsernameAction,
  updateAvatarAction,
} from "@/app/actions/profile-actions";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { LoaderCircle, Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileProps {
  profile: UserProfile;
  email: string;
  onProfileUpdated: (profile: UserProfile) => void;
}

export default function Profile({
  profile,
  email,
  onProfileUpdated,
}: ProfileProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [username, setUsername] = useState(profile.username ?? "");
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

      const updatedProfile = {
        ...profile,
        avatar_url: result.avatarUrl,
      };

      onProfileUpdated(updatedProfile);

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

      const updatedProfile = {
        ...profile,
        username: result.username,
      };

      onProfileUpdated(updatedProfile);

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
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Manage your personal information.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative size-18 shrink-0">
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt="Profile avatar"
                width={72}
                height={72}
                className="size-18 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-18 items-center justify-center rounded-full bg-primary/10 text-xl font-semibold text-muted-foreground">
                {profile.username?.slice(0, 2).toUpperCase() ?? "U"}
              </div>
            )}

            <label
              className={`
                absolute -bottom-1 -right-1
                flex size-7 items-center justify-center
                rounded-full border bg-gray-700/80 text-white shadow-sm
                transition-colors
                ${
                  isUploadingAvatar
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer hover:bg-muted"
                }`}
              aria-label="Change avatar"
            >
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
              />
              {isUploadingAvatar ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
            </label>
          </div>

          <div>
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  maxLength={30}
                  disabled={isSaving}
                  className="max-w-sm"
                />

                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            ) : (
              <>
                <p className="text-lg font-semibold">
                  {profile.username ?? "User"}
                </p>

                <p className="text-sm text-muted-foreground">{email}</p>
              </>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            <Button
              onClick={handleSaveUsername}
              disabled={
                isSaving ||
                username.trim().length < 3 ||
                username.trim() === profile.username
              }
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>

            <Button
              variant="outline"
              disabled={isSaving}
              onClick={() => {
                setUsername(profile.username ?? "");
                setIsEditing(false);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            Edit Profile
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
