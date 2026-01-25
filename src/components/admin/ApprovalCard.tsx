// ============================================================================
// APPROVAL CARD COMPONENT (MODERN UI)
// File: src/components/admin/ApprovalCard.tsx
// Deskripsi: Card approval dengan Modal Konfirmasi & Feedback Visual
// ============================================================================

'use client'

import { useState } from 'react'
import { approveUser, banUser } from '@/actions/admin'
import { formatDateTime, maskPhoneNumber } from '@/lib/utils'
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  User, 
  AlertTriangle, 
  ShieldCheck, 
  Ban 
} from 'lucide-react'
import type { Profile } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ApprovalCardProps {
  user: Profile
}

export default function ApprovalCard({ user }: ApprovalCardProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [showModal, setShowModal] = useState<'approve' | 'reject' | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Handler Aksi (Dipanggil setelah konfirmasi di Modal)
  const executeAction = async () => {
    if (!showModal) return

    setIsProcessing(true)
    const actionType = showModal
    
    try {
      let result
      if (actionType === 'approve') {
        result = await approveUser(user.id)
      } else {
        result = await banUser(user.id)
      }

      if (result.success) {
        // Tampilkan pesan sukses sebentar sebelum refresh
        setSuccessMessage(actionType === 'approve' ? 'User Disetujui' : 'User Ditolak')
        setShowModal(null) // Tutup modal
        
        // Tunggu 1 detik agar admin lihat feedback sukses
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        alert(result.message) // Fallback error
        setIsProcessing(false)
        setShowModal(null)
      }
    } catch (error) {
      console.error(error)
      setIsProcessing(false)
      setShowModal(null)
    }
  }

  // Jika sudah sukses, tampilkan card dalam mode "Sukses" (Hijau/Merah pudar)
  if (successMessage) {
    return (
      <div className={`rounded-xl p-6 border flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in duration-300 ${
        successMessage.includes('Disetujui') 
          ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
          : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
      }`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
           successMessage.includes('Disetujui') ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
          {successMessage.includes('Disetujui') ? <CheckCircle2 className="w-6 h-6" /> : <Ban className="w-6 h-6" />}
        </div>
        <p className="font-bold text-gray-900 dark:text-white">{successMessage}</p>
      </div>
    )
  }

  return (
    <>
      {/* CARD UTAMA */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
        
        {/* User Info */}
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
            {user.avatar_url ? (
                <img src={user.avatar_url} className="w-full h-full object-cover rounded-full" alt={user.full_name} />
            ) : (
                <User className="w-6 h-6 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 dark:text-white truncate text-lg">
              {user.full_name}
            </h3>
            <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">
              {user.phone_number}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 py-1 px-2 rounded-lg w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Menunggu: {formatDateTime(user.created_at)}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowModal('reject')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:border-red-800 transition-all active:scale-95 text-sm"
          >
            <XCircle className="w-4 h-4" />
            Tolak
          </button>

          <button
            onClick={() => setShowModal('approve')}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition-all active:scale-95 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Setujui
          </button>
        </div>
      </div>

      {/* MODAL KONFIRMASI (POPUP) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            
            {/* Icon Modal */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              showModal === 'approve' 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {showModal === 'approve' ? <ShieldCheck className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>

            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {showModal === 'approve' ? 'Setujui User Ini?' : 'Tolak Pendaftaran?'}
            </h3>
            
            <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
              {showModal === 'approve' 
                ? `Anda akan memberikan akses masuk penuh kepada "${user.full_name}".`
                : `User "${user.full_name}" tidak akan bisa login ke aplikasi.`
              }
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(null)}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              
              <button
                onClick={executeAction}
                disabled={isProcessing}
                className={`flex-1 py-3 px-4 text-white font-medium rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  showModal === 'approve'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                    : 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Proses...
                  </>
                ) : (
                  showModal === 'approve' ? 'Ya, Setujui' : 'Ya, Tolak'
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}