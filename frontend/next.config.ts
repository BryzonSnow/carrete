import type { NextConfig } from "next";

const api = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.1.181",
    "192.168.56.1",
    "192.168.128.1",
    "172.21.224.1",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${api}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
