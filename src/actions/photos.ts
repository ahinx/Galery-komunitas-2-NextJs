// ============================================================================
// PHOTO SERVER ACTIONS (FINAL - COMPATIBLE WITH EXISTING AUTH)
// File: src/actions/photos.ts
// Deskripsi: Upload, Manage, & Bulk Operations dengan Audit Trail & Security
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

// ============================================================================
// ADMIN CLIENT (sama seperti di auth.ts)
// ============================================================================

function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('FATAL: SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.local')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
}

// ============================================================================
// HELPER: SILENT AUDIT METADATA (IP & DEVICE TRACKING)
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
// ACTION: UPLOAD PHOTO
// ============================================================================

export async function uploadPhoto(formData: FormData): Promise<{ success: boolean; message: string; data?: any }> {
    console.log("🚀 [UPLOAD START] Memulai proses upload...")

    try {
        // 1. Cek User & Approval
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        if (!user.is_approved) return { success: false, message: ERROR_MESSAGES.NOT_APPROVED }

        console.log(`👤 [USER] ID: ${user.id} | Role: ${user.role}`)

        // 2. Ambil File
        const file = formData.get('file') as File
        if (!file) return { success: false, message: 'File tidak ditemukan' }

        // 3. Persiapan Path & Metadata - Gunakan Admin Client untuk bypass RLS
        const supabaseAdmin = getAdminClient()
        const timestamp = Date.now()
        const randomStr = Math.random().toString(36).substring(7)
        const fileName = `${timestamp}-${randomStr}.webp`
        const storagePath = `${user.id}/${fileName}`

        console.log(`📍 [STORAGE PATH] Target: ${storagePath}`)

        // 4. Eksekusi Upload ke Storage
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(STORAGE_BUCKETS.PHOTOS)
            .upload(storagePath, file, {
                contentType: 'image/webp',
                cacheControl: '31536000',
                upsert: false
            })

        if (uploadError) {
            console.error("❌ [STORAGE ERROR]", uploadError)
            return { success: false, message: `Gagal Upload Storage: ${uploadError.message}` }
        }

        // 5. Simpan ke Database
        const displayUrl = getPublicUrl(STORAGE_BUCKETS.PHOTOS, uploadData.path)
        const auditData = await getAuditMetadata()

        const exifRaw = formData.get('exifData') as string
        const exifData = exifRaw ? JSON.parse(exifRaw) : {}

        const { data: photo, error: dbError } = await supabaseAdmin
            .from('photos')
            .insert({
                user_id: user.id,
                storage_path: uploadData.path,
                display_url: displayUrl,
                file_name: file.name,
                file_size: file.size,
                mime_type: 'image/webp',
                audit_metadata: auditData,
                exif_data: exifData,
                is_deleted: false,
            })
            .select()
            .single()

        if (dbError) {
            console.error("❌ [DB ERROR]", dbError)
            await supabaseAdmin.storage.from(STORAGE_BUCKETS.PHOTOS).remove([uploadData.path])
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
// ACTION: GET PHOTOS (FILTER & SEARCH) - ENHANCED
// ============================================================================

export async function getPhotos(options: {
    userId?: string
    includeDeleted?: boolean
    limit?: number
    offset?: number
    searchQuery?: string
} = {}): Promise<ActionResult<{ photos: Photo[]; total: number }>> {

    console.log("🔍 [GET PHOTOS] Memulai request...")

    try {
        const user = await getCurrentUser()

        if (!user) {
            console.error("❌ [GET PHOTOS] User tidak ditemukan (Unauthorized)")
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        console.log(`👤 [GET PHOTOS] User: ${user.full_name} (${user.role})`)

        // Gunakan Admin Client untuk bypass RLS
        const supabaseAdmin = getAdminClient()
        const { userId, includeDeleted = false, limit = 50, offset = 0, searchQuery = '' } = options

        // Base query dengan relasi ke profiles
        let query = supabaseAdmin
            .from('photos')
            .select('*, profile:profiles!photos_user_id_fkey(*)', { count: 'exact' })

        // Filter Kepemilikan
        if (user.role === 'member') {
            // Member hanya lihat foto sendiri
            query = query.eq('user_id', user.id)
        } else if (userId) {
            // Admin filter by specific user
            query = query.eq('user_id', userId)
        }
        // Admin/Super Admin tanpa userId = lihat semua

        // Filter Trash / Deleted
        if (!includeDeleted) {
            query = query.eq('is_deleted', false)
        }

        // Search by file_name
        if (searchQuery && searchQuery.trim()) {
            const search = searchQuery.trim()
            query = query.ilike('file_name', `%${search}%`)
        }

        // Pagination & Order
        query = query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        const { data: photos, error, count } = await query

        if (error) {
            console.error("❌ [GET PHOTOS] DB Error:", error)
            throw error
        }

        // Post-filter untuk search uploader name
        let filteredPhotos = photos as Photo[]

        if (searchQuery && searchQuery.trim() && photos) {
            const search = searchQuery.trim().toLowerCase()

            filteredPhotos = photos.filter(photo => {
                const fileNameMatch = photo.file_name?.toLowerCase().includes(search)
                const uploaderMatch = photo.profile?.full_name?.toLowerCase().includes(search)
                return fileNameMatch || uploaderMatch
            })
        }

        console.log(`✅ [GET PHOTOS] Berhasil ambil ${filteredPhotos.length} foto`)

        return {
            success: true,
            message: 'Data fetched',
            data: {
                photos: filteredPhotos,
                total: count || filteredPhotos.length
            }
        }

    } catch (err) {
        console.error("💥 [GET PHOTOS] Error:", err)
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: SINGLE SOFT DELETE
// ============================================================================

export async function softDeletePhoto(photoId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }

        const supabaseAdmin = getAdminClient()

        // Validasi Kepemilikan (Member tidak boleh hapus punya orang lain)
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
// ACTION: BULK SOFT DELETE (PENGHAPUSAN MASSAL)
// ============================================================================

export async function bulkSoftDelete(photoIds: string[]): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }

        const supabaseAdmin = getAdminClient()

        // Jika member, pastikan SEMUA foto adalah miliknya
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
        return { success: true, message: `${photoIds.length} foto berhasil dipindahkan ke sampah.` }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: RESTORE PHOTO (Admin Only)
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
// ACTION: BULK RESTORE (Admin Only)
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
        return { success: true, message: `${photoIds.length} foto berhasil dipulihkan.` }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: PERMANENT DELETE (Super Admin Only)
// ============================================================================

export async function permanentDeletePhoto(photoId: string): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'super_admin') {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabaseAdmin = getAdminClient()

        // 1. Ambil path storage sebelum hapus record DB
        const { data: photo } = await supabaseAdmin
            .from('photos')
            .select('storage_path')
            .eq('id', photoId)
            .single()

        if (photo?.storage_path) {
            await supabaseAdmin.storage.from(STORAGE_BUCKETS.PHOTOS).remove([photo.storage_path])
        }

        // 2. Hapus record DB
        const { error } = await supabaseAdmin.from('photos').delete().eq('id', photoId)

        if (error) throw error
        return { success: true, message: 'Foto dihapus permanen dari server.' }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: BULK PERMANENT DELETE (Super Admin Only)
// ============================================================================

export async function bulkPermanentDelete(photoIds: string[]): Promise<ActionResult> {
    try {
        const user = await getCurrentUser()
        if (!user || user.role !== 'super_admin') {
            return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }
        }

        const supabaseAdmin = getAdminClient()

        // 1. Ambil semua path storage
        const { data: photos } = await supabaseAdmin
            .from('photos')
            .select('storage_path')
            .in('id', photoIds)

        if (photos && photos.length > 0) {
            const paths = photos.map(p => p.storage_path)
            await supabaseAdmin.storage.from(STORAGE_BUCKETS.PHOTOS).remove(paths)
        }

        // 2. Hapus record DB massal
        const { error } = await supabaseAdmin.from('photos').delete().in('id', photoIds)

        if (error) throw error
        return { success: true, message: `${photoIds.length} foto telah dimusnahkan permanen.` }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}

// ============================================================================
// ACTION: GET PHOTO STATS (untuk Dashboard)
// ============================================================================

export async function getPhotoStats(): Promise<ActionResult<{
    total: number
    thisMonth: number
    totalSize: number
}>> {
    try {
        const user = await getCurrentUser()
        if (!user) return { success: false, message: ERROR_MESSAGES.UNAUTHORIZED }

        const supabaseAdmin = getAdminClient()

        // Query berdasarkan role
        let query = supabaseAdmin
            .from('photos')
            .select('file_size, created_at')
            .eq('is_deleted', false)

        if (user.role === 'member') {
            query = query.eq('user_id', user.id)
        }

        const { data: photos, error } = await query

        if (error) throw error

        // Hitung stats
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        const total = photos?.length || 0
        const thisMonth = photos?.filter(p => new Date(p.created_at) >= firstDayOfMonth).length || 0
        const totalSize = photos?.reduce((sum, p) => sum + (p.file_size || 0), 0) || 0

        return {
            success: true,
            message: 'Stats fetched',
            data: { total, thisMonth, totalSize }
        }
    } catch {
        return { success: false, message: ERROR_MESSAGES.SERVER_ERROR }
    }
}