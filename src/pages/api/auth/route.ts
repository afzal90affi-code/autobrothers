import { NextResponse } from 'next/server'

const ADMIN_PASSWORD = 'your-secret-afzalazam' // Same password as middleware

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (password === ADMIN_PASSWORD) {
      // Password sahi hai, cookie set karein
      const response = NextResponse.json({ success: true })
      response.cookies.set('admin_auth', ADMIN_PASSWORD, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week validity
      })
      return response
    } else {
      // Password galat hai
      return NextResponse.json({ success: false, message: 'Invalid Password' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}