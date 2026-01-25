// ============================================================================
// MIDDLEWARE - Auth & Route Protection
// File: middleware.ts (di root folder)
// Deskripsi: Proteksi route dan redirect otomatis berdasarkan auth status
// ============================================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Route yang butuh authentication
const PROTECTED_ROUTES = ['/dashboard', '/upload', '/profile', '/admin', '/trash']

// Route yang hanya bisa diakses jika belum login
const AUTH_ROUTES = ['/login', '/verify-otp']

// Route khusus admin
const ADMIN_ROUTES = ['/admin']

// Route khusus super admin
const SUPER_ADMIN_ROUTES = ['/trash']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Ambil user_id dari cookie
    const userId = request.cookies.get('user_id')?.value

    // Check apakah route membutuhkan protection
    const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
    const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
    const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route))
    const isSuperAdminRoute = SUPER_ADMIN_ROUTES.some(route => pathname.startsWith(route))

    // Jika user belum login dan akses protected route
    if (isProtectedRoute && !userId) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Jika user sudah login dan akses auth route (login/verify-otp)
    if (isAuthRoute && userId) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Untuk admin routes, perlu validasi role (akan dihandle di page level)
    // Karena kita tidak bisa query database di middleware (edge runtime)

    return NextResponse.next()
}

// Konfigurasi matcher - route mana yang akan diproses middleware
export const config = {
    matcher: [
        /*
         * Match semua request paths kecuali:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}