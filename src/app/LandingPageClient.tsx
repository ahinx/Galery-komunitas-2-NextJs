// ============================================================================
// LANDING PAGE CLIENT (UI Logic & Components)
// File: src/app/LandingPageClient.tsx
// ============================================================================

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  Camera, 
  Shield, 
  Heart, 
  ArrowRight, 
  AlertTriangle,
  Users,
  Lock,
  Sparkles,
  ImageIcon,
  Clock,
  ChevronRight,
  X,
  CheckCircle2,
  HardDrive
} from 'lucide-react'

// --- Types ---
interface BrandingProps {
  appName: string
  logoUrl: string | null
}

// ============================================================================
// DISCLAIMER MODAL COMPONENT
// ============================================================================
function DisclaimerModal({ 
  isOpen, 
  onAccept,
  appName 
}: { 
  isOpen: boolean
  onAccept: () => void 
  appName: string
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-br from-[#1a1a24] to-[#0f0f15] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Glow Effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
        
        {/* Content */}
        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">
                Sebelum Melanjutkan
              </h2>
              <p className="text-sm text-gray-500">
                Harap baca informasi penting berikut
              </p>
            </div>
          </div>

          {/* Disclaimer Content */}
          <div className="space-y-4 mb-8">
            {/* Point 1 */}
            <div className="flex gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="shrink-0 w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">Proyek Percontohan</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Website ini adalah <strong className="text-amber-300">Pilot Project</strong> yang dibuat secara pribadi. 
                  Belum ada kesepakatan resmi dari pengurus.
                </p>
              </div>
            </div>

            {/* Point 2 */}
            <div className="flex gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="shrink-0 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">Batasan Penyimpanan</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Ruang penyimpanan saat ini hanya <strong className="text-blue-300">5 GB</strong> dan 
                  digunakan untuk keperluan demonstrasi saja.
                </p>
              </div>
            </div>

            {/* Point 3 */}
            <div className="flex gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
              <div className="shrink-0 w-8 h-8 bg-rose-500/20 rounded-lg flex items-center justify-center">
                <X className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white text-sm mb-1">Tanpa Jaminan</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Layanan dapat berubah atau <strong className="text-rose-300">dihentikan sewaktu-waktu</strong> dan akan di informasikan di WA terdaftar.
                </p>
              </div>
            </div>
          </div>

          {/* Creator Info */}
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-xl mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
              A
            </div>
            <div>
              <p className="text-sm font-medium text-white">Ahinxkritinx</p>
              <p className="text-xs text-gray-500">Inisiator & Developer</p>
            </div>
          </div>

          {/* Accept Button */}
          <button
            onClick={onAccept}
            className="group w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-2xl transition-all active:scale-[0.98]"
          >
            <CheckCircle2 className="w-5 h-5" />
            Saya Mengerti & Setuju
          </button>

          {/* Small Note */}
          <p className="text-center text-xs text-gray-600 mt-4">
            Dengan melanjutkan, Anda menyetujui bahwa ini adalah proyek percontohan
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// MAIN LANDING PAGE COMPONENT
// ============================================================================
export default function LandingPageClient({ branding }: { branding: BrandingProps }) {
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  
  // Destructure Branding
  const { appName, logoUrl } = branding

  useEffect(() => {
    // Cek apakah user sudah pernah accept disclaimer
    const acceptedTime = localStorage.getItem('disclaimer_accepted_at')
    
    if (acceptedTime) {
      // Cek apakah sudah lebih dari 7 hari
      const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000 
      const timePassed = Date.now() - parseInt(acceptedTime)
      
      if (timePassed < sevenDaysInMs) {
        return
      }
    }
    
    // Delay 2 detik sebelum tampilkan modal
    const timer = setTimeout(() => {
      setShowDisclaimer(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  const handleAcceptDisclaimer = () => {
    localStorage.setItem('disclaimer_accepted_at', Date.now().toString())
    setShowDisclaimer(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      
      {/* Disclaimer Modal */}
      <DisclaimerModal 
        isOpen={showDisclaimer} 
        onAccept={handleAcceptDisclaimer}
        appName={appName} 
      />
      
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] bg-purple-600/10 rounded-full blur-[80px] animate-pulse delay-500" />
        
        {/* Grid Pattern Overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Noise Texture */}
        <div 
          className="absolute inset-0 opacity-[0.4]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10">
        
        {/* Navigation */}
        <nav className="px-6 py-5 max-w-6xl mx-auto">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              {logoUrl ? (
                 <img src={logoUrl} alt={appName} className="h-10 w-auto object-contain" />
              ) : (
                <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
                    <div className="relative p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                    <Camera className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                </div>
              )}
              
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {appName}
              </span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-3">
              <Link 
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Masuk
              </Link>
              <Link 
                href="/register"
                className="px-5 py-2.5 text-sm font-semibold bg-white/10 hover:bg-white/15 backdrop-blur-sm border border-white/10 rounded-full transition-all hover:scale-[1.02]"
              >
                Daftar
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="px-6 pt-16 pb-24 md:pt-24 md:pb-32 max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-full">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Platform Galeri Komunitas</span>
              </div>

              {/* Headline */}
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  <span className="text-white">Simpan Momen,</span>
                  <br />
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                    Rawat Ingatan.
                  </span>
                </h1>
                <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-xl">
                  Ruang digital khusus untuk keluarga {appName}. Upload foto kegiatan, arsipkan kenangan berharga, dan nikmati privasi yang sepenuhnya terjaga.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/register"
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-white overflow-hidden rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {/* Button Gradient Background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Shine Effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  </div>
                  <span className="relative">Mulai Bergabung</span>
                  <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <Link 
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 font-semibold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Sudah punya akun?
                  <ChevronRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Lock className="w-4 h-4 text-green-500" />
                  <span>End-to-end secure</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Users className="w-4 h-4 text-blue-500" />
                  <span>Khusus anggota</span>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative lg:h-[500px]">
              {/* Main Card */}
              <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">
                {/* Floating Glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 rounded-[32px] blur-2xl opacity-50" />
                
                <div className="relative space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">Galeri Kegiatan</p>
                        <p className="text-xs text-gray-500">24 foto baru</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                      Live
                    </span>
                  </div>

                  {/* Photo Grid Preview */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      'from-blue-600/40 to-indigo-600/40',
                      'from-purple-600/40 to-pink-600/40',
                      'from-amber-600/40 to-orange-600/40',
                      'from-emerald-600/40 to-teal-600/40',
                      'from-rose-600/40 to-red-600/40',
                      'from-cyan-600/40 to-blue-600/40',
                    ].map((gradient, i) => (
                      <div 
                        key={i}
                        className={`aspect-square bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <Camera className="w-6 h-6 text-white/60" />
                      </div>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-2xl font-bold text-white">248</p>
                      <p className="text-xs text-gray-500">Total Foto</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-2xl font-bold text-white">12</p>
                      <p className="text-xs text-gray-500">Album</p>
                    </div>
                    <div className="text-center p-3 bg-white/5 rounded-xl">
                      <p className="text-2xl font-bold text-white">45</p>
                      <p className="text-xs text-gray-500">Anggota</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 p-4 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl border border-emerald-500/20 rounded-2xl animate-bounce" style={{ animationDuration: '3s' }}>
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>

              <div className="absolute -bottom-4 -left-4 p-4 bg-gradient-to-br from-rose-500/20 to-pink-500/20 backdrop-blur-xl border border-rose-500/20 rounded-2xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
                <Heart className="w-6 h-6 text-rose-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            {/* Section Header */}
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Kenapa <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{appName}</span>?
              </h2>
              <p className="text-gray-500 max-w-2xl mx-auto">
                Didesain khusus untuk kebutuhan berbagi kenangan dengan fitur-fitur unggulan
              </p>
            </div>

            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="group p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-blue-500/30 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 mb-6 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Shield className="w-7 h-7 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Aman & Privat</h3>
                <p className="text-gray-500 leading-relaxed">
                  Foto-foto komunitas hanya bisa diakses oleh anggota terverifikasi. Tidak ada akses publik.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-indigo-500/30 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 mb-6 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Kualitas Asli</h3>
                <p className="text-gray-500 leading-relaxed">
                  Upload foto dengan resolusi penuh tanpa kompresi. Kenangan tersimpan dalam kualitas terbaik.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-3xl hover:border-purple-500/30 transition-all hover:-translate-y-1">
                <div className="w-14 h-14 mb-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock className="w-7 h-7 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">Arsip Aman</h3>
                <p className="text-gray-500 leading-relaxed">
                Semua momen tersimpan dengan aman. Akses kapan saja, dari mana saja.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="px-6 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="relative p-6 sm:p-8 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl" />
              
              <div className="relative flex gap-4 sm:gap-6">
                <div className="shrink-0">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-bold text-amber-300 uppercase tracking-wider text-sm">
                    Disclaimer Inisiator
                  </h3>
                  <div className="space-y-3 text-amber-200/80 leading-relaxed">
                    <p>
                      Website ini adalah <strong className="text-amber-100">proyek percontohan (Pilot Project)</strong> yang 
                      dibuat secara pribadi untuk mendemonstrasikan sistem galeri komunitas. 
                      Belum ada kesepakatan resmi dari pengurus. Mohon gunakan dengan bijak.
                    </p>
                    <p>
                      <strong className="text-amber-100">⚠️ Batasan:</strong> Ruang penyimpanan saat ini hanya <strong className="text-amber-100">5 GB</strong> dan 
                      digunakan untuk keperluan demonstrasi saja. Layanan dapat berubah atau dihentikan sewaktu-waktu tanpa pemberitahuan.
                    </p>
                  </div>
                  
                  {/* Creator Info */}
                  <div className="pt-6 mt-6 border-t border-amber-500/20">
                    <div className="flex flex-col items-center justify-center text-center">
                      
                      {/* Nama */}
                      <p className="text-sm text-amber-300/70">
                        Dibuat oleh: <strong className="text-amber-200">Ahinxkritinx</strong>
                      </p>
                      
                      {/* Role */}
                      <p className="text-xs text-amber-400/50 mt-1 mb-3">
                        Inisiator &amp; Developer
                      </p>

                      {/* Tanggal (Badge Style Centered) */}
                      <div className="inline-flex items-center gap-2 bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-500/10">
                        <span className="text-[10px] uppercase tracking-wider text-amber-500/40 font-semibold">
                        Waktu Pengerjaan
                        </span>
                        {/* Divider Kecil di dalam badge */}
                        <div className="w-px h-3 bg-amber-500/20" />
                        <span className="text-xs font-mono text-amber-300/60">
                          23 Jan '26 - Sekarang
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative p-12 sm:p-16 bg-gradient-to-br from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-white/10 rounded-[32px] overflow-hidden">
              {/* Background Elements */}
              <div className="absolute inset-0">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-600/30 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-600/30 rounded-full blur-[100px]" />
              </div>

              <div className="relative space-y-8">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                  Siap Bergabung?
                </h2>
                <p className="text-xl text-gray-400 max-w-xl mx-auto">
                  Jadilah bagian dari komunitas digital kita dan mulai berbagi momen berharga.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link 
                    href="/register"
                    className="group inline-flex items-center justify-center gap-2 px-10 py-4 font-semibold text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl transition-all hover:scale-[1.02]"
                  >
                    Daftar Sekarang
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-lg">
                <Camera className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm font-semibold text-gray-500">{appName}</span>
            </div>

            {/* Copyright */}
            <p className="text-xs text-gray-600 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Ahinxkritinx • Semua Hak Dilindungi
            </p>

            {/* Links */}
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Masuk
              </Link>
              <Link href="/register" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Daftar
              </Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}