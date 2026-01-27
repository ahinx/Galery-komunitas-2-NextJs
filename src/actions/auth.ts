// ============================================================================
// AUTHENTICATION SERVER ACTIONS - Password System (FINAL FIXED)
// File: src/actions/auth.ts
// ============================================================================

'use server'

import { createClient } from '@supabase/supabase-js'
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

// Helper Logger
function debugLog(step: string, data?: any) {
    console.log(`\n🔍 [AUTH-DEBUG] ${step}`)
    if (data) console.log(JSON.stringify(data, null, 2))
}

// Client Admin (Bypass RLS)
function getAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('FATAL: SUPABASE_SERVICE_ROLE_KEY missing')
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    })
}

// Crypto Helpers
const scryptAsync = promisify(scrypt)

async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex')
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer
    return `${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
    try {
        const [salt, hash] = storedHash.split(':')
        if (!salt || !hash) return false
        const derivedKey = await scryptAsync(password, salt, 64) as Buffer
        const hashBuffer = Buffer.from(hash, 'hex')
        return timingSafeEqual(derivedKey, hashBuffer)
    } catch (e) {
        return false
    }
}

type ActionResult<T = void> = {
    success: boolean
    message: string
    data?: T
}

// --- HELPER: GET APP NAME ---
async function getAppNameInternal(supabase: any) {
    try {
        const { data } = await supabase.from('app_settings').select('app_name').single()
        return data?.app_name || "Galeri Komunitas"
    } catch {
        return "Galeri Komunitas"
    }
}

// --- HELPER: SEND WA (Satu Fungsi Saja) ---
async function sendOtpWhatsApp(phoneNumber: string, message: string): Promise<boolean> {
    const fonteToken = process.env.FONNTE_TOKEN
    if (!fonteToken) return false

    try {
        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: { 'Authorization': fonteToken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: phoneNumber, message, countryCode: '62' }),
        })
        const result = await response.json()
        return result.status === true || result.status === 'success'
    } catch (error) {
        console.error('❌ Error sending WA:', error)
        return false
    }
}

// ============================================================================
// ACTION: SEND OTP (MODIFIED FOR TEMPLATE)
// ============================================================================
export async function sendOTP(
    phoneNumber: string,
    type: 'registration' | 'reset_password' = 'registration',
    fullNameInput?: string
): Promise<ActionResult<{ expiresAt: string }>> {
    debugLog('🚀 ACTION: sendOTP', { phoneNumber, type, fullNameInput })

    try {
        if (!isValidPhoneNumber(phoneNumber)) {
            return { success: false, message: '❌ Format nomor tidak valid.' }
        }

        const formattedPhone = formatPhoneNumber(phoneNumber)
        const supabase = getAdminClient()

        // Use maybeSingle to prevent error if not found
        const { data: existingUser } = await supabase
            .from('profiles')
            .select('id, full_name, is_verified')
            .eq('phone_number', formattedPhone)
            .maybeSingle()

        if (type === 'registration' && existingUser) {
            return { success: false, message: '❌ Nomor WhatsApp sudah terdaftar. Silakan login.' }
        }

        if (type === 'reset_password' && !existingUser) {
            return { success: false, message: '❌ Nomor WhatsApp tidak terdaftar.' }
        }

        // --- PREPARE DATA ---
        const appName = await getAppNameInternal(supabase)

        let userName = fullNameInput || "User"
        if (type === 'reset_password' && existingUser?.full_name) {
            userName = existingUser.full_name
        }

        const otpCode = generateOTP()
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

        // Cleanup
        await supabase.from('otp_codes').delete().eq('phone_number', formattedPhone)

        // Save OTP
        const { error: otpError } = await supabase
            .from('otp_codes')
            .insert({
                phone_number: formattedPhone,
                otp_code: otpCode,
                otp_type: type,
                expires_at: expiresAt.toISOString(),
            })

        if (otpError) throw otpError

        // --- TEMPLATE PESAN ---
        let message = ""

        if (type === 'registration') {
            message =
                `🔐 *Kode Verifikasi ${appName}*

Halo *${userName}*,
Terima kasih telah mendaftar.

Kode OTP Anda:
👉 *${otpCode}*

Berlaku 5 menit. Demi keamanan akun, mohon jangan bagikan kode ini kepada siapapun.`
        } else {
            message =
                `🔐 *Reset Password ${appName}*

Halo *${userName}*,
Kami menerima permintaan atur ulang kata sandi untuk akun Anda.

Kode OTP:
👉 *${otpCode}*

Berlaku 5 menit. Abaikan pesan ini jika Anda tidak memintanya.`
        }

        // Kirim WA
        const sent = await sendOtpWhatsApp(formattedPhone, message)

        if (!sent) {
            console.log(`⚠️ [DEV MODE] WA Gagal. Kode: ${otpCode}`)
        }

        return {
            success: true,
            message: '✅ Kode OTP dikirim ke WhatsApp.',
            data: { expiresAt: expiresAt.toISOString() },
        }
    } catch (error: any) {
        console.error('❌ Error sendOTP:', error)
        return { success: false, message: `Server Error: ${error.message}` }
    }
}

// ============================================================================
// ACTION: REGISTER
// ============================================================================
export async function register(
    fullName: string,
    phoneNumber: string,
    password: string,
    otpCode: string
): Promise<ActionResult> {
    try {
        if (!fullName || fullName.trim().length < 3) return { success: false, message: '❌ Nama lengkap minimal 3 karakter' }
        if (!isValidPhoneNumber(phoneNumber)) return { success: false, message: '❌ Format nomor tidak valid' }
        if (!password || password.length < 6) return { success: false, message: '❌ Password minimal 6 karakter' }
        if (!/^\d{6}$/.test(otpCode)) return { success: false, message: '❌ Kode OTP harus 6 digit angka' }

        const formattedPhone = formatPhoneNumber(phoneNumber)
        const supabase = getAdminClient()

        const { data: existing } = await supabase.from('profiles').select('id').eq('phone_number', formattedPhone).maybeSingle()
        if (existing) return { success: false, message: '❌ Nomor sudah terdaftar' }

        const { data: otpData } = await supabase
            .from('otp_codes')
            .select('*')
            .eq('phone_number', formattedPhone)
            .eq('otp_code', otpCode)
            .eq('otp_type', 'registration')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (!otpData) return { success: false, message: '❌ Kode OTP salah/kadaluarsa' }
        if (otpData.attempt_count >= 3) return { success: false, message: '❌ Terlalu banyak percobaan.' }

        const passwordHash = await hashPassword(password)

        const { error: createError } = await supabase
            .from('profiles')
            .insert({
                full_name: fullName.trim(),
                phone_number: formattedPhone,
                password_hash: passwordHash,
                role: 'member',
                is_verified: true,
                is_approved: false,
            })

        if (createError) throw createError

        await supabase.from('otp_codes').update({ is_used: true, used_at: new Date().toISOString() }).eq('id', otpData.id)

        return { success: true, message: '✅ Registrasi berhasil!' }
    } catch (error) {
        return { success: false, message: 'Gagal mendaftar.' }
    }
}

// ============================================================================
// ACTION: LOGIN
// ============================================================================
export async function login(identifier: string, password: string): Promise<ActionResult<{ needsApproval: boolean }>> {
    try {
        const supabase = getAdminClient()
        let query = supabase.from('profiles').select('*')

        if (identifier.match(/^(\+62|62|08)/)) {
            query = query.eq('phone_number', formatPhoneNumber(identifier))
        } else {
            query = query.ilike('full_name', identifier)
        }

        const { data: user } = await query.maybeSingle()

        if (!user) return { success: false, message: '❌ Akun tidak ditemukan' }

        const isValid = await verifyPassword(password, user.password_hash)
        if (!isValid) return { success: false, message: '❌ Password salah' }

        if (!user.is_verified) return { success: false, message: '❌ Akun belum diverifikasi' }

        await supabase.from('profiles').update({ last_login: new Date().toISOString() }).eq('id', user.id)

        const cookieStore = await cookies()
        cookieStore.set('user_id', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30,
        })

        return {
            success: true,
            message: `Selamat datang, ${user.full_name}`,
            data: { needsApproval: !user.is_approved }
        }
    } catch (error) {
        return { success: false, message: 'Login gagal.' }
    }
}

// ============================================================================
// ACTION: RESET PASSWORD
// ============================================================================
export async function resetPassword(phoneNumber: string, otpCode: string, newPassword: string): Promise<ActionResult> {
    try {
        const formattedPhone = formatPhoneNumber(phoneNumber)
        const supabase = getAdminClient()

        const { data: otpData } = await supabase
            .from('otp_codes')
            .select('*')
            .eq('phone_number', formattedPhone)
            .eq('otp_code', otpCode)
            .eq('otp_type', 'reset_password')
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle()

        if (!otpData) return { success: false, message: '❌ Kode OTP tidak valid' }

        const passwordHash = await hashPassword(newPassword)
        await supabase.from('profiles').update({ password_hash: passwordHash }).eq('phone_number', formattedPhone)
        await supabase.from('otp_codes').update({ is_used: true }).eq('id', otpData.id)

        return { success: true, message: '✅ Password berhasil direset!' }
    } catch {
        return { success: false, message: 'Gagal reset password.' }
    }
}

// ============================================================================
// ACTION: LOGOUT
// ============================================================================
export async function logout() {
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
        const supabase = getAdminClient()
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        return data
    } catch { return null }
}

// ============================================================================
// ACTION: CHECK REGISTRATION STATUS
// ============================================================================
export async function checkRegistrationStatus(userId?: string): Promise<any> {
    try {
        const cookieStore = await cookies()
        const currentUserId = userId || cookieStore.get('user_id')?.value
        if (!currentUserId) return { success: false, status: 'not_found' }

        const supabase = getAdminClient()
        const { data: user } = await supabase.from('profiles').select('id, full_name, is_approved, is_verified').eq('id', currentUserId).maybeSingle()

        if (!user) return { success: false, status: 'not_found' }

        let status = 'pending'
        if (user.is_approved) status = 'approved'

        return { success: true, status, user }
    } catch {
        return { success: false, status: 'not_found' }
    }
}

// ============================================================================
// ACTION: PUBLIC ADMIN CONTACTS
// ============================================================================
export async function getAdminContacts() {
    try {
        const supabase = getAdminClient()
        const { data } = await supabase
            .from('profiles')
            .select('id, full_name, role, avatar_url, phone:phone_number')
            .in('role', ['admin', 'super_admin'])
            .not('phone_number', 'is', null)
            .order('role', { ascending: false })
        return data || []
    } catch { return [] }
}