// ============================================================================
// PHOTO SERVER ACTIONS - WITH THUMBNAIL SUPPORT
// File: src/actions/photos.ts
// Fitur: Upload original + thumbnail, RPC stats, cursor pagination
// ============================================================================

'use server'

import { createClient } from '@supabase/supabase-js'
import { getCurrentUser } from './auth'
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/lib/constants'
import { headers } from 'next/headers'
import type { Photo } from '@/lib/supabase/client'
import { getPublicUrl, STORAGE_BUCKETS } from '@/lib/supabase/client'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type ActionResult<T = void> = {
    success: boolean
    message: string
    data?: T
}

export interface PhotoStats {
    total: number
    thisMonth: number
    thisWeek?: number
    totalSize: number
}

export interface PhotoCursor {
    date: string
    id: string
}

export interface PaginatedPhotosResponse {
    photos: Photo[]
    hasMore: boolean
    nextCursor: PhotoCursor | null
}

// ============================================================================
// ADMIN CLIENT
// ============================================================================

function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('FATAL: SUPABASE_SERVICE_ROLE_KEY tidak ditemukan')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

// ============================================================================
// AUDIT METADATA
// ============================================================================

async function getAuditMetadata() {
    const headersList = await headers()
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    let deviceType = 'Desktop'
    const uaLower = userAgent.toLowerCase()
    if (uaLower.includes('mobile')) deviceType = 'Mobile'
    else if (uaLower.includes('tablet') || uaLower.includes('ipad')) deviceType = 'Tablet'

    return {
        ip_address: ip.split(',')[0].trim(),
        user_agent: userAgent,
        device_type: deviceType,
        upload_timestamp: new Date().toISOString(),
    }
}

// ============================================================================
// ACTION: UPLOAD PHOTO WITH THUMBNAIL
// ============================================================================

export async function uploadPhoto(formData: FormData): Promise<ActionResult<{ photoId: string }>> {
    console.log("🚀 [UPLOAD START]")

    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        if (!user.is_approved) return { success: false, message: ERROR_MESSAGES.NOT_APPROVED }

        // Get files from FormData
        const originalFile = formData.get('file') as File
        const thumbnailFile = formData.get('thumbnail') as File | null

        if (!originalFile) {
            return { success: false, message: 'File tidak ditemukan' }
        }

        const supabaseAdmin = getAdminClient()
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const fileName = `${timestamp}-${randomStr}.webp`

        // Storage paths
        const originalPath = `${user.id}/${fileName}`
        const thumbnailPath = thumbnailFile ? `${user.id}/thumbs/${fileName}` : null

        console.log(`📍 [PATHS] Original: ${originalPath}, Thumb: ${thumbnailPath}`)

        // Upload Original
        const { data: originalData, error: originalError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKETS.PHOTOS)
            .upload(originalPath, originalFile, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: false
            })

        if (originalError) {
            console.error("❌ [ORIGINAL UPLOAD ERROR]", originalError)
            return { success: false, message: `Gagal upload: ${originalError.message}` }
        }

        // Upload Thumbnail (jika ada)
        let thumbnailUrl: string | null = null
        if (thumbnailFile && thumbnailPath) {
            const { data: thumbData, error: thumbError } = await supabaseAdmin.storage
                .from(STORAGE_BUCKETS.PHOTOS)
                .upload(thumbnailPath, thumbnailFile, {
                    contentType: 'image/webp',
                    cacheControl: '31536000',
                    upsert: false
                })

            if (thumbError) {
                console.warn("⚠️ [THUMBNAIL UPLOAD WARNING]", thumbError)
                // Lanjutkan tanpa thumbnail, tidak fatal
            } else {
                thumbnailUrl = getPublicUrl(STORAGE_BUCKETS.PHOTOS, thumbData.path)
            }
        }

        // Get URLs
        const displayUrl = getPublicUrl(STORAGE_BUCKETS.PHOTOS, originalData.path)
        const auditData = await getAuditMetadata()

        // Parse EXIF data
        const exifRaw = formData.get('exifData') as string
        const exifData = exifRaw ? JSON.parse(exifRaw) : {}

        // Save to database
        const { data: photo, error: dbError } = await supabaseAdmin
            .from('photos')
            .insert({
                user_id: user.id,
                storage_path: originalData.path,
                display_url: displayUrl,
                thumbnail_url: thumbnailUrl,
                thumbnail_generated: !!thumbnailUrl,
                file_name: originalFile.name,
                file_size: originalFile.size,
                mime_type: 'image/webp',
                audit_metadata: auditData,
                exif_data: exifData,
                is_deleted: false,
            })
            .select()
            .single()

        if (dbError) {
            console.error("❌ [DB ERROR]", dbError)
            // Cleanup uploaded files
            await supabaseAdmin.storage.from(STORAGE_BUCKETS.PHOTOS).remove([originalData.path])
            if (thumbnailPath) {
                await supabaseAdmin.storage.from(STORAGE_BUCKETS.PHOTOS).remove([thumbnailPath])
            }
            return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
        }

        console.log("✅ [UPLOAD SUCCESS] Photo ID:", photo.id)

        return {
            success: true,
            message: SUCCESS_MESSAGES.UPLOAD_SUCCESS,
            data: { photoId: photo.id },
        }

    } catch (error: any) {
        console.error("💥 [CRITICAL ERROR]", error)
        return { success: false, message: error.message || ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: GET PHOTO STATS (RPC)
// ============================================================================

export async function getPhotoStats(): Promise<ActionResult<PhotoStats>> {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }

        const supabaseAdmin = getAdminClient()

        // Try RPC first
        const { data, error } = await supabaseAdmin.rpc('get_photo_stats')

        if (error) {
            console.warn("⚠️ [RPC FALLBACK]", error.message)
            // Fallback to manual query
            return await getPhotoStatsFallback()
        }

        return {
            success: true,
            message: 'Stats loaded',
            data: data as PhotoStats
        }
    } catch (err) {
        console.error('💥 [STATS ERROR]', err)
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

async function getPhotoStatsFallback(): Promise<ActionResult<PhotoStats>> {
    try {
        const supabaseAdmin = getAdminClient()
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const [totalRes, monthRes, sizeRes] = await Promise.all([
            supabaseAdmin
                .from('photos')
                .select('*', { count: 'exact', head: true })
                .eq('is_deleted', false),
            supabaseAdmin
                .from('photos')
                .select('*', { count: 'exact', head: true })
                .eq('is_deleted', false)
                .gte('created_at', firstDayOfMonth),
            supabaseAdmin
                .from('photos')
                .select('file_size')
                .eq('is_deleted', false)
        ])

        const totalSize = sizeRes.data?.reduce((sum, p) => sum + (p.file_size || 0), 0) || 0

        return {
            success: true,
            message: 'Stats loaded (fallback)',
            data: {
                total: totalRes.count || 0,
                thisMonth: monthRes.count || 0,
                totalSize
            }
        }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: GET PHOTOS WITH CURSOR PAGINATION
// ============================================================================

export async function getPhotosPaginated(options: {
    cursor?: PhotoCursor | null
    limit?: number
    userId?: string
    searchQuery?: string
} = {}): Promise<ActionResult<PaginatedPhotosResponse>> {

    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }

        const supabaseAdmin = getAdminClient()
        const { cursor, limit = 20, userId, searchQuery } = options

        // Try RPC first
        const { data, error } = await supabaseAdmin.rpc('get_photos_paginated', {
            p_cursor_date: cursor?.date || null,
            p_cursor_id: cursor?.id || null,
            p_limit: limit,
            p_user_id: userId || null,
            p_search: searchQuery || null
        })

        if (error) {
            console.warn("⚠️ [PAGINATED RPC FALLBACK]", error.message)
            return await getPhotosPaginatedFallback(options)
        }

        return {
            success: true,
            message: 'Photos loaded',
            data: data as PaginatedPhotosResponse
        }

    } catch (err) {
        console.error("💥 [GET PHOTOS ERROR]", err)
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

async function getPhotosPaginatedFallback(options: {
    cursor?: PhotoCursor | null
    limit?: number
    userId?: string
    searchQuery?: string
} = {}): Promise<ActionResult<PaginatedPhotosResponse>> {

    try {
        const supabaseAdmin = getAdminClient()
        const { cursor, limit = 20, userId, searchQuery } = options

        let query = supabaseAdmin
            .from('photos')
            .select('*, profile:profiles!photos_user_id_fkey(*)')
            .eq('is_deleted', false)
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(limit + 1)

        if (userId) query = query.eq('user_id', userId)

        if (searchQuery?.trim()) {
            query = query.or(`file_name.ilike.%${searchQuery}%,exif_data->>camera_model.ilike.%${searchQuery}%`)
        }

        if (cursor) {
            query = query.or(`created_at.lt.${cursor.date},and(created_at.eq.${cursor.date},id.lt.${cursor.id})`)
        }

        const { data: photos, error } = await query

        if (error) throw error

        const hasMore = photos ? photos.length > limit : false
        const resultPhotos = photos?.slice(0, limit) || []

        const nextCursor = hasMore && resultPhotos.length > 0
            ? {
                date: resultPhotos[resultPhotos.length - 1].created_at,
                id: resultPhotos[resultPhotos.length - 1].id
            }
            : null

        return {
            success: true,
            message: 'Photos loaded (fallback)',
            data: { photos: resultPhotos as Photo[], hasMore, nextCursor }
        }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: GET PHOTOS (LEGACY)
// ============================================================================

export async function getPhotos(options: {
    userId?: string
    includeDeleted?: boolean
    limit?: number
    offset?: number
    searchQuery?: string
} = {}): Promise<ActionResult<{ photos: Photo[]; total: number }>> {

    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }

        const supabaseAdmin = getAdminClient()
        const { userId, includeDeleted = false, limit = 50, offset = 0, searchQuery = '' } = options

        let query = supabaseAdmin
            .from('photos')
            .select('*, profile:profiles!photos_user_id_fkey(*)', { count: 'exact' })

        if (userId) query = query.eq('user_id', userId)
        if (!includeDeleted) query = query.eq('is_deleted', false)

        if (searchQuery?.trim()) {
            query = query.or(`file_name.ilike.%${searchQuery}%,exif_data->>camera_model.ilike.%${searchQuery}%`)
        }

        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        const { data: photos, error, count } = await query

        if (error) throw error

        return {
            success: true,
            message: 'Data fetched',
            data: { photos: (photos || []) as Photo[], total: count || 0 }
        }

    } catch (err) {
        console.error("💥 [GET PHOTOS ERROR]", err)
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: SOFT DELETE
// ============================================================================

export async function softDeletePhoto(photoId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }

        const supabaseAdmin = getAdminClient()

        if (user.role === 'member') {
            const { data: photo } = await supabaseAdmin
                .from('photos')
                .select('user_id')
                .eq('id', photoId)
                .single()

            if (!photo || photo.user_id !== user.id) {
                return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
            }
        }

        const { error } = await supabaseAdmin
            .from('photos')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: user.id
            })
            .eq('id', photoId)

        if (error) throw error
        return { success: true, message: SUCCESS_MESSAGES.DELETE_SUCCESS }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: BULK SOFT DELETE
// ============================================================================

export async function bulkSoftDelete(photoIds: string[]): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }

        const supabaseAdmin = getAdminClient()

        if (user.role === 'member') {
            const { data: photos } = await supabaseAdmin
                .from('photos')
                .select('id, user_id')
                .in('id', photoIds)

            if (!photos || photos.some(p => p.user_id !== user.id)) {
                return { success: false, message: "Anda mencoba menghapus foto yang bukan milik Anda." }
            }
        }

        const { error } = await supabaseAdmin
            .from('photos')
            .update({
                is_deleted: true,
                deleted_at: new Date().toISOString(),
                deleted_by: user.id
            })
            .in('id', photoIds)

        if (error) throw error
        return { success: true, message: `${photoIds.length} foto dipindahkan ke sampah.` }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: RESTORE (Admin)
// ============================================================================

export async function restorePhoto(photoId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabaseAdmin = getAdminClient()

        const { error } = await supabaseAdmin
            .from('photos')
            .update({ is_deleted: false, deleted_at: null, deleted_by: null })
            .eq('id', photoId)

        if (error) throw error
        return { success: true, message: 'Foto berhasil dipulihkan' }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: BULK RESTORE (Admin)
// ============================================================================

export async function bulkRestore(photoIds: string[]): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabaseAdmin = getAdminClient()

        const { error } = await supabaseAdmin
            .from('photos')
            .update({ is_deleted: false, deleted_at: null, deleted_by: null })
            .in('id', photoIds)

        if (error) throw error
        return { success: true, message: `${photoIds.length} foto dipulihkan.` }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: PERMANENT DELETE (Super Admin)
// ============================================================================

export async function permanentDeletePhoto(photoId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'super_admin') {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabaseAdmin = getAdminClient()

        // Get paths
        const { data: photo } = await supabaseAdmin
            .from('photos')
            .select('storage_path, thumbnail_url')
            .eq('id', photoId)
            .single()

        if (photo) {
            const pathsToDelete = [photo.storage_path]

            // Extract thumbnail path from URL if exists
            if (photo.thumbnail_url) {
                const thumbPath = photo.thumbnail_url.split('/photos/')[1]
                if (thumbPath) pathsToDelete.push(thumbPath)
            }

            await supabaseAdmin.storage.from(STORAGE_BUCKETS.PHOTOS).remove(pathsToDelete)
        }

        const { error } = await supabaseAdmin.from('photos').delete().eq('id', photoId)

        if (error) throw error
        return { success: true, message: 'Foto dihapus permanen.' }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: BULK PERMANENT DELETE (Super Admin)
// ============================================================================

export async function bulkPermanentDelete(photoIds: string[]): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'super_admin') {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabaseAdmin = getAdminClient()

        // Get all paths
        const { data: photos } = await supabaseAdmin
            .from('photos')
            .select('storage_path, thumbnail_url')
            .in('id', photoIds)

        if (photos && photos.length > 0) {
            const pathsToDelete: string[] = []

            photos.forEach(p => {
                pathsToDelete.push(p.storage_path)
                if (p.thumbnail_url) {
                    const thumbPath = p.thumbnail_url.split('/photos/')[1]
                    if (thumbPath) pathsToDelete.push(thumbPath)
                }
            })

            await supabaseAdmin.storage.from(STORAGE_BUCKETS.PHOTOS).remove(pathsToDelete)
        }

        const { error } = await supabaseAdmin.from('photos').delete().in('id', photoIds)

        if (error) throw error
        return { success: true, message: `${photoIds.length} foto dimusnahkan.` }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: UPDATE THUMBNAIL (untuk migration)
// ============================================================================

export async function updatePhotoThumbnail(
    photoId: string,
    thumbnailUrl: string
): Promise<ActionResult> {
    try {
        const supabaseAdmin = getAdminClient()

        const { error } = await supabaseAdmin
            .from('photos')
            .update({
                thumbnail_url: thumbnailUrl,
                thumbnail_generated: true
            })
            .eq('id', photoId)

        if (error) throw error
        return { success: true, message: 'Thumbnail updated' }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}