// ============================================================================
// PROFILE PAGE (Server Component)
// File: src/app/(main)/profile/page.tsx
// ============================================================================

import { getCurrentUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile/ProfileForm'

// --- PERBAIKAN UTAMA DI SINI ---
// Paksa halaman ini jadi Dinamis agar bisa baca Cookies login
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-10">
      <div className="max-w-xl mx-auto bg-white dark:bg-gray-800 min-h-screen shadow-sm md:min-h-0 md:mt-8 md:rounded-2xl md:border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10 text-center">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pengaturan Profil</h1>
        </div>

        {/* Render Form Client */}
        <ProfileForm user={user} />
        
      </div>
    </div>
  )
}