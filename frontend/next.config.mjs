/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
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

// Conditionally apply bundle analyzer only in development
let config = nextConfig;

if (process.env.ANALYZE === 'true') {
  try {
    const bundleAnalyzer = (await import('@next/bundle-analyzer')).default;
    const withBundleAnalyzer = bundleAnalyzer({
      enabled: true,
    });
    config = withBundleAnalyzer(nextConfig);
  } catch (e) {
    console.warn('Bundle analyzer not available, skipping...');
  }
}

export default config;
