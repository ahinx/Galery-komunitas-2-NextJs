// ============================================================================
// UPLOAD PAGE
// File: src/app/(main)/upload/page.tsx
// ============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import DropZone from '@/components/upload/DropZone'
import { Upload as UploadIcon } from 'lucide-react'

// --- PERBAIKAN UTAMA DI SINI ---
export const dynamic = 'force-dynamic'

export default async function UploadPage() {
  const user = await getCurrentUser()

  // Redirect jika belum login
  if (!user) {
    redirect('/login')
  }

  // Redirect jika belum approved
  if (!user.is_approved) {
    redirect('/waiting-room')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pb-24">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <UploadIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Upload Foto
            </h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Bagikan momen terbaik Anda kepada komunitas.
          </p>
        </div>

        {/* Upload Component */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <DropZone />
        </div>

        {/* Footer Tips */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Pastikan foto yang diupload tidak mengandung unsur SARA dan pornografi.
          </p>
        </div>
      </div>
    </div>
  )
}