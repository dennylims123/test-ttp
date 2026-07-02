import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateId } from '@/lib/ttp/db-helpers'

export async function GET() {
  const reports = await db.execute(`
    SELECT
      r.id, r.name, r.created_at as createdAt, r.updated_at as updatedAt,
      r.pks_account_id as pksAccountId, r.status, r.published_at as publishedAt,
      r.pks_name as pksName, r.pks_address as pksAddress,
      r.pks_latitude as pksLatitude, r.pks_longitude as pksLongitude,
      r.report_date as reportDate, r.periode, r.total_tbs as totalTbs, r.pengisi,
      r.p1m_produksi_tbs_bersertifikat, r.p1m_kapasitas_pks, r.p1m_produksi_cpo,
      r.p1m_fasilitas_kernel, r.p1m_total_tbs, r.p1m_tbs_kebun_inti,
      r.p1m_tbs_plasma, r.p1m_tbs_mandiri, r.p1m_sistem_ttp, r.p1m_nilai_ttp,
      r.p1m_sistem_detail,
      (SELECT COUNT(*) FROM supplier_tbs WHERE report_id = r.id) as supplier_count,
      (SELECT COUNT(*) FROM agen_pengumpul WHERE report_id = r.id) as agen_count,
      p.name as pksAccountName
    FROM ttp_reports r
    LEFT JOIN pks_accounts p ON r.pks_account_id = p.id
    ORDER BY r.updated_at DESC
  `)

  const result = reports.rows.map((r: any) => ({
    id: r.id,
    name: r.name,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    pksAccountId: r.pksAccountId,
    status: r.status,
    publishedAt: r.publishedAt,
    pksName: r.pksName,
    pksAddress: r.pksAddress,
    pksLatitude: r.pksLatitude,
    pksLongitude: r.pksLongitude,
    reportDate: r.reportDate,
    periode: r.periode,
    totalTbs: r.totalTbs,
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
    _count: {
      suppliers: r.supplier_count,
      agenPengumpul: r.agen_count,
    },
    pksAccount: r.pksAccountName ? { name: r.pksAccountName } : null,
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const id = generateId()
  const now = new Date().toISOString()

  await db.execute({
    sql: `INSERT INTO ttp_reports (
      id, name, created_at, updated_at, pks_account_id, status, published_at,
      pks_name, pks_address, pks_latitude, pks_longitude, report_date, periode,
      total_tbs, pengisi, p1m_produksi_tbs_bersertifikat, p1m_kapasitas_pks,
      p1m_produksi_cpo, p1m_fasilitas_kernel, p1m_total_tbs, p1m_tbs_kebun_inti,
      p1m_tbs_plasma, p1m_tbs_mandiri, p1m_sistem_ttp, p1m_nilai_ttp, p1m_sistem_detail
    ) VALUES (?, ?, ?, ?, NULL, 'DRAFT', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      body.name || `Laporan TTP - ${new Date().toLocaleDateString('id-ID')}`,
      now,
      now,
      body.pksName || null,
      body.pksAddress || null,
      body.pksLatitude || null,
      body.pksLongitude || null,
      body.reportDate || null,
      body.periode || null,
      body.totalTbs ?? null,
      body.pengisi || null,
      body.p1mProduksiTbsBersertifikat ?? null,
      body.p1mKapasitasPks ?? null,
      body.p1mProduksiCpo ?? null,
      body.p1mFasilitasKernel || null,
      body.p1mTotalTbs ?? null,
      body.p1mTbsKebunInti ?? null,
      body.p1mTbsPlasma ?? null,
      body.p1mTbsMandiri ?? null,
      body.p1mSistemTtp || null,
      body.p1mNilaiTtp ?? null,
      body.p1mSistemDetail || null,
    ],
  })

  return NextResponse.json({ id, ok: true }, { status: 201 })
}
