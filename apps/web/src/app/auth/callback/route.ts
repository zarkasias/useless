import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import { mergeAnonymousAchievementsIntoCurrentUser } from "@/lib/services/achievement-service-server";

const ANONYMOUS_COOKIE = "anonymous_user_id";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const plan = searchParams.get("plan");

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      /**
       * Password recovery flow.
       * Handle this before anonymous migration.
       */
      if (next === "/reset-password") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }

      /**
       * Normal authentication flow can migrate anonymous achievements.
       */

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

      /*
       * User came from the Pro page.
       * Preserve the selected plan and send them back there.
       */

      if (next === "/pro" && (plan === "month" || plan === "year")) {
        const redirectUrl = new URL("/pro", origin);
        redirectUrl.searchParams.set("plan", plan);
        redirectUrl.searchParams.set("checkout", "1");

        return NextResponse.redirect(redirectUrl);
      }

      /*
       * Normal signup/login confirmation flow.
       */
      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
