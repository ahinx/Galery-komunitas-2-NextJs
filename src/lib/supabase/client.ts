// ============================================================================
// SUPABASE CLIENT CONFIGURATION
// File: src/lib/supabase/client.ts
// Deskripsi: Konfigurasi client Supabase untuk browser & server
// ============================================================================

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ============================================================================
// ENVIRONMENT VARIABLES VALIDATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. ' +
        'Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah diset di .env.local'
    )
}

// ============================================================================
// BROWSER CLIENT (untuk Client Components)
// ============================================================================

export function createClient() {
    return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// ============================================================================
// SERVER CLIENT (untuk Server Components & Server Actions)
// ============================================================================

export async function createServerSupabaseClient() {
    const cookieStore = await cookies()

    return createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            get(name: string) {
                return cookieStore.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value, ...options })
                } catch (error) {
                    // Cookie sudah di-set di middleware atau SSR
                    // Error ini bisa diabaikan
                }
            },
            remove(name: string, options: CookieOptions) {
                try {
                    cookieStore.set({ name, value: '', ...options })
                } catch (error) {
                    // Error ini bisa diabaikan
                }
            },
        },
    })
}

// ============================================================================
// STORAGE HELPER
// ============================================================================

export const STORAGE_BUCKETS = {
    PHOTOS: 'photos',
} as const

/**
 * Helper untuk generate URL publik dari storage path
 */
export function getPublicUrl(bucket: string, path: string): string {
    const supabase = createClient()
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
}

/**
 * Helper untuk upload file ke storage
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File
): Promise<{ url: string; path: string } | null> {
    const supabase = createClient()

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (error) {
        console.error('Upload error:', error)
        return null
    }

    const publicUrl = getPublicUrl(bucket, data.path)

    return {
        url: publicUrl,
        path: data.path,
    }
}

/**
 * Helper untuk hapus file dari storage
 */
export async function deleteFile(
    bucket: string,
    path: string
): Promise<boolean> {
    const supabase = createClient()

    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
        console.error('Delete error:', error)
        return false
    }

    return true
}

// ============================================================================
// TYPE DEFINITIONS (untuk TypeScript)
// ============================================================================

export type UserRole = 'member' | 'admin' | 'super_admin'

export interface Profile {
    id: string
    full_name: string
    phone_number: string
    role: UserRole
    is_verified: boolean
    is_approved: boolean
    created_at: string
    updated_at: string
    last_login: string | null
}

export interface Photo {
    id: string
    user_id: string
    storage_path: string
    display_url: string
    file_name: string
    file_size: number
    mime_type: string
    is_deleted: boolean
    deleted_at: string | null
    deleted_by: string | null
    audit_metadata: AuditMetadata
    exif_data: ExifData
    created_at: string
    updated_at: string
    // Relasi
    profile?: Profile
}

export interface AuditMetadata {
    upload_ip?: string
    user_agent?: string
    geo_location?: {
        city?: string
        isp?: string
        country?: string
    }
    device_type?: string
    screen_resolution?: string
    captured_at?: string
}

export interface ExifData {
    camera_model?: string
    date_taken?: string
    gps_latitude?: number
    gps_longitude?: number
    iso?: number
    aperture?: string
    focal_length?: string
    [key: string]: any // EXIF data bisa bervariasi
}

export interface OtpCode {
    id: string
    phone_number: string
    otp_code: string
    is_used: boolean
    expires_at: string
    created_at: string
    used_at: string | null
    attempt_count: number
}