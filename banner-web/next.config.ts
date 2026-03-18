import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  outputFileTracingRoot: process.cwd(),
  images: {
    dangerouslyAllowSVG: true
  }
};

export default nextConfig;
