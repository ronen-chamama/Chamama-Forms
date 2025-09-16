// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  images: {
    // הכי פשוט:
    domains: ["firebasestorage.googleapis.com", "storage.googleapis.com"],

    // או, אם אתה מעדיף דיוק:
    // remotePatterns: [
    //   {
    //     protocol: "https",
    //     hostname: "firebasestorage.googleapis.com",
    //     pathname: "/v0/b/**",
    //   },
    //   {
    //     protocol: "https",
    //     hostname: "storage.googleapis.com",
    //     pathname: "/**",
    //   },
    // ],
  },
};

export default nextConfig;
