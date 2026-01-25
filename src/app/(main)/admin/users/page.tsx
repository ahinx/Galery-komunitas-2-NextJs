// ============================================================================
// MANAGE USERS PAGE
// File: src/app/admin/users/page.tsx
// ============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getAllUsers } from '@/actions/admin'
import UserManagementTable from '@/components/admin/UserManagementTable'
import { Users } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ManageUsersPage() {
  const user = await getCurrentUser()

  // Security Check
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    redirect('/dashboard')
  }

  // Fetch Data
  const { data } = await getAllUsers()
  const users = data?.users || []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin" className="text-sm text-gray-500 hover:text-blue-600 transition">
              ← Kembali ke Dashboard
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Kelola Pengguna
            </h1>
          </div>
        </div>
      </div>

      {/* Client Component Table */}
      <UserManagementTable initialUsers={users} currentUserRole={user.role} />
    </div>
  )
}