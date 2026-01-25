// ============================================================================
// DOWNLOAD MODAL COMPONENT (Fixed Double Download)
// File: src/components/gallery/DownloadModal.tsx
// - Fix: foto tunggal tidak download 2x
// ============================================================================

'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  X, 
  FileArchive, 
  Image as ImageIcon, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Smartphone
} from 'lucide-react'
import type { Photo } from '@/lib/supabase/client'
import { cn, formatFileSize } from '@/lib/utils'
import JSZip from 'jszip'

interface DownloadModalProps {
  photos: Photo[]
  onClose: () => void
  onComplete: () => void
}

type DownloadStatus = 'idle' | 'downloading' | 'complete' | 'error'

export default function DownloadModal({
  photos,
  onClose,
  onComplete,
}: DownloadModalProps) {
  const [status, setStatus] = useState<DownloadStatus>('idle')
  const [progress, setProgress] = useState({ current: 0, total: photos.length })
  const [errorMessage, setErrorMessage] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  
  // Flag untuk mencegah double execution
  const hasStartedRef = useRef(false)

  const isSingle = photos.length === 1
  const totalSize = photos.reduce((sum, p) => sum + (p.file_size || 0), 0)

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent))
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Download single file
  const downloadFile = async (photo: Photo): Promise<boolean> => {
    try {
      const response = await fetch(photo.display_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = photo.file_name || `photo-${photo.id}.webp`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      return true
    } catch {
      return false
    }
  }

  // Download semua foto langsung (satu per satu)
  const handleDirectDownload = async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    
    setStatus('downloading')
    setProgress({ current: 0, total: photos.length })

    let successCount = 0

    for (let i = 0; i < photos.length; i++) {
      setProgress({ current: i + 1, total: photos.length })
      const success = await downloadFile(photos[i])
      if (success) successCount++
      
      // Delay antar download (kecuali foto terakhir)
      if (photos.length > 1 && i < photos.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }

    if (successCount > 0) {
      setStatus('complete')
      setTimeout(onComplete, 1000)
    } else {
      setStatus('error')
      setErrorMessage('Gagal mengunduh foto')
      hasStartedRef.current = false
    }
  }

  // Download sebagai ZIP
  const handleZipDownload = async () => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    
    setStatus('downloading')
    setProgress({ current: 0, total: photos.length })

    try {
      const zip = new JSZip()

      for (let i = 0; i < photos.length; i++) {
        setProgress({ current: i + 1, total: photos.length })
        try {
          const response = await fetch(photos[i].display_url)
          const blob = await response.blob()
          zip.file(photos[i].file_name || `photo-${photos[i].id}.webp`, blob)
        } catch {
          // Skip failed files
        }
      }

      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      })

      const url = window.URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `galeri-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      setStatus('complete')
      setTimeout(onComplete, 1000)
    } catch {
      setStatus('error')
      setErrorMessage('Gagal membuat file ZIP')
      hasStartedRef.current = false
    }
  }

  // Auto-download untuk foto tunggal - dengan guard
  useEffect(() => {
    if (isSingle && status === 'idle' && !hasStartedRef.current) {
      handleDirectDownload()
    }
  }, []) // Empty deps - hanya run sekali saat mount

  return (
    <div 
      className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && status !== 'downloading' && onClose()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className={cn(
        'relative w-full max-w-sm',
        'bg-white dark:bg-gray-800',
        'rounded-2xl shadow-2xl',
        'animate-in zoom-in-95 fade-in duration-200'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {status === 'idle' && 'Download'}
            {status === 'downloading' && 'Mengunduh...'}
            {status === 'complete' && 'Selesai!'}
            {status === 'error' && 'Gagal'}
          </h3>
          {status !== 'downloading' && (
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Idle - Show options (hanya untuk multiple photos) */}
          {status === 'idle' && !isSingle && (
            <>
              {/* Info */}
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
                <ImageIcon className="w-6 h-6 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {photos.length} foto
                  </p>
                  <p className="text-xs text-gray-500">~{formatFileSize(totalSize)}</p>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {/* Direct Download */}
                <button
                  onClick={handleDirectDownload}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left"
                >
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Smartphone className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Download Langsung</p>
                    <p className="text-[10px] text-gray-500">
                      {isMobile ? 'Direkomendasikan untuk HP' : 'Satu per satu'}
                    </p>
                  </div>
                </button>

                {/* ZIP Download */}
                <button
                  onClick={handleZipDownload}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left"
                >
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <FileArchive className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Download ZIP</p>
                    <p className="text-[10px] text-gray-500">
                      {!isMobile ? 'Direkomendasikan untuk PC' : 'Satu file arsip'}
                    </p>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Downloading */}
          {status === 'downloading' && (
            <div className="py-6 flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {progress.current} / {progress.total}
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Complete */}
          {status === 'complete' && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Download Selesai!</p>
            </div>
          )}

          {/* Error */}
          {status === 'error' && (
            <div className="py-6 flex flex-col items-center">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{errorMessage}</p>
              <button
                onClick={() => {
                  setStatus('idle')
                  hasStartedRef.current = false
                }}
                className="mt-3 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition"
              >
                Coba Lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}