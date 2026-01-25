// ============================================================================
// DASHBOARD PAGE (SERVER COMPONENT)
// File: src/app/(main)/dashboard/page.tsx
// Deskripsi: Fetch data foto & stats global
// ============================================================================

import { getCurrentUser } from '@/actions/auth'
import { getPhotos, getPhotoStats } from '@/actions/photos' // Import getPhotoStats
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const user = await getCurrentUser()
  if (!user) return null

  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : ''

  // 1. Fetch Foto (Shared Gallery)
  const photosResult = await getPhotos({
    searchQuery: searchQuery,
    limit: 100,
  })

  // 2. Fetch Global Stats (Server Side Calculation)
  const statsResult = await getPhotoStats()

  const photos = photosResult.success ? photosResult.data?.photos || [] : []
  
  // Default values jika stats gagal load
  const stats = statsResult.success && statsResult.data ? statsResult.data : {
    total: 0,
    thisMonth: 0,
    totalSize: 0
  }

  return (
    <DashboardClient 
      initialPhotos={photos}
      user={user}
      searchQuery={searchQuery}
      serverStats={stats} // <--- Kirim Stats ke Client
    />
  )
}