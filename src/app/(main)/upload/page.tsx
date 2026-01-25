// ============================================================================
// UPLOAD PAGE
// File: src/app/upload/page.tsx
// Deskripsi: Halaman untuk upload foto dengan drag & drop
// ============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import DropZone from '@/components/upload/DropZone'
import { Upload as UploadIcon } from 'lucide-react'

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <UploadIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Upload Foto
            </h1>
          </div>
          {/* <p className="text-gray-600 dark:text-gray-400">
            Upload foto Anda ke galeri komunitas. File akan dikompresi otomatis.
          </p> */}
        </div>

        {/* Info Banner */}
        {/* <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-blue-600 dark:text-blue-400 mt-0.5">
              ℹ️
            </div>
            <div className="text-sm text-blue-900 dark:text-blue-100 space-y-1">
              <p className="font-medium">Tips Upload:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                <li>File akan dikompresi otomatis menjadi format WebP untuk menghemat ruang</li>
                <li>Metadata EXIF (lokasi, kamera, tanggal) akan disimpan untuk keamanan</li>
                <li>Upload bisa dilakukan secara batch (multiple files sekaligus)</li>
              </ul>
            </div>
          </div>
        </div> */}

        {/* Upload Component */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <DropZone />
        </div>

        {/* Footer Tips */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Semua upload dilindungi dengan sistem audit siluman untuk keamanan komunitas
          </p>
        </div>
      </div>
    </div>
  )
}