import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  // TypeScript type checking is now enabled in builds
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
