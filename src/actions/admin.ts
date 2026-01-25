// ============================================================================
// ADMIN SERVER ACTIONS (User Management Only)
// File: src/actions/admin.ts
// Deskripsi: Actions untuk manajemen user (Approve, Ban, Role, Stats)
// ============================================================================

'use server'

import { createServiceRoleClient } from '@/lib/supabase/client'
import { getCurrentUser } from './auth'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants'
import { revalidatePath } from 'next/cache'
import type { Profile } from '@/lib/supabase/client'

type ActionResult<T = void> = {
    success: boolean
    message: string
    data?: T
}

// Helper: Cek hak akses admin
async function checkAdminAccess() {
    const user = await getCurrentUser()
    if (!user || !['admin', 'super_admin'].includes(user.role)) {
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED)
    }
    return user
}

// ============================================================================
// 1. GET ALL USERS (Untuk halaman /admin/users)
// ============================================================================
export async function getAllUsers(): Promise<ActionResult<{ users: Profile[] }>> {
    try {
        await checkAdminAccess()

        // PENTING: Gunakan Service Role Client untuk bypass RLS
        const supabase = await createServiceRoleClient()

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error("DB Error getAllUsers:", error)
            throw error
        }

        return { success: true, message: 'Data fetched', data: { users: data as Profile[] } }
    } catch (error: any) {
        console.error("Error getAllUsers:", error)
        return { success: false, message: error.message }
    }
}

// ============================================================================
// 2. GET PENDING USERS (Untuk Dashboard Admin) - Dulu: getPendingApprovals
// ============================================================================
export async function getPendingUsers(): Promise<ActionResult<Profile[]>> {
    try {
        await checkAdminAccess()
        const supabase = await createServiceRoleClient()

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_approved', false)
            .order('created_at', { ascending: false })

        if (error) throw error

        return { success: true, message: 'Data fetched', data: data as Profile[] }
    } catch (error: any) {
        console.error('Error getPendingUsers:', error)
        return { success: false, message: error.message }
    }
}

// ============================================================================
// 3. APPROVE USER
// ============================================================================
export async function approveUser(userId: string): Promise<ActionResult> {
    try {
        await checkAdminAccess()
        const supabase = await createServiceRoleClient()

        const { error } = await supabase
            .from('profiles')
            .update({
                is_approved: true,
                status: 'approved'
            })
            .eq('id', userId)

        if (error) throw error

        revalidatePath('/admin')
        revalidatePath('/admin/users')

        return { success: true, message: SUCCESS_MESSAGES.APPROVAL_SUCCESS }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

// ============================================================================
// 4. BAN / REJECT USER
// ============================================================================
export async function banUser(userId: string): Promise<ActionResult> {
    try {
        await checkAdminAccess()
        const supabase = await createServiceRoleClient()

        const { error } = await supabase
            .from('profiles')
            .update({
                is_approved: false,
                status: 'rejected'
            })
            .eq('id', userId)

        if (error) throw error

        revalidatePath('/admin')
        revalidatePath('/admin/users')

        return { success: true, message: SUCCESS_MESSAGES.BAN_SUCCESS }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

// ============================================================================
// 5. CHANGE ROLE (Super Admin Only)
// ============================================================================
export async function changeUserRole(
    userId: string,
    newRole: 'member' | 'admin' | 'super_admin'
): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'super_admin') {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabase = await createServiceRoleClient()

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', userId)

        if (error) throw error

        revalidatePath('/admin/users')
        return { success: true, message: `Role user diubah menjadi ${newRole}` }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}

// ============================================================================
// 6. DELETE USER (Super Admin Only)
// ============================================================================
export async function deleteUser(userId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'super_admin') {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabase = await createServiceRoleClient()

        // Hapus Auth User (Cascade ke profiles & photos)
        const { error } = await supabase.auth.admin.deleteUser(userId)

        if (error) throw error

        revalidatePath('/admin/users')
        return { success: true, message: 'User dihapus permanen.' }
    } catch (error: any) {
        return { success: false, message: error.message }
    }
}