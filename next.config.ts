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
    ],
  },
};

module.exports = nextConfig;
