// ============================================================================
// MAIN LAYOUT
// File: src/app/(main)/layout.tsx
// ============================================================================

import { getCurrentUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'       // Import Baru
import BottomNav from '@/components/layout/BottomNav' // Import Baru

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Security Check
  if (!user) redirect('/login')
  if (!user.is_approved) redirect('/waiting-room')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      
      {/* 1. Header (Desktop & Mobile Top) */}
      <Navbar user={user} />

      {/* 2. Page Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* 3. Bottom Navigation (Mobile Only) */}
      <BottomNav user={user} />

    </div>
  )
}