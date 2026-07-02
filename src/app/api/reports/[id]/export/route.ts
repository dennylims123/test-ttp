import { NextRequest, NextResponse } from 'next/server'
import { getReportWithRelations } from '@/lib/db'
import { exportTtpToExcel } from '@/lib/ttp/export'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const report = await getReportWithRelations(id)
  if (!report) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const buf = await exportTtpToExcel(report as any)
  const safeName = (report.name || 'TTP').replace(/[^\w-]+/g, '_')
  return new NextResponse(buf as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${safeName}.xlsx"`,
    },
  })
}
