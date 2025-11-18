import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 注释掉静态导出配置，以支持 Vercel 动态部署
  // GitHub Pages 部署时需要取消注释以下两行：
  // output: 'export',
  // basePath: '/guanjiancimiaoshuxitong',

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
