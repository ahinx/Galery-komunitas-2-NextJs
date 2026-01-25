// ============================================================================
// ADMIN SERVER ACTIONS (FIXED & COMPLETE)
// File: src/actions/admin.ts
// Deskripsi: Server actions untuk admin management dengan Service Role Bypass
// ============================================================================

'use server'

import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from './auth'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants'
import type { Profile } from '@/lib/supabase/client'
import { revalidatePath } from 'next/cache'

// --- HELPER: ADMIN CLIENT (BYPASS RLS) ---
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

    if (!serviceRoleKey) {
        throw new Error('FATAL: SUPABASE_SERVICE_ROLE_KEY missing')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

type ActionResult<T = void> = {
    success: boolean
    message: string
    data?: T
}

// ----------------------------------------------------------------------------
// 1. GET ALL USERS (Untuk Halaman Kelola Users)
// ----------------------------------------------------------------------------
export async function getAllUsers(): Promise<ActionResult<{ users: Profile[] }>> {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabase = getAdminClient()

        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) throw error

        return {
            success: true,
            message: 'Data user berhasil diambil',
            data: { users: users as Profile[] },
        }
    } catch (error) {
        console.error('Error getAllUsers:', error)
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ----------------------------------------------------------------------------
// 2. GET PENDING (FIXED BUG: Filter by status='pending')
// ----------------------------------------------------------------------------
export async function getPendingApprovals(): Promise<ActionResult<{ users: Profile[] }>> {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabase = getAdminClient()

        // PERBAIKAN DISINI: Gunakan .eq('status', 'pending')
        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_verified', true)
            .eq('status', 'pending') // <--- KUNCI PERBAIKAN
            .order('created_at', { ascending: false })

        if (error) throw error

        return {
            success: true,
            message: 'Pending approvals fetched',
            data: { users: users as Profile[] },
        }
    } catch (error) {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ----------------------------------------------------------------------------
// 3. ACTIONS: APPROVE & BAN
// ----------------------------------------------------------------------------
export async function approveUser(userId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return { success: false, message: 'Unauthorized' }
        }

        const supabase = getAdminClient()
        await supabase.from('profiles').update({
            is_approved: true,
            status: 'approved'
        }).eq('id', userId)

        revalidatePath('/admin')
        revalidatePath('/admin/users')
        return { success: true, message: 'User berhasil disetujui' }
    } catch { return { success: false, message: 'Gagal memproses' } }
}

export async function banUser(userId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return { success: false, message: 'Unauthorized' }
        }

        const supabase = getAdminClient()
        await supabase.from('profiles').update({
            is_approved: false,
            status: 'rejected'
        }).eq('id', userId)

        revalidatePath('/admin')
        revalidatePath('/admin/users')
        return { success: true, message: 'User berhasil ditolak/banned' }
    } catch { return { success: false, message: 'Gagal memproses' } }
}

// ----------------------------------------------------------------------------
// 4. ACTION: CHANGE ROLE (Super Admin Only)
// ----------------------------------------------------------------------------
export async function changeUserRole(
    userId: string,
    newRole: 'member' | 'admin' | 'super_admin'
): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'super_admin') {
            return { success: false, message: 'Hanya Super Admin yang bisa mengubah role' }
        }

        const supabase = getAdminClient()
        await supabase.from('profiles').update({ role: newRole }).eq('id', userId)

        revalidatePath('/admin/users')
        return { success: true, message: `Role diubah menjadi ${newRole}` }
    } catch { return { success: false, message: 'Gagal mengubah role' } }
}

// ----------------------------------------------------------------------------
// 5. ACTION: DELETE USER (Super Admin Only)
// ----------------------------------------------------------------------------
export async function deleteUser(userId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'super_admin') {
            return { success: false, message: 'Hanya Super Admin yang bisa menghapus user' }
        }

        const supabase = getAdminClient()

        // Hapus dari tabel profiles (Cascade akan menghapus foto & data lain)
        const { error } = await supabase.from('profiles').delete().eq('id', userId)
        if (error) throw error

        revalidatePath('/admin/users')
        return { success: true, message: 'User berhasil dihapus permanen' }
    } catch { return { success: false, message: 'Gagal menghapus user' } }
}

// ----------------------------------------------------------------------------
// 6. STATISTICS
// ----------------------------------------------------------------------------
export async function getUserStatistics() {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super_admin'].includes(user.role)) return { success: false, message: 'Unauthorized' }

        const supabase = getAdminClient()

        // Gunakan Promise.all untuk performa
        const [users, pending, photos, storage] = await Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('photos').select('*', { count: 'exact', head: true }).eq('is_deleted', false),
            supabase.from('photos').select('file_size').eq('is_deleted', false)
        ])

        const totalStorage = storage.data?.reduce((acc, curr) => acc + (curr.file_size || 0), 0) || 0

        return {
            success: true,
            message: 'Stats loaded',
            data: {
                totalUsers: users.count || 0,
                pendingApprovals: pending.count || 0,
                totalPhotos: photos.count || 0,
                totalStorage
            }
        }
    } catch { return { success: false, message: 'Error loading stats' } }
}