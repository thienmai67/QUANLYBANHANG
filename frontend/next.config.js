/** @type {import('next').NextConfig} */
const backendInternalUrl = (
  process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8080'
).replace(/\/+$/, '');

const nextConfig = {
  reactStrictMode: true,
  ...(process.env.BUILD_STANDALONE !== 'false' ? { output: 'standalone' } : {}),
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendInternalUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;

