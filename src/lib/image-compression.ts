// ============================================================================
// IMAGE COMPRESSION UTILITY
// File: src/lib/image-compression.ts
// Deskripsi: Kompresi gambar di client-side sebelum upload
// ============================================================================

import imageCompression from 'browser-image-compression'
import { UPLOAD_CONFIG } from './constants'

// ============================================================================
// COMPRESSION OPTIONS
// ============================================================================

const DEFAULT_OPTIONS = {
    maxSizeMB: 1, // Maksimal ukuran file setelah kompresi (MB)
    maxWidthOrHeight: UPLOAD_CONFIG.COMPRESSION_MAX_WIDTH, // Maksimal dimensi
    useWebWorker: true, // Gunakan web worker untuk performa
    fileType: 'image/webp', // Convert ke WebP untuk ukuran lebih kecil
}

// ============================================================================
// COMPRESS IMAGE
// ============================================================================

export async function compressImage(file: File): Promise<File> {
    try {
        console.log(`🖼️ Compressing image: ${file.name}`)
        console.log(`📦 Original size: ${(file.size / 1024 / 1024).toFixed(2)} MB`)

        const compressedFile = await imageCompression(file, DEFAULT_OPTIONS)

        console.log(`✅ Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`)
        console.log(`📊 Compression ratio: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`)

        return compressedFile
    } catch (error) {
        console.error('❌ Compression error:', error)
        // Jika kompresi gagal, return file asli
        return file
    }
}

// ============================================================================
// BATCH COMPRESS (untuk multiple files)
// ============================================================================

export async function compressImages(files: File[]): Promise<File[]> {
    const compressionPromises = files.map(file => compressImage(file))
    return Promise.all(compressionPromises)
}

// ============================================================================
// VALIDATE IMAGE FILE
// ============================================================================

export function validateImageFile(file: File): {
    valid: boolean
    error?: string
} {
    // Check tipe file
    if (!UPLOAD_CONFIG.ALLOWED_TYPES.includes(file.type)) {
        return {
            valid: false,
            error: 'Tipe file tidak didukung. Gunakan JPG, PNG, atau WebP',
        }
    }

    // Check ukuran file
    if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
        return {
            valid: false,
            error: `Ukuran file terlalu besar. Maksimal ${UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB`,
        }
    }

    return { valid: true }
}

// ============================================================================
// GET IMAGE PREVIEW URL
// ============================================================================

export function getImagePreviewUrl(file: File): string {
    return URL.createObjectURL(file)
}

// ============================================================================
// REVOKE PREVIEW URL (untuk cleanup memory)
// ============================================================================

export function revokeImagePreviewUrl(url: string): void {
    URL.revokeObjectURL(url)
}