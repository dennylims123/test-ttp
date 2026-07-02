import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { PKS_ACCOUNT_ID_COOKIE } from '@/lib/ttp/session'

export async function POST(req: NextRequest) {
  const { name, pin } = await req.json()

  if (!name || !pin) {
    return NextResponse.json({ error: 'Nama PKS dan PIN wajib diisi' }, { status: 400 })
  }

  // Find PKS account by name (case-insensitive) + PIN
  // SQLite's default LIKE is case-insensitive for ASCII, but to be safe we use equals with lowercase
  // since PKS names are typically ASCII. We fetch by pin first then verify name.
  const acc = await db.pksAccount.findFirst({
    where: {
      pin: pin.trim(),
    },
  })

  if (!acc || acc.name.toLowerCase() !== name.trim().toLowerCase()) {
    return NextResponse.json({ error: 'Nama PKS atau PIN salah' }, { status: 401 })
  }

  const res = NextResponse.json({
    pksAccountId: acc.id,
    pksName: acc.name,
  })
  res.cookies.set(PKS_ACCOUNT_ID_COOKIE, acc.id, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
  return res
}
