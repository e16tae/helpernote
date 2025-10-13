import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/helpernote/**',
      },
      {
        protocol: 'https',
        hostname: 'minio.helpernote.my',
        pathname: '/helpernote/**',
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);
