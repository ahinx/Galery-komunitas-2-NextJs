// ============================================================================
// LANDING PAGE (Server + Client Hybrid)
// File: src/app/page.tsx
// Deskripsi: Homepage profesional yang mengambil data branding dari DB
// ============================================================================

import { getAppSettings } from '@/actions/settings'
import LandingPageClient from './LandingPageClient' // Kita akan buat file pendamping ini

// 1. SERVER COMPONENT (Main Entry)
// Ini bertugas mengambil data dari database sebelum halaman dirender
export default async function LandingPage() {

  // 1. Ambil Settings
  const settings = await getAppSettings()

  // 2. Siapkan Data Branding Lengkap
  const branding = {
    appName: settings?.app_name || 'Galeri PTN',
    logoUrl: settings?.logo_url || null,
    // Tambahkan ini agar Footer & Mockup bisa pakai Icon asli
    iconUrl: settings?.icon_url || null, 
  }

  // 3. Render
  return <LandingPageClient branding={branding} />


}