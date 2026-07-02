import { NextRequest, NextResponse } from 'next/server'
import { getReport, publishReport, unpublishReport } from '@/lib/db'
import { getAdminSession } from '@/lib/ttp/admin-session'

// POST /api/reports/:id/publish  → Publish a DRAFT report (lock it)
// DELETE /api/reports/:id/publish → Revert a PUBLISHED report back to DRAFT (admin only)

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const report = await getReport(id)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (report.status === 'PUBLISHED') {
    return NextResponse.json({ error: 'Sudah dipublikasi' }, { status: 400 })
  }

  await publishReport(id)
  const updated = await getReport(id)
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getAdminSession()
  if (!session.isAdmin) {
    return NextResponse.json(
      { error: 'Hanya admin yang dapat membuka kembali laporan yang sudah dipublikasi' },
      { status: 403 }
    )
  }

  const report = await getReport(id)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await unpublishReport(id)
  const updated = await getReport(id)
  return NextResponse.json(updated)
}
