// ============================================================================
// PHOTO GRID COMPONENT (Permission Aware)
// File: src/components/gallery/PhotoGrid.tsx
// Deskripsi: Grid foto dengan logika izin hapus granular (Pemilik/Admin)
// ============================================================================

'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import PhotoCard from './PhotoCard'
import PhotoLightbox from './PhotoLightbox'
import DownloadModal from './DownloadModal'
import type { Photo, Profile } from '@/lib/supabase/client'
import { groupPhotosByDate } from '@/lib/utils'
import { 
  Download, 
  Trash2, 
  X, 
  Loader2,
  Share2
} from 'lucide-react'
import { bulkSoftDelete } from '@/actions/photos'
import { cn } from '@/lib/utils'

interface PhotoGridProps {
  photos: Photo[]
  currentUser: Profile // <--- UPDATE: Menerima object User lengkap
  onPhotosUpdated?: () => void
}

export default function PhotoGrid({
  photos,
  currentUser,
  onPhotosUpdated,
}: PhotoGridProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingText, setProcessingText] = useState('')
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [showDownloadModal, setShowDownloadModal] = useState(false)
  const [downloadPhotos, setDownloadPhotos] = useState<Photo[]>([])

  // LOGIKA PERMISSION: Cek apakah user boleh menghapus foto ini
  const canUserDeletePhoto = useCallback((photo: Photo) => {
    // Admin & Super Admin boleh hapus semua
    if (['admin', 'super_admin'].includes(currentUser.role)) return true
    // Member hanya boleh hapus miliknya sendiri
    return photo.user_id === currentUser.id
  }, [currentUser])

  const groupedPhotos = useMemo(() => groupPhotosByDate(photos), [photos])
  const flatPhotos = useMemo(() => photos, [photos])

  // Toggle selection untuk single photo
  const handleSelect = useCallback((photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
        if (newSet.size === 0) setIsSelecting(false)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }, [])

  // Long press
  const handleLongPress = useCallback((photoId: string) => {
    setIsSelecting(true)
    setSelectedPhotos(new Set([photoId]))
  }, [])

  // Select all
  const handleSelectAll = useCallback(() => {
    if (selectedPhotos.size === photos.length) {
      setSelectedPhotos(new Set())
      setIsSelecting(false)
    } else {
      setSelectedPhotos(new Set(photos.map(p => p.id)))
    }
  }, [photos, selectedPhotos.size])

  // Select group
  const handleSelectGroup = useCallback((groupPhotos: Photo[]) => {
    const groupIds = groupPhotos.map(p => p.id)
    setSelectedPhotos(prev => {
      const newSet = new Set(prev)
      const allSelected = groupIds.every(id => newSet.has(id))
      
      if (allSelected) {
        groupIds.forEach(id => newSet.delete(id))
        if (newSet.size === 0) setIsSelecting(false)
      } else {
        groupIds.forEach(id => newSet.add(id))
      }
      return newSet
    })
  }, [])

  // Preview & Lightbox
  const handlePreview = useCallback((photo: Photo) => {
    if (isSelecting) return
    const index = flatPhotos.findIndex(p => p.id === photo.id)
    setLightboxIndex(index >= 0 ? index : 0)
    setLightboxPhoto(photo)
  }, [flatPhotos, isSelecting])

  const handleLightboxPrev = useCallback(() => {
    const newIndex = lightboxIndex > 0 ? lightboxIndex - 1 : flatPhotos.length - 1
    setLightboxIndex(newIndex)
    setLightboxPhoto(flatPhotos[newIndex])
  }, [lightboxIndex, flatPhotos])

  const handleLightboxNext = useCallback(() => {
    const newIndex = lightboxIndex < flatPhotos.length - 1 ? lightboxIndex + 1 : 0
    setLightboxIndex(newIndex)
    setLightboxPhoto(flatPhotos[newIndex])
  }, [lightboxIndex, flatPhotos])

  // Download logic
  const handleSingleDownload = useCallback((photo: Photo) => {
    setDownloadPhotos([photo])
    setShowDownloadModal(true)
  }, [])

  const handleDownloadSelected = useCallback(() => {
    if (selectedPhotos.size === 0) return
    const photosToDownload = photos.filter(p => selectedPhotos.has(p.id))
    setDownloadPhotos(photosToDownload)
    setIsSelecting(false)
    setShowDownloadModal(true)
  }, [selectedPhotos, photos])

  const handleDownloadComplete = useCallback(() => {
    setShowDownloadModal(false)
    setDownloadPhotos([])
    setSelectedPhotos(new Set())
  }, [])

  const handleDownloadClose = useCallback(() => {
    setShowDownloadModal(false)
    if (downloadPhotos.length > 1) setIsSelecting(true)
    setDownloadPhotos([])
  }, [downloadPhotos.length])

  // --- DELETE LOGIC (UPDATED WITH PERMISSION) ---

  const handleDeleteSelected = async () => {
    if (selectedPhotos.size === 0) return

    // Filter: Hanya hapus yang boleh dihapus user
    const idsToDelete = Array.from(selectedPhotos).filter(id => {
      const photo = photos.find(p => p.id === id)
      return photo && canUserDeletePhoto(photo)
    })

    if (idsToDelete.length === 0) {
      alert("Anda tidak memiliki izin untuk menghapus foto yang dipilih.")
      return
    }

    if (!confirm(`Hapus ${idsToDelete.length} foto?`)) return

    setIsProcessing(true)
    setProcessingText('Menghapus...')

    try {
      const result = await bulkSoftDelete(idsToDelete)
      if (result.success) {
        setSelectedPhotos(new Set())
        setIsSelecting(false)
        onPhotosUpdated?.()
      } else {
        alert(result.message)
      }
    } catch {
      alert('Gagal menghapus foto.')
    } finally {
      setIsProcessing(false)
      setProcessingText('')
    }
  }

  const handleSingleDelete = async (photoId: string) => {
    if (!confirm('Hapus foto ini?')) return

    setIsProcessing(true)
    setProcessingText('Menghapus...')

    try {
      const result = await bulkSoftDelete([photoId])
      if (result.success) {
        onPhotosUpdated?.()
      } else {
        alert(result.message)
      }
    } catch {
      alert('Gagal menghapus foto.')
    } finally {
      setIsProcessing(false)
      setProcessingText('')
    }
  }

  const handleCancelSelection = useCallback(() => {
    setSelectedPhotos(new Set())
    setIsSelecting(false)
  }, [])

  const handleStartSelecting = useCallback(() => {
    setIsSelecting(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSelecting) handleCancelSelection()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSelecting, handleCancelSelection])

  if (photos.length === 0) return null

  // Cek apakah tombol hapus massal harus muncul (ada minimal 1 foto milik user terpilih)
  const showBulkDelete = Array.from(selectedPhotos).some(id => {
    const p = photos.find(photo => photo.id === id)
    return p && canUserDeletePhoto(p)
  })

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-4 py-2">
        <span className="text-xs text-gray-500">{photos.length} foto</span>
        {!isSelecting && (
          <button
            onClick={handleStartSelecting}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
          >
            Pilih Foto
          </button>
        )}
      </div>

      {/* Photo Groups */}
      <div className="p-2 md:p-3 space-y-4 pb-24">
        {Object.entries(groupedPhotos).map(([dateLabel, groupPhotos]) => (
          <div key={dateLabel}>
            {/* Date Header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <h2 className="text-xs md:text-sm font-semibold text-gray-900 dark:text-white">
                {dateLabel}
                <span className="ml-1 text-[10px] md:text-xs font-normal text-gray-500">({groupPhotos.length})</span>
              </h2>

              {isSelecting && (
                <button
                  onClick={() => handleSelectGroup(groupPhotos)}
                  className="text-[10px] md:text-xs text-blue-600 dark:text-blue-400 font-medium"
                >
                  {groupPhotos.every(p => selectedPhotos.has(p.id)) ? 'Batalkan' : 'Pilih Semua'}
                </button>
              )}
            </div>

            {/* Masonry Grid */}
            <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-1.5 md:gap-2">
              {groupPhotos.map(photo => {
                // Tentukan izin hapus per foto
                const canDelete = canUserDeletePhoto(photo)

                return (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    isSelecting={isSelecting}
                    isSelected={selectedPhotos.has(photo.id)}
                    onSelect={handleSelect}
                    onLongPress={handleLongPress}
                    onPreview={handlePreview}
                    onDownload={handleSingleDownload}
                    // Hanya oper fungsi delete jika user punya izin
                    onDelete={canDelete ? handleSingleDelete : undefined}
                    // Tampilkan info user agar tahu siapa pemilik foto (Shared Gallery)
                    showUserInfo={true}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Selection Bar */}
      {isSelecting && !showDownloadModal && (
        <div 
          className={cn(
            'fixed left-2 right-2 z-[9999]',
            'bottom-20 md:bottom-4',
            'md:left-1/2 md:-translate-x-1/2 md:right-auto md:w-auto md:min-w-[320px]'
          )}
        >
          <div className={cn(
            'bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg',
            'rounded-full shadow-2xl',
            'border border-gray-200/50 dark:border-gray-700/50'
          )}>
            <div className="flex items-center justify-between px-3 py-2 gap-3">
              {/* Left: Close & Count */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelSelection}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>

                <div className="text-xs">
                  <span className="font-semibold text-gray-900 dark:text-white">{selectedPhotos.size}</span>
                  <button
                    onClick={handleSelectAll}
                    className="ml-1 text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {selectedPhotos.size === photos.length ? '(batalkan)' : '(semua)'}
                  </button>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-1">
                <button
                  disabled={selectedPhotos.size === 0}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 transition"
                  title="Bagikan"
                >
                  <Share2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                <button
                  onClick={handleDownloadSelected}
                  disabled={selectedPhotos.size === 0}
                  className="p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 disabled:opacity-40 transition"
                  title="Download"
                >
                  <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </button>

                {/* Tombol Hapus hanya muncul jika ada foto yang BISA dihapus terpilih */}
                {showBulkDelete && (
                  <button
                    onClick={handleDeleteSelected}
                    className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                    title="Hapus"
                  >
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <PhotoLightbox
          photo={lightboxPhoto}
          photos={flatPhotos}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxPhoto(null)}
          onPrev={handleLightboxPrev}
          onNext={handleLightboxNext}
          onDownload={() => handleSingleDownload(lightboxPhoto)}
          // Cek izin hapus untuk lightbox juga
          onDelete={canUserDeletePhoto(lightboxPhoto) ? handleSingleDelete : undefined}
          showUserInfo={true}
        />
      )}

      {/* Download Modal */}
      {showDownloadModal && downloadPhotos.length > 0 && (
        <DownloadModal
          photos={downloadPhotos}
          onClose={handleDownloadClose}
          onComplete={handleDownloadComplete}
        />
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-3 mx-4">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-900 dark:text-white">{processingText}</p>
          </div>
        </div>
      )}
    </div>
  )
}