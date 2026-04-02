// next.config.ts
import type { NextConfig } from 'next';

const phpApiUrl = process.env.PHP_API_URL || process.env.NEXT_PUBLIC_PHP_API_URL;

let apiHostname = '';

if (phpApiUrl) {
  try {
    apiHostname = new URL(phpApiUrl).hostname;
  } catch (error) {
    console.error('Invalid PHP API URL in env:', phpApiUrl);
  }
}

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    unoptimized: true,
    remotePatterns: apiHostname
      ? [
          {
            protocol: 'https',
            hostname: apiHostname,
            port: '',
            pathname: '/**',
          },
        ]
      : [],
  },
};

export default nextConfig;