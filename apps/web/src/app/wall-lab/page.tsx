import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { WallLabClient } from "@/components/card-wall/wall-lab-client";
import { getWallCatalog } from "@/lib/services/wall-catalog-service-server";

// A development-only workbench for the homepage card wall, like /hero-lab.
export const metadata: Metadata = {
  title: "Wall lab - Useless Achievements",
  robots: { index: false, follow: false },
};

export default async function WallLabPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return <WallLabClient catalog={await getWallCatalog()} />;
}
