import { NextResponse } from 'next/server'
import { ADMIN_PIN_COOKIE } from '@/lib/ttp/admin-session'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ADMIN_PIN_COOKIE)
  return res
}
