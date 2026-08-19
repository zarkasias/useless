import { createClient } from "@/lib/supabase/server";

export default async function AuthTestPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Auth Test</h1>

      <pre className="mt-4">
        {JSON.stringify(
          {
            user: user
              ? {
                  id: user.id,
                  email: user.email,
                }
              : null,
            error: error?.message ?? null,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
