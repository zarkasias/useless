"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateUserTimezoneAction(timezone: string) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      success: false,
      error: "User is not authenticated.",
    };
  }

  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    });
  } catch {
    return {
      success: false,
      error: "Invalid timezone.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      timezone,
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating user timezone:", error);

    return {
      succes: false,
      error: "Unable to update timezone,",
    };
  }

  return {
    success: true,
    timezone,
  };
}
