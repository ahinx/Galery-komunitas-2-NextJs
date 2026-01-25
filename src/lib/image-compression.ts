// ============================================================================
// IMAGE UTILS & COMPRESSION SERVICE
// File: src/lib/image-compression.ts
// Deskripsi: Centralized logic untuk manipulasi, validasi, dan kompresi gambar
// ============================================================================

import imageCompression from 'browser-image-compression'

// --- CONFIGURATION ---
const COMPRESSION_OPTIONS = {
    maxSizeMB: 1,           // Target size < 1MB
    maxWidthOrHeight: 1920, // Full HD standard
    useWebWorker: true,     // Multithreading
    fileType: 'image/webp', // Force WebP
    initialQuality: 0.8     // High Quality
}

// ----------------------------------------------------------------------------
// 1. CORE COMPRESSION (SINGLE)
// ----------------------------------------------------------------------------
export async function compressImage(file: File): Promise<File> {
    // Validasi dasar dulu
    if (!isValidImage(file)) {
        throw new Error('File bukan gambar yang valid')
    }

    try {
        const compressedBlob = await imageCompression(file, COMPRESSION_OPTIONS)

        // Rename extension ke .webp
        const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".webp"

        return new File([compressedBlob], newFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
        })
    } catch (error) {
        console.error("Compression failed:", error)
        // Fallback: Kembalikan file asli jika gagal kompres
        return file
    }
}

// ----------------------------------------------------------------------------
// 2. BATCH COMPRESS (MULTIPLE FILES)
// ----------------------------------------------------------------------------
export async function compressImages(files: File[]): Promise<File[]> {
    // Jalankan kompresi secara paralel (Promise.all) untuk performa maksimal
    const promises = files.map(file => compressImage(file))
    return Promise.all(promises)
}

// ----------------------------------------------------------------------------
// 3. VALIDATE IMAGE FILE
// ----------------------------------------------------------------------------
export function isValidImage(file: File): boolean {
    // Cek tipe MIME
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/jpg']
    if (!validTypes.includes(file.type)) return false

    // Cek Size (Contoh: Max input 20MB sebelum kompres)
    const MAX_INPUT_SIZE = 20 * 1024 * 1024 // 20MB
    if (file.size > MAX_INPUT_SIZE) return false

    return true
}

// ----------------------------------------------------------------------------
// 4. PREVIEW UTILS (MEMORY MANAGEMENT)
// ----------------------------------------------------------------------------

/**
 * Membuat URL preview sementara
 */
export function getImagePreviewUrl(file: File): string {
    return URL.createObjectURL(file)
}

/**
 * Membersihkan URL dari memori browser (PENTING untuk mencegah memory leak)
 * Panggil ini saat komponen unmount atau foto dihapus dari list
 */
export function revokePreviewUrl(url: string): void {
    if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
    }
}