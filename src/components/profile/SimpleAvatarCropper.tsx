// ============================================================================
// SIMPLE AVATAR CROPPER
// File: src/components/profile/SimpleAvatarCropper.tsx
// Deskripsi: Cropper simpel menggunakan react-avatar-editor
// ============================================================================

'use client'

import { useState, useRef } from 'react'
import AvatarEditor from 'react-avatar-editor'
import { Loader2, Check, X, ZoomIn } from 'lucide-react'

interface Props {
  imageSrc: string
  onCancel: () => void
  onCropComplete: (file: File) => void
  isUploading: boolean
}

export default function SimpleAvatarCropper({ imageSrc, onCancel, onCropComplete, isUploading }: Props) {
  const editorRef = useRef<AvatarEditor>(null)
  const [scale, setScale] = useState(1.2)

  const handleSave = async () => {
    if (editorRef.current) {
      // Fitur built-in library: langsung dapat canvas yang sudah dicrop
      const canvas = editorRef.current.getImageScaledToCanvas()

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "avatar.webp", { type: "image/webp" })
          onCropComplete(file)
        }
      }, 'image/webp', 0.8) // Kualitas 80%
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl flex flex-col">

        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-900 dark:text-white">Sesuaikan Foto</h3>
          <button onClick={onCancel} disabled={isUploading} className="text-gray-500 hover:text-red-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Editor Area */}
        <div className="flex justify-center bg-black py-8">
          <AvatarEditor
            ref={editorRef}
            image={imageSrc}
            width={250}
            height={250}
            border={20}
            borderRadius={125} // Lingkaran
            color={[0, 0, 0, 0.6]} // Overlay gelap
            scale={scale}
            rotate={0}
          />
        </div>

        {/* Controls */}
        <div className="p-5 space-y-4 bg-white dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-gray-500" />
            <input
              type="range"
              value={scale}
              min={1}
              max={3}
              step={0.1}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isUploading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Simpan Foto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}