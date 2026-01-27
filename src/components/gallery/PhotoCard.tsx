// ============================================================================
// PHOTO CARD COMPONENT (Clean - No Filename)
// File: src/components/gallery/PhotoCard.tsx
// - Tanpa nama file di card
// - Hanya tanggal upload dan uploader (jika admin)
// - FIX: Longpress tidak trigger saat scroll
// ============================================================================

'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Check, Trash2, Download } from 'lucide-react'
import type { Photo } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PhotoCardProps {
  photo: Photo
  isSelecting: boolean
  isSelected: boolean
  onSelect: (photoId: string) => void
  onLongPress: (photoId: string) => void
  onPreview?: (photo: Photo) => void
  onDownload?: (photo: Photo) => void
  onDelete?: (photoId: string) => void
  showUserInfo?: boolean
}

// FIX: Threshold untuk membedakan scroll vs longpress
const MOVEMENT_THRESHOLD = 10

export default function PhotoCard({
  photo,
  isSelecting,
  isSelected,
  onSelect,
  onLongPress,
  onPreview,
  onDownload,
  onDelete,
  showUserInfo = false,
}: PhotoCardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 })
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const isLongPress = useRef(false)
  
  // FIX: Track touch position
  const touchStart = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)

  const handleTouchStart = (e: React.TouchEvent) => {
    // FIX: Simpan posisi awal
    const touch = e.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
    hasMoved.current = false
    isLongPress.current = false
    
    longPressTimer.current = setTimeout(() => {
      // FIX: Hanya trigger jika tidak bergerak
      if (!hasMoved.current) {
        isLongPress.current = true
        onLongPress(photo.id)
        if (navigator.vibrate) navigator.vibrate(50)
      }
    }, 500)
  }

  // FIX: Detect scroll movement
  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    const dx = Math.abs(touch.clientX - touchStart.current.x)
    const dy = Math.abs(touch.clientY - touchStart.current.y)
    
    if (dx > MOVEMENT_THRESHOLD || dy > MOVEMENT_THRESHOLD) {
      hasMoved.current = true
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (isLongPress.current) {
      e.preventDefault()
      return
    }
    // FIX: Jangan click jika sedang scroll
    if (hasMoved.current) {
      e.preventDefault()
      return
    }
    if (isSelecting) {
      e.preventDefault()
      onSelect(photo.id)
    } else if (onPreview) {
      onPreview(photo)
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(photo.id)
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDownload?.(photo)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete?.(photo.id)
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setDimensions({ width: img.naturalWidth, height: img.naturalHeight })
    setIsLoading(false)
  }

  // Mouse handlers untuk desktop
  const handleMouseDown = () => {
    touchStart.current = { x: 0, y: 0 }
    hasMoved.current = false
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress(photo.id)
    }, 500)
  }

  const handleMouseUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  const handleMouseLeave = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  return (
    <div
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'group relative rounded-lg overflow-hidden cursor-pointer',
        'transition-all duration-200',
        'hover:shadow-lg active:scale-[0.98]',
        isSelected && 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-gray-900 scale-[0.97]',
        'break-inside-avoid mb-1.5 md:mb-2',
        'select-none' // FIX: Prevent text selection during longpress
      )}
    >
      <div 
        className="relative w-full bg-gray-100 dark:bg-gray-800"
        style={{ 
          aspectRatio: `${dimensions.width} / ${dimensions.height}`,
          minHeight: isLoading ? '100px' : 'auto'
        }}
      >
        <Image
          src={photo.display_url}
          alt={photo.file_name || 'Photo'}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className={cn(
            'object-cover transition-all duration-300',
            isLoading && 'blur-sm scale-105'
          )}
          onLoad={handleImageLoad}
          draggable={false}
          priority={false}
        />

        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )}

        {isSelected && (
          <div className="absolute inset-0 bg-blue-500/30" />
        )}

        {/* Gradient - visible on mobile, hover on desktop */}
        <div className={cn(
          'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30',
          'opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'
        )} />

        {/* Checkbox */}
        <div 
          className={cn(
            'absolute top-1.5 left-1.5 z-10 transition-all',
            isSelecting || isSelected 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-75 md:group-hover:opacity-100 md:group-hover:scale-100'
          )}
          onClick={handleCheckboxClick}
        >
          <div
            className={cn(
              'w-5 h-5 md:w-6 md:h-6 rounded-full border-2 flex items-center justify-center shadow',
              isSelected
                ? 'bg-blue-600 border-blue-600'
                : 'bg-white/90 border-white'
            )}
          >
            {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </div>
        </div>

        {/* Action Buttons - Top Right */}
        {!isSelecting && (
          <div className={cn(
            'absolute top-1.5 right-1.5 z-10 flex gap-1',
            'opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'
          )}>
            {onDownload && (
              <button
                onClick={handleDownload}
                className="p-1 bg-white/90 dark:bg-gray-800/90 rounded-full shadow active:scale-90 transition"
              >
                <Download className="w-3 h-3 text-gray-700 dark:text-gray-200" />
              </button>
            )}

            {onDelete && (
              <button
                onClick={handleDelete}
                className="p-1 bg-red-500/90 rounded-full shadow active:scale-90 transition"
              >
                <Trash2 className="w-3 h-3 text-white" />
              </button>
            )}
          </div>
        )}

        {/* Bottom Info - Hanya tanggal dan uploader, tanpa nama file */}
        <div className={cn(
          'absolute bottom-0 left-0 right-0 p-1.5 z-10',
          'opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity'
        )}>
          <p className="text-[10px] text-white/90 drop-shadow-md">
            {formatRelativeTime(photo.created_at)}
            {showUserInfo && photo.profile && (
              <span className="ml-1">• {photo.profile.full_name}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}