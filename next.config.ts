// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'test-prep.asvab-tutoring.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;