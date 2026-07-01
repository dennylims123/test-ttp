import { NextResponse } from 'next/server'
import { ADMIN_PIN_COOKIE, PKS_ACCOUNT_ID_COOKIE } from '@/lib/ttp/session'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(ADMIN_PIN_COOKIE)
  res.cookies.delete(PKS_ACCOUNT_ID_COOKIE)
  return res
}
