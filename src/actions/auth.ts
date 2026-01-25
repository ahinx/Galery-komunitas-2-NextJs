// ============================================================================
// AUTHENTICATION SERVER ACTIONS - Password System (DEBUG VERSION)
// File: src/actions/auth.ts
// Deskripsi: Complete auth dengan registration, login, reset password
// Menggunakan built-in crypto & Service Role untuk Bypass RLS
// ============================================================================

'use server'

import { createClient } from '@supabase/supabase-js' // Gunakan Client Admin
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { randomBytes, scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import {
    formatPhoneNumber,
    isValidPhoneNumber,
    generateOTP
} from '@/lib/utils'



// --- CONFIG ---
const APP_NAME = "GaleriKomunitas"
const OTP_DURATION_MINUTES = 1

// ============================================================================
// 1. LOGGER & ADMIN CLIENT SETUP
// ============================================================================

// Helper untuk mencatat log rapi di Terminal
function debugLog(step: string, data?: any) {
    console.log(`\n🔍 [AUTH-DEBUG] ${step}`)
    if (data) console.log(JSON.stringify(data, null, 2))
}

// Client Admin (Wajib untuk Login/Register saat RLS aktif)
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    const keyStatus = serviceRoleKey ? `✅ Ada (${serviceRoleKey.substring(0, 5)}...)` : '❌ MISSING'

    // Log hanya jika error kritis (supaya tidak spam)
    if (!supabaseUrl || !serviceRoleKey) {
        debugLog('Check Env Var', { url: supabaseUrl, key: keyStatus })
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
// 2. CRYPTO HELPERS (Built-in Node.js)
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

        debugLog('Verify Password Detail', {
            saltLength: salt?.length,
            hashLength: hash?.length
        })

        if (!salt || !hash) return false

        const derivedKey = await scryptAsync(password, salt, 64) as Buffer
        const hashBuffer = Buffer.from(hash, 'hex')

        const match = timingSafeEqual(derivedKey, hashBuffer)
        debugLog('Password Match Result', { match })
        return match
    } catch (e) {
        console.error('Password Verify Error', e)
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
    debugLog('Send WA Start', { phone: phoneNumber, type, hasToken: !!fonteToken })

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
        debugLog('Fonnte Response', result)

        if (!response.ok) {
            console.error('❌ Fonnte API error:', result)
            return false
        }

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
    debugLog('🚀 ACTION: sendOTP', { phoneNumber, type })

    try {
        // Validasi format
        if (!isValidPhoneNumber(phoneNumber)) {
            return {
                success: false,
                message: '❌ Format nomor tidak valid. Gunakan format: 08xxx atau +62xxx',
            }
        }

        const formattedPhone = formatPhoneNumber(phoneNumber)

        // GUNAKAN ADMIN CLIENT (Bypass RLS)
        const supabase = getAdminClient()

        // Cek apakah nomor sudah terdaftar
        const { data: existingUser, error: checkError } = await supabase
            .from('profiles')
            .select('id, is_verified')
            .eq('phone_number', formattedPhone)
            .single()

        debugLog('Check Existing User', { found: !!existingUser, error: checkError?.message })

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

        debugLog('OTP Generated', { otpCode, expiresAt })

        // Simpan OTP ke database (Pakai Admin Client)
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
            // Log untuk Developer jika WA gagal (Bisa lihat kode di terminal)
            console.log(`⚠️ [DEV MODE] WA Gagal. Kode OTP: ${otpCode}`)

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
    } catch (error: any) {
        console.error('❌ Error in sendOTP:', error)
        return {
            success: false,
            message: `❌ Terjadi kesalahan server: ${error.message}`,
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
    debugLog('🚀 ACTION: register', { fullName, phoneNumber })

    try {
        // Validasi input
        if (!fullName || fullName.trim().length < 3) {
            return { success: false, message: '❌ Nama lengkap minimal 3 karakter' }
        }

        if (!isValidPhoneNumber(phoneNumber)) {
            return { success: false, message: '❌ Format nomor tidak valid' }
        }

        if (!password || password.length < 6) {
            return { success: false, message: '❌ Password minimal 6 karakter' }
        }

        if (!/^\d{6}$/.test(otpCode)) {
            return { success: false, message: '❌ Kode OTP harus 6 digit angka' }
        }

        const formattedPhone = formatPhoneNumber(phoneNumber)
        const supabase = getAdminClient() // Pakai Admin Client

        // Cek apakah nomor sudah terdaftar
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone_number', formattedPhone)
            .single()

        if (existingUser) {
            return { success: false, message: '❌ Nomor WhatsApp sudah terdaftar' }
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

        debugLog('Check OTP Result', { valid: !!otpData, error: otpError?.message })

        if (otpError || !otpData) {
            return { success: false, message: '❌ Kode OTP tidak valid atau sudah kadaluarsa' }
        }

        if (otpData.attempt_count >= 3) {
            return { success: false, message: '❌ Terlalu banyak percobaan. Minta kode OTP baru.' }
        }

        // Hash password menggunakan built-in crypto
        const passwordHash = await hashPassword(password)
        debugLog('Password Hashed', { length: passwordHash.length })

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
            return { success: false, message: '❌ Terjadi kesalahan server.' }
        }

        // Mark OTP sebagai used
        await supabase
            .from('otp_codes')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', otpData.id)

        debugLog('✅ Register Success')
        return {
            success: true,
            message: '✅ Registrasi berhasil! Silakan login dengan nomor dan password Anda.',
        }
    } catch (error) {
        console.error('❌ Error in register:', error)
        return { success: false, message: '❌ Terjadi kesalahan server.' }
    }
}

// ============================================================================
// ACTION: LOGIN (dengan Nomor/Nama + Password)
// ============================================================================

export async function login(
    identifier: string, // Bisa nomor WA atau nama
    password: string
): Promise<ActionResult<{ needsApproval: boolean }>> {
    debugLog('🚀 ACTION: login', { identifier })

    try {
        if (!identifier || !password) {
            return { success: false, message: '❌ Nomor/Nama dan password harus diisi' }
        }

        // PENTING: Gunakan Admin Client untuk mencari user (Bypass RLS)
        const supabase = getAdminClient()

        let query = supabase.from('profiles').select('*')

        // Cek apakah identifier adalah nomor WA
        if (identifier.startsWith('+') || identifier.startsWith('08') || identifier.startsWith('62')) {
            const formattedPhone = formatPhoneNumber(identifier)
            debugLog('Search by Phone', formattedPhone)
            query = query.eq('phone_number', formattedPhone)
        } else {
            debugLog('Search by Name', identifier)
            query = query.ilike('full_name', identifier)
        }

        const { data: user, error } = await query.single()

        if (error || !user) {
            debugLog('❌ User Not Found', { error: error?.message })
            return { success: false, message: '❌ Nomor/Nama tidak terdaftar. Pastikan data Anda benar.' }
        }

        debugLog('User Found', { id: user.id, role: user.role })

        // Verify password menggunakan built-in crypto
        const isPasswordValid = await verifyPassword(password, user.password_hash)

        if (!isPasswordValid) {
            debugLog('❌ Invalid Password')
            return { success: false, message: '❌ Password salah. Silakan coba lagi.' }
        }

        // Check verification status
        if (!user.is_verified) {
            return { success: false, message: '❌ Akun Anda belum diverifikasi. Silakan hubungi admin.' }
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

        debugLog('✅ Login Success, Session Created')
        return {
            success: true,
            message: `✅ Selamat datang, ${user.full_name}!`,
            data: {
                needsApproval: !user.is_approved,
            },
        }
    } catch (error) {
        console.error('❌ Error in login:', error)
        return { success: false, message: '❌ Terjadi kesalahan server.' }
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
    debugLog('🚀 ACTION: resetPassword', { phoneNumber })

    try {
        if (!isValidPhoneNumber(phoneNumber)) {
            return { success: false, message: '❌ Format nomor tidak valid' }
        }

        if (!/^\d{6}$/.test(otpCode)) {
            return { success: false, message: '❌ Kode OTP harus 6 digit' }
        }

        if (newPassword.length < 6) {
            return { success: false, message: '❌ Password minimal 6 karakter' }
        }

        const formattedPhone = formatPhoneNumber(phoneNumber)
        const supabase = getAdminClient() // Pakai Admin Client

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
            return { success: false, message: '❌ Kode OTP tidak valid atau sudah kadaluarsa' }
        }

        // Hash password baru
        const passwordHash = await hashPassword(newPassword)

        // Update password
        const { error: updateError } = await supabase
            .from('profiles')
            .update({ password_hash: passwordHash })
            .eq('phone_number', formattedPhone)

        if (updateError) {
            return { success: false, message: '❌ Gagal mereset password.' }
        }

        // Mark OTP as used
        await supabase
            .from('otp_codes')
            .update({ is_used: true, used_at: new Date().toISOString() })
            .eq('id', otpData.id)

        debugLog('✅ Reset Password Success')
        return {
            success: true,
            message: '✅ Password berhasil direset! Silakan login dengan password baru.',
        }
    } catch (error) {
        console.error('❌ Error in resetPassword:', error)
        return { success: false, message: '❌ Terjadi kesalahan server.' }
    }
}

// ============================================================================
// ACTION: LOGOUT
// ============================================================================

// export async function logout(): Promise<void> {
//     debugLog('🚀 ACTION: logout')
//     const cookieStore = await cookies()
//     cookieStore.delete('user_id')
//     redirect('/login')
// }

export async function logout() {
    console.log("Proses Logout...");
    const cookieStore = await cookies()

    // Hapus semua cookie yang mungkin ada
    cookieStore.delete('user_id')

    // Redirect ke login
    redirect('/login')
}

// ============================================================================
// ACTION: GET CURRENT USER (Khusus ini Boleh Pakai Client Biasa/Admin)
// ============================================================================

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies()
        const userId = cookieStore.get('user_id')?.value

        if (!userId) return null

        // Gunakan Admin Client agar bisa baca data user (walaupun RLS mungkin block client biasa)
        const supabase = getAdminClient()

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