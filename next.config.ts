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
    // Reduce bundle parse cost for large libs by modularizing imports
    optimizePackageImports: ["lucide-react"],
  },
  
  // Force dynamic rendering to avoid prerendering issues
  output: 'standalone',
};

export default nextConfig;
