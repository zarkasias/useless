import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const pageExtensions = ["tsx", "ts", "jsx", "js"];

export default function config(phase: string): NextConfig {
  return {
    // Files such as page.dev.tsx only become routes on the dev server.
    pageExtensions:
      phase === PHASE_DEVELOPMENT_SERVER
        ? ["dev.tsx", ...pageExtensions]
        : pageExtensions,
    images: {
      remotePatterns: [
        {
          protocol: "https",
          hostname: "viberank.dev",
          pathname: "/badge",
          search: "?app=Useless%20Achievements&theme=light",
        },
        {
          protocol: "https",
          hostname: "rmpfptafjhseunvnswpj.supabase.co",
          pathname: "/storage/v1/object/public/**",
        },
      ],
    },
  };
}
