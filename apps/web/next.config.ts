import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "opencut.app",
      },
      {
        protocol: "https",
        hostname: "oss.now",
      },
      {
        protocol: "https",
        hostname: "mail0.com",
      },
      {
        protocol: "https",
        hostname: "inbound.new",
      },
      {
        protocol: "https",
        hostname: "assets.dub.co",
      },
    ],
  },
};

export default nextConfig;
