import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone 输出模式（适合 CVM 部署）
  output: "standalone",

  // 图片域名白名单
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.volces.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

export default nextConfig;
