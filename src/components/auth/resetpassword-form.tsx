"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Eye, EyeOff, LoaderCircle } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSession() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        setError("This password reset link is invalid or has expired.");
        setHasValidSession(false);
        setCheckingSession(false);
        return;
      }

      setHasValidSession(true);
      setCheckingSession(false);
    }

    checkSession();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Your password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("Error signing out after password reset:", signOutError);
    }

    setLoading(false);
    setSuccess(true);

    setTimeout(() => {
      router.push("/login");
    }, 1500);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-green-100">
          <CheckCircle2 className="size-7 text-green-600" />
        </div>

        <h2 className="mt-4 text-xl font-black text-gray-800">
          Password updated
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Your new password is ready. Sending you back to login...
        </p>
      </div>
    );
  }

  if (checkingSession) {
    return (
      <div className="flex items-center justify-center py-6">
        <LoaderCircle className="size-6 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!hasValidSession) {
    return (
      <div className="text-center">
        <h2 className="text-xl font-black text-gray-800">
          Reset link unavailable
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This password reset link may have expired or already been used.
        </p>

        <Button
          type="button"
          className="mt-6 w-full rounded-xl"
          onClick={() => router.push("/forgot-password")}
        >
          Request a new reset link
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-800">
          New Password
        </Label>

        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl bg-white/80 pr-11"
          />

          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-800">
          Confirm new password
        </Label>

        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-11 rounded-xl bg-white/80 pr-11"
          />

          <button
            type="button"
            onClick={() => setShowConfirmPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
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
            Updating password...
          </>
        ) : (
          "Update password"
        )}
      </Button>
    </form>
  );
}
