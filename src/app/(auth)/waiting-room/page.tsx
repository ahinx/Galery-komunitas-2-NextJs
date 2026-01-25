'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkRegistrationStatus, logout } from '@/actions/auth'
import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'

export default function WaitingRoomPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [isChecking, setIsChecking] = useState(true)

  // Polling Status setiap 3 detik
  useEffect(() => {
    const interval = setInterval(async () => {
      const result = await checkRegistrationStatus()
      if (result.status === 'approved') {
        setStatus('approved')
        clearInterval(interval)
        setTimeout(() => router.push('/dashboard'), 2000)
      } else if (result.status === 'rejected') {
        setStatus('rejected')
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [router])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
        
        {/* STATUS: PENDING */}
        {status === 'pending' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              <div className="absolute inset-0 border-4 border-amber-500/30 rounded-full animate-ping"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Menunggu Persetujuan
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Admin sedang meninjau pendaftaran Anda.<br/>
              Halaman ini akan otomatis memuat ulang jika sudah disetujui.
            </p>
            <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600 underline">
              Keluar / Batalkan
            </button>
          </div>
        )}

        {/* STATUS: APPROVED */}
        {status === 'approved' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Akun Disetujui!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Selamat datang di komunitas. Mengalihkan ke dashboard...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
          </div>
        )}

        {/* STATUS: REJECTED */}
        {status === 'rejected' && (
          <div className="animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
              Akses Ditolak
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Maaf, admin menolak permohonan pendaftaran Anda.
            </p>
            <button 
              onClick={handleLogout}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-3 rounded-xl transition"
            >
              Keluar Aplikasi
            </button>
          </div>
        )}

      </div>
    </div>
  )
}