// ============================================================================
// PHOTO CARD COMPONENT
// File: src/components/gallery/PhotoCard.tsx
// Deskripsi: Individual photo card untuk gallery
// ============================================================================

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Check, Trash2, Download, Info } from 'lucide-react'
import type { Photo } from '@/lib/supabase/client'
import { formatRelativeTime, formatFileSize } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PhotoCardProps {
  photo: Photo
  isSelecting: boolean
  isSelected: boolean
  onSelect: (photoId: string) => void
  onDelete?: (photoId: string) => void
  showUserInfo?: boolean
}

export default function PhotoCard({
  photo,
  isSelecting,
  isSelected,
  onSelect,
  onDelete,
  showUserInfo = false,
}: PhotoCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [showInfo, setShowInfo] = useState(false)

  const handleClick = () => {
    if (isSelecting) {
      onSelect(photo.id)
    } else {
      // Open lightbox/detail view (akan diimplementasi nanti)
      setShowInfo(!showInfo)
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const response = await fetch(photo.display_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.file_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(photo.id)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={cn(
        'group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer transition-all duration-200',
        isSelected && 'ring-4 ring-blue-500',
        'hover:shadow-xl'
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square">
        <Image
          src={photo.display_url}
          alt={photo.file_name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          className={cn(
            'object-cover transition-all duration-300',
            isLoading && 'blur-sm scale-110',
            'group-hover:scale-105'
          )}
          onLoadingComplete={() => setIsLoading(false)}
        />

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}

        {/* Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {/* Selection Checkbox */}
        {isSelecting && (
          <div className="absolute top-3 left-3">
            <div
              className={cn(
                'w-6 h-6 rounded-full border-2 flex items-center justify-center transition',
                isSelected
                  ? 'bg-blue-600 border-blue-600'
                  : 'bg-white/80 border-white backdrop-blur-sm'
              )}
            >
              {isSelected && <Check className="w-4 h-4 text-white" />}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!isSelecting && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleDownload}
              className="p-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full hover:bg-white dark:hover:bg-gray-700 transition"
              title="Download"
            >
              <Download className="w-4 h-4 text-gray-700 dark:text-gray-200" />
            </button>

            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-2 bg-red-500/90 backdrop-blur-sm rounded-full hover:bg-red-600 transition"
                title="Hapus"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        )}

        {/* Bottom Info */}
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-xs font-medium truncate">
            {photo.file_name}
          </p>
          <p className="text-xs opacity-80">
            {formatRelativeTime(photo.created_at)}
          </p>
        </div>
      </div>

      {/* Info Panel (expandable) */}
      {showInfo && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Ukuran File
            </span>
            <span className="text-xs text-gray-900 dark:text-white">
              {formatFileSize(photo.file_size)}
            </span>
          </div>

          {showUserInfo && photo.profile && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Diupload oleh
              </span>
              <span className="text-xs text-gray-900 dark:text-white">
                {photo.profile.full_name}
              </span>
            </div>
          )}

          {photo.exif_data?.camera_model && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Kamera
              </span>
              <span className="text-xs text-gray-900 dark:text-white">
                {photo.exif_data.camera_model}
              </span>
            </div>
          )}

          {photo.exif_data?.date_taken && (
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Tanggal Diambil
              </span>
              <span className="text-xs text-gray-900 dark:text-white">
                {photo.exif_data.date_taken}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}