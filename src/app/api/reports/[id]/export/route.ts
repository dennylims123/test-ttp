import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exportTtpToExcel } from '@/lib/ttp/export'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
  const buf = await exportTtpToExcel(report)
  const safeName = (report.name || 'TTP').replace(/[^\w-]+/g, '_')
  return new NextResponse(buf as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${safeName}.xlsx"`,
    },
  })
}
