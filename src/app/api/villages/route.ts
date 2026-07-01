import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/villages?q=...&limit=20  -> search by village name
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)

  if (!q) {
    return NextResponse.json([])
  }

  // SQLite LIKE is case-insensitive for ASCII only. Use contains for unicode.
  const villages = await db.village.findMany({
    where: {
      OR: [
        { desa: { contains: q } },
        { full: { contains: q } },
      ],
    },
    take: limit,
    orderBy: { desa: 'asc' },
  })

  return NextResponse.json(villages)
}
