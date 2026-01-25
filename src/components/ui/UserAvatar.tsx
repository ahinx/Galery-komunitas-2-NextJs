'use client'

import LogoutButton from '@/components/auth/LogoutButton'
import Link from 'next/link'
import { useState } from 'react'
import { User, Settings, LogOut } from 'lucide-react'

interface UserAvatarProps {
  name: string
  role: string
  avatarUrl?: string | null
}

export default function UserAvatar({ name, role, avatarUrl }: UserAvatarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const initials = name.substring(0, 2).toUpperCase()

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 focus:outline-none group"
      >
        <div className="text-right hidden md:block">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-200 group-hover:text-blue-600 transition">
            {name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
            {role.replace('_', ' ')}
          </p>
        </div>
        
        <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden ring-2 ring-white dark:ring-gray-800 group-hover:ring-blue-200 transition">
            {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
                <div className="h-full w-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white">
                    <span className="font-bold text-sm">{initials}</span>
                </div>
            )}
        </div>
      </button>

      {/* DROPDOWN DESKTOP */}
      {isOpen && (
        <>
            {/* Backdrop transparan untuk close saat klik luar */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-2 ring-1 ring-black ring-opacity-5 z-50 transform origin-top-right animate-in fade-in slide-in-from-top-2">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{role}</p>
            </div>
            
            <div className="py-1">
                <Link 
                    href="/profile" 
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => setIsOpen(false)}
                >
                    <Settings className="w-4 h-4" />
                    Pengaturan Profil
                </Link>
                
                <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                
                <div className="px-2">
                    {/* Logout Button Custom Styling */}
                    <LogoutButton className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg justify-start" showText={true} />
                </div>
            </div>
            </div>
        </>
      )}
    </div>
  )
}