// ============================================================================
// WAITING ROOM PAGE (With Check Status Button)
// File: src/app/(auth)/waiting-room/page.tsx
// ============================================================================

import { getCurrentUser, getAdminContacts } from '@/actions/auth'
import { getAppSettings } from '@/actions/settings'
import { redirect } from 'next/navigation'
import CheckStatusButton from '@/components/auth/CheckStatusButton' // <--- IMPORT BARU
import { MessageCircle, User, AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'

// Helper: Format HP ke format WA
const formatPhoneForWA = (phone: string | null) => {
  if (!phone) return null
  let p = phone.replace(/\D/g, '')
  if (p.startsWith('0')) p = '62' + p.slice(1)
  return p
}

export default async function WaitingRoomPage() {
  // 1. Ambil Data User, Admin, DAN Settings
  const [user, admins, settings] = await Promise.all([
    getCurrentUser(),
    getAdminContacts(),
    getAppSettings()
  ])

  // Security Check
  if (!user) redirect('/login')
  
  // LOGIC REDIRECT: Jika status berubah jadi approved saat refresh, 
  // baris ini akan langsung melempar user ke dashboard.
  if (user.is_approved) redirect('/dashboard')

  const isRejected = user.status === 'rejected'
  const appName = settings?.app_name || 'Galeri Komunitas'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* --- STATUS CARD --- */}
        <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl shadow-lg border border-gray-200 dark:border-gray-800 text-center">
          
          <div className="flex flex-col items-center justify-center">
            
            {/* ICON STATUS */}
            {isRejected ? (
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                <AlertCircle className="w-12 h-12" />
              </div>
            ) : (
              // ANIMATED ROUND (Kode Animasi Anda)
              <div className="relative mb-6">
                 <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800/40 rounded-full flex items-center justify-center">
                       <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                 </div>
              </div>
            )}

            {/* TEXT STATUS */}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isRejected ? 'Pendaftaran Ditolak' : 'Menunggu Persetujuan'}
            </h1>
            
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed mb-6">
              {isRejected ? (
                <>Maaf <span className="font-semibold">{user.full_name}</span>, pendaftaran Anda belum dapat kami setujui saat ini. Silakan hubungi admin untuk info lebih lanjut.</>
              ) : (
                <>Halo <span className="font-semibold text-gray-900 dark:text-gray-200">{user.full_name}</span>, akun Anda sedang dalam antrean verifikasi admin. Mohon tunggu sebentar ya.</>
              )}
            </p>

            {/* ACTION BUTTONS (Ganti LogoutButton dengan CheckStatusButton) */}
            <div className="w-full flex justify-center border-t border-gray-100 dark:border-gray-800 pt-6">
              <CheckStatusButton /> 
            </div>
          </div>
        </div>

        {/* --- LIST ADMIN --- */}
        {!isRejected && (
          <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-500 delay-200">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
              Butuh verifikasi cepat? Hubungi Admin:
            </h2>

            <div className="grid gap-3 md:grid-cols-2">
              {admins.map((admin: any) => {
                const waNumber = formatPhoneForWA(admin.phone)
                const message = encodeURIComponent(
                  `Halo Admin ${admin.full_name}, saya ${user.full_name} baru mendaftar di ${appName}. Mohon approval akun saya.`
                )
                const waLink = waNumber ? `https://wa.me/${waNumber}?text=${message}` : '#'

                return (
                  <div key={admin.id} className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center gap-3 hover:border-blue-300 transition-all shadow-sm">
                    <div className="shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                      {admin.avatar_url ? (
                        <Image src={admin.avatar_url} alt={admin.full_name} width={40} height={40} className="w-full h-full object-cover"/>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><User className="w-5 h-5"/></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{admin.full_name}</p>
                      <p className="text-[10px] text-gray-500 capitalize">{admin.role.replace('_', ' ')}</p>
                    </div>

                    {waNumber && (
                      <a 
                        href={waLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-green-50 text-green-600 dark:bg-green-900/20 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
                        title="Chat WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )
              })}
              
              {admins.length === 0 && (
                 <div className="col-span-2 text-center py-4 text-gray-400 text-xs italic">
                   Belum ada kontak admin yang tersedia.
                 </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}