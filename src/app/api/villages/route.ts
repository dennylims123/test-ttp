import { NextRequest, NextResponse } from 'next/server'
import { searchVillages } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 100)

  if (!q) {
    return NextResponse.json([])
  }

  const villages = await searchVillages(q, limit)
  return NextResponse.json(villages)
}
