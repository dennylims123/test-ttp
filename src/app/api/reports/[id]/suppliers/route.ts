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
  // Lock editing of PUBLISHED reports for everyone except admin
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
  const items: Array<any> = body.suppliers || []

  await db.supplierTbs.deleteMany({ where: { reportId: id } })

  if (items.length > 0) {
    await db.supplierTbs.createMany({
      data: items.map((s, idx) => ({
        reportId: id,
        section: s.section,
        no: s.no ?? idx + 1,
        namaPemasok: s.namaPemasok || null,
        jenisPemasok: s.jenisPemasok || null,
        jumlahPetani: s.jumlahPetani ?? null,
        sertifikasi: s.sertifikasi || null,
        desa: s.desa || null,
        kecamatan: s.kecamatan || null,
        kabupaten: s.kabupaten || null,
        lintang: s.lintang || null,
        bujur: s.bujur || null,
        legalitas: s.legalitas || null,
        luasAreal: s.luasAreal ?? null,
        petaKebun: s.petaKebun || null,
        volumeTbs: s.volumeTbs ?? null,
      })),
    })
  }

  const refreshed = await db.supplierTbs.findMany({
    where: { reportId: id },
    orderBy: [{ section: 'asc' }, { no: 'asc' }],
  })
  return NextResponse.json(refreshed)
}
