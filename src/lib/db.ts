/**
 * Direct LibSQL (Turso) database client — bypasses Prisma entirely.
 *
 * Why: Prisma's driver adapter for LibSQL still has the Rust engine validate
 * the schema URL at runtime, causing URL_INVALID errors on Vercel serverless.
 * Using @libsql/client directly avoids this entirely and is also faster
 * (no Rust engine overhead).
 *
 * All functions return plain objects (not Prisma model instances).
 */

import { createClient, type Client } from '@libsql/client'

let _client: Client | null = null

export function getClient(): Client {
  if (_client) return _client

  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) {
    throw new Error('DATABASE_URL is not set')
  }

  if (url.startsWith('libsql://') || url.startsWith('https://')) {
    _client = createClient({ url, authToken })
  } else {
    // Local SQLite (development)
    _client = createClient({ url })
  }
  return _client
}

// ============= TYPES =============
export interface PksAccount {
  id: string
  name: string
  pin: string
  createdAt: string
}

export interface TtpReport {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  pksAccountId: string | null
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  pksName: string | null
  pksAddress: string | null
  pksLatitude: string | null
  pksLongitude: string | null
  reportDate: string | null
  periode: string | null
  totalTbs: number | null
  pengisi: string | null
  p1mProduksiTbsBersertifikat: number | null
  p1mKapasitasPks: number | null
  p1mProduksiCpo: number | null
  p1mFasilitasKernel: string | null
  p1mTotalTbs: number | null
  p1mTbsKebunInti: number | null
  p1mTbsPlasma: number | null
  p1mTbsMandiri: number | null
  p1mSistemTtp: string | null
  p1mNilaiTtp: number | null
  p1mSistemDetail: string | null
}

export interface SupplierTbs {
  id: string
  reportId: string
  section: 'internal' | 'external'
  no: number
  namaPemasok: string | null
  jenisPemasok: string | null
  jumlahPetani: number | null
  sertifikasi: string | null
  desa: string | null
  kecamatan: string | null
  kabupaten: string | null
  lintang: string | null
  bujur: string | null
  legalitas: string | null
  luasAreal: number | null
  petaKebun: string | null
  volumeTbs: number | null
}

export interface AgenPengumpul {
  id: string
  reportId: string
  no: number
  namaAgen: string | null
  alamat: string | null
  lintang: string | null
  bujur: string | null
  desaSumber: string | null
  volumeTbs: number | null
  linkedSupplierNo: number | null
}

export interface Farmer {
  id: string
  agenId: string
  no: number
  nama: string | null
  lintang: string | null
  bujur: string | null
  legalitas: string | null
  desa: string | null
  kecamatan: string | null
  kabupaten: string | null
  luasKebun: number | null
}

export interface Village {
  id: number
  desa: string
  full: string
  msd_status?: string  // 'MSD' | 'Non-MSD' | '#N/A'
}

// ============= HELPER =============
function rowToObj(row: Record<string, any>): any {
  const obj: any = {}
  for (const key in row) {
    obj[key] = row[key]
  }
  return obj
}

function rowsToObjects(rows: Record<string, any>[]): any[] {
  return rows.map(rowToObj)
}

// ============= VILLAGE =============
export async function searchVillages(q: string, limit: number = 30): Promise<Village[]> {
  const client = getClient()
  const result = await client.execute({
    sql: 'SELECT id, desa, full, msd_status FROM villages WHERE desa LIKE ? OR full LIKE ? ORDER BY desa ASC LIMIT ?',
    args: [`%${q}%`, `%${q}%`, limit],
  })
  return rowsToObjects(result.rows) as Village[]
}

// ============= REPORTS =============
export async function listReports(): Promise<any[]> {
  const client = getClient()
  const result = await client.execute(`
    SELECT r.*,
      (SELECT COUNT(*) FROM supplier_tbs WHERE report_id = r.id) as supplier_count,
      (SELECT COUNT(*) FROM agen_pengumpul WHERE report_id = r.id) as agen_count,
      p.name as pks_account_name
    FROM ttp_reports r
    LEFT JOIN pks_accounts p ON r.pks_account_id = p.id
    ORDER BY r.updated_at DESC
  `)
  return result.rows.map((row) => {
    const obj = rowToObj(row)
    return {
      ...obj,
      _count: {
        suppliers: obj.supplier_count,
        agenPengumpul: obj.agen_count,
      },
      pksAccount: obj.pks_account_name ? { name: obj.pks_account_name } : null,
    }
  })
}

export async function getReport(id: string): Promise<any | null> {
  const client = getClient()
  const result = await client.execute({
    sql: 'SELECT * FROM ttp_reports WHERE id = ?',
    args: [id],
  })
  if (result.rows.length === 0) return null
  return rowToObj(result.rows[0])
}

export async function getReportWithRelations(id: string): Promise<any | null> {
  const client = getClient()
  const report = await getReport(id)
  if (!report) return null

  const suppliers = await client.execute({
    sql: `SELECT s.*, v.msd_status as msdStatus
          FROM supplier_tbs s
          LEFT JOIN villages v ON LOWER(s.desa) = LOWER(v.desa)
          WHERE s.report_id = ?
          ORDER BY s.section ASC, s.no ASC`,
    args: [id],
  })
  const agen = await client.execute({
    sql: 'SELECT * FROM agen_pengumpul WHERE report_id = ? ORDER BY no ASC',
    args: [id],
  })

  const agenWithFarmers = await Promise.all(
    agen.rows.map(async (a) => {
      const farmers = await client.execute({
        sql: 'SELECT f.*, v.msd_status as msdStatus FROM farmer f LEFT JOIN villages v ON LOWER(f.desa) = LOWER(v.desa) WHERE f.agen_id = ? ORDER BY f.no ASC',
        args: [(a as any).id],
      })
      return { ...rowToObj(a), farmers: rowsToObjects(farmers.rows) }
    })
  )

  return {
    ...report,
    suppliers: rowsToObjects(suppliers.rows),
    agenPengumpul: agenWithFarmers,
  }
}

export async function createReport(data: any): Promise<TtpReport> {
  const client = getClient()
  const id = generateCuid()
  const now = new Date().toISOString()
  await client.execute({
    sql: `INSERT INTO ttp_reports (
      id, name, created_at, updated_at, pks_account_id, status,
      pks_name, pks_address, pks_latitude, pks_longitude, report_date, periode, total_tbs, pengisi,
      p1m_produksi_tbs_bersertifikat, p1m_kapasitas_pks, p1m_produksi_cpo, p1m_fasilitas_kernel,
      p1m_total_tbs, p1m_tbs_kebun_inti, p1m_tbs_plasma, p1m_tbs_mandiri,
      p1m_sistem_ttp, p1m_nilai_ttp, p1m_sistem_detail
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id, data.name || `Laporan TTP - ${new Date().toLocaleDateString('id-ID')}`, now, now,
      data.pksAccountId || null, data.status || 'DRAFT',
      data.pksName || null, data.pksAddress || null, data.pksLatitude || null,
      data.pksLongitude || null, data.reportDate || null, data.periode || null,
      data.totalTbs ?? null, data.pengisi || null,
      data.p1mProduksiTbsBersertifikat ?? null, data.p1mKapasitasPks ?? null,
      data.p1mProduksiCpo ?? null, data.p1mFasilitasKernel || null,
      data.p1mTotalTbs ?? null, data.p1mTbsKebunInti ?? null, data.p1mTbsPlasma ?? null,
      data.p1mTbsMandiri ?? null, data.p1mSistemTtp || null, data.p1mNilaiTtp ?? null,
      data.p1mSistemDetail || null,
    ],
  })
  return getReport(id) as Promise<TtpReport>
}

export async function updateReport(id: string, data: any): Promise<TtpReport> {
  const client = getClient()
  const now = new Date().toISOString()
  await client.execute({
    sql: `UPDATE ttp_reports SET
      name = ?, updated_at = ?,
      pks_name = ?, pks_address = ?, pks_latitude = ?, pks_longitude = ?,
      report_date = ?, periode = ?, total_tbs = ?, pengisi = ?,
      p1m_produksi_tbs_bersertifikat = ?, p1m_kapasitas_pks = ?, p1m_produksi_cpo = ?,
      p1m_fasilitas_kernel = ?, p1m_total_tbs = ?, p1m_tbs_kebun_inti = ?,
      p1m_tbs_plasma = ?, p1m_tbs_mandiri = ?, p1m_sistem_ttp = ?,
      p1m_nilai_ttp = ?, p1m_sistem_detail = ?
    WHERE id = ?`,
    args: [
      data.name, now,
      data.pksName ?? null, data.pksAddress ?? null, data.pksLatitude ?? null,
      data.pksLongitude ?? null, data.reportDate ?? null, data.periode ?? null,
      data.totalTbs ?? null, data.pengisi ?? null,
      data.p1mProduksiTbsBersertifikat ?? null, data.p1mKapasitasPks ?? null,
      data.p1mProduksiCpo ?? null, data.p1mFasilitasKernel ?? null,
      data.p1mTotalTbs ?? null, data.p1mTbsKebunInti ?? null, data.p1mTbsPlasma ?? null,
      data.p1mTbsMandiri ?? null, data.p1mSistemTtp ?? null, data.p1mNilaiTtp ?? null,
      data.p1mSistemDetail ?? null,
      id,
    ],
  })
  return getReport(id) as Promise<TtpReport>
}

export async function deleteReport(id: string): Promise<void> {
  const client = getClient()
  await client.execute({ sql: 'DELETE FROM ttp_reports WHERE id = ?', args: [id] })
}

export async function publishReport(id: string): Promise<void> {
  const client = getClient()
  await client.execute({
    sql: "UPDATE ttp_reports SET status = 'PUBLISHED', published_at = ?, updated_at = ? WHERE id = ?",
    args: [new Date().toISOString(), new Date().toISOString(), id],
  })
}

export async function unpublishReport(id: string): Promise<void> {
  const client = getClient()
  await client.execute({
    sql: "UPDATE ttp_reports SET status = 'DRAFT', published_at = NULL, updated_at = ? WHERE id = ?",
    args: [new Date().toISOString(), id],
  })
}

// ============= SUPPLIERS =============
export async function getSuppliers(reportId: string): Promise<SupplierTbs[]> {
  const client = getClient()
  const result = await client.execute({
    sql: `SELECT s.*, v.msd_status as msdStatus
          FROM supplier_tbs s
          LEFT JOIN villages v ON LOWER(s.desa) = LOWER(v.desa)
          WHERE s.report_id = ?
          ORDER BY s.section ASC, s.no ASC`,
    args: [reportId],
  })
  return rowsToObjects(result.rows) as SupplierTbs[]
}

export async function setSuppliers(reportId: string, suppliers: any[]): Promise<SupplierTbs[]> {
  const client = getClient()
  await client.execute({ sql: 'DELETE FROM supplier_tbs WHERE report_id = ?', args: [reportId] })

  // Deduplicate by (section + no) to prevent duplicates from race conditions
  const seen = new Set<string>()
  const deduped = suppliers.filter((s) => {
    const key = `${s.section}-${s.no}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  for (const [idx, s] of deduped.entries()) {
    const id = generateCuid()
    await client.execute({
      sql: `INSERT INTO supplier_tbs (
        id, report_id, section, no, nama_pemasok, jenis_pemasok, jumlah_petani,
        sertifikasi, desa, kecamatan, kabupaten, lintang, bujur, legalitas,
        luas_areal, peta_kebun, volume_tbs
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, reportId, s.section, s.no ?? idx + 1, s.namaPemasok || null,
        s.jenisPemasok || null, s.jumlahPetani ?? null, s.sertifikasi || null,
        s.desa || null, s.kecamatan || null, s.kabupaten || null,
        s.lintang || null, s.bujur || null, s.legalitas || null,
        s.luasAreal ?? null, s.petaKebun || null, s.volumeTbs ?? null,
      ],
    })
  }
  return getSuppliers(reportId)
}

// ============= AGEN & FARMERS =============
export async function getAgenWithFarmers(reportId: string): Promise<any[]> {
  const client = getClient()
  const agen = await client.execute({
    sql: 'SELECT * FROM agen_pengumpul WHERE report_id = ? ORDER BY no ASC',
    args: [reportId],
  })
  return Promise.all(
    agen.rows.map(async (a) => {
      const farmers = await client.execute({
        sql: 'SELECT f.*, v.msd_status as msdStatus FROM farmer f LEFT JOIN villages v ON LOWER(f.desa) = LOWER(v.desa) WHERE f.agen_id = ? ORDER BY f.no ASC',
        args: [(a as any).id],
      })
      return { ...rowToObj(a), farmers: rowsToObjects(farmers.rows) }
    })
  )
}

export async function setAgen(reportId: string, agenList: any[]): Promise<any[]> {
  const client = getClient()
  // Delete existing (cascade will delete farmers too — but libsql doesn't enforce FK cascade by default)
  const existingAgen = await client.execute({
    sql: 'SELECT id FROM agen_pengumpul WHERE report_id = ?',
    args: [reportId],
  })
  for (const a of existingAgen.rows) {
    await client.execute({ sql: 'DELETE FROM farmer WHERE agen_id = ?', args: [(a as any).id] })
  }
  await client.execute({ sql: 'DELETE FROM agen_pengumpul WHERE report_id = ?', args: [reportId] })

  for (const [idx, a] of agenList.entries()) {
    const agenId = generateCuid()
    await client.execute({
      sql: `INSERT INTO agen_pengumpul (
        id, report_id, no, nama_agen, alamat, lintang, bujur, desa_sumber,
        volume_tbs, linked_supplier_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        agenId, reportId, a.no ?? idx + 1, a.namaAgen || null, a.alamat || null,
        a.lintang || null, a.bujur || null, a.desaSumber || null,
        a.volumeTbs ?? null, a.linkedSupplierNo ?? null,
      ],
    })
    const farmers = a.farmers || []
    for (const [fIdx, f] of farmers.entries()) {
      const farmerId = generateCuid()
      await client.execute({
        sql: `INSERT INTO farmer (
          id, agen_id, no, nama, lintang, bujur, legalitas, desa, kecamatan, kabupaten, luas_kebun
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          farmerId, agenId, f.no ?? fIdx + 1, f.nama || null,
          f.lintang || null, f.bujur || null, f.legalitas || null,
          f.desa || null, f.kecamatan || null, f.kabupaten || null,
          f.luasKebun ?? null,
        ],
      })
    }
  }
  return getAgenWithFarmers(reportId)
}

// ============= ADMIN STATS =============
export async function getAdminReportsWithStats(filter?: {
  status?: string
  q?: string
}): Promise<any[]> {
  const client = getClient()
  let sql = `
    SELECT r.*,
      (SELECT COUNT(*) FROM supplier_tbs WHERE report_id = r.id) as supplier_count,
      (SELECT COUNT(*) FROM agen_pengumpul WHERE report_id = r.id) as agen_count,
      p.name as pks_account_name
    FROM ttp_reports r
    LEFT JOIN pks_accounts p ON r.pks_account_id = p.id
  `
  const args: any[] = []
  const conditions: string[] = []
  if (filter?.status) {
    conditions.push('r.status = ?')
    args.push(filter.status)
  }
  if (filter?.q) {
    conditions.push('(r.name LIKE ? OR r.pks_name LIKE ? OR p.name LIKE ?)')
    args.push(`%${filter.q}%`, `%${filter.q}%`, `%${filter.q}%`)
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ')
  }
  sql += ' ORDER BY r.updated_at DESC'

  const result = await client.execute({ sql, args })
  const reports: any[] = []
  for (const row of result.rows) {
    const obj = rowToObj(row)
    // Get supplier stats
    const suppliers = await client.execute({
      sql: 'SELECT section, volume_tbs, sertifikasi FROM supplier_tbs WHERE report_id = ?',
      args: [obj.id],
    })
    let totalVolume = 0
    let traceableVolume = 0
    let internalVolume = 0
    let externalVolume = 0
    for (const s of suppliers.rows) {
      const vol = (s as any).volume_tbs || 0
      totalVolume += vol
      // All registered suppliers with volume > 0 are traceable
      if (vol > 0) traceableVolume += vol
      if ((s as any).section === 'internal') internalVolume += vol
      else externalVolume += vol
    }
    reports.push({
      ...obj,
      pksAccount: obj.pks_account_name ? { name: obj.pks_account_name } : null,
      stats: {
        totalVolume,
        internalVolume,
        externalVolume,
        ttpPct: totalVolume > 0 ? traceableVolume / totalVolume : 0,
        supplierCount: obj.supplier_count,
        agenCount: obj.agen_count,
      },
    })
  }
  return reports
}

// ============= PKS ACCOUNTS =============
export async function findPksByName(name: string): Promise<PksAccount | null> {
  const client = getClient()
  const result = await client.execute({
    sql: 'SELECT * FROM pks_accounts WHERE LOWER(name) = LOWER(?) LIMIT 1',
    args: [name.trim()],
  })
  if (result.rows.length === 0) return null
  return rowToObj(result.rows[0]) as PksAccount
}

export async function findPksByPin(pin: string): Promise<PksAccount | null> {
  const client = getClient()
  const result = await client.execute({
    sql: 'SELECT * FROM pks_accounts WHERE pin = ? LIMIT 1',
    args: [pin.trim()],
  })
  if (result.rows.length === 0) return null
  return rowToObj(result.rows[0]) as PksAccount
}

// ============= UTIL =============
function generateCuid(): string {
  // Simple CUID-like ID generator (no dependency needed)
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  const counter = Math.random().toString(36).slice(2, 6)
  return `c${timestamp}${random}${counter}`.slice(0, 24)
}

// Keep the `db` export for backward compatibility (not used anymore)
export const db = {
  // Marker to indicate this is the new direct client, not Prisma
  _isDirectClient: true,
}
