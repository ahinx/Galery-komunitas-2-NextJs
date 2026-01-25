// ============================================================================
// UTILITY FUNCTIONS (MERGED)
// File: src/lib/utils.ts
// Deskripsi: Helper functions untuk berbagai keperluan aplikasi
// ============================================================================

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Photo } from '@/lib/supabase/client'

// --- TAILWIND CSS UTILITIES ---
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// --- DATE & TIME UTILITIES ---
export function formatDate(date: string | Date): string {
    const d = new Date(date)
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'long',
    }).format(d)
}

export function formatDateTime(date: string | Date): string {
    const d = new Date(date)
    return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(d)
}

export function formatRelativeTime(date: string | Date): string {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) return 'Baru saja'
    if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`
    if (diffHours < 24) return `${diffHours} jam yang lalu`
    if (diffDays < 7) return `${diffDays} hari yang lalu`

    return formatDate(d)
}

/**
 * Group photos by month/year untuk gallery dengan sticky headers
 * Returns: { "Januari 2025": Photo[], "Desember 2024": Photo[], ... }
 */
export function groupPhotosByDate(photos: Photo[]): Record<string, Photo[]> {
    return photos.reduce((groups, photo) => {
        const date = new Date(photo.created_at)
        const key = new Intl.DateTimeFormat('id-ID', {
            year: 'numeric',
            month: 'long',
        }).format(date)

        if (!groups[key]) {
            groups[key] = []
        }
        groups[key].push(photo)

        return groups
    }, {} as Record<string, Photo[]>)
}

// --- FILE SIZE UTILITIES ---
export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function isValidFileSize(bytes: number, maxMB: number = 10): boolean {
    const maxBytes = maxMB * 1024 * 1024
    return bytes <= maxBytes
}

// --- PHONE NUMBER UTILITIES ---
export function formatPhoneNumber(phone: string): string {
    let cleaned = phone.replace(/\D/g, '')
    if (cleaned.startsWith('0')) {
        cleaned = '62' + cleaned.substring(1)
    }
    if (!cleaned.startsWith('62')) {
        cleaned = '62' + cleaned
    }
    return '+' + cleaned
}

/**
 * Format nomor telepon khusus untuk API Fonnte (Hanya angka)
 */
export function formatPhoneForFonnte(phone: string): string {
    const formatted = formatPhoneNumber(phone);
    return formatted.replace('+', '');
}

export function isValidPhoneNumber(phone: string): boolean {
    const formatted = formatPhoneNumber(phone)
    const regex = /^\+62[0-9]{9,13}$/
    return regex.test(formatted)
}

export function maskPhoneNumber(phone: string): string {
    if (phone.length < 8) return phone
    const start = phone.substring(0, 6)
    const end = phone.substring(phone.length - 4)
    return `${start}****${end}`
}

// --- OTP UTILITIES ---
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export function isValidOTP(otp: string): boolean {
    return /^\d{6}$/.test(otp)
}

// --- STRING UTILITIES ---
export function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str
    return str.substring(0, maxLength - 3) + '...'
}

export function randomString(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
}

/**
 * Generate initials from name (untuk avatar)
 */
export function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2)
}

// --- IMAGE UTILITIES ---
export function isImageFile(file: File): boolean {
    return file.type.startsWith('image/')
}

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

export function generateFileName(originalName: string): string {
    const timestamp = Date.now()
    const random = randomString(8)
    const ext = originalName.split('.').pop()
    return `${timestamp}-${random}.${ext}`
}

/**
 * Validate image file untuk upload
 */
export function isValidImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: 'Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau GIF.' }
    }

    if (file.size > maxSize) {
        return { valid: false, error: 'Ukuran file terlalu besar. Maksimal 10MB.' }
    }

    return { valid: true }
}

// --- ARRAY UTILITIES ---
export function chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// --- VALIDATION UTILITIES ---
export function isValidUrl(url: string): boolean {
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

export function isAuthenticated(userId: string | null | undefined): boolean {
    return !!userId && userId.length > 0
}

// --- LOCAL STORAGE UTILITIES ---
export function getLocalStorage<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback
    try {
        const item = window.localStorage.getItem(key)
        return item ? JSON.parse(item) : fallback
    } catch {
        return fallback
    }
}

export function setLocalStorage<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
        console.error('Failed to set localStorage:', error)
    }
}

export function removeLocalStorage(key: string): void {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.removeItem(key)
    } catch (error) {
        console.error('Failed to remove from localStorage:', error)
    }
}

// --- ERROR HANDLING UTILITIES ---
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    return 'Terjadi kesalahan yang tidak diketahui'
}

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

// --- COLOR UTILITIES (untuk Avatar) ---
/**
 * Generate consistent color from string
 */
export function stringToColor(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }

    const colors = [
        'bg-red-500',
        'bg-orange-500',
        'bg-amber-500',
        'bg-yellow-500',
        'bg-lime-500',
        'bg-green-500',
        'bg-emerald-500',
        'bg-teal-500',
        'bg-cyan-500',
        'bg-sky-500',
        'bg-blue-500',
        'bg-indigo-500',
        'bg-violet-500',
        'bg-purple-500',
        'bg-fuchsia-500',
        'bg-pink-500',
        'bg-rose-500',
    ]

    return colors[Math.abs(hash) % colors.length]
}