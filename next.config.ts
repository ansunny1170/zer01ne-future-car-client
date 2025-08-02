import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.join(__dirname, 'app')
    };
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://ec2-15-165-63-35.ap-northeast-2.compute.amazonaws.com:8000/:path*', // 백엔드 주소
      },
    ]
  },
};

export default nextConfig;