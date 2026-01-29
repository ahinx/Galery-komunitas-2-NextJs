// ============================================================================
// TRASH PAGE (Super Admin Only) - REDESIGNED
// File: src/app/(main)/admin/trash/page.tsx
// ============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPhotos } from '@/actions/photos'
import TrashGrid from '@/components/trash/TrashGrid'
import { Trash2, AlertTriangle, RotateCcw, HardDrive } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function TrashPage() {
  const user = await getCurrentUser()

  if (!user || user.role !== 'super_admin') {
    redirect('/dashboard')
  }

  const photosResult = await getPhotos({
    includeDeleted: true,
    limit: 1000
  })

  const allPhotos = photosResult.success && photosResult.data 
    ? photosResult.data.photos 
    : []

  const deletedPhotos = allPhotos.filter(p => p.is_deleted)
  const totalSizeMB = (deletedPhotos.reduce((sum, p) => sum + (p.file_size || 0), 0) / 1024 / 1024).toFixed(2)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-4">
        
        {/* Header Compact (Updated: Center Mobile, Left Desktop) */}
        <div className="flex flex-col md:flex-row items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4 gap-4 md:gap-0">
          <div className="flex flex-col md:flex-row items-center gap-3 text-center md:text-left">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center text-red-600 dark:text-red-500">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Tempat Sampah
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manajemen foto yang dihapus
              </p>
            </div>
          </div>
        </div>

        {/* Small Warning Banner */}
        {/* <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            <span className="font-semibold">Perhatian:</span> Menghapus di sini berarti <span className="font-bold underline">permanen</span>. Data & file asli akan hilang selamanya.
          </div>
        </div> */}

        {/* Small Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* Card 1 */}
          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Item</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{deletedPhotos.length}</p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Ukuran</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{totalSizeMB} MB</p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-3 col-span-2 md:col-span-1">
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600 dark:text-green-400">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-xs font-medium text-green-600 dark:text-green-400 leading-tight">Semua dapat dipulihkan</p>
            </div>
          </div>
        </div>

        {/* Trash Content */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden min-h-[300px]">
          {deletedPhotos.length > 0 ? (
            <div className="p-4">
              <TrashGrid photos={deletedPhotos} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] text-center p-8">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
                <Trash2 className="w-6 h-6 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tempat Sampah Kosong</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mt-1">
                Aman. Tidak ada foto yang perlu dikhawatirkan.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}