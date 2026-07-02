import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { exportTtpToExcel } from '@/lib/ttp/export'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const reportResult = await db.execute({
    sql: `SELECT * FROM ttp_reports WHERE id = ?`,
    args: [id],
  })
  if (reportResult.rows.length === 0) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const r: any = reportResult.rows[0]

  const suppliersResult = await db.execute({
    sql: `SELECT * FROM supplier_tbs WHERE report_id = ? ORDER BY section ASC, no ASC`,
    args: [id],
  })

  const agenResult = await db.execute({
    sql: `SELECT * FROM agen_pengumpul WHERE report_id = ? ORDER BY no ASC`,
    args: [id],
  })

  const agenWithFarmers = []
  for (const a of agenResult.rows) {
    const farmersResult = await db.execute({
      sql: `SELECT * FROM farmer WHERE agen_id = ? ORDER BY no ASC`,
      args: [(a as any).id],
    })
    agenWithFarmers.push({
      no: (a as any).no,
      nama_agen: (a as any).nama_agen,
      alamat: (a as any).alamat,
      lintang: (a as any).lintang,
      bujur: (a as any).bujur,
      desa_sumber: (a as any).desa_sumber,
      volume_tbs: (a as any).volume_tbs,
      farmers: farmersResult.rows.map((f: any) => ({
        no: f.no,
        nama: f.nama,
        lintang: f.lintang,
        bujur: f.bujur,
        legalitas: f.legalitas,
        desa: f.desa,
        kecamatan: f.kecamatan,
        kabupaten: f.kabupaten,
        luas_kebun: f.luas_kebun,
      })),
    })
  }

  const report = {
    id: r.id,
    name: r.name,
    pks_name: r.pks_name,
    pks_address: r.pks_address,
    pks_latitude: r.pks_latitude,
    pks_longitude: r.pks_longitude,
    report_date: r.report_date,
    periode: r.periode,
    pengisi: r.pengisi,
    p1m_kapasitas_pks: r.p1m_kapasitas_pks,
    p1m_produksi_cpo: r.p1m_produksi_cpo,
    p1m_nilai_ttp: r.p1m_nilai_ttp,
    suppliers: suppliersResult.rows.map((s: any) => ({
      section: s.section,
      no: s.no,
      nama_pemasok: s.nama_pemasok,
      jenis_pemasok: s.jenis_pemasok,
      jumlah_petani: s.jumlah_petani,
      sertifikasi: s.sertifikasi,
      desa: s.desa,
      kecamatan: s.kecamatan,
      kabupaten: s.kabupaten,
      lintang: s.lintang,
      bujur: s.bujur,
      legalitas: s.legalitas,
      luas_areal: s.luas_areal,
      peta_kebun: s.peta_kebun,
      volume_tbs: s.volume_tbs,
    })),
    agenPengumpul: agenWithFarmers,
  }

  const buf = await exportTtpToExcel(report)
  const safeName = (r.name || 'TTP').replace(/[^\w-]+/g, '_')
  return new NextResponse(buf as any, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${safeName}.xlsx"`,
    },
  })
}
