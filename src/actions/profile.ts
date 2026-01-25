'use server'

import { createServerSupabaseClient, getPublicUrl } from '@/lib/supabase/client'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: 'Unauthorized' }

        const fullName = formData.get('fullName') as string
        const file = formData.get('avatar') as File

        const supabase = await createServerSupabaseClient()
        const updates: any = {
            full_name: fullName,
            updated_at: new Date().toISOString()
        }

        // Handle Avatar Upload
        if (file && file.size > 0) {
            // Hapus avatar lama jika ada (optional, skip biar cepat)

            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/avatar-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true })

            if (uploadError) throw new Error('Gagal upload avatar')

            updates.avatar_url = getPublicUrl('avatars', fileName)
        }

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)

        if (error) throw error

        revalidatePath('/dashboard')
        revalidatePath('/profile')

        return { success: true, message: 'Profil berhasil diperbarui' }
    } catch (error: any) {
        return { success: false, message: error.message || 'Gagal update profil' }
    }
}