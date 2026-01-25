// ============================================================================
// ADMIN SERVER ACTIONS
// File: src/actions/admin.ts
// Deskripsi: Server actions untuk admin management
// ============================================================================

'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import { getCurrentUser } from './auth'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants'
import type { Profile } from '@/lib/supabase/client'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ActionResult<T = void> = {
    success: boolean
    message: string
    data?: T
}

// ============================================================================
// ACTION: GET ALL USERS
// ============================================================================

export async function getAllUsers(): Promise<ActionResult<{ users: Profile[] }>> {
    try {
        const user = await getCurrentUser()

        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()

        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching users:', error)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: 'Users fetched successfully',
            data: {
                users: users as Profile[],
            },
        }
    } catch (error) {
        console.error('Error in getAllUsers:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: GET PENDING APPROVALS
// ============================================================================

export async function getPendingApprovals(): Promise<ActionResult<{ users: Profile[] }>> {
    try {
        const user = await getCurrentUser()

        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()

        const { data: users, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('is_verified', true)
            .eq('is_approved', false)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching pending approvals:', error)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: 'Pending approvals fetched successfully',
            data: {
                users: users as Profile[],
            },
        }
    } catch (error) {
        console.error('Error in getPendingApprovals:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: APPROVE USER
// ============================================================================

export async function approveUser(userId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()

        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()

        const { error } = await supabase
            .from('profiles')
            .update({
                is_approved: true,
            })
            .eq('id', userId)

        if (error) {
            console.error('Error approving user:', error)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        // TODO: Kirim notifikasi WhatsApp ke user bahwa akun sudah diapprove
        // const { data: profile } = await supabase
        //   .from('profiles')
        //   .select('phone_number, full_name')
        //   .eq('id', userId)
        //   .single()
        //
        // if (profile) {
        //   await sendWhatsAppNotification(profile.phone_number, 
        //     `Selamat ${profile.full_name}! Akun Anda telah disetujui. Silakan login kembali.`)
        // }

        return {
            success: true,
            message: SUCCESS_MESSAGES.APPROVAL_SUCCESS,
        }
    } catch (error) {
        console.error('Error in approveUser:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: REJECT/BAN USER
// ============================================================================

export async function banUser(userId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()

        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()

        // Set approved ke false untuk ban user
        const { error } = await supabase
            .from('profiles')
            .update({
                is_approved: false,
            })
            .eq('id', userId)

        if (error) {
            console.error('Error banning user:', error)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: SUCCESS_MESSAGES.BAN_SUCCESS,
        }
    } catch (error) {
        console.error('Error in banUser:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: CHANGE USER ROLE (Super Admin only)
// ============================================================================

export async function changeUserRole(
    userId: string,
    newRole: 'member' | 'admin' | 'super_admin'
): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()

        if (!user || user.role !== 'super_admin') {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()

        const { error } = await supabase
            .from('profiles')
            .update({
                role: newRole,
            })
            .eq('id', userId)

        if (error) {
            console.error('Error changing user role:', error)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: `Role berhasil diubah menjadi ${newRole}`,
        }
    } catch (error) {
        console.error('Error in changeUserRole:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: GET USER STATISTICS
// ============================================================================

export async function getUserStatistics(): Promise<ActionResult<{
    totalUsers: number
    pendingApprovals: number
    totalPhotos: number
    totalStorage: number
}>> {
    try {
        const user = await getCurrentUser()

        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()

        // Get total users
        const { count: totalUsers } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        // Get pending approvals
        const { count: pendingApprovals } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('is_verified', true)
            .eq('is_approved', false)

        // Get total photos
        const { count: totalPhotos } = await supabase
            .from('photos')
            .select('*', { count: 'exact', head: true })
            .eq('is_deleted', false)

        // Get total storage (sum of file sizes)
        const { data: photos } = await supabase
            .from('photos')
            .select('file_size')
            .eq('is_deleted', false)

        const totalStorage = photos?.reduce((sum, p) => sum + p.file_size, 0) || 0

        return {
            success: true,
            message: 'Statistics fetched successfully',
            data: {
                totalUsers: totalUsers || 0,
                pendingApprovals: pendingApprovals || 0,
                totalPhotos: totalPhotos || 0,
                totalStorage,
            },
        }
    } catch (error) {
        console.error('Error in getUserStatistics:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}