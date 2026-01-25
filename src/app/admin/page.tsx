// ============================================================================
// ADMIN DASHBOARD PAGE
// File: src/app/admin/page.tsx
// Deskripsi: Dashboard admin untuk kelola user dan foto
// ============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getUserStatistics, getPendingApprovals } from '@/actions/admin'
import { formatFileSize } from '@/lib/utils'
import { Users, Image, Clock, HardDrive, ShieldCheck, UserCheck } from 'lucide-react'
import Link from 'next/link'
import ApprovalCard from '@/components/admin/ApprovalCard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const user = await getCurrentUser()

  // Redirect jika bukan admin
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    redirect('/dashboard')
  }

  // Fetch statistics
  const statsResult = await getUserStatistics()
  const stats = statsResult.data || {
    totalUsers: 0,
    pendingApprovals: 0,
    totalPhotos: 0,
    totalStorage: 0,
  }

  // Fetch pending approvals
  const approvalsResult = await getPendingApprovals()
  const pendingUsers = approvalsResult.data?.users || []

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Kelola user dan moderasi konten
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/admin/users"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Kelola User
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Lihat dan kelola semua user
            </p>
          </Link>

          <Link
            href="/admin/photos"
            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center gap-3 mb-2">
              <Image className="w-6 h-6 text-green-600 dark:text-green-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Moderasi Foto
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Review dan moderasi foto
            </p>
          </Link>

          {user.role === 'super_admin' && (
            <Link
              href="/trash"
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition"
            >
              <div className="flex items-center gap-3 mb-2">
                <HardDrive className="w-6 h-6 text-red-600 dark:text-red-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Tempat Sampah
                </h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Kelola foto yang dihapus
              </p>
            </Link>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total User
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalUsers}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Pending Approval
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.pendingApprovals}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                <Image className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Total Foto
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats.totalPhotos}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Storage Used
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {formatFileSize(stats.totalStorage)}
            </p>
          </div>
        </div>

        {/* Pending Approvals Section */}
        {pendingUsers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <UserCheck className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pending Approval ({pendingUsers.length})
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingUsers.map((pendingUser) => (
                <ApprovalCard key={pendingUser.id} user={pendingUser} />
              ))}
            </div>
          </div>
        )}

        {/* No Pending Approvals */}
        {pendingUsers.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 border border-gray-200 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mx-auto mb-4 flex items-center justify-center">
              <UserCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Tidak Ada Approval Pending
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Semua user sudah disetujui atau belum ada pendaftaran baru
            </p>
          </div>
        )}

        {/* Back to Dashboard */}
        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
          >
            ← Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}