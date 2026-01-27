// ============================================================================
// CHECK STATUS BUTTON
// File: src/components/auth/CheckStatusButton.tsx
// Deskripsi: Tombol refresh manual untuk user di Waiting Room
// ============================================================================

'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { RefreshCw, LogOut } from 'lucide-react'
import { logout } from '@/actions/auth' // Server action logout

export default function CheckStatusButton() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckStatus = () => {
    setIsLoading(true)
    // Refresh Server Component (ini akan mentrigger ulang logic redirect di page.tsx)
    router.refresh()
    
    // Matikan loading setelah 2 detik (visual feedback)
    setTimeout(() => {
      setIsLoading(false)
    }, 2000)
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Tombol Utama: Cek Status */}
      <button
        onClick={handleCheckStatus}
        disabled={isLoading}
        className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
      >
        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        {isLoading ? 'Mengecek...' : 'Cek Status Approval'}
      </button>

      {/* Tombol Sekunder: Logout (Teks Kecil) */}
      <button 
        onClick={() => logout()}
        className="text-sm text-gray-400 hover:text-red-500 flex items-center gap-1.5 transition-colors px-4 py-2"
      >
        <LogOut className="w-3.5 h-3.5" />
        Keluar / Ganti Akun
      </button>
    </div>
  )
}