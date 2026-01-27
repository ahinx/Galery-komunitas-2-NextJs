// ============================================================================
// ROOT LAYOUT (Dynamic Metadata & Viewport)
// File: src/app/layout.tsx
// ============================================================================

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { getAppSettings } from '@/actions/settings'

const inter = Inter({ subsets: ['latin'] })

// 1. GENERATE VIEWPORT (Khusus untuk Theme Color & Skala)
// Ini WAJIB dipisah dari metadata agar theme_color bisa dinamis dari DB
export async function generateViewport(): Promise<Viewport> {
  const settings = await getAppSettings()
  
  // Ambil warna dari DB, atau default biru jika kosong
  const userColor = settings?.theme_color || '#2563eb'

  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    // Logika Warna:
    // Kita set warna pilihan user sebagai default.
    // Anda bisa memisahkan logic dark/light jika mau, tapi agar 
    // "pilihan user" terasa efeknya, kita pakai warna tersebut.
    themeColor: userColor, 
  }
}

// 2. GENERATE METADATA (Untuk SEO, Judul, Icon, dll)
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getAppSettings()

  const appName = settings?.app_name || 'Galeri Komunitas'
  const appDesc = settings?.app_description || 'Platform berbagi foto dan kenangan komunitas.'
  
  // Cache Busting untuk Icon (agar browser refresh gambar baru)
  const version = settings?.updated_at ? new Date(settings.updated_at).getTime() : Date.now()
  
  let iconUrl = '/favicon.ico'
  if (settings?.icon_url) {
     iconUrl = `${settings.icon_url}?v=${version}`
  }

  const appleIconUrl = settings?.apple_icon_url 
    ? `${settings.apple_icon_url}?v=${version}` 
    : iconUrl

  const ogImageUrl = settings?.og_image_url || '/opengraph-image.png'
  const keywords = settings?.keywords ? settings.keywords.split(',').map((k: string) => k.trim()) : ['galeri', 'komunitas']

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),

    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
    description: appDesc,
    keywords: keywords,

    icons: {
      icon: iconUrl,
      shortcut: iconUrl,
      apple: appleIconUrl,
    },

    openGraph: {
      title: appName,
      description: appDesc,
      url: '/',
      siteName: appName,
      locale: 'id_ID',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: appName,
        },
      ],
    },

    twitter: {
      card: 'summary_large_image',
      title: appName,
      description: appDesc,
      images: [ogImageUrl],
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