// ============================================================================
// ADMIN DASHBOARD PAGE (Header Mobile Centered Fix)
// File: src/app/(main)/admin/page.tsx
// Deskripsi: Dashboard admin dengan layout header rata tengah di mobile
// ============================================================================

import { getCurrentUser } from '@/actions/auth'
import { getPendingUsers } from '@/actions/admin' 
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert
} from 'lucide-react'
import ApprovalCard from '@/components/admin/ApprovalCard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()
  
  if (!user || !['admin', 'super_admin'].includes(user.role)) {
    redirect('/dashboard')
  }

  const pendingUsersRes = await getPendingUsers()
  const pendingUsers = pendingUsersRes.success ? pendingUsersRes.data || [] : []

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER SECTION */}
      {/* Perubahan: text-center (Mobile) -> sm:text-left (Desktop) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-gray-200 dark:border-gray-700 pb-6 text-center md:text-left">
        
        {/* Judul & Deskripsi */}
        <div className="flex flex-col items-center md:items-start">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Pusat kontrol & approval anggota komunitas.
          </p>
        </div>

        {/* Tombol Aksi */}
        <Link 
          href="/admin/users"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 dark:bg-gray-700 text-white font-medium rounded-xl hover:bg-gray-800 transition shadow-lg active:scale-95 w-full md:w-auto"
        >
          <Users className="w-4 h-4" />
          Kelola Users
        </Link>
      </div>

      {/* CONTENT: LIST APPROVAL */}
      <div className="space-y-4">
        {/* Sub-header Permintaan (Rata Kiri tetap oke, atau mau tengah juga?) */}
        {/* Defaultnya kita biarkan rata kiri agar rapi dengan grid, tapi flex items-center membuatnya rapi */}
        <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Permintaan Bergabung 
            <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
              {pendingUsers.length}
            </span>
          </h2>
        </div>

        {pendingUsers.length > 0 ? (
          // Grid responsif
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingUsers.map(u => (
              <ApprovalCard key={u.id} user={u} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
               <ShieldCheck className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Semua Bersih!</h3>
            <p className="text-gray-500 text-sm mt-1">Tidak ada permintaan pending saat ini.</p>
          </div>
        )}
      </div>

    </div>
  )
}