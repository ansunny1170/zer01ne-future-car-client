import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Docker 이미지 최적화: 최소 서버 + 필요한 의존성만 포함한 standalone 빌드
  // .next/standalone 폴더가 생성되어 Dockerfile에서 활용
  output: 'standalone',
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