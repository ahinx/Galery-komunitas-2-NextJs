import { getCurrentUser } from '@/actions/auth'
import { updateProfile } from '@/actions/profile'
import LogoutButton from '@/components/auth/LogoutButton'
import { redirect } from 'next/navigation'
import { Camera, User, Phone, Shield } from 'lucide-react'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 md:pb-10">
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 min-h-screen shadow-sm md:min-h-0 md:mt-8 md:rounded-2xl md:border border-gray-200 dark:border-gray-700 overflow-hidden">
        
        {/* Header Mobile Style */}
        <div className="bg-white dark:bg-gray-800 p-4 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
            <h1 className="text-lg font-bold text-center">Pengaturan Profil</h1>
        </div>

        <div className="p-6">
            <form action={updateProfile} className="space-y-8">
                
                {/* 1. Avatar Section */}
                <div className="flex flex-col items-center gap-4">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden ring-4 ring-white dark:ring-gray-700 shadow-lg">
                             {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                                    {user.full_name[0]}
                                </div>
                             )}
                        </div>
                        {/* Overlay Edit Icon */}
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="w-8 h-8 text-white" />
                        </div>
                        <input type="file" name="avatar" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    </div>
                    <p className="text-xs text-gray-500">Ketuk foto untuk mengubah</p>
                </div>

                {/* 2. Info Form */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <User className="w-4 h-4" /> Nama Lengkap
                        </label>
                        <input 
                            type="text" 
                            name="fullName"
                            defaultValue={user.full_name}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            placeholder="Nama Anda"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Phone className="w-4 h-4" /> Nomor WhatsApp
                        </label>
                        <input 
                            type="text" 
                            defaultValue={user.phone_number}
                            disabled
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400">Nomor tidak dapat diubah</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            <Shield className="w-4 h-4" /> Role
                        </label>
                        <div className="px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-medium capitalize">
                            {user.role.replace('_', ' ')}
                        </div>
                    </div>
                </div>

                {/* 3. Action Buttons */}
                <div className="pt-4">
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95">
                        Simpan Perubahan
                    </button>
                </div>
            </form>

            {/* SEPARATOR */}
            <hr className="my-8 border-gray-100 dark:border-gray-700" />

            {/* 4. DANGER ZONE (LOGOUT) */}
            <div className="space-y-4">
                <h3 className="text-sm font-medium text-red-500">Zona Akun</h3>
                <LogoutButton 
                    className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium py-3 rounded-xl transition-all border border-red-100" 
                    showText={true} 
                />
                <p className="text-center text-xs text-gray-400">Versi Aplikasi 1.0.0</p>
            </div>
        </div>
      </div>
    </div>
  )
}