import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

  const report = {
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    pksAccountId: r.pks_account_id,
    status: r.status,
    publishedAt: r.published_at,
    pksName: r.pks_name,
    pksAddress: r.pks_address,
    pksLatitude: r.pks_latitude,
    pksLongitude: r.pks_longitude,
    reportDate: r.report_date,
    periode: r.periode,
    totalTbs: r.total_tbs,
    pengisi: r.pengisi,
    p1mProduksiTbsBersertifikat: r.p1m_produksi_tbs_bersertifikat,
    p1mKapasitasPks: r.p1m_kapasitas_pks,
    p1mProduksiCpo: r.p1m_produksi_cpo,
    p1mFasilitasKernel: r.p1m_fasilitas_kernel,
    p1mTotalTbs: r.p1m_total_tbs,
    p1mTbsKebunInti: r.p1m_tbs_kebun_inti,
    p1mTbsPlasma: r.p1m_tbs_plasma,
    p1mTbsMandiri: r.p1m_tbs_mandiri,
    p1mSistemTtp: r.p1m_sistem_ttp,
    p1mNilaiTtp: r.p1m_nilai_ttp,
    p1mSistemDetail: r.p1m_sistem_detail,
    suppliers: suppliersResult.rows.map((s: any) => ({
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
    })),
    agenPengumpul: agenWithFarmers,
  }

  return NextResponse.json(report)
}

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
      { error: 'Laporan sudah dipublikasi dan tidak dapat diubah. Buka kembali via Rekap Admin.' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const now = new Date().toISOString()

  await db.execute({
    sql: `UPDATE ttp_reports SET
      name = ?, pks_name = ?, pks_address = ?, pks_latitude = ?, pks_longitude = ?,
      report_date = ?, periode = ?, total_tbs = ?, pengisi = ?,
      p1m_produksi_tbs_bersertifikat = ?, p1m_kapasitas_pks = ?, p1m_produksi_cpo = ?,
      p1m_fasilitas_kernel = ?, p1m_total_tbs = ?, p1m_tbs_kebun_inti = ?,
      p1m_tbs_plasma = ?, p1m_tbs_mandiri = ?, p1m_sistem_ttp = ?,
      p1m_nilai_ttp = ?, p1m_sistem_detail = ?, updated_at = ?
    WHERE id = ?`,
    args: [
      body.name,
      body.pksName ?? null,
      body.pksAddress ?? null,
      body.pksLatitude ?? null,
      body.pksLongitude ?? null,
      body.reportDate ?? null,
      body.periode ?? null,
      body.totalTbs ?? null,
      body.pengisi ?? null,
      body.p1mProduksiTbsBersertifikat ?? null,
      body.p1mKapasitasPks ?? null,
      body.p1mProduksiCpo ?? null,
      body.p1mFasilitasKernel ?? null,
      body.p1mTotalTbs ?? null,
      body.p1mTbsKebunInti ?? null,
      body.p1mTbsPlasma ?? null,
      body.p1mTbsMandiri ?? null,
      body.p1mSistemTtp ?? null,
      body.p1mNilaiTtp ?? null,
      body.p1mSistemDetail ?? null,
      now,
      id,
    ],
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
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
    const session = await getAdminSession()
    if (!session.isAdmin) {
      return NextResponse.json(
        { error: 'Laporan yang sudah dipublikasi hanya dapat dihapus oleh admin.' },
        { status: 403 }
      )
    }
  }

  // Delete cascade: farmers → agen_pengumpul → supplier_tbs → ttp_reports
  await db.batch([
    {
      sql: `DELETE FROM farmer WHERE agen_id IN (SELECT id FROM agen_pengumpul WHERE report_id = ?)`,
      args: [id],
    },
    { sql: `DELETE FROM agen_pengumpul WHERE report_id = ?`, args: [id] },
    { sql: `DELETE FROM supplier_tbs WHERE report_id = ?`, args: [id] },
    { sql: `DELETE FROM ttp_reports WHERE id = ?`, args: [id] },
  ])

  return NextResponse.json({ ok: true })
}

// Inline import to avoid circular dependency
async function getAdminSession() {
  const { getAdminSession: getSession } = await import('@/lib/ttp/admin-session')
  return getSession()
}
