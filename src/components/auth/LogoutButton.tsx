// ============================================================================
// COMPONENT: LOGOUT BUTTON
// File: src/components/auth/LogoutButton.tsx
// Deskripsi: Client component untuk menangani proses logout dengan UX yang baik
// ============================================================================

'use client'

import { logout } from '@/actions/auth'
import { LogOut } from 'lucide-react'
import { useState } from 'react'

interface LogoutButtonProps {
    className?: string
    showText?: boolean
}

export default function LogoutButton({ className, showText = false }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    if (isLoading) return
    setIsLoading(true)
    await logout()
  }

  // Default styling jika className tidak diisi
  const defaultClass = "p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className={className || defaultClass}
      title="Keluar Aplikasi"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <LogOut className="w-5 h-5" />
      )}
      {showText && <span className="ml-2">{isLoading ? 'Keluar...' : 'Keluar'}</span>}
    </button>
  )
}