// ============================================================================
// NAVBAR COMPONENT (Dynamic Branding)
// File: src/components/layout/Navbar.tsx
// ============================================================================

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Images, Upload, Shield, Image as ImageIcon, Settings } from 'lucide-react'
import SearchBar from '@/components/ui/SearchBar'
import UserAvatar from '@/components/ui/UserAvatar'
import Tooltip from '@/components/ui/Tooltip'

// Update Interface Props
interface NavbarProps {
  user: {
    full_name: string
    role: string
    avatar_url?: string | null
  }
  // Props baru untuk Settings
  settings: {
    app_name?: string
    logo_url?: string | null
  }
}

export default function Navbar({ user, settings }: NavbarProps) {
  const pathname = usePathname()
  const isDashboard = pathname === '/dashboard'

  // Nama Aplikasi Default
  const appName = settings.app_name || 'Galeri PTN'

  const getLinkClass = (path: string) => 
    `p-2 rounded-full transition ${
      pathname === path 
        ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
    }`

  return (
    <nav className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16 gap-3 md:gap-4">
          
          {/* --- 1. LOGO SECTION (DINAMIS) --- */}
          <Link 
            href="/dashboard" 
            className={`
              flex items-center gap-2 md:gap-3 shrink-0 z-20 transition-all duration-300
              ${!isDashboard 
                ? 'absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto' 
                : 'static'
              }
            `}
          >
            {/* LOGIC GAMBAR LOGO */}
            {settings.logo_url ? (
               // A. Jika ada Logo Uploaded -> Tampilkan Gambar
               <img 
                 src={settings.logo_url} 
                 alt={appName}
                 className="h-8 md:h-10 w-auto object-contain" 
               />
            ) : (
               // B. Jika Kosong -> Tampilkan Icon Default (Blue Box)
               <div className="w-8 h-8 md:w-9 md:h-9 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                 <Images className="w-4 h-4 md:w-5 md:h-5 text-white" />
               </div>
            )}
            
            {/* LOGIC TEKS NAMA APLIKASI */}
            <span className={`
              font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 tracking-tight
              ${isDashboard ? 'hidden md:block' : 'block'}
            `}>
              {appName}
            </span>
          </Link>

          {/* --- 2. SEARCH BAR --- */}
          {isDashboard ? (
             <div className="flex-1 flex justify-end md:justify-center max-w-full md:max-w-lg transition-all">
                <div className="w-full">
                  <SearchBar />
                </div>
             </div>
          ) : (
             <div className="hidden md:block flex-1"></div>
          )}

          {/* --- 3. DESKTOP MENU --- */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <Tooltip text="Galeri Utama">
              <Link href="/dashboard" className={getLinkClass('/dashboard')}>
                <ImageIcon className="w-5 h-5" />
              </Link>
            </Tooltip>

            <Tooltip text="Upload Foto">
              <Link href="/upload" className={getLinkClass('/upload')}>
                <Upload className="w-5 h-5" />
              </Link>
            </Tooltip>
            
            {['admin', 'super_admin'].includes(user.role) && (
              <Tooltip text="Admin Panel">
                <Link href="/admin" className={getLinkClass('/admin')}>
                  <Shield className="w-5 h-5" />
                </Link>
              </Tooltip>
            )}

            {user.role === 'super_admin' && (
              <Tooltip text="Pengaturan Aplikasi">
                <Link href="/admin/settings" className={getLinkClass('/admin/settings')}>
                  <Settings className="w-5 h-5" />
                </Link>
              </Tooltip>
            )}

            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

            <Link href="/profile">
              <UserAvatar name={user.full_name} role={user.role} avatarUrl={user.avatar_url} />
            </Link>
          </div>

          <div className={`md:hidden ${!isDashboard ? 'w-8' : ''}`}></div>

        </div>
      </div>
    </nav>
  )
}