import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/ttp/session'
import { exportTtpToExcel } from '@/lib/ttp/export'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getSession()
  if (session.role === 'guest') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = await db.ttpReport.findUnique({
    where: { id },
    include: {
      suppliers: { orderBy: [{ section: 'asc' }, { no: 'asc' }] },
      agenPengumpul: {
        orderBy: { no: 'asc' },
        include: { farmers: { orderBy: { no: 'asc' } } },
      },
    },
  })
  if (!report) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // PKS can only export their own reports
  if (session.role === 'pks' && report.pksAccountId !== session.pksAccountId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const buf = await exportTtpToExcel(report)
  const safeName = (report.name || 'TTP').replace(/[^\w-]+/g, '_')
  return new NextResponse(buf as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${safeName}.xlsx"`,
    },
  })
}
