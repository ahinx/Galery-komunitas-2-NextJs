// ============================================================================
// PROFILE PAGE (Server Component)
// File: src/app/(main)/profile/page.tsx
// ============================================================================

import { getCurrentUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 min-h-screen shadow-sm md:min-h-0 md:mt-8 md:rounded-2xl md:border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Header Mobile Style */}
        <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
            <h1 className="text-lg font-bold text-center">Pengaturan Profil</h1>
        </div>

        {/* Render Client Component */}
        <ProfileForm user={user} />
        
      </div>
    </div>
  )
}