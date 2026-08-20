import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { mergeAnonymousAchievementsIntoCurrentUser } from "@/lib/achievement-service-server";

const ANONYMOUS_COOKIE = "anonymous_user_id";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // The user is authenticated at this point.
      // If this browser has anonymous achievement history,
      // merge it into the newly authenticated account.
      const cookieStore = await cookies();

      const anonymousId = cookieStore.get(ANONYMOUS_COOKIE)?.value;

      if (anonymousId) {
        try {
          await mergeAnonymousAchievementsIntoCurrentUser(anonymousId);
        } catch (migrationError) {
          // Authentication succeeded, so don't treat a migration
          // problem as an authentication failure.
          console.error(
            "Anonymous achievement migration error:",
            migrationError,
          );
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
