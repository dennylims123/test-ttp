import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateId } from '@/lib/ttp/db-helpers'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const reportResult = await db.execute({
    sql: `SELECT status FROM ttp_reports WHERE id = ?`,
    args: [id],
  })

  if (reportResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (reportResult.rows[0].status === 'PUBLISHED') {
    return NextResponse.json(
      { error: 'Laporan sudah dipublikasi. Buka kembali via Rekap Admin.' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const items: Array<any> = body.suppliers || []

  // Delete existing suppliers for this report
  await db.execute({ sql: `DELETE FROM supplier_tbs WHERE report_id = ?`, args: [id] })

  // Insert new ones in batch
  if (items.length > 0) {
    const stmts = items.map((s, idx) => ({
      sql: `INSERT INTO supplier_tbs (
        id, report_id, section, no, nama_pemasok, jenis_pemasok, jumlah_petani,
        sertifikasi, desa, kecamatan, kabupaten, lintang, bujur, legalitas,
        luas_areal, peta_kebun, volume_tbs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        generateId(),
        id,
        s.section,
        s.no ?? idx + 1,
        s.namaPemasok || null,
        s.jenisPemasok || null,
        s.jumlahPetani ?? null,
        s.sertifikasi || null,
        s.desa || null,
        s.kecamatan || null,
        s.kabupaten || null,
        s.lintang || null,
        s.bujur || null,
        s.legalitas || null,
        s.luasAreal ?? null,
        s.petaKebun || null,
        s.volumeTbs ?? null,
      ],
    }))
    await db.batch(stmts)
  }

  const refreshed = await db.execute({
    sql: `SELECT * FROM supplier_tbs WHERE report_id = ? ORDER BY section ASC, no ASC`,
    args: [id],
  })

  return NextResponse.json(
    refreshed.rows.map((s: any) => ({
      id: s.id,
      section: s.section,
      no: s.no,
      namaPemasok: s.nama_pemasok,
      jenisPemasok: s.jenis_pemasok,
      jumlahPetani: s.jumlah_petani,
      sertifikasi: s.sertifikasi,
      desa: s.desa,
      kecamatan: s.kecamatan,
      kabupaten: s.kabupaten,
      lintang: s.lintang,
      bujur: s.bujur,
      legalitas: s.legalitas,
      luasAreal: s.luas_areal,
      petaKebun: s.peta_kebun,
      volumeTbs: s.volume_tbs,
    }))
  )
}
