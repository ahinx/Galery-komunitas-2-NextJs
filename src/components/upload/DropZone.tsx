// ============================================================================
// DROPZONE COMPONENT WITH THUMBNAIL GENERATION
// File: src/components/upload/DropZone.tsx
// Fitur: Upload original + thumbnail dalam satu flow
// ============================================================================

'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Play, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import { uploadPhoto } from '@/actions/photos'
import { extractExifData } from '@/lib/exif-extractor'

// Import Utility
import { 
  processImageWithThumbnail,
  getImagePreviewUrl, 
  revokePreviewUrl,
  isValidImage,
  type ProcessedImage
} from '@/lib/image-compression'

// --- TYPE DEFINITIONS ---
interface UploadFile extends File {
  preview: string
  id: string
  status: 'pending' | 'processing' | 'uploading' | 'success' | 'error'
  statusText?: string
  errorMessage?: string
  processedData?: ProcessedImage
}

export default function DropZone() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false)

  // ============================================================================
  // PROCESS & UPLOAD SINGLE FILE
  // ============================================================================
  
  const processAndUpload = async (fileId: string, fileObj: File) => {
    // Step 1: Processing (compress + generate thumbnail)
    setFiles(prev => prev.map(f => f.id === fileId ? { 
      ...f, 
      status: 'processing',
      statusText: 'Memproses gambar...'
    } : f))
    
    try {
      // Extract EXIF data first (before compression might strip it)
      const exifData = await extractExifData(fileObj)
      
      // Process image: compress original + generate thumbnail
      setFiles(prev => prev.map(f => f.id === fileId ? { 
        ...f, 
        statusText: 'Membuat thumbnail...'
      } : f))
      
      const processed = await processImageWithThumbnail(fileObj)
      
      console.log(`📊 [PROCESSED] Original: ${(processed.originalSize/1024).toFixed(0)}KB, Thumb: ${(processed.thumbnailSize/1024).toFixed(0)}KB`)

      // Step 2: Uploading
      setFiles(prev => prev.map(f => f.id === fileId ? { 
        ...f, 
        status: 'uploading',
        statusText: 'Mengupload...',
        processedData: processed
      } : f))

      // Prepare FormData with both files
      const formData = new FormData()
      formData.append('file', processed.original)
      formData.append('thumbnail', processed.thumbnail)
      formData.append('exifData', JSON.stringify(exifData))

      const result = await uploadPhoto(formData)

      if (result.success) {
        setFiles(prev => prev.map(f => f.id === fileId ? { 
          ...f, 
          status: 'success',
          statusText: 'Selesai!'
        } : f))
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      console.error(`❌ [UPLOAD ERROR] ${fileId}:`, error)
      setFiles(prev => prev.map(f => f.id === fileId ? { 
        ...f, 
        status: 'error', 
        errorMessage: error.message || 'Gagal upload' 
      } : f))
    }
  }

  // ============================================================================
  // START UPLOAD ALL PENDING
  // ============================================================================
  
  const handleStartUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploadingGlobal(true)
    
    // Process sequentially to avoid overwhelming the server
    for (const file of pendingFiles) {
      await processAndUpload(file.id, file)
    }
    
    setIsUploadingGlobal(false)
  }

  // ============================================================================
  // ON DROP FILES
  // ============================================================================
  
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    const newFiles = acceptedFiles.map(file => {
      if (!isValidImage(file)) return null
      return Object.assign(file, {
        preview: getImagePreviewUrl(file),
        id: Math.random().toString(36).substring(7),
        status: 'pending' as const
      })
    }).filter(Boolean) as UploadFile[]
    
    setFiles(prev => [...prev, ...newFiles])

    if (fileRejections.length > 0) {
      alert(`${fileRejections.length} file ditolak (format/ukuran tidak valid).`)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 
      'image/jpeg': [], 
      'image/png': [], 
      'image/webp': [], 
      'image/heic': [] 
    },
    multiple: true,
    disabled: isUploadingGlobal
  })

  // ============================================================================
  // FILE ACTIONS
  // ============================================================================
  
  const removeFile = (id: string) => {
    setFiles(prev => {
      const target = prev.find(f => f.id === id)
      if (target) revokePreviewUrl(target.preview)
      return prev.filter(f => f.id !== id)
    })
  }

  const clearAll = () => {
    files.forEach(f => revokePreviewUrl(f.preview))
    setFiles([])
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const isAllDone = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error')

  // Cleanup on unmount
  useEffect(() => {
    return () => files.forEach(file => revokePreviewUrl(file.preview))
  }, [])

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* 1. DROPZONE AREA */}
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center cursor-pointer transition-all duration-200 relative overflow-hidden
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }
          ${isUploadingGlobal ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className={`
            w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors
            ${isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}
          `}>
            <Upload className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <p className="text-base sm:text-lg font-bold text-gray-700 dark:text-gray-200">
              {isDragActive ? "Lepaskan file..." : "Pilih Foto Galeri"}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Tap atau Tarik foto ke sini. Thumbnail akan dibuat otomatis.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ACTION BAR */}
      {files.length > 0 && !isAllDone && (
        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            
            {/* Info Count */}
            <div className="text-xs sm:text-sm text-center sm:text-left w-full sm:w-auto">
              <span className="font-bold text-gray-900 dark:text-white">{pendingCount}</span> foto siap upload
              <span className="text-gray-400 ml-1">(+ thumbnail)</span>
            </div>
            
            {/* Buttons Group */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={clearAll}
                disabled={isUploadingGlobal}
                className="flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition disabled:opacity-50 text-center"
              >
                Batal
              </button>

              <button 
                onClick={handleStartUpload}
                disabled={isUploadingGlobal || pendingCount === 0}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isUploadingGlobal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Proses...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Mulai Upload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. LIST FILE ANTRIAN */}
      {files.length > 0 && (
        <div className="space-y-3">
           <div className="flex justify-between items-center px-1">
             <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider">
               Daftar Foto
             </h3>
             {isAllDone && (
               <button onClick={clearAll} className="text-xs text-blue-600 hover:underline">
                 Bersihkan List
               </button>
             )}
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {files.map((file) => (
              <div 
                key={file.id} 
                className={`
                  relative p-2.5 sm:p-3 rounded-xl border flex items-center gap-3 sm:gap-4 shadow-sm transition-all
                  ${file.status === 'error' 
                    ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
                    : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'
                  }
                `}
              >
                
                {/* Thumbnail Preview */}
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 relative shrink-0 shadow-inner group">
                   <Image 
                     src={file.preview} 
                     alt="preview" 
                     fill 
                     className={`object-cover transition-opacity ${file.status === 'uploading' || file.status === 'processing' ? 'opacity-50' : 'opacity-100'}`}
                   />
                   {file.status === 'success' && (
                     <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                       <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-md" />
                     </div>
                   )}
                   {file.status === 'processing' && (
                     <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                       <ImageIcon className="w-4 h-4 text-amber-600 animate-pulse" />
                     </div>
                   )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-[200px]">
                      {file.name}
                    </p>
                    
                    {file.status === 'pending' && !isUploadingGlobal && (
                      <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Status Bar */}
                  <div className="mt-1.5">
                    {file.status === 'pending' && (
                        <span className="text-[10px] sm:text-xs text-gray-400 flex items-center gap-1">
                            Menunggu...
                        </span>
                    )}

                    {file.status === 'processing' && (
                        <div className="flex items-center gap-2 text-amber-600 text-[10px] sm:text-xs font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>{file.statusText || 'Memproses...'}</span>
                        </div>
                    )}

                    {file.status === 'uploading' && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-blue-600 font-medium">
                             <Loader2 className="w-3 h-3 animate-spin" />
                             <span>{file.statusText || 'Mengupload...'}</span>
                          </div>
                          <div className="h-1 sm:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 animate-pulse w-3/4 rounded-full"></div>
                          </div>
                          {file.processedData && (
                            <p className="text-[9px] text-gray-400">
                              Original: {(file.processedData.originalSize/1024).toFixed(0)}KB • 
                              Thumb: {(file.processedData.thumbnailSize/1024).toFixed(0)}KB
                            </p>
                          )}
                        </div>
                    )}

                    {file.status === 'success' && (
                        <span className="text-[10px] sm:text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                    )}

                    {file.status === 'error' && (
                        <span className="text-[10px] sm:text-xs text-red-600 font-medium flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {file.errorMessage || 'Gagal'}
                        </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}