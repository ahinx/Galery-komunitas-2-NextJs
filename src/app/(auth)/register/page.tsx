// ============================================================================
// REGISTER PAGE SERVER
// File: src/app/(auth)/register/page.tsx
// ============================================================================

import { getAppSettings } from '@/actions/settings'
import RegisterClient from './RegisterClient'

export const metadata = {
  title: 'Daftar Akun Baru',
}

export default async function RegisterPage() {
  // 1. Ambil Settings dari Database
  const settings = await getAppSettings()

  // 2. Siapkan Branding
  const branding = {
    appName: settings?.app_name || 'Lensaptn',
    logoUrl: settings?.logo_url || null,
  }

  // 3. Render Client
  return <RegisterClient branding={branding} />
}