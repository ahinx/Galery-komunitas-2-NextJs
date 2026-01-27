// ============================================================================
// ROOT LAYOUT (Dynamic Metadata)
// File: src/app/layout.tsx
// ============================================================================

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { getAppSettings } from '@/actions/settings' // Import fungsi tadi

const inter = Inter({ subsets: ['latin'] })

// 1. VIEWPORT (Tetap Statis)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#111827' },
  ],
}

// 2. GENERATE METADATA (Dinamis dari DB)
export async function generateMetadata(): Promise<Metadata> {
  // Ambil data dari DB
  const settings = await getAppSettings()

  // Fallback jika DB kosong/error
  const appName = settings?.app_name || 'Galeri Komunitas'
  const appDesc = settings?.app_description || 'Platform berbagi momen warga.'
  const iconUrl = settings?.icon_url || '/favicon.ico'
  const ogImage = settings?.og_image_url || '/opengraph-image.png' // Default file lokal

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
    description: appDesc,
    
    // Icon Tab Browser (Favicon Dinamis)
    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: iconUrl, 
    },

    // Open Graph (Tampilan Share WA/FB)
    openGraph: {
      title: appName,
      description: appDesc,
      siteName: appName,
      locale: 'id_ID',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: appName,
        },
      ],
    },

    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      title: appName,
      description: appDesc,
      images: [ogImage],
    },
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={inter.className}>
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
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}