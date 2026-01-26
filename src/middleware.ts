// ============================================================================
// MIDDLEWARE - Custom Session dengan Cookie user_id
// File: src/middleware.ts
// ============================================================================

import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
    const url = request.nextUrl.clone()
    const path = url.pathname

    // DEBUG
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🔍 PATH:', path)

    // 1. Ambil user_id dari cookie (sesuai dengan auth.ts)
    const userId = request.cookies.get('user_id')?.value

    console.log('👤 USER_ID:', userId || 'NULL (tidak login)')

    // 2. Konfigurasi Rute
    const publicRoutes = ['/', '/login', '/register', '/reset-password', '/verify-otp', '/auth/callback']
    const authRoutes = ['/login', '/register', '/reset-password', '/verify-otp']

    const isPublicRoute = publicRoutes.includes(path)
    const isAuthRoute = authRoutes.includes(path)

    console.log('📋 isPublicRoute:', isPublicRoute)
    console.log('📋 isAuthRoute:', isAuthRoute)

    // 3. LOGIKA PENGALIHAN

    // CASE A: User SUDAH Login (ada cookie user_id)
    if (userId) {
        if (isAuthRoute) {
            console.log('✅ User login, akses auth route → REDIRECT ke /dashboard')
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
        console.log('✅ User login, akses allowed → PASS')
        return NextResponse.next()
    }

    // CASE B: User BELUM Login (tidak ada cookie user_id)
    if (!isPublicRoute) {
        console.log('🚫 User belum login, akses protected route → REDIRECT ke /login')
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    console.log('✅ User belum login, akses public route → PASS')
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}