// ============================================================================
// PHOTO LIGHTBOX COMPONENT
// File: src/components/gallery/PhotoLightbox.tsx
// Deskripsi: Fullscreen preview dengan swipe & high z-index
// FIX: + Zoom support (pinch/double-tap) + Back button Android
// ============================================================================

'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import Image from 'next/image'
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Trash2, 
  Info,
  Share2,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { Photo } from '@/lib/supabase/client'
import { formatRelativeTime, formatFileSize, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PhotoLightboxProps {
  photo: Photo
  photos: Photo[]
  currentIndex: number
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  onDownload?: () => void
  onDelete?: (photoId: string) => void
  showUserInfo?: boolean
}

export default function PhotoLightbox({
  photo,
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onDownload,
  onDelete,
  showUserInfo = false,
}: PhotoLightboxProps) {
  const [showInfo, setShowInfo] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)

  // Swipe refs
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)
  const touchStartY = useRef(0)

  // ==================== FIX: Back Button Android ====================
  useEffect(() => {
    // Push state saat lightbox dibuka
    window.history.pushState({ lightbox: true, photoId: photo.id }, '')

    const handlePopState = () => {
      // Saat user tekan back, tutup lightbox
      onClose()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [onClose, photo.id])

  // FIX: Close yang konsisten dengan history
  const handleClose = useCallback(() => {
    window.history.back()
  }, [])

  // Keyboard
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') handleClose()
    if (e.key === 'ArrowLeft' && !isZoomed) onPrev()
    if (e.key === 'ArrowRight' && !isZoomed) onNext()
  }, [handleClose, onPrev, onNext, isZoomed])

  // Touch handlers untuk swipe (disable saat zoom)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isZoomed) return
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (isZoomed) return
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      if (diff > 0) onNext()
      else onPrev()
    }
  }

  // FIX: Track zoom state
  const handleZoomChange = useCallback((ref: any) => {
    if (ref?.state?.scale !== undefined) {
      setIsZoomed(ref.state.scale > 1.05)
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleKeyDown])

  useEffect(() => {
    setImageLoaded(false)
    setIsZoomed(false)
  }, [photo.id])

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: photo.file_name || 'Photo',
          url: photo.display_url
        })
      } catch {}
    }
  }

  const handleDeleteAndClose = () => {
    if (onDelete) {
      onDelete(photo.id)
      handleClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/70 to-transparent">
        <div className="flex items-center justify-between p-3 pt-safe">
          <button 
            onClick={handleClose} 
            className="p-2 hover:bg-white/10 rounded-full active:scale-95 transition"
          >
            <X className="w-6 h-6 text-white" />
          </button>

          <div className="flex items-center gap-1">
            {navigator.share && (
              <button onClick={handleShare} className="p-2 hover:bg-white/10 rounded-full active:scale-95 transition">
                <Share2 className="w-5 h-5 text-white" />
              </button>
            )}
            <button 
              onClick={() => setShowInfo(!showInfo)} 
              className={cn('p-2 rounded-full active:scale-95 transition', showInfo ? 'bg-white/20' : 'hover:bg-white/10')}
            >
              <Info className="w-5 h-5 text-white" />
            </button>
            {onDownload && (
              <button onClick={onDownload} className="p-2 hover:bg-white/10 rounded-full active:scale-95 transition">
                <Download className="w-5 h-5 text-white" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={handleDeleteAndClose} 
                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full active:scale-95 transition"
              >
                <Trash2 className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Image Area */}
      <div 
        className="flex-1 flex items-center justify-center relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Nav Left (Desktop) */}
        {photos.length > 1 && !isZoomed && (
          <button
            onClick={onPrev}
            className="absolute left-2 z-40 p-2 bg-white/10 hover:bg-white/20 rounded-full hidden md:block"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
        )}

        {/* ==================== FIX: Zoomable Image ==================== */}
        <TransformWrapper
          initialScale={1}
          minScale={1}
          maxScale={4}
          centerOnInit
          onTransformed={handleZoomChange}
          doubleClick={{ mode: 'toggle', step: 2 }}
          panning={{ disabled: !isZoomed }}
          pinch={{ step: 5 }}
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* Zoom Controls - hanya muncul saat zoomed di mobile */}
              {isZoomed && (
                <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-2 md:hidden">
                  <button 
                    onClick={() => zoomOut()}
                    className="p-1.5 hover:bg-white/20 rounded-full active:scale-90 transition"
                  >
                    <ZoomOut className="w-5 h-5 text-white" />
                  </button>
                  <button 
                    onClick={() => zoomIn()}
                    className="p-1.5 hover:bg-white/20 rounded-full active:scale-90 transition"
                  >
                    <ZoomIn className="w-5 h-5 text-white" />
                  </button>
                  <button 
                    onClick={() => resetTransform()}
                    className="p-1.5 hover:bg-white/20 rounded-full active:scale-90 transition"
                  >
                    <RotateCcw className="w-5 h-5 text-white" />
                  </button>
                </div>
              )}

              {/* Image */}
              <TransformComponent
                wrapperStyle={{ width: '100%', height: '100%' }}
                contentStyle={{ 
                  width: '100%', 
                  height: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
              >
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  {!imageLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                  
                  <Image
                    src={photo.display_url}
                    alt={photo.file_name || 'Photo'}
                    fill
                    className={cn(
                      'object-contain transition-opacity duration-200',
                      imageLoaded ? 'opacity-100' : 'opacity-0'
                    )}
                    onLoad={() => setImageLoaded(true)}
                    priority
                    sizes="100vw"
                    draggable={false}
                  />
                </div>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        {/* Nav Right (Desktop) */}
        {photos.length > 1 && !isZoomed && (
          <button
            onClick={onNext}
            className="absolute right-2 z-40 p-2 bg-white/10 hover:bg-white/20 rounded-full hidden md:block"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}

        {/* Zoom hint - mobile only, saat tidak zoom */}
        {!isZoomed && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 md:hidden pointer-events-none">
            <ZoomIn className="w-3.5 h-3.5 text-white/70" />
            <span className="text-white/70 text-xs">Cubit / ketuk 2x untuk zoom</span>
          </div>
        )}

        {/* Dots indicator (mobile) */}
        {photos.length > 1 && !isZoomed && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1 md:hidden">
            {photos.slice(Math.max(0, currentIndex - 2), Math.min(photos.length, currentIndex + 3)).map((p, i) => {
              const idx = Math.max(0, currentIndex - 2) + i
              return (
                <div
                  key={p.id}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    idx === currentIndex ? 'bg-white w-3' : 'bg-white/40'
                  )}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent',
        'transition-transform duration-200',
        showInfo ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'
      )}>
        <div className="p-3 pb-safe">
          {/* Basic */}
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-white font-medium text-sm truncate">
                {photo.file_name?.replace('.webp', '') || 'Photo'}
              </p>
              <p className="text-white/50 text-xs">
                {currentIndex + 1} / {photos.length}
              </p>
            </div>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className="text-xs text-white/60 ml-2"
            >
              {showInfo ? 'Tutup' : 'Detail'}
            </button>
          </div>

          {/* Extended info */}
          {showInfo && (
            <div className="mt-3 pt-3 border-t border-white/20 space-y-2 text-sm text-white/70">
              <p>📅 {formatDate(photo.created_at)}</p>
              <p>💾 {formatFileSize(photo.file_size)}</p>
              {showUserInfo && photo.profile && (
                <p>👤 {photo.profile.full_name}</p>
              )}
              {photo.exif_data?.camera_model && (
                <p>📷 {photo.exif_data.camera_model}</p>
              )}
              <p className="text-white/40 text-xs pt-1">
                💡 Cubit untuk zoom
                {/* ketuk 2x untuk zoom cepat */}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}