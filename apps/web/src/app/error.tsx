"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="mb-4 text-7xl">💥</div>

        <h1 className="text-4xl font-bold tracking-tight">Something Broke</h1>

        <p className="mt-4 text-muted-foreground">
          Congratulations. You may have discovered an achievement we did not
          intend to create.
        </p>

        <Button onClick={reset} className="mt-6">
          Try Again
        </Button>
      </div>
    </main>
  );
}
