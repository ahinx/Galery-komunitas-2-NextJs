// ============================================================================
// LOGIN PAGE SERVER (Data Fetching)
// File: src/app/(auth)/login/page.tsx
// Deskripsi: Mengambil data settings dari server sebelum render Client Component
// ============================================================================

import { getAppSettings } from '@/actions/settings' // <-- Import yang BENAR sesuai landing page
import LoginClient from './LoginClient'

export const metadata = {
  title: 'Masuk - Akun Anggota',
}

export default async function LoginPage() {
  // 1. Ambil Settings dari Database
  const settings = await getAppSettings()

  // 2. Siapkan Data Branding 
  // Kita mapping field dari database (snake_case) ke props component (camelCase)
  const branding = {
    appName: settings?.app_name || 'Lensaptn', // Default jika null
    logoUrl: settings?.logo_url || null,
  }

  // 3. Render Client Component
  return <LoginClient branding={branding} />
}