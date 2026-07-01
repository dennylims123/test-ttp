import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/ttp/session'

// POST /api/reports/:id/publish  → PKS owner publishes their DRAFT report
// DELETE /api/reports/:id/publish → Admin reverts a PUBLISHED report back to DRAFT ("reject")

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (session.role === 'guest') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = await db.ttpReport.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.role === 'pks' && report.pksAccountId !== session.pksAccountId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (report.status === 'PUBLISHED') {
    return NextResponse.json({ error: 'Sudah dipublikasi' }, { status: 400 })
  }

  const updated = await db.ttpReport.update({
    where: { id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  if (session.role !== 'admin') {
    return NextResponse.json(
      { error: 'Hanya admin yang dapat membuka kembali laporan yang sudah dipublikasi' },
      { status: 403 }
    )
  }

  const report = await db.ttpReport.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.ttpReport.update({
    where: { id },
    data: { status: 'DRAFT', publishedAt: null },
  })
  return NextResponse.json(updated)
}
