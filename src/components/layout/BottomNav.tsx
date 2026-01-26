// ============================================================================
// BOTTOM NAV COMPONENT (Mobile Only)
// File: src/components/layout/BottomNav.tsx
// ============================================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Images, Upload, Shield, User as UserIcon } from 'lucide-react'

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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 pb-safe z-50">
      <div className={`grid h-16 items-center px-2 ${
          user.role === 'member' ? 'grid-cols-3' : 'grid-cols-4'
      }`}>
        
        <Link href="/dashboard" className={getMobileClass('/dashboard')}>
          <Images className="w-6 h-6" />
          <span className="text-[10px]">Galeri</span>
        </Link>

        <Link href="/upload" className={getMobileClass('/upload')}>
          <Upload className="w-6 h-6" />
          <span className="text-[10px]">Upload</span>
        </Link>

        {user.role !== 'member' && (
           <Link href="/admin" className={getMobileClass('/admin')}>
              <Shield className="w-6 h-6" />
              <span className="text-[10px]">Admin</span>
           </Link>
        )}

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