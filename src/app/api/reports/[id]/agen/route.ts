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
  const items: Array<any> = body.agen || []

  // Delete existing agen (cascade will delete farmers via SQL or we do it manually)
  // First delete all farmers for this report's agen
  await db.execute({
    sql: `DELETE FROM farmer WHERE agen_id IN (SELECT id FROM agen_pengumpul WHERE report_id = ?)`,
    args: [id],
  })
  await db.execute({ sql: `DELETE FROM agen_pengumpul WHERE report_id = ?`, args: [id] })

  // Insert new agen + farmers
  for (const a of items) {
    const agenId = generateId()
    await db.execute({
      sql: `INSERT INTO agen_pengumpul (
        id, report_id, no, nama_agen, alamat, lintang, bujur, desa_sumber,
        volume_tbs, linked_supplier_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        agenId,
        id,
        a.no ?? 1,
        a.namaAgen || null,
        a.alamat || null,
        a.lintang || null,
        a.bujur || null,
        a.desaSumber || null,
        a.volumeTbs ?? null,
        a.linkedSupplierNo ?? null,
      ],
    })

    const farmers: Array<any> = a.farmers || []
    if (farmers.length > 0) {
      const stmts = farmers.map((f, idx) => ({
        sql: `INSERT INTO farmer (
          id, agen_id, no, nama, lintang, bujur, legalitas, desa, kecamatan,
          kabupaten, luas_kebun
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          generateId(),
          agenId,
          f.no ?? idx + 1,
          f.nama || null,
          f.lintang || null,
          f.bujur || null,
          f.legalitas || null,
          f.desa || null,
          f.kecamatan || null,
          f.kabupaten || null,
          f.luasKebun ?? null,
        ],
      }))
      await db.batch(stmts)
    }
  }

  // Fetch refreshed agen with farmers
  const agenResult = await db.execute({
    sql: `SELECT * FROM agen_pengumpul WHERE report_id = ? ORDER BY no ASC`,
    args: [id],
  })

  const result = []
  for (const a of agenResult.rows) {
    const farmersResult = await db.execute({
      sql: `SELECT * FROM farmer WHERE agen_id = ? ORDER BY no ASC`,
      args: [(a as any).id],
    })
    result.push({
      id: (a as any).id,
      no: (a as any).no,
      namaAgen: (a as any).nama_agen,
      alamat: (a as any).alamat,
      lintang: (a as any).lintang,
      bujur: (a as any).bujur,
      desaSumber: (a as any).desa_sumber,
      volumeTbs: (a as any).volume_tbs,
      linkedSupplierNo: (a as any).linked_supplier_no,
      farmers: farmersResult.rows.map((f: any) => ({
        id: f.id,
        no: f.no,
        nama: f.nama,
        lintang: f.lintang,
        bujur: f.bujur,
        legalitas: f.legalitas,
        desa: f.desa,
        kecamatan: f.kecamatan,
        kabupaten: f.kabupaten,
        luasKebun: f.luas_kebun,
      })),
    })
  }

  return NextResponse.json(result)
}
