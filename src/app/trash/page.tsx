// ============================================================================
// TRASH PAGE (Super Admin Only)
// File: src/app/trash/page.tsx
// Deskripsi: Kelola foto yang sudah di-soft delete (permanent purge)
// ============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPhotos } from '@/actions/photos'
import TrashGrid from '@/components/trash/TrashGrid'
import { Trash2, AlertTriangle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TrashPage() {
  const user = await getCurrentUser()

  // Redirect jika bukan super admin
  if (!user || user.role !== 'super_admin') {
    redirect('/dashboard')
  }

  // Fetch deleted photos
  const photosResult = await getPhotos({
    includeDeleted: true,
  })

  const deletedPhotos = photosResult.success 
    ? (photosResult.data?.photos || []).filter(p => p.is_deleted)
    : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
              <Trash2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Tempat Sampah
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola foto yang telah dihapus
              </p>
            </div>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-900 dark:text-red-100">
              <p className="font-medium mb-1">⚠️ Perhatian!</p>
              <p>
                Permanent delete akan menghapus foto secara permanen dari storage dan database. 
                Aksi ini <span className="font-bold">tidak dapat dibatalkan</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Foto Dihapus
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {deletedPhotos.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Dapat Dipulihkan
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {deletedPhotos.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Storage Dapat Dibebaskan
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(deletedPhotos.reduce((sum, p) => sum + p.file_size, 0) / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Trash Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          {deletedPhotos.length > 0 ? (
            <TrashGrid photos={deletedPhotos} />
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Trash2 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Tempat sampah kosong
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tidak ada foto yang dihapus
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}