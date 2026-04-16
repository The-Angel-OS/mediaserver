/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: '*.spacesangels.com' },
      { protocol: 'https', hostname: '*.vercel-storage.com' },
      { protocol: 'http', hostname: '192.168.*' },
    ],
  },
  serverExternalPackages: ['livekit-server-sdk', 'better-sqlite3'],
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/proxy/vmware/:path*',
          destination: `${process.env.VMWARE_URL || 'https://192.168.1.1'}/:path*`,
        },
        {
          source: '/proxy/kubernetes/:path*',
          destination: `${process.env.K8S_DASHBOARD_URL || 'http://localhost:8001'}/:path*`,
        },
      ],
    }
  },
}

// PWA wrapper — applied in production only
let nextConfig = baseConfig
try {
  const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    disable: process.env.NODE_ENV === 'development',
    workboxOptions: {
      disableDevLogs: true,
      runtimeCaching: [
        {
          urlPattern: /\/api\/payload\/.*/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'angel-os-api-cache',
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 2 },
          },
        },
        {
          urlPattern: /\/api\/cameras\/.*\/snapshot/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'camera-snapshots',
            expiration: { maxEntries: 50, maxAgeSeconds: 30 },
          },
        },
        {
          urlPattern: /\.(png|jpg|jpeg|svg|gif|webp|ico)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'image-cache',
            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
          },
        },
      ],
    },
  })
  nextConfig = withPWA(baseConfig)
} catch {
  // @ducanh2912/next-pwa not installed yet — run: pnpm add @ducanh2912/next-pwa
}

module.exports = nextConfig
