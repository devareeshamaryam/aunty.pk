/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      // Self-hosted CDN
      { protocol: 'https', hostname: 'aunty.pk', pathname: '/cdn/**' },
      { protocol: 'https', hostname: 'www.aunty.pk', pathname: '/cdn/**' },
      // Legacy uploads (kept for old DB records)
      { protocol: 'https', hostname: 'aunty.pk', pathname: '/uploads/**' },
      // Local dev — API + CDN
      { protocol: 'http', hostname: 'localhost', port: '3030', pathname: '/uploads/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '3030', pathname: '/uploads/**' },
      { protocol: 'http', hostname: 'localhost', port: '3031', pathname: '/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '3031', pathname: '/**' },
    ],
  },
};

export default nextConfig;
