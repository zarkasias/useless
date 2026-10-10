"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type UpdateUsernameResult =
  | {
      success: true;
      username: string;
    }
  | {
      success: false;
      error: string;
    };

type UpdateAvatarResult =
  | {
      success: true;
      avatarUrl: string;
    }
  | {
      success: false;
      error: string;
    };

export async function updateUsernameAction(
  username: string,
): Promise<UpdateUsernameResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "You must be logged in to update your profile.",
    };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3) {
    return {
      success: false,
      error: "Username must be at least 3 characters.",
    };
  }

  if (trimmedUsername.length > 30) {
    return {
      success: false,
      error: "Username must be 30 characters or fewer.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      username: trimmedUsername,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating username:", error);

    return {
      success: false,
      error:
        error.code === "23505"
          ? "That username is already taken."
          : "Unable to update your username.",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return {
    success: true,
    username: trimmedUsername,
  };
}

export async function updateAvatarAction(
  avatarUrl: string,
): Promise<UpdateAvatarResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "You must be logged in to update your profile.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      avatar_url: avatarUrl,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating avatar:", error);

    return {
      success: false,
      error: "Unable to update your avatar.",
    };
  }

  revalidatePath("/profile");
  revalidatePath("/dashboard");

  return {
    success: true,
    avatarUrl,
  };
}
