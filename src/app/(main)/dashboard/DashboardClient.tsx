// ============================================================================
// DASHBOARD CLIENT COMPONENT (Final Clean)
// File: src/app/(main)/dashboard/DashboardClient.tsx
// - Stats centered, mini floating saat scroll
// ============================================================================

'use client'

import { useState, useCallback, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import PhotoGrid from '@/components/gallery/PhotoGrid'
import { 
  Images, 
  TrendingUp,
  HardDrive
} from 'lucide-react'
import type { Photo, Profile } from '@/lib/supabase/client'
import { cn, formatFileSize } from '@/lib/utils'

interface DashboardClientProps {
  initialPhotos: Photo[]
  user: Profile
  searchQuery: string
}

export default function DashboardClient({
  initialPhotos,
  user,
  searchQuery,
}: DashboardClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [photos] = useState(initialPhotos)
  const [isScrolled, setIsScrolled] = useState(false)

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calculate stats
  const stats = {
    total: photos.length,
    thisMonth: photos.filter(p => {
      const photoDate = new Date(p.created_at)
      const now = new Date()
      return photoDate.getMonth() === now.getMonth() && 
             photoDate.getFullYear() === now.getFullYear()
    }).length,
    totalSize: photos.reduce((sum, p) => sum + (p.file_size || 0), 0)
  }

  const handlePhotosUpdated = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  return (
    <>
      {/* Stats - Normal (sebelum scroll) */}
      {photos.length > 0 && !isScrolled && (
        <div className="flex justify-center py-3 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm">
            <div className="flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span>
              <span className="text-gray-500">Total</span>
            </div>

            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{stats.thisMonth}</span>
              <span className="text-gray-500">Bulan ini</span>
            </div>

            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{formatFileSize(stats.totalSize)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats - Mini Floating (saat scroll) */}
      {photos.length > 0 && isScrolled && (
        <div className="fixed top-16 md:top-20 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className={cn(
            'flex items-center gap-3 px-3 py-1.5 rounded-full',
            'bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg',
            'shadow-lg border border-gray-200/50 dark:border-gray-700/50',
            'text-[11px] md:text-xs'
          )}>
            <div className="flex items-center gap-1">
              <Images className="w-3 h-3 text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{stats.total}</span>
            </div>

            <div className="w-px h-2.5 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{stats.thisMonth}</span>
            </div>

            <div className="w-px h-2.5 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{formatFileSize(stats.totalSize)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Section */}
      <div className="flex-1">
        {photos.length > 0 ? (
          <PhotoGrid
            photos={photos}
            showUserInfo={user.role !== 'member'}
            canDelete={true}
            onPhotosUpdated={handlePhotosUpdated}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-8">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <Images className="w-10 h-10 text-gray-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'Tidak ada hasil' : 'Belum ada foto'}
            </h3>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              {searchQuery 
                ? 'Coba kata kunci lain.' 
                : 'Upload foto pertama Anda melalui menu Upload.'}
            </p>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Memuat...</p>
          </div>
        </div>
      )}
    </>
  )
}