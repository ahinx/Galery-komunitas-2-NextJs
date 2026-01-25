// ============================================================================
// USER MANAGEMENT TABLE (POWER FEATURES)
// File: src/components/admin/UserManagementTable.tsx
// Deskripsi: Tabel manajemen user dengan Filter Canggih & Smart Actions
// ============================================================================

'use client'

import { useState } from 'react'
import { Profile } from '@/lib/supabase/client'
import { changeUserRole, banUser, approveUser, deleteUser } from '@/actions/admin'
import { 
  Search, Filter, Shield, User, 
  Trash2, Ban, CheckCircle2, Loader2, Undo2, XCircle
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface Props {
  initialUsers: Profile[]
  currentUserRole: string
}

type FilterStatus = 'all' | 'approved' | 'pending' | 'rejected'
type FilterRole = 'all' | 'member' | 'admin' | 'super_admin'

export default function UserManagementTable({ initialUsers, currentUserRole }: Props) {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [roleFilter, setRoleFilter] = useState<FilterRole>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  // ================= FILTER LOGIC =================
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          u.phone_number.includes(search)
    const matchesStatus = statusFilter === 'all' ? true : u.status === statusFilter
    const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter
    
    return matchesSearch && matchesStatus && matchesRole
  })

  // ================= ACTIONS =================

  // 1. Ganti Role
  const handleRoleChange = async (userId: string, newRole: 'member' | 'admin' | 'super_admin') => {
    if (!confirm(`Ubah role user ini menjadi ${newRole}?`)) return
    setLoadingId(userId)
    const res = await changeUserRole(userId, newRole)
    if (res.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
    } else {
      alert(res.message)
    }
    setLoadingId(null)
  }

  // 2. Approve (Untuk Pending atau Recovery Rejected)
  const handleApprove = async (userId: string) => {
    setLoadingId(userId)
    const res = await approveUser(userId)
    if (res.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'approved', is_approved: true } : u))
    } else {
      alert(res.message)
    }
    setLoadingId(null)
  }

  // 3. Reject/Ban (Untuk Pending atau Active)
  const handleReject = async (userId: string) => {
    if (!confirm("Yakin ingin menolak/memblokir user ini?")) return
    setLoadingId(userId)
    const res = await banUser(userId)
    if (res.success) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'rejected', is_approved: false } : u))
    } else {
      alert(res.message)
    }
    setLoadingId(null)
  }

  // 4. Delete Permanen
  const handleDelete = async (userId: string) => {
    if (!confirm('BAHAYA: Menghapus user akan menghapus SEMUA data & foto mereka permanen. Lanjutkan?')) return
    setLoadingId(userId)
    const res = await deleteUser(userId)
    if (res.success) {
      setUsers(users.filter(u => u.id !== userId))
    } else {
      alert(res.message)
    }
    setLoadingId(null)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col">
      
      {/* TOOLBAR FILTER */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col lg:flex-row gap-4 justify-between">
        
        {/* Search Bar */}
        <div className="relative w-full lg:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau WhatsApp..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          
          {/* Status Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
              className="pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="approved">✅ Aktif</option>
              <option value="pending">⏳ Pending</option>
              <option value="rejected">🚫 Ditolak</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as FilterRole)}
              className="pl-9 pr-8 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
            >
              <option value="all">Semua Role</option>
              <option value="member">👤 Member</option>
              <option value="admin">🛡️ Admin</option>
              <option value="super_admin">⚡ Super Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* STATUS BAR (Opsional: Info jumlah) */}
      <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border-b border-blue-100 dark:border-blue-900/30 text-xs text-blue-600 dark:text-blue-400 flex gap-4">
        <span>Total: <b>{filteredUsers.length}</b></span>
        <span>Approved: <b>{filteredUsers.filter(u => u.status === 'approved').length}</b></span>
        <span>Pending: <b>{filteredUsers.filter(u => u.status === 'pending').length}</b></span>
        <span>Rejected: <b>{filteredUsers.filter(u => u.status === 'rejected').length}</b></span>
      </div>

      {/* TABLE DATA */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700 sticky top-0 backdrop-blur-sm">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4 text-right">Kontrol Akses</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {filteredUsers.map((user) => (
              <tr key={user.id} className={`group transition-colors ${
                user.status === 'rejected' ? 'bg-red-50/30 hover:bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
              }`}>
                
                {/* 1. INFO USER */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden shadow-sm">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} className="w-full h-full object-cover" />
                      ) : user.full_name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {user.full_name}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{user.phone_number}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">Daftar: {formatDateTime(user.created_at)}</p>
                    </div>
                  </div>
                </td>

                {/* 2. STATUS BADGE */}
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                    user.status === 'approved' 
                      ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400'
                      : user.status === 'rejected'
                      ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
                      : 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 animate-pulse'
                  }`}>
                    {user.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                    {user.status === 'rejected' && <Ban className="w-3 h-3" />}
                    {user.status === 'pending' && <Loader2 className="w-3 h-3 animate-spin" />}
                    
                    {user.status === 'approved' ? 'Aktif' : user.status === 'rejected' ? 'Ditolak' : 'Menunggu'}
                  </span>
                </td>

                {/* 3. ROLE SELECTOR */}
                <td className="px-6 py-4">
                  {currentUserRole === 'super_admin' ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as any)}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:border-blue-400 transition-colors"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  ) : (
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded capitalize">
                      {user.role.replace('_', ' ')}
                    </span>
                  )}
                </td>

                {/* 4. SMART ACTIONS */}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {loadingId === user.id ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    ) : (
                      <>
                        {/* KONDISI: USER REJECTED -> Tampilkan TOMBOL PULIHKAN */}
                        {user.status === 'rejected' && (
                          <button
                            onClick={() => handleApprove(user.id)}
                            title="Pulihkan / Setujui Kembali"
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-medium transition border border-green-200"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Pulihkan
                          </button>
                        )}

                        {/* KONDISI: USER PENDING -> Tampilkan APPROVE & REJECT */}
                        {user.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(user.id)}
                              title="Setujui"
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleReject(user.id)}
                              title="Tolak"
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}

                        {/* KONDISI: USER ACTIVE -> Tampilkan BAN */}
                        {user.status === 'approved' && (
                          <button
                            onClick={() => handleReject(user.id)}
                            title="Blokir User"
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <Ban className="w-5 h-5" />
                          </button>
                        )}

                        {/* SUPER ADMIN: DELETE PERMANENT */}
                        {currentUserRole === 'super_admin' && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            title="Hapus Permanen"
                            className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-2 border-l border-gray-200 pl-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>

              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <User className="w-8 h-8 text-gray-300" />
                    <p>Tidak ada user yang cocok dengan filter.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}