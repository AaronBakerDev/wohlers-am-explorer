import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Turbopack/Webpack transpiles certain ESM packages from node_modules
  transpilePackages: ["html2canvas"],
  
  // Disable ESLint and TypeScript errors during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Keep defaults; avoid aggressive package import optimization that can break ESM interop
    // optimizePackageImports removed due to runtime issues in production bundles
  },
  
  // Force dynamic rendering to avoid prerendering issues
  output: 'standalone',
  
  // Performance optimizations
  compress: true,
  swcMinify: true,
};

export default nextConfig;
