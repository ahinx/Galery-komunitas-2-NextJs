// ============================================================================
// MAIN LAYOUT (PERSISTENT NAVIGATION)
// File: src/app/(main)/layout.tsx
// Deskripsi: Layout ini membungkus Dashboard, Upload, Admin, & Profile
// ============================================================================

import { getCurrentUser } from '@/actions/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SearchBar from '@/components/ui/SearchBar'
import UserAvatar from '@/components/ui/UserAvatar'
import Tooltip from '@/components/ui/Tooltip'
import { Images, Upload, Shield, User as UserIcon } from 'lucide-react'

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  // Security Check Global untuk area ini
  if (!user) redirect('/login')
  if (!user.is_approved) redirect('/waiting-room')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20 md:pb-0">
      
      {/* ================= HEADER DESKTOP ================= */}
      <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* LOGO */}
            <Link href="/dashboard" className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Images className="w-5 h-5 text-white" />
              </div>
              <span className="hidden sm:block text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                GaleriKomunitas
              </span>
            </Link>

            {/* SEARCH BAR */}
            <div className="flex-1 flex justify-center max-w-lg">
               <SearchBar />
            </div>

            {/* MENU KANAN (DESKTOP) */}
            <div className="hidden md:flex items-center gap-4">
              <Tooltip text="Upload Foto">
                <Link href="/upload" className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition">
                 <Upload className="w-5 h-5" />
                </Link>
             </Tooltip>
              
              {user.role !== 'member' && (
                <Tooltip text="Admin Panel">
                    <Link href="/admin" className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition">
                    <Shield className="w-5 h-5" />
                    </Link>
                </Tooltip>
              )}

              <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

              <UserAvatar name={user.full_name} role={user.role} avatarUrl={user.avatar_url} />
            </div>

            {/* Placeholder Mobile */}
            <div className="md:hidden w-9"></div>

          </div>
        </div>
      </nav>

      {/* ================= PAGE CONTENT ================= */}
      {/* Ini adalah tempat konten Dashboard/Upload/Profile akan muncul */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* ================= MOBILE BOTTOM NAV ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe z-50">
        <div className={`grid h-16 items-center px-2 ${
            user.role === 'member' ? 'grid-cols-3' : 'grid-cols-4'
        }`}>
          
          <Link href="/dashboard" className="flex flex-col items-center justify-center gap-1 text-blue-600 dark:text-blue-400 p-2 rounded-xl transition">
            <Images className="w-6 h-6" />
            <span className="text-[10px] font-medium">Galeri</span>
          </Link>

          <Link href="/upload" className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-xl transition">
            <Upload className="w-6 h-6" />
            <span className="text-[10px] font-medium">Upload</span>
          </Link>

          {user.role !== 'member' && (
             <Link href="/admin" className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 p-2 rounded-xl transition">
                <Shield className="w-6 h-6" />
                <span className="text-[10px] font-medium">Admin</span>
             </Link>
          )}

          <Link href="/profile" className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-xl transition">
            {user.avatar_url ? (
                <img src={user.avatar_url} className="w-6 h-6 rounded-full object-cover border border-gray-300" />
            ) : (
                <UserIcon className="w-6 h-6" />
            )}
            <span className="text-[10px] font-medium">Akun</span>
          </Link>

        </div>
      </nav>

    </div>
  )
}