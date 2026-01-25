// ============================================================================
// TRASH GRID COMPONENT
// File: src/components/trash/TrashGrid.tsx
// Deskripsi: Grid untuk manage foto di trash (restore/permanent delete)
// ============================================================================

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { permanentDeletePhoto, restorePhoto } from '@/actions/photos'
import { formatRelativeTime, formatFileSize } from '@/lib/utils'
import { RotateCcw, Trash2, AlertCircle, Loader2 } from 'lucide-react'
import type { Photo } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface TrashGridProps {
  photos: Photo[]
}

export default function TrashGrid({ photos }: TrashGridProps) {
  const router = useRouter()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleRestore = async (photoId: string) => {
    if (!confirm('Yakin ingin memulihkan foto ini?')) return

    setProcessingId(photoId)

    try {
      const result = await restorePhoto(photoId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setProcessingId(null)
    }
  }

  const handlePermanentDelete = async (photoId: string) => {
    if (!confirm(
      '⚠️ PERHATIAN!\n\n' +
      'Foto akan dihapus PERMANEN dari storage dan database.\n' +
      'Aksi ini TIDAK DAPAT DIBATALKAN!\n\n' +
      'Yakin ingin melanjutkan?'
    )) return

    // Double confirmation
    if (!confirm('Konfirmasi sekali lagi: Yakin ingin menghapus PERMANEN?')) return

    setProcessingId(photoId)

    try {
      const result = await permanentDeletePhoto(photoId)

      if (result.success) {
        router.refresh()
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
        >
          {/* Image */}
          <div className="relative aspect-square">
            <Image
              src={photo.display_url}
              alt={photo.file_name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              className="object-cover opacity-60"
            />

            {/* Deleted Overlay */}
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-center text-white">
                <Trash2 className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs font-medium">Dihapus</p>
              </div>
            </div>

            {/* Processing Overlay */}
            {processingId === photo.id && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          {/* Info & Actions */}
          <div className="p-3 space-y-2">
            <div>
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                {photo.file_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatFileSize(photo.file_size)}
              </p>
            </div>

            {photo.deleted_at && (
              <p className="text-xs text-red-600 dark:text-red-400">
                Dihapus {formatRelativeTime(photo.deleted_at)}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleRestore(photo.id)}
                disabled={processingId === photo.id}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition"
                title="Pulihkan"
              >
                <RotateCcw className="w-3 h-3" />
                Pulihkan
              </button>

              <button
                onClick={() => handlePermanentDelete(photo.id)}
                disabled={processingId === photo.id}
                className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded text-xs font-medium transition"
                title="Hapus Permanen"
              >
                <Trash2 className="w-3 h-3" />
                Hapus
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}