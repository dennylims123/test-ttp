import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admin/reports — list all reports with stats (open access, no admin auth)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') // 'DRAFT' | 'PUBLISHED' | null
  const q = searchParams.get('q')?.toLowerCase()

  const reports = await db.ttpReport.findMany({
    where: {
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { pksName: { contains: q } },
              { pksAccount: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { suppliers: true, agenPengumpul: true } },
      pksAccount: { select: { name: true } },
      suppliers: {
        select: { section: true, volumeTbs: true, jenisPemasok: true, sertifikasi: true },
      },
    },
  })

  // Compute summary stats per report
  const withStats = reports.map((r) => {
    const totalVolume = r.suppliers.reduce((acc, s) => acc + (s.volumeTbs || 0), 0)
    const certifiedVolume = r.suppliers
      .filter((s) => s.sertifikasi === 'Ya')
      .reduce((acc, s) => acc + (s.volumeTbs || 0), 0)
    const ttpPct = totalVolume > 0 ? certifiedVolume / totalVolume : 0
    const internalVolume = r.suppliers
      .filter((s) => s.section === 'internal')
      .reduce((acc, s) => acc + (s.volumeTbs || 0), 0)
    const externalVolume = r.suppliers
      .filter((s) => s.section === 'external')
      .reduce((acc, s) => acc + (s.volumeTbs || 0), 0)

    const { suppliers, ...rest } = r
    return {
      ...rest,
      stats: {
        totalVolume,
        internalVolume,
        externalVolume,
        ttpPct,
        supplierCount: r._count.suppliers,
        agenCount: r._count.agenPengumpul,
      },
    }
  })

  return NextResponse.json(withStats)
}
