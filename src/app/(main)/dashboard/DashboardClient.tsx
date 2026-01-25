// ============================================================================
// DASHBOARD CLIENT COMPONENT (Global Stats)
// File: src/app/(main)/dashboard/DashboardClient.tsx
// Deskripsi: Menampilkan stats global server-side & grid foto
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
import { getPhotos } from '@/actions/photos'

// Definisi tipe Stats
interface DashboardStats {
  total: number
  thisMonth: number
  totalSize: number
}

interface DashboardClientProps {
  initialPhotos: Photo[]
  user: Profile
  searchQuery: string
  serverStats: DashboardStats // <--- Prop Baru
}

export default function DashboardClient({
  initialPhotos,
  user,
  searchQuery,
  serverStats, 
}: DashboardClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [isScrolled, setIsScrolled] = useState(false)

  // Sync photos saat navigasi balik/search
  useEffect(() => {
    setPhotos(initialPhotos)
  }, [initialPhotos])

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handler update: Refresh router agar stats di server dihitung ulang
  const handlePhotosUpdated = useCallback(async () => {
    startTransition(async () => {
      router.refresh() // <--- Ini akan memicu fetch ulang getPhotoStats() di server

      // Update grid lokal biar UI responsif
      try {
        const res = await getPhotos({
            searchQuery: searchQuery,
            limit: 100
        })
        if (res.success && res.data) {
            setPhotos(res.data.photos)
        }
      } catch (error) {
        console.error("Gagal refresh data lokal", error)
      }
    })
  }, [router, searchQuery])

  return (
    <>
      {/* Stats Bar - Normal (Menampilkan Data Server Global) */}
      {!isScrolled && (
        <div className="flex justify-center py-3 border-b border-gray-200/50 dark:border-gray-800/50">
          <div className="flex items-center gap-4 md:gap-6 text-xs md:text-sm">
            <div className="flex items-center gap-1.5">
              <Images className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{serverStats.total}</span>
              <span className="text-gray-500">Total Foto</span>
            </div>

            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{serverStats.thisMonth}</span>
              <span className="text-gray-500">Bulan Ini</span>
            </div>

            <div className="w-px h-3 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1.5" title="Total penggunaan server">
              <HardDrive className="w-3.5 h-3.5 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{formatFileSize(serverStats.totalSize)}</span>
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
              <span className="font-semibold text-gray-900 dark:text-white">{serverStats.total}</span>
            </div>

            <div className="w-px h-2.5 bg-gray-300 dark:bg-gray-600" />

            <div className="flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-purple-500" />
              <span className="font-semibold text-gray-900 dark:text-white">{formatFileSize(serverStats.totalSize)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Section */}
      <div className="flex-1">
        {photos.length > 0 ? (
          <PhotoGrid
            photos={photos}
            currentUser={user} 
            onPhotosUpdated={handlePhotosUpdated}
          />
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