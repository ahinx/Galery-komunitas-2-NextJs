// ============================================================================
// PHOTO SERVER ACTIONS
// File: src/actions/photos.ts
// Deskripsi: Server actions untuk upload, delete, dan manage photos
// ============================================================================

'use server'

import { createServerSupabaseClient, getPublicUrl, STORAGE_BUCKETS } from '@/lib/supabase/client'
import { getCurrentUser } from './auth'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants'
import { cookies } from 'next/headers'
import type { Photo } from '@/lib/supabase/client'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ActionResult<T = void> = {
    success: boolean
    message: string
    data?: T
}

// ============================================================================
// HELPER: CAPTURE METADATA SILUMAN
// ============================================================================

async function captureUploadMetadata() {
    const { headers } = await import('next/headers')
    const headersList = await headers()

    const ip = headersList.get('x-forwarded-for') ||
        headersList.get('x-real-ip') ||
        'unknown'

    const userAgent = headersList.get('user-agent') || 'unknown'

    // Deteksi device type dari user agent
    let deviceType = 'Desktop'
    if (userAgent.toLowerCase().includes('mobile')) deviceType = 'Mobile'
    else if (userAgent.toLowerCase().includes('tablet')) deviceType = 'Tablet'

    return {
        upload_ip: ip.split(',')[0].trim(),
        user_agent: userAgent,
        device_type: deviceType,
        captured_at: new Date().toISOString(),
    }
}

// ============================================================================
// ACTION: UPLOAD PHOTO
// ============================================================================

export async function uploadPhoto(formData: FormData): Promise<ActionResult<{ photoId: string }>> {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        if (!user.is_approved) {
            return {
                success: false,
                message: ERROR_MESSAGES.NOT_APPROVED,
            }
        }

        const file = formData.get('file') as File
        const exifDataStr = formData.get('exifData') as string

        if (!file) {
            return {
                success: false,
                message: 'File tidak ditemukan',
            }
        }

        const supabase = await createServerSupabaseClient()

        // Generate unique filename
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const ext = file.name.split('.').pop()
        const fileName = `${timestamp}-${randomStr}.${ext}`
        const storagePath = `${user.id}/${fileName}`

        // Upload ke Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKETS.PHOTOS)
            .upload(storagePath, file, {
                cacheControl: '3600',
                upsert: false,
            })

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return {
                success: false,
                message: ERROR_MESSAGES.UPLOAD_FAILED,
            }
        }

        // Generate public URL
        const displayUrl = getPublicUrl(STORAGE_BUCKETS.PHOTOS, uploadData.path)

        // Capture audit metadata
        const auditMetadata = await captureUploadMetadata()

        // Parse EXIF data jika ada
        let exifData = {}
        try {
            if (exifDataStr) {
                exifData = JSON.parse(exifDataStr)
            }
        } catch (e) {
            console.error('Error parsing EXIF data:', e)
        }

        // Insert record ke database
        const { data: photo, error: dbError } = await supabase
            .from('photos')
            .insert({
                user_id: user.id,
                storage_path: uploadData.path,
                display_url: displayUrl,
                file_name: file.name,
                file_size: file.size,
                mime_type: file.type,
                audit_metadata: auditMetadata,
                exif_data: exifData,
                is_deleted: false,
            })
            .select()
            .single()

        if (dbError) {
            // Rollback: hapus file dari storage jika insert DB gagal
            await supabase.storage
                .from(STORAGE_BUCKETS.PHOTOS)
                .remove([uploadData.path])

            console.error('Database error:', dbError)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: SUCCESS_MESSAGES.UPLOAD_SUCCESS,
            data: {
                photoId: photo.id,
            },
        }
    } catch (error) {
        console.error('Error in uploadPhoto:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: GET PHOTOS (dengan filter & pagination)
// ============================================================================

export async function getPhotos(options: {
    userId?: string
    includeDeleted?: boolean
    limit?: number
    offset?: number
} = {}): Promise<ActionResult<{ photos: Photo[]; total: number }>> {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()
        const {
            userId,
            includeDeleted = false,
            limit = 24,
            offset = 0,
        } = options

        let query = supabase
            .from('photos')
            .select('*, profile:profiles(*)', { count: 'exact' })

        // Filter berdasarkan user role
        if (user.role === 'member') {
            query = query.eq('user_id', user.id)
        } else if (userId) {
            query = query.eq('user_id', userId)
        }

        // Filter soft-deleted
        if (!includeDeleted) {
            query = query.eq('is_deleted', false)
        }

        // Sorting & pagination
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        const { data: photos, error, count } = await query

        if (error) {
            console.error('Error fetching photos:', error)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: 'Photos fetched successfully',
            data: {
                photos: photos as Photo[],
                total: count || 0,
            },
        }
    } catch (error) {
        console.error('Error in getPhotos:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: SOFT DELETE PHOTO
// ============================================================================

export async function softDeletePhoto(photoId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()

        // Check ownership jika bukan admin
        if (user.role === 'member') {
            const { data: photo } = await supabase
                .from('photos')
                .select('user_id')
                .eq('id', photoId)
                .single()

            if (!photo || photo.user_id !== user.id) {
                return {
                    success: false,
                    message: ERROR_MESSAGES.UNAUTHORIZED,
                }
            }
        }

        // Soft delete
        const { error } = await supabase
            .from('photos')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
            })
            .eq('id', photoId)

        if (error) {
            console.error('Error soft deleting photo:', error)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: SUCCESS_MESSAGES.DELETE_SUCCESS,
        }
    } catch (error) {
        console.error('Error in softDeletePhoto:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: BULK SOFT DELETE
// ============================================================================

export async function bulkSoftDelete(photoIds: string[]): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()

        // Jika member, check ownership semua foto
        if (user.role === 'member') {
            const { data: photos } = await supabase
                .from('photos')
                .select('id, user_id')
                .in('id', photoIds)

            if (!photos || photos.some(p => p.user_id !== user.id)) {
                return {
                    success: false,
                    message: ERROR_MESSAGES.UNAUTHORIZED,
                }
            }
        }

        // Bulk soft delete
        const { error } = await supabase
            .from('photos')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: user.id,
            })
            .in('id', photoIds)

        if (error) {
            console.error('Error bulk soft deleting:', error)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: `${photoIds.length} foto berhasil dihapus`,
        }
    } catch (error) {
        console.error('Error in bulkSoftDelete:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: PERMANENT DELETE (Super Admin only)
// ============================================================================

export async function permanentDeletePhoto(photoId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()

        if (!user || user.role !== 'super_admin') {
            return {
                success: false,
                message: ERROR_MESSAGES.UNAUTHORIZED,
            }
        }

        const supabase = await createServerSupabaseClient()

        // Get photo data untuk hapus dari storage
        const { data: photo } = await supabase
            .from('photos')
            .select('storage_path')
            .eq('id', photoId)
            .single()

        if (!photo) {
            return {
                success: false,
                message: 'Foto tidak ditemukan',
            }
        }

        // Hapus dari storage
        const { error: storageError } = await supabase.storage
            .from(STORAGE_BUCKETS.PHOTOS)
            .remove([photo.storage_path])

        if (storageError) {
            console.error('Error deleting from storage:', storageError)
        }

        // Hapus dari database
        const { error: dbError } = await supabase
            .from('photos')
            .delete()
            .eq('id', photoId)

        if (dbError) {
            console.error('Error deleting from database:', dbError)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: 'Foto berhasil dihapus permanen',
        }
    } catch (error) {
        console.error('Error in permanentDeletePhoto:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}

// ============================================================================
// ACTION: RESTORE PHOTO
// ============================================================================

export async function restorePhoto(photoId: string): Promise<ActionResult> {
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
            .from('photos')
            .update({
                is_deleted: false,
                deleted_at: null,
                deleted_by: null,
            })
            .eq('id', photoId)

        if (error) {
            console.error('Error restoring photo:', error)
            return {
                success: false,
                message: ERROR_MESSAGES.SERVER_ERROR,
            }
        }

        return {
            success: true,
            message: 'Foto berhasil dipulihkan',
        }
    } catch (error) {
        console.error('Error in restorePhoto:', error)
        return {
            success: false,
            message: ERROR_MESSAGES.SERVER_ERROR,
        }
    }
}