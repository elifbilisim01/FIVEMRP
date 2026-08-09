import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/fivem-api/:path*",
        destination: "https://servers-frontend.fivem.net/api/:path*",
      },
    ];
  },
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
