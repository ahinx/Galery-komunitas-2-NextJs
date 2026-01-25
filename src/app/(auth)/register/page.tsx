// ============================================================================
// REGISTER PAGE - Interactive Real-time Validation
// File: src/app/(auth)/register/page.tsx
// Deskripsi: Halaman registrasi dengan validasi password real-time & UX interaktif
// ============================================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendOTP } from '@/actions/auth'
import { 
  UserPlus, 
  Loader2, 
  Eye, 
  EyeOff, 
  Send, 
  CheckCircle2, 
  User, 
  Phone, 
  Lock, 
  XCircle, 
  ArrowRight
} from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  
  // ================= STATE MANAGEMENT =================
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  // Form Data
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  })

  // Validasi Visual (null = belum isi, true = valid, false = invalid)
  const [passMatch, setPassMatch] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  // ================= REAL-TIME VALIDATION =================
  useEffect(() => {
    // Cek kesamaan password secara real-time
    if (formData.confirmPassword) {
      setPassMatch(formData.password === formData.confirmPassword)
    } else {
      setPassMatch(null) // Reset jika kosong
    }
  }, [formData.password, formData.confirmPassword])

  // ================= HANDLERS =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    // Reset error global saat user mengetik
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 1. Validasi Final
    if (formData.fullName.trim().length < 3) {
      setError('❌ Nama lengkap minimal 3 karakter')
      return
    }
    if (formData.password.length < 6) {
      setError('❌ Password minimal 6 karakter')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('❌ Password tidak cocok!')
      return
    }

    setIsLoading(true)

    try {
      // 2. Simpan Data Sementara (Untuk Step OTP nanti)
      sessionStorage.setItem('temp_register_data', JSON.stringify({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      }))

      // 3. Kirim OTP
      const result = await sendOTP(formData.phoneNumber, 'registration')

      if (result.success) {
        // Redirect ke halaman Verify OTP dengan membawa nomor HP di URL
        const encodedPhone = encodeURIComponent(formData.phoneNumber)
        router.push(`/verify-otp?phone=${encodedPhone}&type=registration`)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error(err)
      setError('❌ Terjadi kesalahan sistem. Coba lagi nanti.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-white/20">
          
          {/* ================= HEADER (LOGO & JUDUL) ================= */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Daftar Akun Baru
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Isi data diri Anda untuk bergabung
            </p>
          </div>

          {/* ================= FORM REGISTRASI ================= */}
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* 1. Nama Lengkap */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 ml-1">
                Nama Lengkap
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Contoh: Ahink Ganteng"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* 2. Nomor WhatsApp */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 ml-1">
                Nomor WhatsApp
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="08xxxxxxxxxx"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* 3. Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 ml-1">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* 4. Konfirmasi Password (INTERAKTIF) */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5 ml-1">
                Ulangi Password
              </label>
              <div className="relative">
                {/* Ikon Validasi Kiri (Berubah Warna) */}
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${
                  passMatch === false ? 'text-red-500' : 
                  passMatch === true ? 'text-green-500' : 
                  'text-gray-400'
                }`}>
                  {passMatch === true ? <CheckCircle2 className="h-5 w-5" /> : 
                   passMatch === false ? <XCircle className="h-5 w-5" /> : 
                   <Lock className="h-5 w-5" />}
                </div>
                
                <input
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Ketik ulang password"
                  className={`block w-full pl-10 pr-10 py-3 border rounded-xl leading-5 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all ${
                    passMatch === false 
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                      : passMatch === true 
                      ? 'border-green-500 focus:border-green-500 focus:ring-green-500/20'
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/50'
                  }`}
                  required
                />
                
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Feedback Text di Bawah Input */}
              {passMatch === false && (
                <p className="text-xs text-red-500 mt-1 ml-1 font-medium animate-pulse flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> Password tidak cocok!
                </p>
              )}
              {passMatch === true && (
                <p className="text-xs text-green-600 mt-1 ml-1 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Password cocok.
                </p>
              )}
            </div>

            {/* Error Message Global */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl animate-in fade-in slide-in-from-top-2">
                <p className="text-sm text-red-600 dark:text-red-400 text-center font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || passMatch === false}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/30 transform transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:transform-none mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <span>Kirim Kode OTP</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* ================= FOOTER ================= */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sudah punya akun?{' '}
              <Link href="/login" className="font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                Login disini
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}