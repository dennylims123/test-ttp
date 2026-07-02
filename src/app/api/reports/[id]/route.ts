import { NextRequest, NextResponse } from 'next/server'
import {
  getReportWithRelations,
  getReport,
  updateReport,
  deleteReport,
} from '@/lib/db'
import { getAdminSession } from '@/lib/ttp/admin-session'

// Admin can edit published reports. Suppliers cannot.
async function canEdit(report: any): Promise<{ allowed: boolean; error?: string }> {
  if (report.status !== 'PUBLISHED') return { allowed: true }
  const session = await getAdminSession()
  if (session.isAdmin) return { allowed: true }
  return {
    allowed: false,
    error: 'Laporan sudah dipublikasi. Hanya admin yang dapat mengedit. Buka kembali via Rekap Admin.',
  }
}

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

  // Lock editing of PUBLISHED reports — admin can still edit
  const editCheck = await canEdit(existing)
  if (!editCheck.allowed) {
    return NextResponse.json({ error: editCheck.error }, { status: 403 })
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
