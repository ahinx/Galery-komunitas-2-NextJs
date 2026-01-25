// ============================================================================
// DROPZONE COMPONENT (PREVIEW MODE + MANUAL UPLOAD)
// File: src/components/upload/DropZone.tsx
// Deskripsi: Drag & Drop dengan preview, kompresi WebP, dan tombol eksekusi manual
// ============================================================================

'use client'

import { useCallback, useState, useEffect } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Play, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { uploadPhoto } from '@/actions/photos'

// Import Utility
import { 
  compressImage, 
  getImagePreviewUrl, 
  revokePreviewUrl,
  isValidImage 
} from '@/lib/image-compression'

// --- TYPE DEFINITIONS ---
interface UploadFile extends File {
  preview: string
  id: string
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error'
  errorMessage?: string
}

export default function DropZone() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false)

  // --------------------------------------------------------------------------
  // LOGIC: PROSES UPLOAD SATU FILE
  // --------------------------------------------------------------------------
  const processUpload = async (fileId: string, fileObj: File) => {
    // Update status ke Compressing
    setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'compressing' } : f))
    
    try {
      // 1. Kompresi Client-Side
      const compressedFile = await compressImage(fileObj)
      
      // Update status ke Uploading
      setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'uploading' } : f))

      // 2. Persiapkan Data
      const formData = new FormData()
      formData.append('file', compressedFile) 

      // 3. Eksekusi Server Action
      const result = await uploadPhoto(formData)

      if (result.success) {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: 'success' } : f))
      } else {
        throw new Error(result.message)
      }
    } catch (error: any) {
      setFiles(prev => prev.map(f => f.id === fileId ? { 
        ...f, 
        status: 'error', 
        errorMessage: error.message || 'Gagal upload' 
      } : f))
    }
  }

  // --------------------------------------------------------------------------
  // LOGIC: TOMBOL MULAI UPLOAD (BATCH ACTION)
  // --------------------------------------------------------------------------
  const handleStartUpload = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    if (pendingFiles.length === 0) return

    setIsUploadingGlobal(true)

    // Eksekusi semua file yang pending secara paralel
    // Kita gunakan Promise.all agar UI tahu kapan SEMUA selesai
    await Promise.all(pendingFiles.map(file => processUpload(file.id, file)))

    setIsUploadingGlobal(false)
  }

  // --------------------------------------------------------------------------
  // EVENT: ON DROP (HANYA PREVIEW, JANGAN UPLOAD DULU)
  // --------------------------------------------------------------------------
  const onDrop = useCallback((acceptedFiles: File[], fileRejections: FileRejection[]) => {
    // 1. Siapkan file object dengan preview
    const newFiles = acceptedFiles.map(file => {
      if (!isValidImage(file)) return null

      return Object.assign(file, {
        preview: getImagePreviewUrl(file),
        id: Math.random().toString(36).substring(7),
        status: 'pending' as const
      })
    }).filter(Boolean) as UploadFile[]
    
    // 2. Masukkan ke state (TIDAK ADA processUpload disini)
    setFiles(prev => [...prev, ...newFiles])

    if (fileRejections.length > 0) {
      alert(`${fileRejections.length} file ditolak (Format salah/terlalu besar).`)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [], 'image/png': [], 'image/webp': [], 'image/heic': []
    },
    multiple: true,
    disabled: isUploadingGlobal // Matikan dropzone saat sedang upload
  })

  // --------------------------------------------------------------------------
  // ACTIONS: HAPUS FILE / RESET
  // --------------------------------------------------------------------------
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

  // Hitung statistik untuk UI
  const pendingCount = files.filter(f => f.status === 'pending').length
  const successCount = files.filter(f => f.status === 'success').length
  const isAllDone = files.length > 0 && files.every(f => f.status === 'success' || f.status === 'error')

  // Cleanup on unmount
  useEffect(() => {
    return () => files.forEach(file => revokePreviewUrl(file.preview))
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      
      {/* 1. AREA DROPZONE */}
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 relative overflow-hidden
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
            w-16 h-16 rounded-full flex items-center justify-center transition-colors
            ${isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}
          `}>
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <p className="text-lg font-bold text-gray-700 dark:text-gray-200">
              {isDragActive ? "Lepaskan file sekarang..." : "Pilih Foto Galeri"}
            </p>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              Tarik & lepas foto di sini. Preview dulu sebelum upload.
            </p>
          </div>
        </div>
      </div>

      {/* 2. ACTION BAR (TOMBOL UPLOAD) */}
      {files.length > 0 && !isAllDone && (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="text-sm">
            <span className="font-bold text-gray-900 dark:text-white">{pendingCount}</span> foto siap diupload
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={clearAll}
              disabled={isUploadingGlobal}
              className="px-4 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
            >
              Batal Semua
            </button>
            <button 
              onClick={handleStartUpload}
              disabled={isUploadingGlobal || pendingCount === 0}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isUploadingGlobal ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Mulai Upload
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 3. LIST FILE ANTRIAN */}
      {files.length > 0 && (
        <div className="space-y-3">
           {/* Header List */}
           <div className="flex justify-between items-center px-1">
             <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
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
                  relative p-3 rounded-xl border flex items-center gap-4 shadow-sm transition-all
                  ${file.status === 'error' 
                    ? 'bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30' 
                    : 'bg-white border-gray-100 dark:bg-gray-800 dark:border-gray-700'
                  }
                `}
              >
                
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 relative shrink-0 shadow-inner group">
                   <Image 
                      src={file.preview} 
                      alt="preview" 
                      fill 
                      className={`object-cover transition-opacity ${file.status === 'uploading' ? 'opacity-50' : 'opacity-100'}`}
                   />
                   {file.status === 'success' && (
                     <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                       <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
                     </div>
                   )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
                      {file.name}
                    </p>
                    
                    {/* Hapus Button (Hanya jika belum/gagal upload) */}
                    {file.status !== 'success' && file.status !== 'uploading' && !isUploadingGlobal && (
                      <button onClick={() => removeFile(file.id)} className="text-gray-400 hover:text-red-500 p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Status Bar */}
                  <div className="mt-1.5">
                    {file.status === 'pending' && (
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                            Menunggu konfirmasi...
                        </span>
                    )}

                    {file.status === 'compressing' && (
                        <div className="flex items-center gap-2 text-amber-600 text-xs font-medium">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Mengompresi (WebP)...</span>
                        </div>
                    )}

                    {file.status === 'uploading' && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-blue-600 font-medium">
                             <span>Mengupload...</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 animate-pulse w-3/4 rounded-full"></div>
                          </div>
                        </div>
                    )}

                    {file.status === 'success' && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Selesai
                        </span>
                    )}

                    {file.status === 'error' && (
                        <span className="text-xs text-red-600 font-medium flex items-center gap-1">
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