"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LoaderCircle, MailCheck } from "lucide-react";

export function ForgotPasswordForm() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-violet-100">
          <MailCheck className="size-7 text-violet-600" />
        </div>

        <h2 className="mt-4 text-4xl font-black text-gray-600">
          Check your inbox
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          We sent a password reset link to{" "}
          <span className="font-semibold text-gray-700">{email}</span>.
        </p>

        <Button asChild variant="outline" className="mt-6 w-full rounded-xl">
          <Link href="/login">
            <ArrowLeft className="mr-2 size-4" />
            Back to login
          </Link>
        </Button>
      </div>
    );
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>

        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11 rounded-xl bg-white/80"
        />
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-xl bg-violet-600 font-bold hover:bg-violet-700"
      >
        {loading ? (
          <>
            <LoaderCircle className="mr-2 size-4 animate-spin" />
            Sending reset link...
          </>
        ) : (
          "Send reset link"
        )}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm font-semibold text-violet-600 hover:text-violet-700"
        >
          <ArrowLeft className="mr-1.5 size-4" />
          Back to login
        </Link>
      </div>
    </form>
  );
}
