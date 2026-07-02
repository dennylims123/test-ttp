import { NextRequest, NextResponse } from 'next/server'
import { getAdminReportsWithStats } from '@/lib/db'
import { getAdminSession } from '@/lib/ttp/admin-session'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')
  const q = searchParams.get('q')?.toLowerCase()

  const reports = await getAdminReportsWithStats({
    status: statusFilter || undefined,
    q: q || undefined,
  })
  return NextResponse.json(reports)
}
