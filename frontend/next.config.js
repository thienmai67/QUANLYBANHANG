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
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/manager/dashboard',
        permanent: true,
      },
      {
        source: '/admin/dashboard',
        destination: '/manager/dashboard',
        permanent: true,
      },
      {
        source: '/admin/orders',
        destination: '/manager/orders',
        permanent: true,
      },
      {
        source: '/admin/products',
        destination: '/manager/products',
        permanent: true,
      },
      {
        source: '/admin/customers',
        destination: '/manager/customers',
        permanent: true,
      },
      {
        source: '/admin/categories',
        destination: '/manager/categories',
        permanent: true,
      },
      {
        source: '/admin/settings',
        destination: '/manager/settings',
        permanent: true,
      },
      {
        source: '/admin/analytics',
        destination: '/manager/dashboard',
        permanent: true,
      },
      {
        source: '/admin/bom-requests',
        destination: '/manager/dashboard',
        permanent: true,
      },
      {
        source: '/admin/:path*',
        destination: '/manager/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;

