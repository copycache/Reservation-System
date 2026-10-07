import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: "http://127.0.0.1:8000",
    COOKIE_SECURE: "false",
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8000/api/:path*",
      },
      {
        source: "/storage/:path*",
        destination: "http://127.0.0.1:8000/storage/:path*",
      },
    ];
  },
};

export default nextConfig;
