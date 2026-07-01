import ExcelJS from 'exceljs'
import type { TtpReport, SupplierTbs, AgenPengumpul } from '@prisma/client'

interface FullReport extends TtpReport {
  suppliers: SupplierTbs[]
  agenPengumpul: (AgenPengumpul & { farmers: any[] })[]
}

export async function exportTtpToExcel(report: FullReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'TTP Web App'
  wb.created = new Date()

  // Sheet 1: Informasi & Deskripsi
  const infoSheet = wb.addWorksheet('Informasi', {
    properties: { defaultColWidth: 18 },
  })
  infoSheet.addRow(['FORM TTP — Traceability to Plantation'])
  infoSheet.addRow([])
  infoSheet.addRow(['Nama PKS', report.pksName || ''])
  infoSheet.addRow(['Alamat PKS', report.pksAddress || ''])
  infoSheet.addRow(['Lintang', report.pksLatitude || ''])
  infoSheet.addRow(['Bujur', report.pksLongitude || ''])
  infoSheet.addRow(['Tanggal Pemberian Informasi', report.reportDate || ''])
  infoSheet.addRow(['Periode Pelaporan', report.periode || ''])
  infoSheet.addRow(['Nama Pengisi', report.pengisi || ''])
  infoSheet.addRow([])
  infoSheet.addRow(['Deskripsi TTP'])
  infoSheet.addRow([
    'Tujuan: Memahami dari mana sebuah perusahaan, PKS, memperoleh TBS yang diproses di PKS, dan menelusurinya kembali sampai ke kebun asal.',
  ])
  infoSheet.addRow([
    'Kriteria TTP: 1) Rekapan TTP, 2) List Supplier TBS, 3) Agen-Pengumpul. PKS harus dapat menelusuri pemasok TBS-nya sampai ke kebun asal.',
  ])
  infoSheet.getCell('A1').font = { bold: true, size: 14 }

  // Sheet 2: List Supplier TBS
  const suppSheet = wb.addWorksheet('List Supplier TBS', {
    views: [{ state: 'frozen', ySplit: 4 }],
  })
  suppSheet.addRow(['Pernyataan Seluruh Pemasok TBS - Kemamputelusuran ke Kebun (Traceability to Plantation)'])
  suppSheet.addRow(['Nama PKS :', report.pksName || ''])
  suppSheet.addRow(['Alamat PKS :', report.pksAddress || ''])
  suppSheet.addRow(['Periode Pelaporan :', report.periode || ''])

  suppSheet.addRow([])
  suppSheet.addRow(['A. Internal - Sumber TBS yang berasal dari Kebun Inti dan Plasma'])
  suppSheet.addRow([
    'No',
    'Nama Pemasok',
    'Jenis Pemasok',
    'Jumlah Pemasok (Petani)',
    'Sertifikasi RSPO/ISPO',
    'Desa',
    'Kecamatan',
    'Kabupaten',
    'Lintang',
    'Bujur',
    'Status Legalitas',
    'Luasan Areal (ha)',
    'Peta Kebun',
    'Volume TBS (ton)',
    '% Volume',
  ])

  const internal = report.suppliers.filter((s) => s.section === 'internal')
  const external = report.suppliers.filter((s) => s.section === 'external')
  const totalVolume =
    report.suppliers.reduce((acc, s) => acc + (s.volumeTbs || 0), 0) || 0
  const internalVolume = internal.reduce((acc, s) => acc + (s.volumeTbs || 0), 0)
  const externalVolume = external.reduce((acc, s) => acc + (s.volumeTbs || 0), 0)

  internal.forEach((s, i) => {
    suppSheet.addRow([
      i + 1,
      s.namaPemasok || '',
      s.jenisPemasok || '',
      s.jumlahPetani ?? '',
      s.sertifikasi || '',
      s.desa || '',
      s.kecamatan || '',
      s.kabupaten || '',
      s.lintang || '',
      s.bujur || '',
      s.legalitas || '',
      s.luasAreal ?? '',
      s.petaKebun || '',
      s.volumeTbs ?? '',
      totalVolume > 0 && s.volumeTbs ? s.volumeTbs / totalVolume : 0,
    ])
  })

  suppSheet.addRow([
    'Sub-Total Penerimaan TBS dari Kebun Inti dan Plasma',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    internalVolume,
    totalVolume > 0 ? internalVolume / totalVolume : 0,
  ])

  suppSheet.addRow([])
  suppSheet.addRow(['B. Eksternal'])
  suppSheet.addRow([
    'No',
    'Nama Pemasok',
    'Jenis Pemasok',
    'Jumlah Pemasok (Petani)',
    'Sertifikasi RSPO/ISPO',
    'Desa',
    'Kecamatan',
    'Kabupaten',
    'Lintang',
    'Bujur',
    'Status Legalitas',
    'Luasan Areal (ha)',
    'Peta Kebun',
    'Volume TBS (ton)',
    '% Volume',
  ])

  external.forEach((s, i) => {
    suppSheet.addRow([
      i + 1,
      s.namaPemasok || '',
      s.jenisPemasok || '',
      s.jumlahPetani ?? '',
      s.sertifikasi || '',
      s.desa || '',
      s.kecamatan || '',
      s.kabupaten || '',
      s.lintang || '',
      s.bujur || '',
      s.legalitas || '',
      s.luasAreal ?? '',
      s.petaKebun || '',
      s.volumeTbs ?? '',
      totalVolume > 0 && s.volumeTbs ? s.volumeTbs / totalVolume : 0,
    ])
  })

  suppSheet.addRow([
    'Sub-Total Penerimaan TBS dari Agen/Pengumpul/Dealer/Etc',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    externalVolume,
    totalVolume > 0 ? externalVolume / totalVolume : 0,
  ])
  suppSheet.addRow([
    'Total pembelian TBS yang diproses PKS =',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    totalVolume,
    1,
  ])

  // Make headers bold
  suppSheet.getRow(7).font = { bold: true }
  suppSheet.getRow(8).font = { bold: true }
  suppSheet.getRow(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }

  // Sheet 3: Agen-Pengumpul
  const agenSheet = wb.addWorksheet('Agen-Pengumpul (Petani)')
  agenSheet.addRow(['PHASE 2B. Pernyataan Pemasok TBS Tidak Langsung (Agen/Pengumpul)'])

  report.agenPengumpul.forEach((a, idx) => {
    agenSheet.addRow([`Agen #${idx + 1}`])
    agenSheet.addRow(['Nama Agen/Pengumpul', a.namaAgen || ''])
    agenSheet.addRow(['Alamat', a.alamat || ''])
    agenSheet.addRow(['Lintang', a.lintang || ''])
    agenSheet.addRow(['Bujur', a.bujur || ''])
    agenSheet.addRow(['Desa Sumber TBS', a.desaSumber || ''])
    agenSheet.addRow(['Volume TBS yang dipasok ke PKS (ton)', a.volumeTbs ?? ''])
    agenSheet.addRow([])
    agenSheet.addRow([
      'No',
      'Nama Petani',
      'Lintang',
      'Bujur',
      'Legalitas',
      'Desa',
      'Kecamatan',
      'Kabupaten',
      'Luas Kebun (Ha)',
      '% Luas',
      'Est. Volume (ton)',
    ])
    const totalLuas = a.farmers.reduce((acc, f) => acc + (f.luasKebun || 0), 0)
    a.farmers.forEach((f, i) => {
      const pctLuas = totalLuas > 0 && f.luasKebun ? f.luasKebun / totalLuas : 0
      agenSheet.addRow([
        i + 1,
        f.nama || '',
        f.lintang || '',
        f.bujur || '',
        f.legalitas || '',
        f.desa || '',
        f.kecamatan || '',
        f.kabupaten || '',
        f.luasKebun ?? '',
        pctLuas,
        pctLuas * (a.volumeTbs || 0),
      ])
    })
    agenSheet.addRow(['', '', '', '', '', '', '', 'Total', totalLuas, 1, a.volumeTbs ?? 0])
    agenSheet.addRow([])
  })

  // Sheet 4: Summary
  const sumSheet = wb.addWorksheet('Summary')
  sumSheet.addRow(['Summary Sumber Pasokan TBS'])
  sumSheet.addRow([])
  sumSheet.addRow(['Internal', 'Eksternal', 'Total (Tonase)'])
  sumSheet.addRow([internalVolume, externalVolume, totalVolume])
  sumSheet.addRow([])
  sumSheet.addRow(['INTERNAL'])
  sumSheet.addRow(['Pasokan Internal (Jumlah)'])
  sumSheet.addRow(['Kebun Inti', 'Plasma'])
  const intiCount = internal.filter((s) => s.jenisPemasok === 'Kebun Inti').length
  const plasmaCount = internal.filter((s) => s.jenisPemasok === 'Plasma').length
  sumSheet.addRow([intiCount, plasmaCount])
  sumSheet.addRow(['Total', intiCount + plasmaCount])
  sumSheet.addRow([])
  sumSheet.addRow(['EKSTERNAL'])
  sumSheet.addRow(['Pasokan Eksternal (Jumlah)'])
  sumSheet.addRow([
    'Perusahaan Perkebunan Pihak Ketiga',
    'Kebun Pribadi Pihak Ketiga',
    'Koperasi',
    'Agen',
    'Gapoktan (Poktan)',
  ])
  const extCount = (jenis: string) =>
    external.filter((s) => s.jenisPemasok === jenis).length
  const extVolume = (jenis: string) =>
    external.filter((s) => s.jenisPemasok === jenis).reduce((acc, s) => acc + (s.volumeTbs || 0), 0)
  sumSheet.addRow([
    extCount('Perusahaan Perkebunan Pihak Ketiga'),
    extCount('Kebun Pribadi Pihak Ketiga/Petani'),
    extCount('Koperasi'),
    extCount('Agen / Pengumpul / Ramp'),
    extCount('Gapoktan/Poktan'),
  ])
  sumSheet.addRow([])
  sumSheet.addRow(['Persentase Pasokan Volume TBS Eksternal (% per Kategori)'])
  sumSheet.addRow([
    extVolume('Perusahaan Perkebunan Pihak Ketiga'),
    extVolume('Kebun Pribadi Pihak Ketiga/Petani'),
    extVolume('Koperasi'),
    extVolume('Agen / Pengumpul / Ramp'),
    extVolume('Gapoktan/Poktan'),
  ])

  // Sheet 5: Rekapan TTP
  const rekapanSheet = wb.addWorksheet('Rekapan TTP')
  rekapanSheet.addRow(['Pernyataan di Awal Kebertelusuran ke Kebun/Traceability to Plantation'])
  rekapanSheet.addRow(['Nama PKS :', report.pksName || ''])
  rekapanSheet.addRow(['Alamat PKS :', report.pksAddress || ''])
  rekapanSheet.addRow(['Titik Koordinat :', `${report.pksLatitude || ''}, ${report.pksLongitude || ''}`])
  rekapanSheet.addRow(['Tanggal Pemberian Informasi :', report.reportDate || ''])
  rekapanSheet.addRow(['Periode Pelaporan :', report.periode || ''])
  rekapanSheet.addRow([])
  rekapanSheet.addRow(['Data PKS', '', 'Data Sumber TBS', '', '', 'TTP'])
  rekapanSheet.addRow(['', '', 'Internal', '', 'Eksternal', ''])
  rekapanSheet.addRow([
    'TBS yang diproses (ton/tahun)',
    'Kapasitas PKS (Ton/jam)',
    'Produksi CPO (Ton)',
    'Total TBS Kebun Inti (Ton)',
    'Total TBS Plasma (Ton)',
    'Total TBS Pemasok Mandiri (Ton)',
    '% TTP',
  ])
  rekapanSheet.addRow([
    totalVolume,
    report.p1mKapasitasPks ?? '',
    report.p1mProduksiCpo ?? '',
    internal.filter((s) => s.jenisPemasok === 'Kebun Inti').reduce((a, s) => a + (s.volumeTbs || 0), 0),
    internal.filter((s) => s.jenisPemasok === 'Plasma').reduce((a, s) => a + (s.volumeTbs || 0), 0),
    externalVolume,
    report.p1mNilaiTtp ?? '',
  ])

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
