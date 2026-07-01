import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Bulk replace all suppliers for a report (simple sync approach)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const items: Array<any> = body.suppliers || []

  // Delete existing, then re-insert
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
