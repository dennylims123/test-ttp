import ExcelJS from 'exceljs'

// Types matching the raw libsql row shape
interface RawSupplier {
  section: string
  no: number
  nama_pemasok: string | null
  jenis_pemasok: string | null
  jumlah_petani: number | null
  sertifikasi: string | null
  desa: string | null
  kecamatan: string | null
  kabupaten: string | null
  lintang: string | null
  bujur: string | null
  legalitas: string | null
  luas_areal: number | null
  peta_kebun: string | null
  volume_tbs: number | null
}

interface RawFarmer {
  no: number
  nama: string | null
  lintang: string | null
  bujur: string | null
  legalitas: string | null
  desa: string | null
  kecamatan: string | null
  kabupaten: string | null
  luas_kebun: number | null
}

interface RawAgen {
  no: number
  nama_agen: string | null
  alamat: string | null
  lintang: string | null
  bujur: string | null
  desa_sumber: string | null
  volume_tbs: number | null
  farmers: RawFarmer[]
}

interface RawReport {
  id: string
  name: string
  pks_name: string | null
  pks_address: string | null
  pks_latitude: string | null
  pks_longitude: string | null
  report_date: string | null
  periode: string | null
  pengisi: string | null
  p1m_kapasitas_pks: number | null
  p1m_produksi_cpo: number | null
  p1m_nilai_ttp: number | null
  suppliers: RawSupplier[]
  agenPengumpul: RawAgen[]
}

export async function exportTtpToExcel(report: RawReport): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'TTP Web App'
  wb.created = new Date()

  // Sheet 1: Informasi
  const infoSheet = wb.addWorksheet('Informasi', { properties: { defaultColWidth: 18 } })
  infoSheet.addRow(['FORM TTP — Traceability to Plantation'])
  infoSheet.addRow([])
  infoSheet.addRow(['Nama PKS', report.pks_name || ''])
  infoSheet.addRow(['Alamat PKS', report.pks_address || ''])
  infoSheet.addRow(['Lintang', report.pks_latitude || ''])
  infoSheet.addRow(['Bujur', report.pks_longitude || ''])
  infoSheet.addRow(['Tanggal Pemberian Informasi', report.report_date || ''])
  infoSheet.addRow(['Periode Pelaporan', report.periode || ''])
  infoSheet.addRow(['Nama Pengisi', report.pengisi || ''])
  infoSheet.addRow([])
  infoSheet.addRow(['Deskripsi TTP'])
  infoSheet.addRow(['Tujuan: Memahami dari mana sebuah perusahaan, PKS, memperoleh TBS yang diproses di PKS, dan menelusurinya kembali sampai ke kebun asal.'])
  infoSheet.addRow(['Kriteria TTP: 1) Rekapan TTP, 2) List Supplier TBS, 3) Agen-Pengumpul. PKS harus dapat menelusuri pemasok TBS-nya sampai ke kebun asal.'])
  infoSheet.getCell('A1').font = { bold: true, size: 14 }

  // Sheet 2: List Supplier TBS
  const suppSheet = wb.addWorksheet('List Supplier TBS', { views: [{ state: 'frozen', ySplit: 4 }] })
  suppSheet.addRow(['Pernyataan Seluruh Pemasok TBS - Kemamputelusuran ke Kebun (Traceability to Plantation)'])
  suppSheet.addRow(['Nama PKS :', report.pks_name || ''])
  suppSheet.addRow(['Alamat PKS :', report.pks_address || ''])
  suppSheet.addRow(['Periode Pelaporan :', report.periode || ''])
  suppSheet.addRow([])
  suppSheet.addRow(['A. Internal - Sumber TBS yang berasal dari Kebun Inti dan Plasma'])
  suppSheet.addRow(['No', 'Nama Pemasok', 'Jenis Pemasok', 'Jumlah Pemasok (Petani)', 'Sertifikasi RSPO/ISPO', 'Desa', 'Kecamatan', 'Kabupaten', 'Lintang', 'Bujur', 'Status Legalitas', 'Luasan Areal (ha)', 'Peta Kebun', 'Volume TBS (ton)', '% Volume', 'Status MSD/SSD'])

  const internal = report.suppliers.filter((s: any) => s.section === 'internal')
  const external = report.suppliers.filter((s: any) => s.section === 'external')
  const totalVolume = report.suppliers.reduce((acc: number, s: any) => acc + (s.volume_tbs || 0), 0) || 0
  const internalVolume = internal.reduce((acc: number, s: any) => acc + (s.volume_tbs || 0), 0)
  const externalVolume = external.reduce((acc: number, s: any) => acc + (s.volume_tbs || 0), 0)

  internal.forEach((s: any, i: number) => {
    suppSheet.addRow([
      i + 1, s.nama_pemasok || '', s.jenis_pemasok || '', s.jumlah_petani ?? '',
      s.sertifikasi || '', s.desa || '', s.kecamatan || '', s.kabupaten || '',
      s.lintang || '', s.bujur || '', s.legalitas || '', s.luas_areal ?? '',
      s.peta_kebun || '', s.volume_tbs ?? '',
      totalVolume > 0 && s.volume_tbs ? s.volume_tbs / totalVolume : 0,
      s.msdStatus || s.msd_status || (s.desa ? '#N/A' : ''),
    ])
  })

  suppSheet.addRow(['Sub-Total Penerimaan TBS dari Kebun Inti dan Plasma', '', '', '', '', '', '', '', '', '', '', '', '', internalVolume, totalVolume > 0 ? internalVolume / totalVolume : 0, ''])
  suppSheet.addRow([])
  suppSheet.addRow(['B. Eksternal'])
  suppSheet.addRow(['No', 'Nama Pemasok', 'Jenis Pemasok', 'Jumlah Pemasok (Petani)', 'Sertifikasi RSPO/ISPO', 'Desa', 'Kecamatan', 'Kabupaten', 'Lintang', 'Bujur', 'Status Legalitas', 'Luasan Areal (ha)', 'Peta Kebun', 'Volume TBS (ton)', '% Volume', 'Status MSD/SSD'])

  external.forEach((s: any, i: number) => {
    suppSheet.addRow([
      i + 1, s.nama_pemasok || '', s.jenis_pemasok || '', s.jumlah_petani ?? '',
      s.sertifikasi || '', s.desa || '', s.kecamatan || '', s.kabupaten || '',
      s.lintang || '', s.bujur || '', s.legalitas || '', s.luas_areal ?? '',
      s.peta_kebun || '', s.volume_tbs ?? '',
      totalVolume > 0 && s.volume_tbs ? s.volume_tbs / totalVolume : 0,
      s.msdStatus || s.msd_status || (s.desa ? '#N/A' : ''),
    ])
  })

  suppSheet.addRow(['Sub-Total Penerimaan TBS dari Agen/Pengumpul/Dealer/Etc', '', '', '', '', '', '', '', '', '', '', '', '', externalVolume, totalVolume > 0 ? externalVolume / totalVolume : 0, ''])
  suppSheet.addRow(['Total pembelian TBS yang diproses PKS =', '', '', '', '', '', '', '', '', '', '', '', '', totalVolume, 1, ''])

  suppSheet.getRow(7).font = { bold: true }
  suppSheet.getRow(8).font = { bold: true }
  suppSheet.getRow(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }

  // Sheet 3: Agen-Pengumpul
  const agenSheet = wb.addWorksheet('Agen-Pengumpul (Petani)')
  agenSheet.addRow(['PHASE 2B. Pernyataan Pemasok TBS Tidak Langsung (Agen/Pengumpul)'])

  report.agenPengumpul.forEach((a, idx) => {
    agenSheet.addRow([`Agen #${idx + 1}`])
    agenSheet.addRow(['Nama Agen/Pengumpul', a.nama_agen || ''])
    agenSheet.addRow(['Alamat', a.alamat || ''])
    agenSheet.addRow(['Lintang', a.lintang || ''])
    agenSheet.addRow(['Bujur', a.bujur || ''])
    agenSheet.addRow(['Desa Sumber TBS', a.desa_sumber || ''])
    agenSheet.addRow(['Volume TBS yang dipasok ke PKS (ton)', a.volume_tbs ?? ''])
    agenSheet.addRow([])
    agenSheet.addRow(['No', 'Nama Petani', 'Lintang', 'Bujur', 'Legalitas', 'Desa', 'Kecamatan', 'Kabupaten', 'Luas Kebun (Ha)', '% Luas', 'Est. Volume (ton)', 'Status MSD/SSD'])
    const totalLuas = a.farmers.reduce((acc: number, f: any) => acc + (f.luas_kebun || 0), 0)
    a.farmers.forEach((f: any, i: number) => {
      const pctLuas = totalLuas > 0 && f.luas_kebun ? f.luas_kebun / totalLuas : 0
      agenSheet.addRow([
        i + 1, f.nama || '', f.lintang || '', f.bujur || '', f.legalitas || '',
        f.desa || '', f.kecamatan || '', f.kabupaten || '', f.luas_kebun ?? '',
        pctLuas, pctLuas * (a.volume_tbs || 0),
        f.msdStatus || f.msd_status || (f.desa ? '#N/A' : ''),
      ])
    })
    agenSheet.addRow(['', '', '', '', '', '', '', 'Total', totalLuas, 1, a.volume_tbs ?? 0, ''])
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
  const intiCount = internal.filter((s) => s.jenis_pemasok === 'Kebun Inti').length
  const plasmaCount = internal.filter((s) => s.jenis_pemasok === 'Plasma').length
  sumSheet.addRow([intiCount, plasmaCount])
  sumSheet.addRow(['Total', intiCount + plasmaCount])
  sumSheet.addRow([])
  sumSheet.addRow(['EKSTERNAL'])
  sumSheet.addRow(['Pasokan Eksternal (Jumlah)'])
  sumSheet.addRow(['Perusahaan Perkebunan Pihak Ketiga', 'Kebun Pribadi Pihak Ketiga', 'Koperasi', 'Agen', 'Gapoktan (Poktan)'])
  const extCount = (jenis: string) => external.filter((s) => s.jenis_pemasok === jenis).length
  const extVolume = (jenis: string) => external.filter((s) => s.jenis_pemasok === jenis).reduce((acc, s) => acc + (s.volume_tbs || 0), 0)
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
  rekapanSheet.addRow(['Nama PKS :', report.pks_name || ''])
  rekapanSheet.addRow(['Alamat PKS :', report.pks_address || ''])
  rekapanSheet.addRow(['Titik Koordinat :', `${report.pks_latitude || ''}, ${report.pks_longitude || ''}`])
  rekapanSheet.addRow(['Tanggal Pemberian Informasi :', report.report_date || ''])
  rekapanSheet.addRow(['Periode Pelaporan :', report.periode || ''])
  rekapanSheet.addRow([])
  rekapanSheet.addRow(['Data PKS', '', 'Data Sumber TBS', '', '', 'TTP'])
  rekapanSheet.addRow(['', '', 'Internal', '', 'Eksternal', ''])
  rekapanSheet.addRow(['TBS yang diproses (ton/tahun)', 'Kapasitas PKS (Ton/jam)', 'Produksi CPO (Ton)', 'Total TBS Kebun Inti (Ton)', 'Total TBS Plasma (Ton)', 'Total TBS Pemasok Mandiri (Ton)', '% TTP'])
  rekapanSheet.addRow([
    totalVolume,
    report.p1m_kapasitas_pks ?? '',
    report.p1m_produksi_cpo ?? '',
    internal.filter((s) => s.jenis_pemasok === 'Kebun Inti').reduce((a, s) => a + (s.volume_tbs || 0), 0),
    internal.filter((s) => s.jenis_pemasok === 'Plasma').reduce((a, s) => a + (s.volume_tbs || 0), 0),
    externalVolume,
    report.p1m_nilai_ttp ?? '',
  ])

  const buf = await wb.xlsx.writeBuffer()
  return Buffer.from(buf)
}
