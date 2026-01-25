// ============================================================================
// WAITING ROOM PAGE
// File: src/app/(auth)/waiting-room/page.tsx
// Deskripsi: Halaman waiting untuk member yang belum di-approve admin
// ============================================================================

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkAuthStatus, logout } from '@/actions/auth'
import { Clock, LogOut, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function WaitingRoomPage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // Check status user saat page load
    checkAuthStatus().then((status) => {
      if (!status.isAuthenticated) {
        router.push('/login')
      } else if (status.isApproved) {
        router.push('/dashboard')
      } else if (status.user) {
        setUserName(status.user.full_name)
      }
    })
  }, [router])

  const handleCheckStatus = async () => {
    setIsChecking(true)
    
    const status = await checkAuthStatus()
    
    if (status.isApproved) {
      router.push('/dashboard')
    } else {
      // Beri feedback visual bahwa sudah dicek
      setTimeout(() => setIsChecking(false), 1000)
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Menunggu Persetujuan
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Halo, <span className="font-medium text-gray-900 dark:text-white">{userName}</span>!
            </p>
          </div>

          {/* Info Steps */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Pendaftaran Berhasil
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Akun Anda telah berhasil didaftarkan dan terverifikasi
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700">
              <div className="flex-shrink-0 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Menunggu Persetujuan Admin
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Akun Anda sedang dalam proses verifikasi oleh admin
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg opacity-50">
              <div className="flex-shrink-0 w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                  Akses Penuh
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Setelah disetujui, Anda dapat mengakses semua fitur
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleCheckStatus}
              disabled={isChecking}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              {isChecking ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Memeriksa Status...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Periksa Status
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-5 h-5" />
              Keluar
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">💡 Tips:</span> Proses persetujuan biasanya memakan waktu maksimal 24 jam. Anda akan menerima notifikasi WhatsApp setelah akun disetujui.
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          Butuh bantuan? Hubungi admin melalui WhatsApp
        </p>
      </div>
    </div>
  )
}