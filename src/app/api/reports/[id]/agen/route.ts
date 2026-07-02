import { NextRequest, NextResponse } from 'next/server'
import { getReport, setAgen } from '@/lib/db'
import { getAdminSession } from '@/lib/ttp/admin-session'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const report = await getReport(id)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Published reports can only be edited by admin
  if (report.status === 'PUBLISHED') {
    const session = await getAdminSession()
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Laporan sudah dipublikasi. Hanya admin yang dapat mengedit.' },
        { status: 403 }
      )
    }
  }

  const body = await req.json()
  const items: Array<any> = body.agen || []
  const refreshed = await setAgen(id, items)
  return NextResponse.json(refreshed)
}
