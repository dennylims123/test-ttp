import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSession } from '@/lib/ttp/admin-session'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session.isAdmin) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status')
  const q = searchParams.get('q')?.toLowerCase()

  // Build WHERE clause
  const whereParts: string[] = []
  const args: any[] = []
  if (statusFilter) {
    whereParts.push('r.status = ?')
    args.push(statusFilter)
  }
  if (q) {
    whereParts.push('(LOWER(r.name) LIKE ? OR LOWER(COALESCE(r.pks_name, \'\')) LIKE ? OR LOWER(COALESCE(p.name, \'\')) LIKE ?)')
    args.push(`%${q}%`, `%${q}%`, `%${q}%`)
  }
  const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : ''

  const reports = await db.execute({
    sql: `
      SELECT
        r.id, r.name, r.created_at as createdAt, r.updated_at as updatedAt,
        r.pks_account_id as pksAccountId, r.status, r.published_at as publishedAt,
        r.pks_name as pksName, r.periode,
        (SELECT COUNT(*) FROM supplier_tbs WHERE report_id = r.id) as supplier_count,
        (SELECT COUNT(*) FROM agen_pengumpul WHERE report_id = r.id) as agen_count,
        p.name as pksAccountName
      FROM ttp_reports r
      LEFT JOIN pks_accounts p ON r.pks_account_id = p.id
      ${whereClause}
      ORDER BY r.updated_at DESC
    `,
    args,
  })

  // Fetch suppliers for stats (per report)
  const result = []
  for (const row of reports.rows) {
    const r: any = row
    const suppliersResult = await db.execute({
      sql: `SELECT section, volume_tbs, jenis_pemasok, sertifikasi FROM supplier_tbs WHERE report_id = ?`,
      args: [r.id],
    })
    const suppliers = suppliersResult.rows as any[]

    const totalVolume = suppliers.reduce((acc, s) => acc + (s.volume_tbs || 0), 0)
    const certifiedVolume = suppliers
      .filter((s) => s.sertifikasi === 'Ya')
      .reduce((acc, s) => acc + (s.volume_tbs || 0), 0)
    const ttpPct = totalVolume > 0 ? certifiedVolume / totalVolume : 0
    const internalVolume = suppliers
      .filter((s) => s.section === 'internal')
      .reduce((acc, s) => acc + (s.volume_tbs || 0), 0)
    const externalVolume = suppliers
      .filter((s) => s.section === 'external')
      .reduce((acc, s) => acc + (s.volume_tbs || 0), 0)

    result.push({
      id: r.id,
      name: r.name,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      pksAccountId: r.pksAccountId,
      status: r.status,
      publishedAt: r.publishedAt,
      pksName: r.pksName,
      periode: r.periode,
      pksAccount: r.pksAccountName ? { name: r.pksAccountName } : null,
      stats: {
        totalVolume,
        internalVolume,
        externalVolume,
        ttpPct,
        supplierCount: r.supplier_count,
        agenCount: r.agen_count,
      },
    })
  }

  return NextResponse.json(result)
}
