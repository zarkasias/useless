import "server-only";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

export async function getAnonymousUser(anonymousId: string) {
  const { data, error } = await supabaseAdmin
    .from("anonymous_users")
    .select("*")
    .eq("anonymous_id", anonymousId)
    .single();

  if (error || !data) {
    return null;
  }

  await supabaseAdmin
    .from("anonymous_users")
    .update({
      last_seen_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  return data;
}

export async function createAnonymousUser() {
  const anonymousId = crypto.randomUUID();

  const { data, error } = await supabaseAdmin
    .from("anonymous_users")
    .insert({
      anonymous_id: anonymousId,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("Error creating anonymous user:", error);
    throw new Error("Unable to create anonymous user");
  }

  return data;
}

export async function updateAnonymousUserTimezone(
  anonymousId: string,
  timezone: string,
) {
  const { error } = await supabaseAdmin
    .from("anonymous_users")
    .update({
      timezone,
      last_seen_at: new Date().toISOString(),
    })
    .eq("anonymous_id", anonymousId);

  if (error) {
    console.error("Error updating anonymous user timezone:", error);

    return false;
  }

  return true;
}
