// Type definitions for the TTP Form

export const JENIS_INTERNAL = ['Kebun Inti', 'Plasma'] as const
export const JENIS_EKSTERNAL = [
  'Perusahaan Perkebunan Pihak Ketiga',
  'Kebun Pribadi Pihak Ketiga/Petani',
  'Agen / Pengumpul / Ramp',
  'Koperasi',
  'Gapoktan/Poktan',
] as const

export const PERIODE_OPTIONS = [
  '1 Januari - 31 Desember 2025',
  '1 Januari - 30 Juni 2025',
  '1 Juli - 31 Desember 2025',
] as const

export const LEGALITAS_OPTIONS = ['HGU', 'SHM', 'SKT', 'SKGR', 'Lainnya'] as const
export const YA_TIDAK = ['Ya', 'Tidak'] as const
export const Y_T = ['Y', 'T'] as const

export type JenisInternal = (typeof JENIS_INTERNAL)[number]
export type JenisEksternal = (typeof JENIS_EKSTERNAL)[number]
export type Periode = (typeof PERIODE_OPTIONS)[number]

export interface PksInfo {
  pksName: string
  pksAddress: string
  pksLatitude: string
  pksLongitude: string
  reportDate: string
  periode: string
  totalTbs: number | null
  pengisi: string
}

export interface P1MData {
  produksiTbsBersertifikat: number | null
  kapasitasPks: number | null
  produksiCpo: number | null
  fasilitasKernel: 'Y' | 'T' | ''
  totalTbs: number | null
  tbsKebunInti: number | null
  tbsPlasma: number | null
  tbsMandiri: number | null
  sistemTtp: 'Y' | 'T' | ''
  nilaiTtp: number | null
  sistemDetail: string
}

export interface SupplierRow {
  id?: string
  section: 'internal' | 'external'
  no: number
  namaPemasok: string
  jenisPemasok: string
  jumlahPetani: number | null
  sertifikasi: string
  desa: string
  kecamatan: string
  kabupaten: string
  lintang: string
  bujur: string
  legalitas: string
  luasAreal: number | null
  petaKebun: string
  volumeTbs: number | null
}

export interface FarmerRow {
  id?: string
  no: number
  nama: string
  lintang: string
  bujur: string
  legalitas: string
  desa: string
  kecamatan: string
  kabupaten: string
  luasKebun: number | null
}

export interface AgenPengumpulRow {
  id?: string
  no: number
  namaAgen: string
  alamat: string
  lintang: string
  bujur: string
  desaSumber: string
  volumeTbs: number | null
  farmers: FarmerRow[]
}

// ---- Calculation helpers (replicating Excel formulas) ----

export function pct(value: number | null | undefined, total: number | null | undefined): number {
  if (!total || total === 0 || value == null) return 0
  return value / total
}

export function sumBy<T>(items: T[], picker: (t: T) => number | null | undefined): number {
  return items.reduce((acc, it) => {
    const v = picker(it)
    return acc + (typeof v === 'number' && !isNaN(v) ? v : 0)
  }, 0)
}

export function countIf<T>(items: T[], predicate: (t: T) => boolean): number {
  return items.filter(predicate).length
}

export function sumIf<T>(
  items: T[],
  predicate: (t: T) => boolean,
  picker: (t: T) => number | null | undefined
): number {
  return sumBy(items.filter(predicate), picker)
}

// ---- Aggregate computations ----

export interface TtpSummary {
  internal: {
    kebunInti: { count: number; volume: number; pctVolume: number }
    plasma: { count: number; volume: number; pctVolume: number }
    total: { count: number; volume: number; pctVolume: number }
  }
  external: {
    perusahaan: { count: number; volume: number; pctVolume: number }
    pribadi: { count: number; volume: number; pctVolume: number }
    koperasi: { count: number; volume: number; pctVolume: number }
    agen: { count: number; volume: number; pctVolume: number }
    gapoktan: { count: number; volume: number; pctVolume: number }
    total: { count: number; volume: number; pctVolume: number }
  }
  totalVolume: number
  internalVolume: number
  externalVolume: number
  internalPct: number
  externalPct: number
}

export function computeSummary(suppliers: SupplierRow[]): TtpSummary {
  const internal = suppliers.filter((s) => s.section === 'internal')
  const external = suppliers.filter((s) => s.section === 'external')

  const totalVolume =
    sumBy(suppliers, (s) => s.volumeTbs) || 0

  const inti = internal.filter((s) => s.jenisPemasok === 'Kebun Inti')
  const plasma = internal.filter((s) => s.jenisPemasok === 'Plasma')

  const perusahaan = external.filter((s) => s.jenisPemasok === 'Perusahaan Perkebunan Pihak Ketiga')
  const pribadi = external.filter((s) => s.jenisPemasok === 'Kebun Pribadi Pihak Ketiga/Petani')
  const koperasi = external.filter((s) => s.jenisPemasok === 'Koperasi')
  const agen = external.filter((s) => s.jenisPemasok === 'Agen / Pengumpul / Ramp')
  const gapoktan = external.filter((s) => s.jenisPemasok === 'Gapoktan/Poktan')

  const internalVolume = sumBy(internal, (s) => s.volumeTbs)
  const externalVolume = sumBy(external, (s) => s.volumeTbs)

  const mk = (rows: SupplierRow[]) => ({
    count: rows.length,
    volume: sumBy(rows, (s) => s.volumeTbs),
    pctVolume: pct(sumBy(rows, (s) => s.volumeTbs), totalVolume),
  })

  const internalTotal = mk(internal)
  const externalTotal = mk(external)

  return {
    internal: {
      kebunInti: mk(inti),
      plasma: mk(plasma),
      total: {
        count: internalTotal.count,
        volume: internalVolume,
        pctVolume: pct(internalVolume, totalVolume),
      },
    },
    external: {
      perusahaan: mk(perusahaan),
      pribadi: mk(pribadi),
      koperasi: mk(koperasi),
      agen: mk(agen),
      gapoktan: mk(gapoktan),
      total: {
        count: externalTotal.count,
        volume: externalVolume,
        pctVolume: pct(externalVolume, totalVolume),
      },
    },
    totalVolume,
    internalVolume,
    externalVolume,
    internalPct: pct(internalVolume, totalVolume),
    externalPct: pct(externalVolume, totalVolume),
  }
}

// % TTP calculation: certified volume / total volume
export function computeTtpPercent(suppliers: SupplierRow[]): number {
  const total = sumBy(suppliers, (s) => s.volumeTbs) || 0
  if (total === 0) return 0
  const certified = sumBy(
    suppliers.filter((s) => s.sertifikasi === 'Ya'),
    (s) => s.volumeTbs
  )
  return certified / total
}

// Estimate max TBS capacity from luasAreal
// Excel formula: Internal rows = L*30; External Perusahaan = L*30; External others = L*20
export function estimateMaxTbs(s: SupplierRow): number {
  if (!s.luasAreal) return 0
  if (s.section === 'internal') {
    return s.luasAreal * 30
  }
  if (s.jenisPemasok === 'Perusahaan Perkebunan Pihak Ketiga') {
    return s.luasAreal * 30
  }
  return s.luasAreal * 20
}
