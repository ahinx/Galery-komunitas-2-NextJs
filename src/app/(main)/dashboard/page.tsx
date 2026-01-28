// ============================================================================
// DASHBOARD PAGE (SERVER COMPONENT) - OPTIMIZED
// File: src/app/(main)/dashboard/page.tsx
// ============================================================================

import { getCurrentUser } from '@/actions/auth'
import { getPhotosPaginated, getPhotoStats } from '@/actions/photos'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

interface DashboardProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const INITIAL_LOAD_LIMIT = 20

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const user = await getCurrentUser()
  if (!user) return null

  const params = await searchParams
  const searchQuery = typeof params.q === 'string' ? params.q : ''

  // Parallel fetch
  const [photosResult, statsResult] = await Promise.all([
    getPhotosPaginated({
      limit: INITIAL_LOAD_LIMIT,
      searchQuery: searchQuery,
    }),
    getPhotoStats()
  ])

  const photosData = photosResult.success && photosResult.data 
    ? photosResult.data 
    : { photos: [], hasMore: false, nextCursor: null }
  
  const stats = statsResult.success && statsResult.data 
    ? statsResult.data 
    : { total: 0, thisMonth: 0, totalSize: 0 }

  return (
    <DashboardClient 
      initialPhotos={photosData.photos}
      initialHasMore={photosData.hasMore}
      initialCursor={photosData.nextCursor}
      user={user}
      searchQuery={searchQuery}
      serverStats={stats}
    />
  )
}