import { NextRequest, NextResponse } from 'next/server'
import { getReport, setAgen } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const report = await getReport(id)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (report.status === 'PUBLISHED') {
    return NextResponse.json(
      { error: 'Laporan sudah dipublikasi. Buka kembali via Rekap Admin.' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const items: Array<any> = body.agen || []
  const refreshed = await setAgen(id, items)
  return NextResponse.json(refreshed)
}
