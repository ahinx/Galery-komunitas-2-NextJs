// ============================================================================
// VERIFY OTP PAGE
// File: src/app/(auth)/verify-otp/page.tsx
// Deskripsi: Halaman input OTP yang menangani finalisasi registrasi
// ============================================================================

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { register, sendOTP } from '@/actions/auth' // HANYA IMPORT YANG ADA
import { 
  ShieldCheck, 
  Loader2, 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

// Kita butuh wrapper Suspense untuk useSearchParams di Next.js
export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
      <VerifyContent />
    </Suspense>
  )
}

function VerifyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Ambil data dari URL
  const phone = searchParams.get('phone') || ''
  const type = searchParams.get('type') || 'registration'

  // State
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(60) // 60 detik cooldown
  const [showSuccessModal, setShowSuccessModal] = useState(false) // State Popup

  // Timer Countdown
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Fokus otomatis ke kotak selanjutnya
  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return // Cegah paste banyak karakter sekaligus di satu kotak (handle onPaste terpisah)
    
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Pindah fokus ke kanan
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`)
      nextInput?.focus()
    }
  }

  // Handle Backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`)
      prevInput?.focus()
    }
  }

  // Handle Paste (User paste kode 6 digit langsung)
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('')
    if (pastedData.length === 6) {
      setOtp(pastedData)
      // Fokus ke tombol submit/kotak terakhir
      document.getElementById('otp-5')?.focus()
    }
  }

  // LOGIKA UTAMA: Submit OTP
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const otpCode = otp.join('')

    if (otpCode.length !== 6) {
      setError('Mohon lengkapi 6 digit kode OTP')
      return
    }

    setIsLoading(true)

    try {
      if (type === 'registration') {
        // 1. Ambil data nama & password dari Session Storage (dari halaman Register)
        const storedData = sessionStorage.getItem('temp_register_data')
        
        if (!storedData) {
          throw new Error('Sesi pendaftaran kadaluarsa. Silakan daftar ulang.')
        }

        const { fullName, password } = JSON.parse(storedData)

        // 2. Panggil Server Action Register
        const result = await register(fullName, phone, password, otpCode)

        if (result.success) {
          // Bersihkan session
          sessionStorage.removeItem('temp_register_data')
          // Tampilkan Popup Sukses
          setShowSuccessModal(true)
        } else {
          setError(result.message)
        }
      } 
      // Handle tipe lain (misal reset password) bisa ditambahkan di sini
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem')
    } finally {
      setIsLoading(false)
    }
  }

  // Kirim Ulang OTP
  const handleResend = async () => {
    if (countdown > 0) return
    setIsLoading(true)
    try {
      const result = await sendOTP(phone, 'registration') // Ini sekarang kirim OTP 1 menit
      if (result.success) {
        setCountdown(60) // Reset 60 detik
        setError('')
        alert('Kode OTP baru telah dikirim (Berlaku 1 Menit)')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Gagal mengirim ulang OTP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 relative">
        
        {/* Tombol Back */}
        <Link 
          href="/register" 
          className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>

        {/* Header */}
        <div className="text-center mb-8 mt-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Verifikasi OTP</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Masukkan 6 digit kode yang dikirim ke <br/>
            <span className="font-semibold text-gray-800 dark:text-gray-200">{phone}</span>
          </p>
        </div>

        {/* Form OTP */}
        <form onSubmit={handleSubmit}>
          <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                id={`otp-${idx}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 text-center text-2xl font-bold border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm"
              />
            ))}
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || otp.some(d => !d)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed mb-6 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Memverifikasi...</span>
              </>
            ) : (
              'Verifikasi & Daftar'
            )}
          </button>

          {/* Resend Timer */}
          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Kirim ulang kode dalam <span className="font-bold text-blue-600 dark:text-blue-400">{countdown} detik</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={isLoading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Kirim Ulang Kode
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ================= MODAL SUKSES (POPUP) ================= */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center transform scale-100 animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Pendaftaran Berhasil!
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              Akun Anda telah aktif namun belum di verifikasi. Silakan login untuk cek status dan mulai menjelajah galeri.
            </p>

            <button
              onClick={() => router.push('/login')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition-all"
            >
              Login Sekarang
            </button>
          </div>
        </div>
      )}

    </div>
  )
}