import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    // PackFileCacheStrategy 등 인프라 경고(대용량 문자열 직렬화 안내)는 로그만 숨김 — 캐시 동작은 유지
    config.infrastructureLogging = { level: "error" };
    return config;
  },
};

export default nextConfig;
