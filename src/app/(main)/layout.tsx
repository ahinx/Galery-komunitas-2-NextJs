// ============================================================================
// MAIN LAYOUT
// File: src/app/(main)/layout.tsx
// ============================================================================

import { getCurrentUser } from '@/actions/auth'
import { getAppSettings } from '@/actions/settings' // Import fungsi ini
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import { redirect } from 'next/navigation'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. Ambil Data User & Settings secara paralel
  const [user, settings] = await Promise.all([
    getCurrentUser(),
    getAppSettings()
  ])

  if (!user) {
    redirect('/login')
  }

  // Fallback settings jika null (misal database kosong)
  const appSettings = settings || {
    app_name: 'Galeri PTN',
    logo_url: null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20 md:pb-0">
      
      {/* HEADER: Kirim user & settings ke Navbar */}
      <Navbar user={user} settings={appSettings} />

      {/* PAGE CONTENT */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* BOTTOM NAV */}
      <BottomNav user={user} />

    </div>
  )
}