import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    COOKIE_SECURE: "false",
  },

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "/api/:path*",
      },
      {
        source: "/storage/:path*",
        destination: "/storage/:path*",
      },
    ];
  },
};

export default nextConfig;
