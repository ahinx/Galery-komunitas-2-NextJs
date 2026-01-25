// ============================================================================
// AUTHENTICATION SERVER ACTIONS - Password System
// File: src/actions/auth.ts
// Deskripsi: Complete auth dengan registration, login, reset password
// Menggunakan built-in crypto (tidak perlu bcrypt external)
// ============================================================================

'use server'

import { createServerSupabaseClient } from '@/lib/supabase/client'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import {
    formatPhoneNumber,
    isValidPhoneNumber,
    generateOTP
} from '@/lib/utils'

// ============================================================================
// CRYPTO HELPERS (Built-in Node.js - No External Dependencies)
// ============================================================================

const scryptAsync = promisify(scrypt)

/**
 * Hash password menggunakan scrypt (built-in Node.js)
 * Format output: salt:hash (keduanya hex encoded)
 */
async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer
    return `${salt}:${derivedKey.toString('hex')}`
}

/**
 * Verify password dengan timing-safe comparison
 */
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
        const [salt, hash] = storedHash.split(':')
        if (!salt || !hash) return false

        const derivedKey = await scryptAsync(password, salt, 64) as Buffer
        const hashBuffer = Buffer.from(hash, 'hex')

        return timingSafeEqual(derivedKey, hashBuffer)
    } catch {
        return false
    }
}

// ============================================================================
// TYPES
// ============================================================================

type ActionResult<T = void> = {
    success: boolean
    message: string
    data?: T
}

// ============================================================================
// HELPER: SEND OTP VIA WHATSAPP
// ============================================================================

async function sendOtpWhatsApp(
    phoneNumber: string,
    otpCode: string,
    type: 'registration' | 'reset_password'
): Promise<boolean> {
    const fonteToken = process.env.FONNTE_TOKEN

    if (!fonteToken) {
        console.error('❌ FONNTE_TOKEN tidak ditemukan')
        return false
    }

    try {
        const message = type === 'registration'
            ? `🔐 *Kode OTP Registrasi*\n\nKode verifikasi: *${otpCode}*\n\nBerlaku 5 menit.\nJangan bagikan kode ini!`
            : `🔐 *Kode Reset Password*\n\nKode reset: *${otpCode}*\n\nBerlaku 5 menit.\nJangan bagikan kode ini!`

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': fonteToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                target: phoneNumber,
                message,
                countryCode: '62',
            }),
        })

        const result = await response.json()

        if (!response.ok) {
            console.error('❌ Fonnte API error:', result)
            return false
        }

        console.log('✅ OTP terkirim ke', phoneNumber)
        return result.status === true || result.status === 'success'
    } catch (error) {
        console.error('❌ Error sending WhatsApp OTP:', error)
        return false
    }
}

// ============================================================================
// ACTION: SEND OTP (untuk registrasi atau reset password)
// ============================================================================

export async function sendOTP(
    phoneNumber: string,
    type: 'registration' | 'reset_password' = 'registration'
): Promise<ActionResult<{ expiresAt: string }>> {
    try {
        // Validasi format
        if (!isValidPhoneNumber(phoneNumber)) {
            return {
                success: false,
                message: '❌ Format nomor tidak valid. Gunakan format: 08xxx atau +62xxx',
            }
        }

        const formattedPhone = formatPhoneNumber(phoneNumber)
        const supabase = await createServerSupabaseClient()

        // Cek apakah nomor sudah terdaftar
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id, is_verified')
            .eq('phone_number', formattedPhone)
            .single()

        if (type === 'registration' && existingUser) {
            return {
                success: false,
                message: '❌ Nomor WhatsApp sudah terdaftar. Silakan login.',
            }
        }

        if (type === 'reset_password' && !existingUser) {
            return {
                success: false,
                message: '❌ Nomor WhatsApp tidak terdaftar. Pastikan nomor Anda benar.',
            }
        }

        // Generate OTP
        const otpCode = generateOTP()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 menit

        // Simpan OTP ke database
        const { error: otpError } = await supabase
            .from('otp_codes')
            .insert({
                phone_number: formattedPhone,
                otp_code: otpCode,
                otp_type: type,
                expires_at: expiresAt.toISOString(),
            })

        if (otpError) {
            console.error('❌ Error saving OTP:', otpError)
            return {
                success: false,
                message: '❌ Terjadi kesalahan server. Silakan hubungi admin.',
            }
        }

        // Kirim OTP via WhatsApp
        const sent = await sendOtpWhatsApp(formattedPhone, otpCode, type)

        if (!sent) {
            // Rollback OTP jika gagal kirim
            await supabase
                .from('otp_codes')
                .delete()
                .eq('phone_number', formattedPhone)
                .eq('otp_code', otpCode)

            return {
                success: false,
                message: '❌ Gagal mengirim kode OTP. Pastikan nomor WhatsApp aktif.',
            }
        }

        return {
            success: true,
            message: '✅ Kode OTP telah dikirim ke WhatsApp Anda',
            data: {
                expiresAt: expiresAt.toISOString(),
            },
        }
    } catch (error) {
        console.error('❌ Error in sendOTP:', error)
        return {
            success: false,
            message: '❌ Terjadi kesalahan server. Silakan hubungi admin.',
        }
    }
}

// ============================================================================
// ACTION: REGISTER (dengan OTP verification)
// ============================================================================

export async function register(
    fullName: string,
    phoneNumber: string,
    password: string,
    otpCode: string
): Promise<ActionResult> {
    try {
        // Validasi input
        if (!fullName || fullName.trim().length < 3) {
            return {
                success: false,
                message: '❌ Nama lengkap minimal 3 karakter',
            }
        }

        if (!isValidPhoneNumber(phoneNumber)) {
            return {
                success: false,
                message: '❌ Format nomor tidak valid',
            }
        }

        if (!password || password.length < 6) {
            return {
                success: false,
                message: '❌ Password minimal 6 karakter',
            }
        }

        if (!/^\d{6}$/.test(otpCode)) {
            return {
                success: false,
                message: '❌ Kode OTP harus 6 digit angka',
            }
        }

        const formattedPhone = formatPhoneNumber(phoneNumber)
        const supabase = await createServerSupabaseClient()

        // Cek apakah nomor sudah terdaftar
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone_number', formattedPhone)
            .single()

        if (existingUser) {
            return {
                success: false,
                message: '❌ Nomor WhatsApp sudah terdaftar',
            }
        }

        // Verifikasi OTP
        const { data: otpData, error: otpError } = await supabase
            .from('otp_codes')
            .select('*')
            .eq('phone_number', formattedPhone)
            .eq('otp_code', otpCode)
            .eq('otp_type', 'registration')
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (otpError || !otpData) {
            return {
                success: false,
                message: '❌ Kode OTP tidak valid atau sudah kadaluarsa',
            }
        }

        // Check attempt count
        if (otpData.attempt_count >= 3) {
            return {
                success: false,
                message: '❌ Terlalu banyak percobaan. Minta kode OTP baru.',
            }
        }

        // Hash password menggunakan built-in crypto
        const passwordHash = await hashPassword(password)

        // Buat user baru
        const { data: newUser, error: createError } = await supabase
            .from('profiles')
            .insert({
                full_name: fullName.trim(),
                phone_number: formattedPhone,
                password_hash: passwordHash,
                role: 'member',
                is_verified: true, // Sudah verified via OTP
                is_approved: false, // Menunggu approval admin
            })
            .select()
            .single()

        if (createError) {
            console.error('❌ Error creating user:', createError)
            return {
                success: false,
                message: '❌ Terjadi kesalahan server. Silakan hubungi admin.',
            }
        }

        // Mark OTP sebagai used
        await supabase
            .from('otp_codes')
            .update({
                is_used: true,
                used_at: new Date().toISOString(),
            })
            .eq('id', otpData.id)

        return {
            success: true,
            message: '✅ Registrasi berhasil! Silakan login dengan nomor dan password Anda.',
        }
    } catch (error) {
        console.error('❌ Error in register:', error)
        return {
            success: false,
            message: '❌ Terjadi kesalahan server. Silakan hubungi admin.',
        }
    }
}

// ============================================================================
// ACTION: LOGIN (dengan Nomor/Nama + Password)
// ============================================================================

export async function login(
    identifier: string, // Bisa nomor WA atau nama
    password: string
): Promise<ActionResult<{ needsApproval: boolean }>> {
    try {
        // Validasi input
        if (!identifier || !password) {
            return {
                success: false,
                message: '❌ Nomor/Nama dan password harus diisi',
            }
        }

        const supabase = await createServerSupabaseClient()

        // Cari user berdasarkan nomor WA atau nama
        let query = supabase
            .from('profiles')
            .select('*')

        // Cek apakah identifier adalah nomor WA
        if (identifier.startsWith('+') || identifier.startsWith('08') || identifier.startsWith('62')) {
            const formattedPhone = formatPhoneNumber(identifier)
            query = query.eq('phone_number', formattedPhone)
        } else {
            // Search by name (case-insensitive)
            query = query.ilike('full_name', identifier)
        }

        const { data: user, error } = await query.single()

        if (error || !user) {
            return {
                success: false,
                message: '❌ Nomor/Nama tidak terdaftar. Pastikan data Anda benar.',
            }
        }

        // Verify password menggunakan built-in crypto
        const isPasswordValid = await verifyPassword(password, user.password_hash)

        if (!isPasswordValid) {
            return {
                success: false,
                message: '❌ Password salah. Silakan coba lagi.',
            }
        }

        // Check verification status
        if (!user.is_verified) {
            return {
                success: false,
                message: '❌ Akun Anda belum diverifikasi. Silakan hubungi admin.',
            }
        }

        // Update last login
        await supabase
            .from('profiles')
            .update({ last_login: new Date().toISOString() })
            .eq('id', user.id)

        // Set session cookie
        const cookieStore = await cookies()
        cookieStore.set('user_id', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 hari
        })

        return {
            success: true,
            message: `✅ Selamat datang, ${user.full_name}!`,
            data: {
                needsApproval: !user.is_approved,
            },
        }
    } catch (error) {
        console.error('❌ Error in login:', error)
        return {
            success: false,
            message: '❌ Terjadi kesalahan server. Silakan hubungi admin.',
        }
    }
}

// ============================================================================
// ACTION: RESET PASSWORD
// ============================================================================

export async function resetPassword(
    phoneNumber: string,
    otpCode: string,
    newPassword: string
): Promise<ActionResult> {
    try {
        // Validasi
        if (!isValidPhoneNumber(phoneNumber)) {
            return {
                success: false,
                message: '❌ Format nomor tidak valid',
            }
        }

        if (!/^\d{6}$/.test(otpCode)) {
            return {
                success: false,
                message: '❌ Kode OTP harus 6 digit',
            }
        }

        if (newPassword.length < 6) {
            return {
                success: false,
                message: '❌ Password minimal 6 karakter',
            }
        }

        const formattedPhone = formatPhoneNumber(phoneNumber)
        const supabase = await createServerSupabaseClient()

        // Verifikasi OTP
        const { data: otpData } = await supabase
            .from('otp_codes')
            .select('*')
            .eq('phone_number', formattedPhone)
            .eq('otp_code', otpCode)
            .eq('otp_type', 'reset_password')
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (!otpData) {
            return {
                success: false,
                message: '❌ Kode OTP tidak valid atau sudah kadaluarsa',
            }
        }

        // Hash password baru menggunakan built-in crypto
        const passwordHash = await hashPassword(newPassword)

        // Update password
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ password_hash: passwordHash })
            .eq('phone_number', formattedPhone)

        if (updateError) {
            return {
                success: false,
                message: '❌ Gagal mereset password. Silakan coba lagi.',
            }
        }

        // Mark OTP as used
        await supabase
            .from('otp_codes')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', otpData.id)

        return {
            success: true,
            message: '✅ Password berhasil direset! Silakan login dengan password baru.',
        }
    } catch (error) {
        console.error('❌ Error in resetPassword:', error)
        return {
            success: false,
            message: '❌ Terjadi kesalahan server. Silakan hubungi admin.',
        }
    }
}

// ============================================================================
// ACTION: LOGOUT
// ============================================================================

export async function logout(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.delete('user_id')
    redirect('/login')
}

// ============================================================================
// ACTION: GET CURRENT USER
// ============================================================================

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('user_id')?.value

        if (!userId) return null

        const supabase = await createServerSupabaseClient()
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        return profile
    } catch (error) {
        console.error('❌ Error getting current user:', error)
        return null
    }
}

// ============================================================================
// ACTION: CHECK AUTH STATUS
// ============================================================================

export async function checkAuthStatus() {
    const user = await getCurrentUser()

    return {
        isAuthenticated: !!user,
        isVerified: user?.is_verified || false,
        isApproved: user?.is_approved || false,
        user,
    }
}