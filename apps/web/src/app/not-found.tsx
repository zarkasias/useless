import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-lg text-center">
        <div className="mb-4 flex justify-center w-full">
          <Image
            src="/icons/golden_trophy.webp"
            alt="Useless Achievements trophy"
            width={58}
            height={58}
            priority
            className="h-auto w-auto"
          />
        </div>

        <h1 className="text-4xl font-bold tracking-tight">
          404 Achievement Unlocked
        </h1>

        <p className="mt-4 text-muted-foreground">
          You successfully found a page that does not exist. Truly impressive.
        </p>

        <Button asChild className="mt-6">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}
