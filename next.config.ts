import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "api.catherdingapp.com",
      },
      {
        protocol: "http",
        hostname: "10.10.7.65",
      },
      {
        protocol: "http",
        hostname: "10.10.26.185",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
