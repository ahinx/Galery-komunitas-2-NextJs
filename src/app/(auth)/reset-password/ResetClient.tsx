// ============================================================================
// RESET PASSWORD PAGE CLIENT
// File: src/app/(auth)/reset-password/ResetClient.tsx
// ============================================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sendOTP, resetPassword } from '@/actions/auth'
import { KeyRound, Loader2, Eye, EyeOff, Send, CheckCircle2, ArrowLeft, Camera } from 'lucide-react'
import Link from 'next/link'

interface BrandingProps {
  appName: string
  logoUrl: string | null
}

type Step = 'phone' | 'otp' | 'success'

export default function ResetClient({ branding }: { branding: BrandingProps }) {
  const router = useRouter()
  const { appName, logoUrl } = branding
  
  const [step, setStep] = useState<Step>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(0)

  // Send OTP
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!phoneNumber) {
      setError('❌ Nomor WhatsApp harus diisi')
      return
    }

    setIsLoading(true)

    try {
      const result = await sendOTP(phoneNumber, 'reset_password')

      if (result.success) {
        setSuccess(result.message)
        setStep('otp')
        setCountdown(60)
        
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('❌ Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!/^\d{6}$/.test(otpCode)) {
      setError('❌ Kode OTP harus 6 digit angka')
      return
    }

    if (newPassword.length < 6) {
      setError('❌ Password minimal 6 karakter')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('❌ Konfirmasi password tidak cocok')
      return
    }

    setIsLoading(true)

    try {
      const result = await resetPassword(phoneNumber, otpCode, newPassword)

      if (result.success) {
        setSuccess(result.message)
        setStep('success')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('❌ Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return

    setError('')
    setIsLoading(true)

    try {
      const result = await sendOTP(phoneNumber, 'reset_password')

      if (result.success) {
        setSuccess(result.message)
        setCountdown(60)
        
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('❌ Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          
          {/* Header - BRANDING LOGIC IMPLEMENTED HERE */}
          <div className="flex flex-col items-center justify-center mb-6 gap-3">
             {/* LOGIC LOGO SESUAI ATURAN SAMA */}
             {logoUrl ? (
                // Ada Logo: Background Putih-Abu (Style Tile)
                <div className="p-3 bg-gradient-to-b from-white to-gray-400 rounded-2xl shadow-md">
                  <img 
                    src={logoUrl} 
                    alt={appName} 
                    className="h-10 w-auto object-contain" 
                  />
                </div>
            ) : (
                // Tidak Ada Logo: Fallback Biru (tapi disini saya sesuaikan dengan tema Reset PW yaitu Ungu/Pink agar tetap cantik)
                // ATAU saya gunakan Biru sesuai aturan ketat anda: "jika tidak ada maka begron warna biru"
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-md">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
            )}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {step === 'phone' && 'Reset Password'}
              {step === 'otp' && 'Verifikasi & Password Baru'}
              {step === 'success' && 'Berhasil!'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {step === 'phone' && `Masukkan nomor WhatsApp yang terdaftar di ${appName}`}
              {step === 'otp' && `Kode OTP dikirim ke ${phoneNumber}`}
              {step === 'success' && 'Silakan login dengan password baru'}
            </p>
          </div>

          {/* STEP 1: Input Phone Number */}
          {step === 'phone' && (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nomor WhatsApp
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="08xx atau +62xx"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Nomor harus terdaftar di <strong>{appName}</strong>
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Mengirim OTP...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Kirim Kode OTP
                  </>
                )}
              </button>

              <Link
                href="/login"
                className="block text-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium py-2 transition"
              >
                <ArrowLeft className="w-4 h-4 inline mr-1" />
                Kembali ke Login
              </Link>
            </form>
          )}

          {/* STEP 2: OTP & New Password */}
          {step === 'otp' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kode OTP (6 Digit)
                </label>
                <input
                  type="text"
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-bold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Kirim ulang dalam <span className="font-bold text-gray-900 dark:text-white">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                  >
                    Kirim Ulang Kode OTP
                  </button>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || otpCode.length !== 6}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Reset Password
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('phone')}
                className="w-full text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium py-2 transition"
              >
                ← Kembali
              </button>
            </form>
          )}

          {/* STEP 3: Success */}
          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Password Berhasil Direset!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Anda akan diarahkan ke halaman login dalam 3 detik...
                </p>
              </div>

              <Link
                href="/login"
                className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium px-8 py-3 rounded-lg transition"
              >
                Login Sekarang
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}