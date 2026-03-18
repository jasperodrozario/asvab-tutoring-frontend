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
        pathname: '/**', // ✅ allow all paths (not just /uploads/**)
      },
      {
        protocol: 'https',
        hostname: 'staging-test-prep.asvab-tutoring.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
