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

const legacyCourseRedirects = [
  'asvab',
  'oar',
  'afoqt',
  'sift',
  'astb',
] as const;

const CANONICAL_HOST = 'www.asvab-tutoring.com';
const NAKED_HOST = 'asvab-tutoring.com';

/** Naked domain → www (production uses x-forwarded-host from index.php proxy). */
const nakedToWwwRedirects = [
  {
    source: '/:path*',
    has: [{ type: 'header' as const, key: 'x-forwarded-host', value: NAKED_HOST }],
    destination: `https://${CANONICAL_HOST}/:path*`,
    permanent: true,
  },
  {
    source: '/:path*',
    has: [{ type: 'header' as const, key: 'host', value: NAKED_HOST }],
    destination: `https://${CANONICAL_HOST}/:path*`,
    permanent: true,
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  async redirects() {
    return [
      ...nakedToWwwRedirects,
      {
        source: '/course/:code',
        destination: '/courses/:code',
        permanent: true,
      },
      ...legacyCourseRedirects.flatMap((course) => [
        {
          source: `/${course}`,
          destination: `/courses/${course}`,
          permanent: true,
        },
        {
          source: `/${course}/`,
          destination: `/courses/${course}`,
          permanent: true,
        },
      ]),
    ];
  },
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
