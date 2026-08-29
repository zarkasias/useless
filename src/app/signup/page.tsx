import { Navbar } from "@/components/navbar";
import { SignupForm } from "@/components/auth/signup-form";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import { Sparkles } from "lucide-react";

export default async function SignupPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <Navbar user={null} />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-violet-50 via-blue-50 to-background px-4 py-10">
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[8%] top-20 size-3 rotate-12 rounded-sm bg-yellow-300 sm:size-4" />
          <div className="absolute right-[10%] top-28 size-4 rotate-45 rounded-sm bg-violet-300 sm:size-5" />
          <div className="absolute bottom-[18%] left-[14%] size-3 rounded-full bg-blue-300" />
          <div className="absolute bottom-[20%] right-[14%] size-3 rounded-full bg-pink-300" />

          <div className="absolute left-1/2 top-12 size-72 -translate-x-1/2 rounded-full bg-violet-400/10 blur-3xl sm:size-96" />
          <div className="absolute bottom-0 left-[10%] size-56 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="absolute bottom-0 right-[10%] size-56 rounded-full bg-pink-400/10 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Branding */}
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex size-20 items-center justify-center rounded-3xl border bg-white/40 shadow-lg shadow-violet-500/10">
              <Image
                src="/icons/golden_trophy.webp"
                alt="Useless Achievements trophy"
                width={58}
                height={58}
                priority
                className="h-auto w-auto"
              />
            </div>

            <div className="mx-auto inline-flex -rotate-1 items-center gap-2 rounded-full border-2 border-violet-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-violet-700 shadow-sm backdrop-blur">
              <Sparkles className="size-3.5" />
              Your first five are free
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-gray-800 sm:text-4xl">
              Start collecting{" "}
              <span className="bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 bg-clip-text text-transparent">
                useless greatness.
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-md leading-6 text-muted-foreground">
              Create an account and begin earning ridiculous achievements for
              things nobody asked you to do.
            </p>
          </div>

          <Card className="rounded-3xl border-2 border-white/80 bg-white/40 shadow-xl shadow-violet-500/10 backdrop-blur">
            <CardContent className="p-6 sm:p-8">
              <SignupForm />
            </CardContent>
          </Card>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Serious accomplishments are absolutely not required.
          </p>
        </div>
      </main>
    </div>
  );
}
