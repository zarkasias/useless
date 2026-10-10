import { LoaderCircle } from "lucide-react";

interface PageLoaderProps {
  message?: string;
}

export function PageLoader({ message = "Loading..." }: PageLoaderProps) {
  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-100 via-blue-100 to-purple-100 shadow-sm">
          <LoaderCircle className="size-10 animate-spin text-violet-600" />
        </div>

        <div>
          <p className="text-lg font-semibold text-gray-700">{message}</p>

          <p className="mt-1 text-sm text-muted-foreground">
            Unearthing something wonderfully useless...
          </p>
        </div>
      </div>
    </div>
  );
}
