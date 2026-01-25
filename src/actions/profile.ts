// ============================================================================
// PROFILE SERVER ACTIONS (SUPER ADMIN MODE)
// File: src/actions/profile.ts
// Deskripsi: Bypass RLS total untuk Upload & Update Profile
// ============================================================================

'use server'

import { createServiceRoleClient } from '@/lib/supabase/client'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    console.log("🚀 [PROFILE] Action triggered...")

    try {
        // 1. Cek Login
        const user = await getCurrentUser()
        if (!user) {
            console.error("❌ [PROFILE] Unauthorized")
            return { success: false, message: 'Unauthorized: Sesi habis' }
        }

        const fullName = formData.get('fullName') as string
        const avatarFile = formData.get('avatar') as File | null

        // GUNAKAN SERVICE ROLE (ADMIN) UNTUK SEMUA OPERASI
        // Pastikan SUPABASE_SERVICE_ROLE_KEY ada di .env.local
        const adminSupabase = await createServiceRoleClient()

        let publicAvatarUrl = null

        // 2. Upload Avatar (Jika ada)
        if (avatarFile && avatarFile.size > 0) {
            console.log("📂 [PROFILE] Uploading file:", avatarFile.name)

            const fileName = `avatar-${user.id}-${Date.now()}.webp`

            const { error: uploadError } = await adminSupabase.storage
                .from('avatars')
                .upload(fileName, avatarFile, {
                    upsert: true,
                    contentType: 'image/webp'
                })

            if (uploadError) {
                console.error("❌ [PROFILE] Upload Error:", uploadError)
                throw new Error("Gagal upload: " + uploadError.message)
            }

            const { data } = adminSupabase.storage.from('avatars').getPublicUrl(fileName)
            publicAvatarUrl = data.publicUrl
            console.log("✅ [PROFILE] URL Generated:", publicAvatarUrl)
        }

        // 3. Update Database (Pakai Admin Client juga!)
        const updateData: any = {
            full_name: fullName,
            updated_at: new Date().toISOString()
        }

        if (publicAvatarUrl) {
            updateData.avatar_url = publicAvatarUrl
        }

        console.log("📝 [PROFILE] Updating DB for user:", user.id, updateData)

        const { error: dbError } = await adminSupabase
            .from('profiles')
            .update(updateData)
            .eq('id', user.id)

        if (dbError) {
            console.error("❌ [PROFILE] DB Error:", dbError)
            throw new Error("Gagal update database: " + dbError.message)
        }

        console.log("🎉 [PROFILE] Success!")

        // Refresh semua cache
        revalidatePath('/', 'layout')

        return { success: true, message: 'Profil berhasil disimpan' }

    } catch (error: any) {
        console.error("💥 [PROFILE] Exception:", error)
        return { success: false, message: error.message || 'Terjadi kesalahan sistem' }
    }
}