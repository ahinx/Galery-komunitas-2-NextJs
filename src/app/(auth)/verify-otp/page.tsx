// ============================================================================
// VERIFY OTP PAGE
// File: src/app/(auth)/verify-otp/page.tsx
// Deskripsi: Halaman verifikasi OTP dengan countdown timer
// ============================================================================

'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { verifyOTP, sendOTP } from '@/actions/auth'
import { AUTH_CONFIG } from '@/lib/constants'
import { ShieldCheck, Loader2, ArrowLeft, RefreshCw } from 'lucide-react'

function VerifyOTPContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const phoneNumber = searchParams.get('phone') || ''
  const fullName = searchParams.get('name') || ''

  const [otpCode, setOtpCode] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(AUTH_CONFIG.RESEND_COOLDOWN_SECONDS)
  const [canResend, setCanResend] = useState(false)

  // Refs untuk auto-focus inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setCanResend(true)
    }
  }, [countdown])

  // Handle input OTP
  const handleOtpChange = (index: number, value: string) => {
    // Hanya terima angka
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otpCode]
    newOtp[index] = value

    setOtpCode(newOtp)
    setError('')

    // Auto-focus ke input berikutnya
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit jika sudah 6 digit
    if (index === 5 && value && newOtp.every(digit => digit)) {
      handleVerify(newOtp.join(''))
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      const newOtp = pastedData.split('')
      setOtpCode(newOtp)
      inputRefs.current[5]?.focus()
      handleVerify(pastedData)
    }
  }

  // Verify OTP
  const handleVerify = async (code: string) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await verifyOTP(phoneNumber, code, fullName)

      if (result.success) {
        if (result.data?.needsApproval) {
          router.push('/waiting-room')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(result.message)
        setOtpCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  // Resend OTP
  const handleResend = async () => {
    if (!canResend) return

    setIsLoading(true)
    setError('')

    try {
      const result = await sendOTP(phoneNumber)

      if (result.success) {
        setCountdown(AUTH_CONFIG.RESEND_COOLDOWN_SECONDS)
        setCanResend(false)
        setOtpCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Gagal mengirim ulang kode. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </button>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Verifikasi Kode OTP
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Kode dikirim ke <span className="font-medium text-gray-900 dark:text-white">{phoneNumber}</span>
            </p>
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
              {otpCode.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={isLoading}
                  autoFocus={index === 0}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              {canResend ? (
                <button
                  onClick={handleResend}
                  disabled={isLoading}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium flex items-center gap-2 justify-center mx-auto transition"
                >
                  <RefreshCw className="w-4 h-4" />
                  Kirim Ulang Kode
                </button>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Kirim ulang dalam <span className="font-bold text-gray-900 dark:text-white">{countdown}s</span>
                </p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">
                {error}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Memverifikasi...</span>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Kode OTP berlaku selama {AUTH_CONFIG.OTP_EXPIRY_MINUTES} menit
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  )
}