// ============================================================================
// ADMIN SETTINGS PAGE (Complete Version)
// File: src/app/(main)/admin/settings/page.tsx
// ============================================================================

import { getAppSettings, updateAppSettings } from '@/actions/settings'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { Settings, Globe, Image as ImageIcon, ShieldAlert, Smartphone, Share2 } from 'lucide-react'
import FormButton from './FormButton' 
import AssetUploader from './AssetUploader' // Komponen Baru

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'super_admin') redirect('/dashboard')

  const settings = await getAppSettings()

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      
      {/* HEADER SECTION (Responsive) */}
      <div className="mb-8 border-b border-gray-200 dark:border-gray-700 pb-6 flex flex-col items-center md:flex-row md:items-center justify-between gap-4 text-center md:text-left">
        <div>
            <h1 className="text-3xl font-bold flex items-center justify-center md:justify-start gap-3 text-gray-900 dark:text-white">
               <Settings className="w-8 h-8 text-blue-600" />
               Pengaturan Sistem
            </h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md mx-auto md:mx-0">
               Kontrol penuh identitas aplikasi, SEO, dan aset visual.
            </p>
        </div>
        <div className="shrink-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full border border-red-100 dark:border-red-800 text-xs font-bold uppercase tracking-wider">
               <ShieldAlert className="w-4 h-4" />
               Super Admin
            </div>
        </div>
      </div>

      <form action={updateAppSettings} className="space-y-8">
        
        {/* 1. IDENTITAS & SEO */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-100 dark:border-gray-700/50">
            <Globe className="w-5 h-5 text-blue-500" /> 
            Identitas & SEO
          </h2>
          
          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Nama Aplikasi</label>
              <input type="text" name="app_name" defaultValue={settings?.app_name || ''} placeholder="Contoh: Galeri Warga"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Deskripsi Meta</label>
              <textarea name="app_description" defaultValue={settings?.app_description || ''} rows={2}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Keywords (SEO)</label>
                  <input type="text" name="keywords" defaultValue={settings?.keywords || ''} placeholder="foto, galeri, warga..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-blue-500/50 outline-none text-sm" />
                  <p className="text-xs text-gray-400 mt-1">Pisahkan dengan koma.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Theme Color (Mobile)</label>
                  <div className="flex gap-2">
                      <input type="color" name="theme_color" defaultValue={settings?.theme_color || '#2563eb'} 
                        className="h-11 w-16 p-1 rounded border border-gray-300 cursor-pointer" />
                      <input type="text" name="theme_color_text" defaultValue={settings?.theme_color || '#2563eb'} readOnly
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-sm font-mono" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Warna toolbar browser di Android.</p>
                </div>
            </div>
          </div>
        </div>

        {/* 2. LOGO & BRANDING */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-100 dark:border-gray-700/50">
            <ImageIcon className="w-5 h-5 text-purple-500" /> 
            Logo & Branding
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
             <AssetUploader 
                label="Logo Navbar (Desktop)"
                name="logo_url"
                folder="logos"
                defaultValue={settings?.logo_url}
                description="Format PNG Transparan. Tinggi max 100px. Muncul di header website."
                aspectRatio="wide"
             />
             <AssetUploader 
                label="Browser Favicon"
                name="icon_url"
                folder="icons"
                defaultValue={settings?.icon_url}
                description="Format ICO/PNG. Ukuran 32x32px. Muncul di tab browser."
             />
          </div>
        </div>

        {/* 3. MOBILE & SOCIAL */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 text-gray-800 dark:text-gray-200 pb-2 border-b border-gray-100 dark:border-gray-700/50">
            <Share2 className="w-5 h-5 text-green-500" /> 
            Mobile & Social Media
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
             <AssetUploader 
                label="Apple Touch Icon (iOS)"
                name="apple_icon_url"
                folder="icons"
                defaultValue={settings?.apple_icon_url}
                description="Format PNG (Kotak). Ukuran 180x180px. Untuk 'Add to Home Screen' di iPhone."
             />
             <AssetUploader 
                label="Open Graph Image (Social Share)"
                name="og_image_url"
                folder="social"
                defaultValue={settings?.og_image_url}
                description="Format JPG/PNG. Ukuran 1200x630px. Preview saat link dishare ke WhatsApp/FB."
                aspectRatio="wide"
             />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-4 pb-10 md:pb-0">
           <FormButton />
        </div>

      </form>
    </div>
  )
}