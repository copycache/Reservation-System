import type { NextConfig } from "next";

const API_URL = "http://94.237.64.125:8000";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: API_URL,
    COOKIE_SECURE: "false",
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: "/storage/:path*",
        destination: `${API_URL}/storage/:path*`,
      },
    ];
  },
};

export default nextConfig;
