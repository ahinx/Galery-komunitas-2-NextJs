// ============================================================================
// ROOT LAYOUT (Updated for SEO & Social Share)
// File: src/app/layout.tsx
// ============================================================================

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
// import { Toaster } from 'sonner'

// Inisialisasi Font
const inter = Inter({ subsets: ['latin'] })

// 1. KONFIGURASI VIEWPORT (Terpisah di Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
}

// 2. KONFIGURASI METADATA (SEO & Social Share)
export const metadata: Metadata = {
  // GANTI INI dengan domain Vercel Anda (tanpa akhiran /)
  metadataBase: new URL('https://galeri-komunitas-anda.vercel.app'), 

  title: {
    default: 'Galeri Komunitas',
    template: '%s | Galeri Komunitas',
  },
  description: 'Platform berbagi foto dan kenangan komunitas. Upload, simpan, dan bagikan momen terbaik Anda.',
  
  // Konfigurasi Icon (Favicon)
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png', // Opsional: jika Anda punya icon khusus Apple
  },

  // Konfigurasi Open Graph (Tampilan saat dibagi di WA/FB)
  openGraph: {
    title: 'Galeri Komunitas',
    description: 'Lihat koleksi foto dan momen spesial komunitas kami.',
    url: '/',
    siteName: 'Galeri Komunitas',
    locale: 'id_ID',
    type: 'website',
    // Gambar Preview (Next.js akan otomatis cari file opengraph-image di folder app)
  },

  // Konfigurasi Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Galeri Komunitas',
    description: 'Platform berbagi foto dan kenangan komunitas.',
  },

  // Konfigurasi PWA (Opsional, agar bisa diinstall)
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Galeri Komunitas',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Script untuk mencegah Flash of Unstyled Content (FOUC) pada Dark Mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
        
        {/* Main Content */}
        {children}
        
        {/* Toast Notification */}
        {/* <Toaster position="top-center" richColors /> */}
      </body>
    </html>
  )
}