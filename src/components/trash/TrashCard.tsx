// ============================================================================
// TRASH GRID COMPONENT (Redesigned & Responsive)
// File: src/components/trash/TrashGrid.tsx
// Deskripsi: Grid foto terhapus dengan UI bersih & info 'Deleted by'
// ============================================================================

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { permanentDeletePhoto, restorePhoto } from '@/actions/photos'
import { formatRelativeTime, formatFileSize } from '@/lib/utils'
import { RotateCcw, Trash2, Loader2, UserX, AlertTriangle } from 'lucide-react'
import type { Photo } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TrashGridProps {
  photos: Photo[]
}

export default function TrashGrid({ photos }: TrashGridProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  // --- Handlers ---
  const handleRestore = async (photoId: string) => {
    if (!confirm('Pulihkan foto ini ke galeri?')) return
    setProcessingId(photoId)
    try {
      const result = await restorePhoto(photoId)
      if (result.success) router.refresh()
      else alert(result.message)
    } catch {
      alert('Gagal memulihkan foto.')
    } finally {
      setProcessingId(null)
    }
  }

  const handlePermanentDelete = async (photoId: string) => {
    if (!confirm('⚠️ HAPUS PERMANEN?\nData tidak bisa dikembalikan!')) return
    setProcessingId(photoId)
    try {
      const result = await permanentDeletePhoto(photoId)
      if (result.success) router.refresh()
      else alert(result.message)
    } catch {
      alert('Gagal menghapus foto.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
        >
          {/* --- Image Area --- */}
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
            <Image
              src={photo.thumbnail_url || photo.display_url}
              alt={photo.file_name}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                processingId === photo.id ? "opacity-50 blur-sm" : "group-hover:opacity-90"
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
            
            {/* Processing Spinner */}
            {processingId === photo.id && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}

            {/* Badge 'Deleted' kecil di pojok (opsional, visual cue) */}
            <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-600/90 text-white text-[10px] font-bold uppercase rounded shadow-sm backdrop-blur-sm">
              Deleted
            </div>
          </div>

          {/* --- Info Area --- */}
          <div className="p-3 flex flex-col gap-2 text-xs flex-1">
            
            {/* Meta Data */}
            <div className="space-y-0.5">
              <p className="font-medium text-gray-900 dark:text-gray-100 truncate" title={photo.file_name}>
                {photo.file_name}
              </p>
              <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
                <span>{formatFileSize(photo.file_size)}</span>
                <span>{photo.deleted_at ? formatRelativeTime(photo.deleted_at) : '-'}</span>
              </div>
            </div>

            {/* Deleted By Info */}
            <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <UserX className="w-3 h-3 text-red-400" />
              <span className="truncate" title={`Dihapus oleh user ID: ${photo.deleted_by}`}>
                Oleh: {photo.deleted_by ? 'Admin/User' : 'System'} 
                {/* Note: Idealnya join nama admin, tapi utk performa 'Admin/User' cukup */}
              </span>
            </div>

            {/* Actions (Responsive Grid) */}
            <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
              <button
                onClick={() => handleRestore(photo.id)}
                disabled={!!processingId}
                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg font-medium transition-colors disabled:opacity-50"
                title="Pulihkan Foto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Pulihkan</span>
              </button>

              <button
                onClick={() => handlePermanentDelete(photo.id)}
                disabled={!!processingId}
                className="flex items-center justify-center gap-1.5 px-2 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg font-medium transition-colors disabled:opacity-50"
                title="Hapus Permanen"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Hapus</span>
              </button>
            </div>

          </div>
        </div>
      ))}
    </div>
  )
}