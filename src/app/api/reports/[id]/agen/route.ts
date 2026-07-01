import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/ttp/session'

async function getEditableReport(id: string) {
  const session = await getSession()
  if (session.role === 'guest') {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  const report = await db.ttpReport.findUnique({ where: { id } })
  if (!report) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
  if (session.role === 'pks' && report.pksAccountId !== session.pksAccountId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  if (report.status === 'PUBLISHED' && session.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Laporan sudah dipublikasi' }, { status: 403 }) }
  }
  return { report, session }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const r = await getEditableReport(id)
  if ('error' in r) return r.error

  const body = await req.json()
  const items: Array<any> = body.agen || []

  await db.agenPengumpul.deleteMany({ where: { reportId: id } })

  for (const a of items) {
    const created = await db.agenPengumpul.create({
      data: {
        reportId: id,
        no: a.no ?? 1,
        namaAgen: a.namaAgen || null,
        alamat: a.alamat || null,
        lintang: a.lintang || null,
        bujur: a.bujur || null,
        desaSumber: a.desaSumber || null,
        volumeTbs: a.volumeTbs ?? null,
        linkedSupplierNo: a.linkedSupplierNo ?? null,
      },
    })

    const farmers: Array<any> = a.farmers || []
    if (farmers.length > 0) {
      await db.farmer.createMany({
        data: farmers.map((f, idx) => ({
          agenId: created.id,
          no: f.no ?? idx + 1,
          nama: f.nama || null,
          lintang: f.lintang || null,
          bujur: f.bujur || null,
          legalitas: f.legalitas || null,
          desa: f.desa || null,
          kecamatan: f.kecamatan || null,
          kabupaten: f.kabupaten || null,
          luasKebun: f.luasKebun ?? null,
        })),
      })
    }
  }

  const refreshed = await db.agenPengumpul.findMany({
    where: { reportId: id },
    orderBy: { no: 'asc' },
    include: { farmers: { orderBy: { no: 'asc' } } },
  })
  return NextResponse.json(refreshed)
}
