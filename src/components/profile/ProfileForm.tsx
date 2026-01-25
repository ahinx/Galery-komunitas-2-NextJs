'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/actions/profile'
import LogoutButton from '@/components/auth/LogoutButton'
import SimpleAvatarCropper from '@/components/profile/SimpleAvatarCropper'
import { Camera, User, Phone, Shield, Loader2 } from 'lucide-react'

interface ProfileFormProps {
  user: {
    id: string, full_name: string, phone_number: string, avatar_url: string | null, role: string
  }
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [isCropping, setIsCropping] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(URL.createObjectURL(file))
      setIsCropping(true)
      e.target.value = '' 
    }
  }

  const handleCropComplete = async (croppedFile: File) => {
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('avatar', croppedFile)
      formData.append('fullName', user.full_name)

      const result = await updateProfile(formData)

      if (result.success) {
        setIsCropping(false)
        setSelectedFile(null)
        router.refresh()
      } else {
        alert("Gagal: " + result.message)
      }
    } catch (error) {
      alert('Gagal upload avatar')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <>
      {isCropping && selectedFile && (
        <SimpleAvatarCropper
          imageSrc={selectedFile}
          onCancel={() => { setIsCropping(false); setSelectedFile(null) }}
          onCropComplete={handleCropComplete}
          isUploading={isUploading}
        />
      )}

      <div className="p-6">
        <div className="flex flex-col items-center gap-4 mb-8">
            <div onClick={() => fileInputRef.current?.click()} className="relative group cursor-pointer">
                <div className="w-28 h-28 rounded-full bg-gray-200 overflow-hidden ring-4 ring-white dark:ring-gray-700 shadow-xl relative">
                     {isUploading && (
                       <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
                         <Loader2 className="w-8 h-8 text-white animate-spin" />
                       </div>
                     )}
                     {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                     ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold">
                            {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                        </div>
                     )}
                </div>
                <div className="absolute bottom-1 right-1 p-2 bg-blue-600 text-white rounded-full shadow-lg border-2 border-white dark:border-gray-800 z-20">
                  <Camera className="w-4 h-4" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>
            <p className="text-xs text-gray-500">Ketuk foto untuk mengubah</p>
        </div>

        <form action={updateProfile} className="space-y-6">
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <User className="w-4 h-4" /> Nama Lengkap
                </label>
                <input type="text" name="fullName" defaultValue={user.full_name}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition" />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Phone className="w-4 h-4" /> Nomor WhatsApp
                </label>
                <input type="text" defaultValue={user.phone_number} disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed" />
            </div>
            <div className="pt-2">
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                    Simpan Perubahan
                </button>
            </div>
        </form>
        <hr className="my-8 border-gray-100 dark:border-gray-700" />
        <div className="space-y-4">
            <LogoutButton className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 rounded-xl border border-red-100" showText={true} />
        </div>
      </div>
    </>
  )
}