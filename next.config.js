// ============================================================================
// NEXT.JS CONFIGURATION
// File: next.config.js (di root folder)
// Deskripsi: Konfigurasi Next.js untuk optimasi dan deployment
// ============================================================================

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {}, // Enable Turbopack (experimental)

  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**"
      }
    ],
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384]
  },

  // Experimental features
  experimental: {
    // Server Actions sudah stable di Next.js 14+
    serverActions: {
      bodySizeLimit: "10mb" // Untuk handle upload foto
    }
  },

  // Output mode untuk deployment
  // 'standalone' untuk Docker/VPS, 'export' untuk static hosting
  output: "standalone",

  // Webpack configuration (optional)
  webpack: (config, { isServer }) => {
    // Ignore exif-js warnings
    config.ignoreWarnings = [{ module: /exif-js/ }];

    return config;
  },

  // Environment variables yang boleh diakses di client
  env: {
    NEXT_PUBLIC_APP_NAME: "Galeri Foto Komunitas",
    NEXT_PUBLIC_APP_VERSION: "1.0.0"
  },

  // Compression
  compress: true,

  // PWA Support (jika menggunakan next-pwa)
  // Uncomment jika install next-pwa package
  // ...withPWA({
  //   dest: 'public',
  //   register: true,
  //   skipWaiting: true,
  //   disable: process.env.NODE_ENV === 'development',
  // }),

  // Headers untuk keamanan
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on"
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN"
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff"
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin"
          }
        ]
      }
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false
      }
    ];
  }
};

module.exports = nextConfig;
