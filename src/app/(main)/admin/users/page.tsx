// ============================================================================
// MANAGE USERS PAGE (Mobile Centered Header)
// File: src/app/(main)/admin/users/page.tsx
// Deskripsi: Halaman tabel user dengan header responsif (Rata Tengah di HP)
// ============================================================================

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/actions/auth'
import { getAllUsers } from '@/actions/admin' 
import UserManagementTable from '@/components/admin/UserManagementTable' 
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ManageUsersPage() {
  const user = await getCurrentUser()

  // 1. Security Check
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    redirect('/dashboard')
  }

  // 2. Fetch Data Semua User
  const { data, success, message } = await getAllUsers()
  
  // Fallback jika data kosong/error
  const users = success && data?.users ? data.users : []

  if (!success) {
    console.error("Gagal mengambil data users:", message)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER SECTION */}
      <div className="mb-8">
        
        {/* Tombol Kembali (Disembunyikan di Mobile) */}
        <Link 
          href="/admin" 
          className="hidden md:inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors mb-6 group w-fit"
        >
          <div className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          </div>
          <span>Kembali ke Dashboard</span>
        </Link>

        {/* Judul & Info Halaman (Rata Tengah di Mobile) */}
        {/* Perubahan: flex-col items-center text-center -> md:flex-row md:items-start md:text-left */}
        <div className="flex flex-col items-center text-center md:flex-row md:items-center md:justify-between md:text-left gap-4">
          
          <div className="flex flex-col items-center md:flex-row md:items-center gap-4">
            {/* Icon Box */}
            <div className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            
            {/* Teks Judul */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Kelola Pengguna
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Database lengkap {users.length} anggota komunitas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Interaktif */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <UserManagementTable initialUsers={users} currentUserRole={user.role} />
      </div>
      
    </div>
  )
}