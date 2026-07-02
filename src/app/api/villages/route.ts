import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)

  if (!q) {
    return NextResponse.json([])
  }

  const result = await db.execute({
    sql: 'SELECT id, desa, full FROM villages WHERE desa LIKE ? OR full LIKE ? ORDER BY desa ASC LIMIT ?',
    args: [`%${q}%`, `%${q}%`, limit],
  })

  const villages = result.rows.map((row: any) => ({
    id: row.id,
    desa: row.desa,
    full: row.full,
  }))

  return NextResponse.json(villages)
}
