import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/ttp/admin-session'

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const reportResult = await db.execute({
    sql: `SELECT status FROM ttp_reports WHERE id = ?`,
    args: [id],
  })
  if (reportResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (reportResult.rows[0].status === 'PUBLISHED') {
    return NextResponse.json({ error: 'Sudah dipublikasi' }, { status: 400 })
  }

  const now = new Date().toISOString()
  await db.execute({
    sql: `UPDATE ttp_reports SET status = 'PUBLISHED', published_at = ?, updated_at = ? WHERE id = ?`,
    args: [now, now, id],
  })

  return NextResponse.json({ ok: true, status: 'PUBLISHED', publishedAt: now })
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

  const reportResult = await db.execute({
    sql: `SELECT status FROM ttp_reports WHERE id = ?`,
    args: [id],
  })
  if (reportResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const now = new Date().toISOString()
  await db.execute({
    sql: `UPDATE ttp_reports SET status = 'DRAFT', published_at = NULL, updated_at = ? WHERE id = ?`,
    args: [now, id],
  })

  return NextResponse.json({ ok: true, status: 'DRAFT' })
}
