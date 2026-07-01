import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_PIN_COOKIE, getAdminPin } from '@/lib/ttp/session'

export async function POST(req: NextRequest) {
  const { pin } = await req.json()

  if (!pin) {
    return NextResponse.json({ error: 'PIN wajib diisi' }, { status: 400 })
  }

  if (pin !== getAdminPin()) {
    return NextResponse.json({ error: 'PIN admin salah' }, { status: 401 })
  }

  const res = NextResponse.json({ role: 'admin' })
  res.cookies.set(ADMIN_PIN_COOKIE, pin, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return res
}
