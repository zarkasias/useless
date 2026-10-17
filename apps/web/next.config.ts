import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
