import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // mysql2 uses dynamic requires; keep it out of the server bundle.
  serverExternalPackages: ["mysql2"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
        ],
      },
    ];
  },
  // Arena/E2B preview hosts reach the dev server through a proxied origin.
  allowedDevOrigins: ["*.e2b.app"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "mdabutaher.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: { optimizePackageImports: ["lucide-react"] },
  // পুরোনো সাইটের গ্যালারি ঠিকানা → নতুন রুট (SEO 301)
  async redirects() {
    return [
      { source: "/picture-gallery/:path*", destination: "/gallery/photos", permanent: true },
      { source: "/picture-gallery", destination: "/gallery/photos", permanent: true },
      { source: "/poster/:path*", destination: "/gallery/posters", permanent: true },
      { source: "/poster", destination: "/gallery/posters", permanent: true },
    ];
  },
};

export default nextConfig;
