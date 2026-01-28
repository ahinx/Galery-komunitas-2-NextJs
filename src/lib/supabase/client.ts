// ============================================================================
// SUPABASE CLIENT CONFIGURATION - WITH THUMBNAIL SUPPORT
// File: src/lib/supabase/client.ts
// Update: Tambah thumbnail_url di Photo type
// ============================================================================

import { createBrowserClient } from '@supabase/ssr'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function validateEnvVars() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        throw new Error(
            'Missing Supabase environment variables. ' +
            'Pastikan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah diset.'
        )
    }
}

// ============================================================================
// BROWSER CLIENT
// ============================================================================

export function createClient() {
    validateEnvVars()
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}

// ============================================================================
// SERVER CLIENT
// ============================================================================

export async function createServerSupabaseClient() {
    validateEnvVars()
    const cookieStore = await cookies()

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value, ...options })
                    } catch (error) { }
                },
                remove(name: string, options: CookieOptions) {
                    try {
                        cookieStore.set({ name, value: '', ...options })
                    } catch (error) { }
                },
            },
        }
    )
}

// ============================================================================
// SERVICE ROLE CLIENT
// ============================================================================

export async function createServiceRoleClient() {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Missing Supabase service role environment variables.')
    }

    const { createClient } = await import('@supabase/supabase-js')
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        { auth: { persistSession: false } }
    )
}

// ============================================================================
// STORAGE HELPER
// ============================================================================

export const STORAGE_BUCKETS = {
    PHOTOS: 'photos',
} as const

export function getPublicUrl(bucket: string, path: string): string {
    const supabase = createClient()
    const { data } = supabase.storage.from(bucket).getPublicUrl(path)
    return data.publicUrl
}

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
// TYPE DEFINITIONS
// ============================================================================

export type UserRole = 'member' | 'admin' | 'super_admin'

export interface Profile {
    id: string
    full_name: string
    phone_number: string
    avatar_url?: string
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
    thumbnail_url: string | null  // ← BARU: URL thumbnail
    thumbnail_generated: boolean  // ← BARU: Flag status
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
    [key: string]: any
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