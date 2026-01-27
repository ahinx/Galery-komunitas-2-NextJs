// ============================================================================
// COMPONENT: ASSET UPLOADER (Responsive Fix)
// File: src/app/(main)/admin/settings/AssetUploader.tsx
// Deskripsi: Komponen upload gambar dengan layout responsif (Mobile-First)
// ============================================================================
'use client'

import { useState, useRef } from 'react'
import { UploadCloud, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { uploadAppAsset } from '@/actions/settings'
import { toast } from 'sonner'

interface AssetUploaderProps {
  label: string
  name: string // Nama field hidden input
  defaultValue?: string
  folder: string
  description?: string
  aspectRatio?: string // Contoh: "1:1", "16:9"
}

export default function AssetUploader({ label, name, defaultValue, folder, description, aspectRatio }: AssetUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState(defaultValue || '')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validasi sederhana
    if (file.size > 2 * 1024 * 1024) { // 2MB Limit
        toast.error('Ukuran file maksimal 2MB')
        return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    // Panggil Server Action untuk Upload
    const res = await uploadAppAsset(formData)

    if (res.success && res.url) {
        setPreviewUrl(res.url)
        toast.success('Gambar berhasil diupload')
    } else {
        toast.error('Gagal upload: ' + res.message)
    }
    setIsUploading(false)
  }

  return (
    <div className="w-full">
      <label className="block text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
        {label}
      </label>
      
      {/* Hidden Input untuk menyimpan URL final ke Form Utama */}
      <input type="hidden" name={name} value={previewUrl} />

      {/* CONTAINER UTAMA: 
          - Mobile: Flex Column (Atas-Bawah)
          - Tablet/Desktop (sm): Flex Row (Kiri-Kanan) 
      */}
      <div className="flex flex-col sm:flex-row items-start gap-4">
        
        {/* Preview Area */}
        <div className={`
            relative shrink-0 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
            rounded-lg overflow-hidden flex items-center justify-center self-center sm:self-auto
            ${aspectRatio === 'wide' 
                ? 'w-full h-48 sm:w-48 sm:h-28' // Mobile: Full Width, Desktop: Fixed Width
                : 'w-32 h-32 sm:w-24 sm:h-24'   // Mobile: Agak Besar, Desktop: Kecil
            }
        `}>
            {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
            ) : (
                <ImageIcon className="w-8 h-8 text-gray-300" />
            )}
            
            {/* Loading Overlay */}
            {isUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
            )}
        </div>

        {/* Action Area */}
        <div className="flex-1 w-full sm:w-auto">
            <div className="flex flex-col gap-3 sm:gap-2">
                
                {/* Tombol Upload (Full Width di Mobile) */}
                <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-[0.98]"
                >
                    <UploadCloud className="w-4 h-4" />
                    {previewUrl ? 'Ganti Gambar' : 'Pilih Gambar'}
                </button>
                
                {previewUrl && (
                    <button
                        type="button"
                        onClick={() => setPreviewUrl('')}
                        className="text-xs text-red-500 hover:text-red-600 flex items-center justify-center sm:justify-start gap-1 py-1"
                    >
                        <X className="w-3 h-3" /> Hapus Gambar
                    </button>
                )}
            </div>
            
            <p className="text-xs text-gray-400 mt-3 leading-relaxed text-center sm:text-left">
                {description}
            </p>
            
            {/* Native File Input (Hidden) */}
            <input 
                ref={fileInputRef}
                type="file" 
                accept="image/png, image/jpeg, image/webp, image/x-icon"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
      </div>
    </div>
  )
}