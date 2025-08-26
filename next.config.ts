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
  eslint: { ignoreDuringBuilds: true },
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'https://dev.ftcar.org/:path*', // 백엔드 주소
  //     },
  //   ]
  // },
};

export default nextConfig;
