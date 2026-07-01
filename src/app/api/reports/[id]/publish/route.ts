import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/reports/:id/publish  → Publish a DRAFT report (lock it)
// DELETE /api/reports/:id/publish → Revert a PUBLISHED report back to DRAFT ("reject" / reopen)

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const report = await db.ttpReport.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
  const report = await db.ttpReport.findUnique({ where: { id } })
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await db.ttpReport.update({
    where: { id },
    data: { status: 'DRAFT', publishedAt: null },
  })
  return NextResponse.json(updated)
}
