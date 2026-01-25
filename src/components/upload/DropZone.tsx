// ============================================================================
// DROPZONE COMPONENT
// File: src/components/upload/DropZone.tsx
// Deskripsi: Drag & drop upload component dengan preview
// ============================================================================

'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle2 } from 'lucide-react'
import { compressImage, validateImageFile, getImagePreviewUrl } from '@/lib/image-compression'
import { extractExifData } from '@/lib/exif-extractor'
import { uploadPhoto } from '@/actions/photos'
import { formatFileSize } from '@/lib/utils'
import { UPLOAD_CONFIG } from '@/lib/constants'

interface UploadFile {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  progress?: number
}

export default function DropZone() {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  // Handle file drop/select
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map(file => {
      const validation = validateImageFile(file)
      
      return {
        file,
        preview: getImagePreviewUrl(file),
        status: validation.valid ? 'pending' : 'error',
        error: validation.error,
      }
    })

    setFiles(prev => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'],
    },
    maxSize: UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES,
    multiple: true,
  })

  // Remove file dari list
  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev]
      URL.revokeObjectURL(newFiles[index].preview)
      newFiles.splice(index, 1)
      return newFiles
    })
  }

  // Upload semua file
  const handleUploadAll = async () => {
    setIsUploading(true)

    for (let i = 0; i < files.length; i++) {
      const uploadFile = files[i]
      
      if (uploadFile.status !== 'pending') continue

      // Update status ke uploading
      setFiles(prev => {
        const newFiles = [...prev]
        newFiles[i].status = 'uploading'
        return newFiles
      })

      try {
        // Compress image
        const compressedFile = await compressImage(uploadFile.file)
        
        // Extract EXIF
        const exifData = await extractExifData(uploadFile.file)

        // Prepare form data
        const formData = new FormData()
        formData.append('file', compressedFile)
        formData.append('exifData', JSON.stringify(exifData))

        // Upload
        const result = await uploadPhoto(formData)

        if (result.success) {
          setFiles(prev => {
            const newFiles = [...prev]
            newFiles[i].status = 'success'
            return newFiles
          })
        } else {
          setFiles(prev => {
            const newFiles = [...prev]
            newFiles[i].status = 'error'
            newFiles[i].error = result.message
            return newFiles
          })
        }
      } catch (error) {
        setFiles(prev => {
          const newFiles = [...prev]
          newFiles[i].status = 'error'
          newFiles[i].error = 'Terjadi kesalahan saat upload'
          return newFiles
        })
      }
    }

    setIsUploading(false)
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const successCount = files.filter(f => f.status === 'success').length

  return (
    <div className="space-y-6">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
            <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
              {isDragActive ? 'Lepaskan file di sini' : 'Drag & drop foto Anda di sini'}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              atau klik untuk memilih file
            </p>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            Maksimal {UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB per file • Format: JPG, PNG, WebP
          </div>
        </div>
      </div>

      {/* File Preview List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 dark:text-white">
              {files.length} file dipilih
            </h3>
            
            {pendingCount > 0 && (
              <button
                onClick={handleUploadAll}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload {pendingCount} File
                  </>
                )}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((uploadFile, index) => (
              <div
                key={index}
                className="relative group bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                {/* Preview Image */}
                <div className="aspect-square relative bg-gray-100 dark:bg-gray-700">
                  <img
                    src={uploadFile.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />

                  {/* Status Overlay */}
                  {uploadFile.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}

                  {uploadFile.status === 'success' && (
                    <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                      <div className="bg-green-500 rounded-full p-2">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  )}

                  {uploadFile.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/20" />
                  )}

                  {/* Remove Button */}
                  {uploadFile.status !== 'uploading' && (
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* File Info */}
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatFileSize(uploadFile.file.size)}
                  </p>

                  {uploadFile.error && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Success Summary */}
          {successCount > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm text-green-800 dark:text-green-200">
                ✅ {successCount} dari {files.length} file berhasil diupload
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}