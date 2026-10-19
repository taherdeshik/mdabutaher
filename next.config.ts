import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Arena/E2B preview hosts reach the dev server through a proxied origin.
  allowedDevOrigins: ["*.e2b.app"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mdabutaher.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: { optimizePackageImports: ["lucide-react"] },
};

export default nextConfig;
