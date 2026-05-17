import type { NextConfig } from "next";

const RAILWAY_API = process.env.RAILWAY_API_URL ?? "https://dekat-api-production.up.railway.app";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
      { protocol: "https", hostname: "images.samsung.com" },
      { protocol: "https", hostname: "**.gsmarena.com" },
      { protocol: "https", hostname: "**.unsplash.com" },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${RAILWAY_API}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
