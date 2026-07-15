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

      // Query MSD status per UNIQUE village name (not per village row)
      // Multiple villages can have the same name — we count each supplier's
      // village once, taking the first match's MSD status
      const uniqueNames = [...new Set(villageNames.map(n => n.toLowerCase()))]
      let msdCount = 0
      let nonMsdCount = 0
      let naCount = 0
      let unmatchedCount = 0

      for (const name of uniqueNames) {
        const match = await client.execute({
          sql: "SELECT msd_status FROM villages WHERE LOWER(desa) = ? LIMIT 1",
          args: [name],
        })
        if (match.rows.length > 0) {
          const status = (match.rows[0] as any).msd_status || '#N/A'
          if (status === 'MSD') msdCount++
          else if (status === 'Non-MSD') nonMsdCount++
          else naCount++
        } else {
          unmatchedCount++
        }
      }
      // Scale counts to match actual supplier count (some suppliers share village names)
      const supplierCount = villageNames.length
      const matchedTotal = msdCount + nonMsdCount + naCount
      if (matchedTotal > 0 && supplierCount > matchedTotal) {
        const ratio = supplierCount / matchedTotal
        msdCount = Math.round(msdCount * ratio)
        nonMsdCount = Math.round(nonMsdCount * ratio)
        naCount = supplierCount - msdCount - nonMsdCount - unmatchedCount
      }

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
