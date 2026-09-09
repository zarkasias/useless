"use server";

import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";

import { stripe } from "@/lib/stripe-server";
import { getAuthenticatedUser } from "@/lib/services/achievement-service-server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createAdminClient(supabaseUrl, serviceRoleKey);

export async function deleteAccountAction(): Promise<
  { success: false; error: string } | never
> {
  const user = await getAuthenticatedUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in to delete your account.",
    };
  }

  try {
    // Get Stripe customer before deleting database records
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("provider_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Error loading subscription during account deletion:",
        subscriptionError,
      );

      return {
        success: false,
        error: "Unable to delete your account.",
      };
    }

    // Delete Stripe customer if this is a subscribed user.
    // Free users simply skip this block.
    if (subscription?.provider_customer_id) {
      try {
        await stripe.customers.del(subscription.provider_customer_id);
      } catch (error) {
        console.error("Error deleting Stripe customer:", error);

        return {
          success: false,
          error:
            "Unable to cancel your subscription. Your account was not deleted.",
        };
      }
    }

    // Find and remove avatars belonging to this user
    const { data: avatarFiles, error: avatarListError } =
      await supabaseAdmin.storage.from("avatars").list("", {
        limit: 1000,
        search: `${user.id}-`,
      });

    if (avatarListError) {
      console.error("Error finding avatar files:", avatarListError);

      return {
        success: false,
        error: "Unable to remove your account files.",
      };
    }

    if (avatarFiles?.length) {
      const filesToDelete = avatarFiles.map((file) => file.name);

      const { error: avatarDeleteError } = await supabaseAdmin.storage
        .from("avatars")
        .remove(filesToDelete);

      if (avatarDeleteError) {
        console.error("Error deleting avatar files:", avatarDeleteError);

        return {
          success: false,
          error: "Unable to remove your account files.",
        };
      }
    }

    // Delete the Supabase Auth user.
    //
    // Cascades handle:
    // auth.users
    //   -> profiles
    //      -> subscriptions
    //   -> user_achievements
    const { error: deleteUserError } =
      await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      console.error("Error deleting auth user:", deleteUserError);

      return {
        success: false,
        error: "Unable to delete your account.",
      };
    }
  } catch (error) {
    console.error("Unexpected account deletion error:", error);

    return {
      success: false,
      error: "Something went wrong deleting your account.",
    };
  }

  redirect("/");
}
