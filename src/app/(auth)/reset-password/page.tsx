// ============================================================================
// RESET PASSWORD PAGE SERVER
// File: src/app/(auth)/reset-password/page.tsx
// ============================================================================

import { getAppSettings } from '@/actions/settings'
import ResetClient from './ResetClient'

export const metadata = {
  title: 'Reset Password',
}

export default async function ResetPasswordPage() {
  const settings = await getAppSettings()

  const branding = {
    appName: settings?.app_name || 'Lensaptn',
    logoUrl: settings?.logo_url || null,
  }

  return <ResetClient branding={branding} />
}