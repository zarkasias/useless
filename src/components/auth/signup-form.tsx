"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LoaderCircle, MailCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { migrateAnonymousAchievementsAction } from "@/app/actions/achievement-actions";

import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const formSchema = z
  .object({
    username: z.string().min(3).max(20),
    email: z.string().email(),
    password: z.string().min(6).max(100),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type SignupStage = "idle" | "creating" | "finishing" | "check-email";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);

  const [signupStage, setSignupStage] = useState<SignupStage>("idle");

  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(
    null,
  );

  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next");
  const plan = searchParams.get("plan");

  const loginParams = new URLSearchParams();

  if (next) {
    loginParams.set("next", next);
  }

  if (plan) {
    loginParams.set("plan", plan);
  }

  const loginHref =
    loginParams.size > 0 ? `/login?${loginParams.toString()}` : "/login";

  const isLoading = signupStage === "creating" || signupStage === "finishing";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setSignupStage("creating");

    const params = new URLSearchParams(window.location.search);
    const next = params.get("next") ?? "/dashboard";
    const plan = params.get("plan");

    const callbackUrl = new URL("/auth/callback", window.location.origin);

    callbackUrl.searchParams.set("next", next);

    if (plan === "month" || plan === "year") {
      callbackUrl.searchParams.set("plan", plan);
    }

    if (next === "/pro") {
      callbackUrl.searchParams.set("checkout", "1");
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            username: values.username,
          },
          emailRedirectTo: callbackUrl.toString(),
        },
      });

      if (error) {
        if (
          error.code === "over_email_send_rate_limit" ||
          error.status === 429
        ) {
          setError(
            "Too many confirmation emails have been sent. Please wait a little while and try again.",
          );
        } else {
          setError(error.message);
        }

        setSignupStage("idle");
        return;
      }

      if (!data.user) {
        setError("Unable to create account");
        setSignupStage("idle");
        return;
      }

      /*
       * If Supabase gives us a session immediately,
       * finish migration and then go to the dashboard.
       */
      if (data.session) {
        setSignupStage("finishing");

        try {
          await migrateAnonymousAchievementsAction();
        } catch (migrationError) {
          console.error(
            "Anonymous achievement migration error:",
            migrationError,
          );
        }

        if (next === "/pro" && (plan === "month" || plan === "year")) {
          router.push(`/pro?plan=${plan}&checkout=1`);
        } else {
          router.push(next);
        }
        router.refresh();
        return;
      }

      /*
       * Email confirmation is required.
       */
      setConfirmationEmail(values.email);
      form.reset();
      setSignupStage("check-email");
    } catch (err) {
      console.error("Signup error:", err);

      setError("An unexpected error occurred");
      setSignupStage("idle");
    }
  }

  if (signupStage === "finishing") {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-violet-100">
          <Sparkles className="size-7 text-violet-600" />

          <LoaderCircle className="absolute size-20 animate-spin text-violet-300" />
        </div>

        <h2 className="mt-6 text-xl font-bold text-gray-800">
          Account created!
        </h2>

        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
          Organizing your completely unnecessary achievements...
        </p>

        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-violet-600">
          <LoaderCircle className="size-4 animate-spin" />
          Finished your account setup...
        </div>
      </div>
    );
  }

  if (signupStage === "check-email") {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-violet-100">
          <MailCheck className="size-7 text-violet-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-800">
            Check your email
          </h2>

          <p className="text-sm leading-6 text-muted-foreground">
            We sent a confirmation link to
          </p>

          <p className="font-semibold text-gray-800">{confirmationEmail}</p>

          <p className="text-sm leading-6 text-muted-foreground">
            Confirm your email address to finish creating your account and begin
            collecting useless greatness.
          </p>
        </div>

        <Button
          variant="outline"
          className="w-full rounded-full"
          onClick={() => router.push(loginHref)}
        >
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>

                <FormControl>
                  <Input
                    placeholder="cooluser123"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>

                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>

                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>

                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {signupStage === "creating" ? (
              <>
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Sign Up"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Already have an account? </span>

        <a
          href={loginHref}
          className="underline underline-offset-4 hover:text-primary"
        >
          Log in
        </a>
      </div>
    </div>
  );
}
