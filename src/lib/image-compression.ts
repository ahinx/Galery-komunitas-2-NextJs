// ============================================================================
// IMAGE COMPRESSION & THUMBNAIL SERVICE
// File: src/lib/image-compression.ts
// Fitur: Compress original + Generate thumbnail dalam satu flow
// ============================================================================

import imageCompression from 'browser-image-compression'

// ============================================================================
// CONFIGURATION
// ============================================================================

// Original image settings (untuk preview/download)
const ORIGINAL_OPTIONS = {
    maxSizeMB: 1,           // Target ~1MB
    maxWidthOrHeight: 1920, // Full HD
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.85
}

// Thumbnail settings (untuk gallery grid)
const THUMBNAIL_OPTIONS = {
    maxSizeMB: 0.05,        // Target ~50KB
    maxWidthOrHeight: 400,  // Thumbnail size
    useWebWorker: true,
    fileType: 'image/webp' as const,
    initialQuality: 0.7
}

// ============================================================================
// TYPES
// ============================================================================

export interface ProcessedImage {
    original: File
    thumbnail: File
    originalSize: number
    thumbnailSize: number
}

// ============================================================================
// 1. PROCESS IMAGE (Original + Thumbnail)
// ============================================================================

/**
 * Memproses gambar: compress original + generate thumbnail
 * Returns kedua file untuk di-upload bersamaan
 */
export async function processImageWithThumbnail(file: File): Promise<ProcessedImage> {
    if (!isValidImage(file)) {
        throw new Error('File bukan gambar yang valid')
    }

    try {
        // Jalankan kompresi paralel untuk performa
        const [compressedOriginal, thumbnail] = await Promise.all([
            compressImage(file, ORIGINAL_OPTIONS),
            compressImage(file, THUMBNAIL_OPTIONS)
        ])

        // Rename files
        const baseName = file.name.replace(/\.[^/.]+$/, "")

        const originalFile = new File(
            [compressedOriginal],
            `${baseName}.webp`,
            { type: 'image/webp', lastModified: Date.now() }
        )

        const thumbnailFile = new File(
            [thumbnail],
            `${baseName}_thumb.webp`,
            { type: 'image/webp', lastModified: Date.now() }
        )

        return {
            original: originalFile,
            thumbnail: thumbnailFile,
            originalSize: originalFile.size,
            thumbnailSize: thumbnailFile.size
        }
    } catch (error) {
        console.error("Image processing failed:", error)
        throw error
    }
}

// ============================================================================
// 2. COMPRESS SINGLE IMAGE (Internal helper)
// ============================================================================

async function compressImage(
    file: File,
    options: typeof ORIGINAL_OPTIONS | typeof THUMBNAIL_OPTIONS
): Promise<Blob> {
    try {
        return await imageCompression(file, options)
    } catch (error) {
        console.error("Compression failed:", error)
        // Fallback: return original jika gagal
        return file
    }
}

// ============================================================================
// 3. LEGACY: COMPRESS ONLY (untuk backward compatibility)
// ============================================================================

/**
 * @deprecated Use processImageWithThumbnail instead
 * Kept for backward compatibility
 */
export async function compressImageOnly(file: File): Promise<File> {
    if (!isValidImage(file)) {
        throw new Error('File bukan gambar yang valid')
    }

    try {
        const compressedBlob = await imageCompression(file, ORIGINAL_OPTIONS)
        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"

        return new File([compressedBlob], newFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
        })
    } catch (error) {
        console.error("Compression failed:", error)
        return file
    }
}

// Alias for backward compatibility
export const compressImage_legacy = compressImageOnly

// ============================================================================
// 4. BATCH PROCESS (Multiple files)
// ============================================================================

export async function processImagesWithThumbnails(
    files: File[]
): Promise<ProcessedImage[]> {
    const results = await Promise.all(
        files.map(file => processImageWithThumbnail(file))
    )
    return results
}

// ============================================================================
// 5. GENERATE THUMBNAIL ONLY (untuk existing photos)
// ============================================================================

/**
 * Generate thumbnail dari URL gambar existing
 * Digunakan untuk migration foto lama
 */
export async function generateThumbnailFromUrl(imageUrl: string): Promise<Blob | null> {
    try {
        // Fetch image
        const response = await fetch(imageUrl)
        const blob = await response.blob()

        // Convert to File untuk processing
        const file = new File([blob], 'temp.webp', { type: blob.type })

        // Compress to thumbnail
        const thumbnail = await imageCompression(file, THUMBNAIL_OPTIONS)

        return thumbnail
    } catch (error) {
        console.error('Failed to generate thumbnail from URL:', error)
        return null
    }
}

// ============================================================================
// 6. VALIDATION
// ============================================================================

export function isValidImage(file: File): boolean {
    const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic'
    ]

    if (!validTypes.includes(file.type)) return false

    // Max input 20MB sebelum compress
    const MAX_INPUT_SIZE = 20 * 1024 * 1024
    if (file.size > MAX_INPUT_SIZE) return false

    return true
}

// ============================================================================
// 7. PREVIEW URL MANAGEMENT (Memory)
// ============================================================================

export function getImagePreviewUrl(file: File): string {
    return URL.createObjectURL(file)
}

export function revokePreviewUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
    }
}

// ============================================================================
// 8. UTILITY: Get image dimensions
// ============================================================================

export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
            URL.revokeObjectURL(url)
            resolve({ width: img.width, height: img.height })
        }

        img.onerror = () => {
            URL.revokeObjectURL(url)
            reject(new Error('Failed to load image'))
        }

        img.src = url
    })
}

// ============================================================================
// 9. UTILITY: Estimate compression result
// ============================================================================

export function estimateCompressedSize(originalSize: number): {
    originalEstimate: number
    thumbnailEstimate: number
} {
    // Rough estimates based on typical compression ratios
    return {
        originalEstimate: Math.min(originalSize * 0.3, 1024 * 1024), // ~30% or max 1MB
        thumbnailEstimate: Math.min(originalSize * 0.05, 50 * 1024)  // ~5% or max 50KB
    }
}