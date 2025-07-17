import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://15.165.63.35:8000/:path*', // 백엔드 주소
      },
    ]
  },
};

export default nextConfig;