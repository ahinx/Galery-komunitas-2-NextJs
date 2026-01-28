// ============================================================================
// DASHBOARD CLIENT COMPONENT - WITH INFINITE SCROLL
// File: src/app/(main)/dashboard/DashboardClient.tsx
// ============================================================================

'use client'

import { useState, useCallback, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import PhotoGrid from '@/components/gallery/PhotoGrid'
import { 
  Images, 
  TrendingUp,
  HardDrive,
  Loader2,
  ChevronUp
} from 'lucide-react'
import type { Photo, Profile } from '@/lib/supabase/client'
import { cn, formatFileSize } from '@/lib/utils'
import { getPhotosPaginated, type PhotoCursor } from '@/actions/photos'

// ============================================================================
// TYPES
// ============================================================================

interface DashboardStats {
  total: number
  thisMonth: number
  totalSize: number
}

interface DashboardClientProps {
  initialPhotos: Photo[]
  initialHasMore: boolean
  initialCursor: PhotoCursor | null
  user: Profile
  searchQuery: string
  serverStats: DashboardStats
}

const LOAD_MORE_LIMIT = 20
const SCROLL_THRESHOLD = 400

// ============================================================================
// COMPONENT
// ============================================================================

export default function DashboardClient({
  initialPhotos,
  initialHasMore,
  initialCursor,
  user,
  searchQuery,
  serverStats, 
}: DashboardClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Photo state
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [cursor, setCursor] = useState<PhotoCursor | null>(initialCursor)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // UI state
  const [isScrolled, setIsScrolled] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  
  // Refs
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const isLoadingRef = useRef(false)

  // ============================================================================
  // SYNC STATE
  // ============================================================================
  
  useEffect(() => {
    setPhotos(initialPhotos)
    setHasMore(initialHasMore)
    setCursor(initialCursor)
  }, [initialPhotos, initialHasMore, initialCursor])

  // ============================================================================
  // INFINITE SCROLL
  // ============================================================================

  const loadMorePhotos = useCallback(async () => {
    if (isLoadingRef.current || !hasMore || !cursor) return
    
    isLoadingRef.current = true
    setIsLoadingMore(true)

    try {
      const result = await getPhotosPaginated({
        cursor,
        limit: LOAD_MORE_LIMIT,
        searchQuery,
      })

      if (result.success && result.data) {
        const { photos: newPhotos, hasMore: moreAvailable, nextCursor } = result.data
        
        setPhotos(prev => {
          const existingIds = new Set(prev.map(p => p.id))
          const uniqueNew = newPhotos.filter(p => !existingIds.has(p.id))
          return [...prev, ...uniqueNew]
        })
        
        setHasMore(moreAvailable)
        setCursor(nextCursor)
      }
    } catch (error) {
      console.error('Failed to load more photos:', error)
    } finally {
      setIsLoadingMore(false)
      isLoadingRef.current = false
    }
  }, [cursor, hasMore, searchQuery])

  // ============================================================================
  // INTERSECTION OBSERVER
  // ============================================================================

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingRef.current) {
          loadMorePhotos()
        }
      },
      { rootMargin: `${SCROLL_THRESHOLD}px`, threshold: 0 }
    )

    const sentinel = loadMoreRef.current
    if (sentinel) observer.observe(sentinel)

    return () => {
      if (sentinel) observer.unobserve(sentinel)
    }
  }, [loadMorePhotos, hasMore])

  // ============================================================================
  // SCROLL EFFECTS
  // ============================================================================

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 50)
      setShowBackToTop(scrollY > 500)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // ============================================================================
  // PHOTO UPDATE HANDLER
  // ============================================================================

  const handlePhotosUpdated = useCallback(async () => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Stats Bar - Normal */}
      {!isScrolled && (
        <div className="flex justify-center py-3 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm">
            <div className="flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {serverStats.total.toLocaleString('id-ID')}
              </span>
              <span className="text-gray-500">Total Foto</span>
            </div>

            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {serverStats.thisMonth.toLocaleString('id-ID')}
              </span>
              <span className="text-gray-500">Bulan Ini</span>
            </div>

            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1.5" title="Total penggunaan server">
              <HardDrive className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatFileSize(serverStats.totalSize)}
              </span>
              <span className="text-gray-500 hidden sm:inline">Terpakai</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar - Mini Floating */}
      {isScrolled && (
        <div className="fixed top-16 md:top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={cn(
            'flex items-center gap-3 px-3 py-1.5 rounded-full',
            'bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg',
            'shadow-lg border border-gray-200/50 dark:border-gray-700/50',
            'text-[11px] md:text-xs'
          )}>
            <div className="flex items-center gap-1">
              <Images className="w-3 h-3 text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {serverStats.total.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="w-px h-2.5 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatFileSize(serverStats.totalSize)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Section */}
      <div className="flex-1">
        {photos.length > 0 ? (
          <>
            <PhotoGrid
              photos={photos}
              currentUser={user} 
              onPhotosUpdated={handlePhotosUpdated}
            />
            
            {/* Infinite Scroll Sentinel */}
            <div ref={loadMoreRef} className="py-8 flex justify-center">
              {isLoadingMore && (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Memuat foto...</span>
                </div>
              )}
              
              {!hasMore && photos.length > 0 && (
                <p className="text-sm text-gray-400">
                  Semua {photos.length} foto telah dimuat
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Images className="w-10 h-10 text-gray-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Tidak ada hasil' : 'Galeri Kosong'}
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {searchQuery 
                ? 'Coba kata kunci lain.' 
                : 'Jadilah yang pertama mengupload foto!'}
            </p>
          </div>
        )}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className={cn(
            'fixed bottom-6 right-6 z-50',
            'w-10 h-10 rounded-full',
            'bg-blue-600 hover:bg-blue-700 text-white',
            'shadow-lg hover:shadow-xl',
            'flex items-center justify-center',
            'transition-all duration-200',
            'animate-in fade-in zoom-in-50'
          )}
          aria-label="Kembali ke atas"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Sinkronisasi data...</p>
          </div>
        </div>
      )}
    </>
  )
}