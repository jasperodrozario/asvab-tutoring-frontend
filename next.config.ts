// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'test-prep.asvab-tutoring.com',
        port: '',
        pathname: '/uploads/**',
      },
    ],
  },
};

module.exports = nextConfig;
