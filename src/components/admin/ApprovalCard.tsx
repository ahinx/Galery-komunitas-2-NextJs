// ============================================================================
// APPROVAL CARD COMPONENT
// File: src/components/admin/ApprovalCard.tsx
// Deskripsi: Card untuk approve/reject user baru
// ============================================================================

'use client'

import { useState } from 'react'
import { approveUser, banUser } from '@/actions/admin'
import { formatDateTime, maskPhoneNumber } from '@/lib/utils'
import { CheckCircle2, XCircle, Loader2, User } from 'lucide-react'
import type { Profile } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface ApprovalCardProps {
  user: Profile
}

export default function ApprovalCard({ user }: ApprovalCardProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [action, setAction] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async () => {
    if (!confirm(`Yakin ingin menyetujui ${user.full_name}?`)) return

    setIsProcessing(true)
    setAction('approve')

    try {
      const result = await approveUser(user.id)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsProcessing(false)
      setAction(null)
    }
  }

  const handleReject = async () => {
    if (!confirm(`Yakin ingin menolak ${user.full_name}? User tidak akan bisa mengakses aplikasi.`)) return

    setIsProcessing(true)
    setAction('reject')

    try {
      const result = await banUser(user.id)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsProcessing(false)
      setAction(null)
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
      {/* User Info */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
            {user.full_name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {maskPhoneNumber(user.phone_number)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Daftar: {formatDateTime(user.created_at)}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApprove}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition text-sm"
        >
          {isProcessing && action === 'approve' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Setujui
            </>
          )}
        </button>

        <button
          onClick={handleReject}
          disabled={isProcessing}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition text-sm"
        >
          {isProcessing && action === 'reject' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Tolak
            </>
          )}
        </button>
      </div>
    </div>
  )
}