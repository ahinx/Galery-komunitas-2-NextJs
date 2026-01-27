// ============================================================================
// BOTTOM NAV COMPONENT (Mobile Only - Updated)
// File: src/components/layout/BottomNav.tsx
// ============================================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Images, Upload, Shield, User as UserIcon, Settings } from 'lucide-react' // Tambah Settings Icon

interface BottomNavProps {
  user: {
    role: string
    avatar_url?: string | null
  }
}

export default function BottomNav({ user }: BottomNavProps) {
  const pathname = usePathname()

  // Helper Active State Mobile
  const getMobileClass = (path: string) => 
    `flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition ${
      pathname === path 
        ? 'text-blue-600 dark:text-blue-400 font-bold' 
        : 'text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium'
    }`

  // Hitung jumlah kolom grid berdasarkan role
  let gridCols = 'grid-cols-3'
  if (user.role === 'admin') gridCols = 'grid-cols-4'
  if (user.role === 'super_admin') gridCols = 'grid-cols-5'

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe z-50">
      <div className={`grid h-16 items-center px-2 ${gridCols}`}>
        
        {/* 1. Galeri */}
        <Link href="/dashboard" className={getMobileClass('/dashboard')}>
          <Images className="w-6 h-6" />
          <span className="text-[10px]">Galeri</span>
        </Link>

        {/* 2. Upload */}
        <Link href="/upload" className={getMobileClass('/upload')}>
          <Upload className="w-6 h-6" />
          <span className="text-[10px]">Upload</span>
        </Link>

        {/* 3. Admin (Admin & Super Admin) */}
        {['admin', 'super_admin'].includes(user.role) && (
           <Link href="/admin" className={getMobileClass('/admin')}>
              <Shield className="w-6 h-6" />
              <span className="text-[10px]">Admin</span>
           </Link>
        )}

        {/* 4. Settings (Super Admin Only) - [BARU] */}
        {user.role === 'super_admin' && (
           <Link href="/admin/settings" className={getMobileClass('/admin/settings')}>
              <Settings className="w-6 h-6" />
              <span className="text-[10px]">Setting</span>
           </Link>
        )}

        {/* 5. Profil */}
        <Link href="/profile" className={getMobileClass('/profile')}>
          {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt="Profile"
                className={`w-6 h-6 rounded-full object-cover border ${
                  pathname === '/profile' ? 'border-blue-600' : 'border-gray-300'
                }`} 
              />
          ) : (
              <UserIcon className="w-6 h-6" />
          )}
          <span className="text-[10px]">Akun</span>
        </Link>

      </div>
    </nav>
  )
}