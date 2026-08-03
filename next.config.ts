import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
    ],
  },
  typescript: {
    // !! DİKKAT !!
    // Bu ayar açıldığında TypeScript hataları olsa bile Next.js build alırken hata vermez ve geçer.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
