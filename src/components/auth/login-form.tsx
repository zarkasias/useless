"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { LoaderCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { migrateAnonymousAchievementsAction } from "@/app/actions/achievement-actions";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginStage = "idle" | "authenticating" | "finishing";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);

  const [loginStage, setLoginStage] = useState<LoginStage>("idle");

  const supabase = createClient();
  const router = useRouter();

  const isLoading = loginStage !== "idle";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setError(null);
    setLoginStage("authenticating");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        setError(error.message);
        setLoginStage("idle");
        return;
      }

      if (!data.user) {
        setError("Unable to log in");
        setLoginStage("idle");
        return;
      }

      // Authentication succeeded.
      // From this point forward, show the finishing state.
      setLoginStage("finishing");

      try {
        await migrateAnonymousAchievementsAction();
      } catch (migrationError) {
        console.error("Anonymous achievement migration error:", migrationError);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);

      setError("An unexpected error occurred");
      setLoginStage("idle");
    }
  }

  if (loginStage === "finishing") {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
        <div className="relative flex size-16 items-center justify-center rounded-2xl bg-violet-100">
          <Sparkles className="size-7 text-violet-600" />

          <LoaderCircle className="absolute size-20 animate-spin text-violet-300" />
        </div>

        <h2 className="mt-6 text-xl font-bold text-gray-800">
          You&apos;re in!
        </h2>

        <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
          Gathering your completely unnecessary achievements...
        </p>

        <div className="mt-5 flex items-center gap-2 text-xs font-medium text-violet-600">
          <LoaderCircle className="size-4 animate-spin" />
          Preparing your dashboard
        </div>
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {loginStage === "authenticating" ? (
              <>
                <LoaderCircle className="mr-2 size-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">
          Don&apos;t have an account?{" "}
        </span>

        <a
          href="/signup"
          className="underline underline-offset-4 hover:text-primary"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}
