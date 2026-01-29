// ============================================================================
// TRASH GRID COMPONENT (With Modern Modal)
// File: src/components/trash/TrashGrid.tsx
// Deskripsi: Grid foto trash dengan modal konfirmasi modern
// ============================================================================

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { permanentDeletePhoto, restorePhoto } from '@/actions/photos'
import { formatRelativeTime, formatFileSize } from '@/lib/utils'
import { RotateCcw, Trash2, Loader2, UserX, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { Photo } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface TrashGridProps {
  photos: Photo[]
}

export default function TrashGrid({ photos }: TrashGridProps) {
  const router = useRouter()
  
  // State untuk Modal & Processing
  const [modalType, setModalType] = useState<'restore' | 'delete' | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Handler untuk membuka modal
  const openModal = (type: 'restore' | 'delete', photoId: string) => {
    setModalType(type)
    setSelectedPhoto(photoId)
  }

  // Handler untuk menutup modal
  const closeModal = () => {
    if (isProcessing) return
    setModalType(null)
    setSelectedPhoto(null)
  }

  // Eksekusi Aksi (Restore / Delete)
  const executeAction = async () => {
    if (!selectedPhoto || !modalType) return

    setIsProcessing(true)

    try {
      let result
      if (modalType === 'restore') {
        result = await restorePhoto(selectedPhoto)
      } else {
        result = await permanentDeletePhoto(selectedPhoto)
      }

      if (result.success) {
        // Feedback visual singkat sebelum refresh (opsional)
        // Disini langsung refresh saja agar cepat
        router.refresh()
        closeModal()
      } else {
        alert(result.message) // Fallback error
      }
    } catch (error) {
      console.error(error)
      alert('Terjadi kesalahan sistem.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            {/* Image Area */}
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
              <Image
                src={photo.thumbnail_url || photo.display_url}
                alt={photo.file_name}
                fill
                className={cn(
                  "object-cover transition-opacity duration-300",
                  // Jika foto ini sedang diproses (walaupun modal tertutup), beri efek visual
                  (isProcessing && selectedPhoto === photo.id) ? "opacity-50 blur-sm" : "group-hover:opacity-90"
                )}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              />
              
              {/* Spinner di card jika loading */}
              {(isProcessing && selectedPhoto === photo.id) && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              )}

              <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-red-600/90 text-white text-[10px] font-bold uppercase rounded shadow-sm backdrop-blur-sm pointer-events-none">
                Deleted
              </div>
            </div>

            {/* Info Area */}
            <div className="p-3 flex flex-col gap-2 text-xs flex-1">
              <div className="space-y-0.5">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate" title={photo.file_name}>
                  {photo.file_name}
                </p>
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs">
                  <span>{formatFileSize(photo.file_size)}</span>
                  <span>{photo.deleted_at ? formatRelativeTime(photo.deleted_at) : '-'}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-[10px]">
                <UserX className="w-3 h-3 text-red-400 shrink-0" />
                <span className="truncate" title={`User ID: ${photo.deleted_by}`}>
                  Oleh: {photo.deleted_by ? 'Admin/User' : 'System'} 
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-2 mt-auto pt-2">
                <button
                  onClick={() => openModal('restore', photo.id)}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Pulihkan</span>
                </button>

                <button
                  onClick={() => openModal('delete', photo.id)}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-1.5 px-2 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL KONFIRMASI MODERN --- */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            
            {/* Icon Modal */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${
              modalType === 'restore' 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {modalType === 'restore' ? <RotateCcw className="w-7 h-7" /> : <Trash2 className="w-7 h-7" />}
            </div>

            {/* Judul Modal */}
            <h3 className="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {modalType === 'restore' ? 'Pulihkan Foto Ini?' : 'Hapus Permanen?'}
            </h3>
            
            {/* Deskripsi Modal */}
            <div className="text-center text-gray-500 dark:text-gray-400 text-sm mb-6">
              {modalType === 'restore' ? (
                <p>Foto akan dikembalikan ke galeri utama dan dapat dilihat kembali oleh user.</p>
              ) : (
                <div className="space-y-2">
                  <p>Anda yakin ingin menghapus foto ini secara permanen?</p>
                  <p className="font-bold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-800">
                    ⚠️ Tindakan ini TIDAK DAPAT dibatalkan!
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Aksi Modal */}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={isProcessing}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              
              <button
                onClick={executeAction}
                disabled={isProcessing}
                className={`flex-1 py-3 px-4 text-white font-medium rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  modalType === 'restore'
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
                  modalType === 'restore' ? 'Ya, Pulihkan' : 'Ya, Hapus'
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}