// ============================================================================
// DASHBOARD PAGE (Main Gallery)
// File: src/app/dashboard/page.tsx
// Deskripsi: Halaman utama galeri dengan masonry grid
// ============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getPhotos } from '@/actions/photos'
import PhotoGrid from '@/components/gallery/PhotoGrid'
import { Images, Upload, User, LogOut } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  // Redirect jika belum login
  if (!user) {
    redirect('/login')
  }

  // Redirect jika belum approved
  if (!user.is_approved) {
    redirect('/waiting-room')
  }

  // Fetch photos
  const photosResult = await getPhotos({
    userId: user.role === 'member' ? user.id : undefined,
  })

  const photos = photosResult.success ? photosResult.data?.photos || [] : []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Images className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                  Galeri Foto
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.full_name}
                </p>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
              >
                <Images className="w-4 h-4" />
                Galeri
              </Link>

              <Link
                href="/upload"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Link>

              {user.role !== 'member' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <User className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.full_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {user.role.replace('_', ' ')}
                </p>
              </div>

              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Total Foto
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {photos.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Images className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Bulan Ini
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {photos.filter(p => {
                    const photoDate = new Date(p.created_at)
                    const now = new Date()
                    return photoDate.getMonth() === now.getMonth() &&
                           photoDate.getFullYear() === now.getFullYear()
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Upload className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Status
                </p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  Aktif
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <PhotoGrid
            photos={photos}
            showUserInfo={user.role !== 'member'}
            canDelete={true}
          />
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
        <div className="grid grid-cols-3 h-16">
          <Link
            href="/dashboard"
            className="flex flex-col items-center justify-center gap-1 text-blue-600 dark:text-blue-400"
          >
            <Images className="w-5 h-5" />
            <span className="text-xs font-medium">Galeri</span>
          </Link>

          <Link
            href="/upload"
            className="flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400"
          >
            <Upload className="w-5 h-5" />
            <span className="text-xs font-medium">Upload</span>
          </Link>

          <Link
            href="/profile"
            className="flex flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-400"
          >
            <User className="w-5 h-5" />
            <span className="text-xs font-medium">Profil</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}