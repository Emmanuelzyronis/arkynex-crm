import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The repo can sit alongside other lockfiles (e.g. a parent workspace); pin the
  // Turbopack root to this project so builds resolve from here.
  turbopack: {
    root: process.cwd(),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
