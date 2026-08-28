import type { UserProfile } from "@/lib/supabase";
import Image from "next/image";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { LoaderCircle, Plus } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface ProfileProps {
  profile: UserProfile;
  isUploadingAvatar: boolean;
  username: string;
  isEditing: boolean;
  isSaving: boolean;
  email: string;
  setUsername: (value: string) => void;
  setIsEditing: (value: boolean) => void;
  handleAvatarUpload: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>;
  handleSaveUsername: () => Promise<void>;
}

export default function Profile({
  profile,
  username,
  isEditing,
  isSaving,
  email,
  isUploadingAvatar,
  setUsername,
  setIsEditing,
  handleAvatarUpload,
  handleSaveUsername,
}: ProfileProps) {
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
              disabled={isSaving || username.trim() === profile.username}
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
