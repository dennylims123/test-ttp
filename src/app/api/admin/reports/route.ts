import { NextRequest, NextResponse } from 'next/server'
import { getAdminReportsWithStats, getClient } from '@/lib/db'
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

  // Batch-compute MSD distribution for all reports at once
  // (avoids N+1 queries that would timeout on Vercel serverless)
  const client = getClient()
  for (const report of reports) {
    try {
      // Get all village names for this report's suppliers
      const suppliers = await client.execute({
        sql: 'SELECT desa FROM supplier_tbs WHERE report_id = ? AND desa IS NOT NULL AND desa != ?',
        args: [report.id, ''],
      })
      const villageNames = suppliers.rows.map((r: any) => (r.desa as string).trim()).filter(Boolean)

      if (villageNames.length === 0) {
        report.msdDistribution = { msd: 0, nonMsd: 0, na: 0, unmatched: 0 }
        continue
      }

      // Batch query: check all village names at once using IN clause
      // Build placeholders for the IN clause
      const placeholders = villageNames.map(() => '?').join(',')
      const lowerNames = villageNames.map((n) => n.toLowerCase())
      const msdResult = await client.execute({
        sql: `SELECT msd_status, COUNT(*) as cnt FROM villages WHERE LOWER(desa) IN (${placeholders}) GROUP BY msd_status`,
        args: lowerNames,
      })

      let msdCount = 0
      let nonMsdCount = 0
      let naCount = 0
      let matchedCount = 0
      for (const row of msdResult.rows) {
        const status = (row as any).msd_status || '#N/A'
        const cnt = (row as any).cnt
        matchedCount += cnt
        if (status === 'MSD') msdCount = cnt
        else if (status === 'Non-MSD') nonMsdCount = cnt
        else naCount = cnt
      }
      const unmatchedCount = villageNames.length - matchedCount

      report.msdDistribution = {
        msd: msdCount,
        nonMsd: nonMsdCount,
        na: naCount,
        unmatched: unmatchedCount,
      }
    } catch (e) {
      report.msdDistribution = { msd: 0, nonMsd: 0, na: 0, unmatched: 0 }
    }
  }

  return NextResponse.json(reports)
}
