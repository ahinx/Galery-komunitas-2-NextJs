// ============================================================================
// REGISTER PAGE CLIENT
// File: src/app/(auth)/register/RegisterClient.tsx
// ============================================================================

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { sendOTP } from '@/actions/auth'
import { 
  Camera,
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  User, 
  Phone, 
  Lock, 
  XCircle, 
  ArrowRight,
  AlertCircle
} from 'lucide-react'

// Interface Props
interface BrandingProps {
  appName: string
  logoUrl: string | null
}

export default function RegisterClient({ branding }: { branding: BrandingProps }) {
  const router = useRouter()
  const { appName, logoUrl } = branding
  
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

  // Validasi Visual
  const [passMatch, setPassMatch] = useState<boolean | null>(null)
  const [passLength, setPassLength] = useState<boolean | null>(null)
  const [nameValid, setNameValid] = useState<boolean | null>(null)
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null)
  const [error, setError] = useState('')

  // ================= REAL-TIME VALIDATION =================
  useEffect(() => {
    // Validasi nama (minimal 3 karakter)
    if (formData.fullName) {
      setNameValid(formData.fullName.trim().length >= 3)
    } else {
      setNameValid(null)
    }
  }, [formData.fullName])

  useEffect(() => {
    // Validasi nomor telepon (minimal 10 digit, hanya angka)
    if (formData.phoneNumber) {
      const phoneRegex = /^[0-9+]{10,15}$/
      setPhoneValid(phoneRegex.test(formData.phoneNumber.replace(/\s/g, '')))
    } else {
      setPhoneValid(null)
    }
  }, [formData.phoneNumber])

  useEffect(() => {
    // Validasi panjang password (minimal 6 karakter)
    if (formData.password) {
      setPassLength(formData.password.length >= 6)
    } else {
      setPassLength(null)
    }
  }, [formData.password])

  useEffect(() => {
    // Cek kesamaan password
    if (formData.confirmPassword) {
      setPassMatch(formData.password === formData.confirmPassword)
    } else {
      setPassMatch(null)
    }
  }, [formData.password, formData.confirmPassword])

  // ================= HANDLERS =================
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validasi final dengan pesan Indonesia
    if (!formData.fullName.trim()) {
      setError('Nama lengkap wajib diisi')
      return
    }
    if (formData.fullName.trim().length < 3) {
      setError('Nama lengkap minimal 3 karakter')
      return
    }
    if (!formData.phoneNumber.trim()) {
      setError('Nomor WhatsApp wajib diisi')
      return
    }
    if (!phoneValid) {
      setError('Format nomor WhatsApp tidak valid')
      return
    }
    if (!formData.password) {
      setError('Password wajib diisi')
      return
    }
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter')
      return
    }
    if (!formData.confirmPassword) {
      setError('Konfirmasi password wajib diisi')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi tidak cocok')
      return
    }

    setIsLoading(true)

    try {
      sessionStorage.setItem('temp_register_data', JSON.stringify({
        fullName: formData.fullName,
        phoneNumber: formData.phoneNumber,
        password: formData.password
      }))

      const result = await sendOTP(formData.phoneNumber, 'registration')

      if (result.success) {
        const encodedPhone = encodeURIComponent(formData.phoneNumber)
        router.push(`/verify-otp?phone=${encodedPhone}&type=registration`)
      } else {
        // Terjemahkan error dari server jika perlu
        const errorMsg = result.message
          .replace('Format nomor tidak valid', 'Format nomor WhatsApp tidak valid')
          .replace('already registered', 'sudah terdaftar')
          .replace('Invalid', 'Tidak valid')
          .replace('Error', 'Kesalahan')
        setError(errorMsg)
      }
    } catch (err) {
      console.error(err)
      setError('Terjadi kesalahan sistem. Silakan coba lagi nanti.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] right-[-20%] w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-30%] left-[-20%] w-[400px] h-[400px] bg-blue-600/15 rounded-full blur-[80px]" />
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col px-5 py-6 max-w-md mx-auto w-full">
        
        {/* Header - Compact */}
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-3 group">
            
            {/* LOGIC LOGO SESUAI PERMINTAAN */}
            {logoUrl ? (
                // Ada Logo: Background Putih-Abu
                <div className="p-2 bg-gradient-to-b from-white to-gray-400 rounded-xl">
                  <img 
                    src={logoUrl} 
                    alt={appName} 
                    className="h-5 w-auto object-contain" 
                  />
                </div>
            ) : (
                // Tidak Ada Logo: Background Biru (Seperti semula)
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Camera className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
            )}

            {/* Nama Aplikasi */}
            <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {appName}
            </span>

          </Link>
          <Link 
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Masuk
          </Link>
        </div>

        {/* Register Card */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl">
            
            {/* Title - Compact */}
            <div className="text-center mb-5">
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                Buat Akun Baru
              </h1>
              <p className="text-xs sm:text-sm text-gray-500">
                Isi data diri untuk bergabung di {appName}
              </p>
            </div>

            {/* Form - noValidate untuk disable browser validation */}
            <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
              
              {/* Nama Lengkap */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400 ml-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Contoh: Budi Santoso"
                    className={`w-full px-4 py-2.5 pl-10 bg-white/5 border rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      nameValid === false 
                        ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30' 
                        : nameValid === true 
                        ? 'border-green-500/50 focus:border-green-500/50 focus:ring-green-500/30'
                        : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/50'
                    }`}
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    nameValid === false ? 'text-red-400' : 
                    nameValid === true ? 'text-green-400' : 
                    'text-gray-500'
                  }`}>
                    {nameValid === true ? <CheckCircle2 className="w-4 h-4" /> : 
                     nameValid === false ? <XCircle className="w-4 h-4" /> : 
                     <User className="w-4 h-4" />}
                  </div>
                </div>
                {nameValid === false && (
                  <p className="text-[11px] text-red-400 ml-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Minimal 3 karakter
                  </p>
                )}
              </div>

              {/* Nomor WhatsApp */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400 ml-1">
                  Nomor WhatsApp
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="08xxxxxxxxxx"
                    className={`w-full px-4 py-2.5 pl-10 bg-white/5 border rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      phoneValid === false 
                        ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30' 
                        : phoneValid === true 
                        ? 'border-green-500/50 focus:border-green-500/50 focus:ring-green-500/30'
                        : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/50'
                    }`}
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    phoneValid === false ? 'text-red-400' : 
                    phoneValid === true ? 'text-green-400' : 
                    'text-gray-500'
                  }`}>
                    {phoneValid === true ? <CheckCircle2 className="w-4 h-4" /> : 
                     phoneValid === false ? <XCircle className="w-4 h-4" /> : 
                     <Phone className="w-4 h-4" />}
                  </div>
                </div>
                {phoneValid === false && (
                  <p className="text-[11px] text-red-400 ml-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Format nomor tidak valid
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400 ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Minimal 6 karakter"
                    className={`w-full px-4 py-2.5 pl-10 pr-10 bg-white/5 border rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      passLength === false 
                        ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30' 
                        : passLength === true 
                        ? 'border-green-500/50 focus:border-green-500/50 focus:ring-green-500/30'
                        : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/50'
                    }`}
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    passLength === false ? 'text-red-400' : 
                    passLength === true ? 'text-green-400' : 
                    'text-gray-500'
                  }`}>
                    {passLength === true ? <CheckCircle2 className="w-4 h-4" /> : 
                     passLength === false ? <XCircle className="w-4 h-4" /> : 
                     <Lock className="w-4 h-4" />}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passLength === false && (
                  <p className="text-[11px] text-red-400 ml-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Minimal 6 karakter
                  </p>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-400 ml-1">
                  Ulangi Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Ketik ulang password"
                    className={`w-full px-4 py-2.5 pl-10 pr-10 bg-white/5 border rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 transition-all ${
                      passMatch === false 
                        ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30' 
                        : passMatch === true 
                        ? 'border-green-500/50 focus:border-green-500/50 focus:ring-green-500/30'
                        : 'border-white/10 focus:border-blue-500/50 focus:ring-blue-500/50'
                    }`}
                  />
                  <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                    passMatch === false ? 'text-red-400' : 
                    passMatch === true ? 'text-green-400' : 
                    'text-gray-500'
                  }`}>
                    {passMatch === true ? <CheckCircle2 className="w-4 h-4" /> : 
                     passMatch === false ? <XCircle className="w-4 h-4" /> : 
                     <Lock className="w-4 h-4" />}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Feedback Text */}
                {passMatch === false && (
                  <p className="text-[11px] text-red-400 ml-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Password tidak cocok
                  </p>
                )}
                {passMatch === true && (
                  <p className="text-[11px] text-green-400 ml-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Password cocok
                  </p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || passMatch === false || passLength === false || nameValid === false || phoneValid === false}
                className="group w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all active:scale-[0.98] mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Kirim Kode OTP
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer Link */}
            <div className="mt-5 pt-4 border-t border-white/10 text-center">
              <p className="text-sm text-gray-500">
                Sudah punya akun?{' '}
                <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                  Masuk disini
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer - Compact */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} <span className="text-gray-500">{appName}</span> • v0.1-beta
          </p>
        </div>

      </div>
    </div>
  )
}