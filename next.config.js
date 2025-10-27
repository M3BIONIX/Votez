/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'output: export' for server-side rendering and API routes
  // This enables Next.js to work properly with Vercel deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;
