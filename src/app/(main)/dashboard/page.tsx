// ============================================================================
// DASHBOARD PAGE (SERVER COMPONENT)
// File: src/app/(main)/dashboard/page.tsx
// ============================================================================

import { getCurrentUser } from '@/actions/auth'
import { getPhotos } from '@/actions/photos'
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

  const photosResult = await getPhotos({
    userId: user.role === 'member' ? user.id : undefined,
    searchQuery: searchQuery,
    limit: 100,
  })

  const photos = photosResult.success ? photosResult.data?.photos || [] : []

  return (
    <DashboardClient 
      initialPhotos={photos}
      user={user}
      searchQuery={searchQuery}
    />
  )
}