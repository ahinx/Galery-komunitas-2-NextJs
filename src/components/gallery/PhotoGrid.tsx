// ============================================================================
// PHOTO GRID COMPONENT (Masonry Layout)
// File: src/components/gallery/PhotoGrid.tsx
// Deskripsi: Masonry grid dengan sticky headers berdasarkan bulan/tahun
// ============================================================================

'use client'

import { useState, useMemo } from 'react'
import PhotoCard from './PhotoCard'
import type { Photo } from '@/lib/supabase/client'
import { groupPhotosByDate } from '@/lib/utils'
import { Download, Trash2, X } from 'lucide-react'
import { bulkSoftDelete } from '@/actions/photos'
import JSZip from 'jszip'

interface PhotoGridProps {
  photos: Photo[]
  showUserInfo?: boolean
  canDelete?: boolean
  onPhotosUpdated?: () => void
}

export default function PhotoGrid({
  photos,
  showUserInfo = false,
  canDelete = false,
  onPhotosUpdated,
}: PhotoGridProps) {
  const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set())
  const [isSelecting, setIsSelecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Group photos by month/year
  const groupedPhotos = useMemo(() => groupPhotosByDate(photos), [photos])

  // Toggle selection
  const handleSelect = (photoId: string) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev)
      if (newSet.has(photoId)) {
        newSet.delete(photoId)
      } else {
        newSet.add(photoId)
      }
      return newSet
    })
  }

  // Select all dalam satu grup
  const handleSelectGroup = (groupPhotos: Photo[]) => {
    const groupIds = groupPhotos.map(p => p.id)
    setSelectedPhotos(prev => {
      const newSet = new Set(prev)
      const allSelected = groupIds.every(id => newSet.has(id))
      
      if (allSelected) {
        groupIds.forEach(id => newSet.delete(id))
      } else {
        groupIds.forEach(id => newSet.add(id))
      }
      
      return newSet
    })
  }

  // Download selected as ZIP
  const handleDownloadSelected = async () => {
    if (selectedPhotos.size === 0) return

    setIsProcessing(true)

    try {
      const zip = new JSZip()
      const selectedPhotosArray = photos.filter(p => selectedPhotos.has(p.id))

      // Download semua foto dan tambahkan ke ZIP
      for (const photo of selectedPhotosArray) {
        try {
          const response = await fetch(photo.display_url)
          const blob = await response.blob()
          zip.file(photo.file_name, blob)
        } catch (error) {
          console.error(`Failed to download ${photo.file_name}:`, error)
        }
      }

      // Generate ZIP dan download
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = window.URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `photos-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Clear selection
      setSelectedPhotos(new Set())
      setIsSelecting(false)
    } catch (error) {
      console.error('Failed to create ZIP:', error)
      alert('Gagal membuat file ZIP. Silakan coba lagi.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Delete selected photos
  const handleDeleteSelected = async () => {
    if (selectedPhotos.size === 0) return

    const confirmed = confirm(
      `Yakin ingin menghapus ${selectedPhotos.size} foto yang dipilih?`
    )

    if (!confirmed) return

    setIsProcessing(true)

    try {
      const result = await bulkSoftDelete(Array.from(selectedPhotos))

      if (result.success) {
        setSelectedPhotos(new Set())
        setIsSelecting(false)
        onPhotosUpdated?.()
      } else {
        alert(result.message)
      }
    } catch (error) {
      console.error('Failed to delete photos:', error)
      alert('Gagal menghapus foto. Silakan coba lagi.')
    } finally {
      setIsProcessing(false)
    }
  }

  // Cancel selection
  const handleCancelSelection = () => {
    setSelectedPhotos(new Set())
    setIsSelecting(false)
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-500 dark:text-gray-400">Belum ada foto</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Selection Mode Toggle */}
      {!isSelecting && photos.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsSelecting(true)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            Pilih Foto
          </button>
        </div>
      )}

      {/* Grouped Photos */}
      {Object.entries(groupedPhotos).map(([dateLabel, groupPhotos]) => (
        <div key={dateLabel}>
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm py-3 mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {dateLabel}
            </h2>

            {isSelecting && (
              <button
                onClick={() => handleSelectGroup(groupPhotos)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                {groupPhotos.every(p => selectedPhotos.has(p.id))
                  ? 'Batalkan Semua'
                  : 'Pilih Semua'}
              </button>
            )}
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {groupPhotos.map(photo => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                isSelecting={isSelecting}
                isSelected={selectedPhotos.has(photo.id)}
                onSelect={handleSelect}
                onDelete={canDelete ? (id) => {
                  // Single delete
                  setSelectedPhotos(new Set([id]))
                  handleDeleteSelected()
                } : undefined}
                showUserInfo={showUserInfo}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Floating Action Bar (saat selection mode) */}
      {isSelecting && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-50">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleCancelSelection}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>

                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {selectedPhotos.size} dipilih
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadSelected}
                  disabled={selectedPhotos.size === 0 || isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                >
                  <Download className="w-4 h-4" />
                  Download ZIP
                </button>

                {canDelete && (
                  <button
                    onClick={handleDeleteSelected}
                    disabled={selectedPhotos.size === 0 || isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}