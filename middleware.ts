import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Apna password yahan set karein
const ADMIN_PASSWORD = 'your-secret-afzalazam' 

export function middleware(request: NextRequest) {
  // Check if user is trying to access admin panel
  if (request.nextUrl.pathname.startsWith('/admin')) {
    
    // Agar user login page par hai, toh usko jaane dein
    if (request.nextUrl.pathname === '/admin/login') {
      return NextResponse.next()
    }

    // Check if cookie exists
    const isAuthenticated = request.cookies.get('admin_auth')?.value === ADMIN_PASSWORD

    // Agar cookie nahi hai (ya password galat hai), toh login page par bhej dein
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

// Config to match admin routes
export const config = {
  matcher: '/admin/:path*',
}