import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // PROTOTYPE (reading pages): lets a phone on the local network load the dev server's assets.
  allowedDevOrigins: ['192.168.1.200'],
};

export default nextConfig;
