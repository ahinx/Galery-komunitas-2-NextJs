// ============================================================================
// LOGIN PAGE CLIENT (UI Logic & Components)
// File: src/app/(auth)/login/LoginClient.tsx
// Deskripsi: Tampilan Login yang menerima props branding
// ============================================================================

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/actions/auth'
import { Camera, Loader2, Eye, EyeOff, User, Lock, ArrowRight, AlertCircle } from 'lucide-react'
import Link from 'next/link'

// Interface props yang diterima dari Server Component
interface BrandingProps {
  appName: string
  logoUrl: string | null
}

export default function LoginClient({ branding }: { branding: BrandingProps }) {
  const router = useRouter()
  
  // Destructure data branding agar mudah dipanggil
  const { appName, logoUrl } = branding

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!identifier || !password) {
      setError('Nomor/Nama dan password harus diisi')
      return
    }

    setIsLoading(true)

    try {
      const result = await login(identifier, password)

      if (result.success) {
        if (result.data?.needsApproval) {
          router.push('/waiting-room')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-30%] left-[-20%] w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[400px] h-[400px] bg-indigo-600/15 rounded-full blur-[80px]" />
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
        
        {/* Header - Compact & Branding Connected */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-3 group">
            
            {/* LOGIC: Logo dari Database (Sekarang dibungkus background gradient) */}
            {logoUrl ? (
                <div className="p-2 bg-gradient-to-b from-white to-gray-400 rounded-xl">
                  <img 
                    src={logoUrl} 
                    alt={appName} 
                    className="h-5 w-auto object-contain" 
                  />
                </div>
            ) : (
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Camera className="w-4 h-4 text-white" strokeWidth={2.5} />
                </div>
            )}
            
            {/* LOGIC: Nama App dari Database */}
            <span className="text-lg font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {appName}
            </span>
          </Link>

          <Link 
            href="/register"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Daftar
          </Link>
        </div>

        {/* Login Card */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
            
            {/* Title - Dinamis sesuai AppName */}
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">
                Selamat Datang
              </h1>
              <p className="text-sm text-gray-500">
                Masuk ke akun {appName} kamu
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="identifier" className="block text-xs font-medium text-gray-400">
                  Nomor WhatsApp / Nama
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="identifier"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="08xx atau nama kamu"
                    className="w-full px-4 py-3 pl-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    required
                  />
                  <User className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-medium text-gray-400">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full px-4 py-3 pl-11 pr-11 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    required
                  />
                  <Lock className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <Link 
                  href="/reset-password" 
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Lupa password?
                </Link>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="group w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-gray-600 disabled:to-gray-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[#0a0a0f]/80 text-xs text-gray-500">
                  atau
                </span>
              </div>
            </div>

            <Link
              href="/register"
              className="block w-full text-center px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-medium rounded-xl transition-all active:scale-[0.98]"
            >
              Buat Akun Baru
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} <span className="text-gray-500">{appName}</span> • v0.1-beta
          </p>
        </div>

      </div>
    </div>
  )
}