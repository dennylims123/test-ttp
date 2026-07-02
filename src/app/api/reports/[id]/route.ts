import { NextRequest, NextResponse } from 'next/server'
import {
  getReportWithRelations,
  getReport,
  updateReport,
  deleteReport,
} from '@/lib/db'
import { getAdminSession } from '@/lib/ttp/admin-session'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const report = await getReportWithRelations(id)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(report)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const existing = await getReport(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Lock editing of PUBLISHED reports
  if (existing.status === 'PUBLISHED') {
    return NextResponse.json(
      { error: 'Laporan sudah dipublikasi dan tidak dapat diubah. Buka kembali via Rekap Admin.' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const updated = await updateReport(id, body)
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const report = await getReport(id)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // PUBLISHED reports can only be deleted by admin
  if (report.status === 'PUBLISHED') {
    const session = await getAdminSession()
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Laporan yang sudah dipublikasi hanya dapat dihapus oleh admin.' },
        { status: 403 }
      )
    }
  }

  await deleteReport(id)
  return NextResponse.json({ ok: true })
}
