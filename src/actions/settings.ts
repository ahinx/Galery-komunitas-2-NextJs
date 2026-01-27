// ============================================================================
// SETTINGS ACTIONS (Upload & Update)
// File: src/actions/settings.ts
// ============================================================================
'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/actions/auth'

// --- HELPERS ---
function getAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

function getPublicClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

// 1. GET SETTINGS
export async function getAppSettings() {
    try {
        const supabase = getPublicClient()
        const { data } = await supabase.from('app_settings').select('*').limit(1).single()
        return data
    } catch (error) {
        return null
    }
}

// 2. UPLOAD ASSET (Helper Action untuk Upload File)
export async function uploadAppAsset(formData: FormData) {
    try {
        // Cek Auth
        const user = await getCurrentUser()
        if (!user || user.role !== 'super_admin') throw new Error('Unauthorized')

        const file = formData.get('file') as File
        const folder = formData.get('folder') as string || 'misc'

        if (!file) throw new Error('No file uploaded')

        const supabase = getAdminClient()

        // Buat nama file unik: folder/timestamp-namafile
        const fileName = `${folder}/${Date.now()}-${file.name.replace(/\s/g, '_')}`

        const { data, error } = await supabase
            .storage
            .from('app-assets')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            })

        if (error) throw error

        // Ambil Public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('app-assets')
            .getPublicUrl(fileName)

        return { success: true, url: publicUrl }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

// 3. UPDATE SETTINGS
export async function updateAppSettings(formData: FormData) {
    try {
        // Cek Super Admin
        const currentUser = await getCurrentUser()
        if (!currentUser || currentUser.role !== 'super_admin') {
            return { success: false, message: '⛔ Hanya Super Admin.' }
        }

        const supabase = getAdminClient()

        // Ambil Data Teks
        const app_name = formData.get('app_name') as string
        const app_description = formData.get('app_description') as string
        const keywords = formData.get('keywords') as string
        const theme_color = formData.get('theme_color') as string

        // Ambil URL Gambar (Ini diisi oleh Client Component setelah upload sukses)
        const logo_url = formData.get('logo_url') as string
        const icon_url = formData.get('icon_url') as string
        const apple_icon_url = formData.get('apple_icon_url') as string
        const og_image_url = formData.get('og_image_url') as string

        const existing = await getAppSettings()

        const payload = {
            app_name,
            app_description,
            keywords,
            theme_color,
            logo_url,
            icon_url,
            apple_icon_url,
            og_image_url,
            updated_at: new Date().toISOString()
        }

        if (existing) {
            await supabase.from('app_settings').update(payload).eq('id', existing.id)
        } else {
            await supabase.from('app_settings').insert(payload)
        }

        revalidatePath('/', 'layout')
        return { success: true, message: '✅ Pengaturan Sistem berhasil diperbarui!' }

    } catch (error: any) {
        return { success: false, message: `Gagal: ${error.message}` }
    }
}