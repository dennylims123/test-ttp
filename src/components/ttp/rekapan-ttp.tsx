'use client'

import { useTtpStore } from '@/lib/ttp/store'
import { computeSummary, computeTtpPercent, getSupplyCategory } from '@/lib/ttp/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Y_T } from '@/lib/ttp/types'
import { Info, FileSpreadsheet } from 'lucide-react'

function fmt(n: number | null | undefined, digits = 2) {
  if (n == null || !isFinite(n)) return '-'
  return n.toLocaleString('id-ID', { maximumFractionDigits: digits })
}

interface RekapanTtpProps {
  readOnly?: boolean
}

export function RekapanTtp({ readOnly = false }: RekapanTtpProps) {
  const { pks, p1m, setPks, setP1m, suppliers } = useTtpStore()
  const s = computeSummary(suppliers)
  const ttpPct = computeTtpPercent(suppliers)

  // Auto-derived: total TBS = internal + external
  const autoTotalTbs = s.totalVolume
  const autoTbsInti = s.internal.kebunInti.volume
  const autoTbsPlasma = s.internal.plasma.volume
  const autoTbsMandiri = s.externalVolume
  // 3-way category volumes
  const dmaVolume = suppliers.filter((s) => getSupplyCategory(s) === 'DMA').reduce((a, s) => a + (s.volumeTbs || 0), 0)
  const plantationVolume = suppliers.filter((s) => getSupplyCategory(s) === 'Independent Plantation').reduce((a, s) => a + (s.volumeTbs || 0), 0)
  const smallholderVolume = suppliers.filter((s) => getSupplyCategory(s) === 'Independent Smallholder').reduce((a, s) => a + (s.volumeTbs || 0), 0)

  return (
    <div className="space-y-6">
      {/* Section 1: PKS Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pernyataan di Awal Kebertelusuran ke Kebun</CardTitle>
          <CardDescription>
            Traceability to Plantation — ringkasan data PKS dan tingkat kemamputelusuran
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Nama PKS</Label>
            <Input
              value={pks.pksName}
              onChange={(e) => setPks({ pksName: e.target.value })}
              placeholder="Nama PKS yang melaporkan"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Tanggal Pemberian Informasi</Label>
            <Input
              value={pks.reportDate}
              onChange={(e) => setPks({ reportDate: e.target.value })}
              placeholder="Contoh: 27 Desember 2024"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-xs">Alamat PKS</Label>
            <Textarea
              value={pks.pksAddress}
              onChange={(e) => setPks({ pksAddress: e.target.value })}
              placeholder="Alamat PKS, mulai dari nama jalan (jika ada), desa, kecamatan, kabupaten, provinsi"
              className="min-h-[60px]"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Lintang (Latitude)</Label>
            <Input
              type="number"
              step="any"
              value={pks.pksLatitude}
              onChange={(e) => setPks({ pksLatitude: e.target.value })}
              placeholder="-0.001780"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Bujur (Longitude)</Label>
            <Input
              type="number"
              step="any"
              value={pks.pksLongitude}
              onChange={(e) => setPks({ pksLongitude: e.target.value })}
              placeholder="101.353716"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Periode Pelaporan</Label>
            <Input
              value={pks.periode}
              onChange={(e) => setPks({ periode: e.target.value })}
              placeholder="Contoh: 1 Juli - 31 Desember 2024"
              disabled={readOnly}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nama Pengisi</Label>
            <Input
              value={pks.pengisi}
              onChange={(e) => setPks({ pengisi: e.target.value })}
              placeholder="Nama pengisi form"
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Data PKS & Sumber TBS (auto-derived) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data PKS & Sumber TBS</CardTitle>
          <CardDescription>
            Nilai otomatis dihitung dari form P2A (List Supplier TBS)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatBox
              label="TBS yang diproses (ton/tahun)"
              value={fmt(autoTotalTbs)}
              derived
            />
            <StatBox
              label="DMA — Internal (Ton)"
              value={fmt(dmaVolume)}
              derived
            />
            <StatBox
              label="Independent Plantation (Ton)"
              value={fmt(plantationVolume)}
              derived
            />
            <StatBox
              label="Independent Smallholder (Ton)"
              value={fmt(smallholderVolume)}
              derived
            />
            <StatBox
              label="% TTP (Traceable)"
              value={`${(ttpPct * 100).toFixed(2)}%`}
              derived
              highlight={ttpPct >= 0.95}
            />
          </div>
          <div className="mt-4 flex items-start gap-2 p-3 rounded-md bg-blue-50 text-blue-800 text-xs">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>Catatan:</strong> Nilai TBS di atas otomatis dihitung dari data di tab
              &quot;2. List Supplier TBS&quot;. Tidak perlu diisi manual.
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: P1M Traceability Statement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">P1.M — Pernyataan Kemamputelusuran</CardTitle>
          <CardDescription>
            Pernyataan di awal kebertelusuran ke kebon (Phase 1)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset disabled={readOnly} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Fasilitas Pengolah Kernel / KCP (Y/T)</Label>
              <Select
                value={p1m.fasilitasKernel}
                onValueChange={(v) => setP1m({ fasilitasKernel: v as 'Y' | 'T' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {Y_T.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j === 'Y' ? 'Ya' : 'Tidak'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Apakah PKS Memiliki Sistem TTP? (Y/T)</Label>
              <Select
                value={p1m.sistemTtp}
                onValueChange={(v) => setP1m({ sistemTtp: v as 'Y' | 'T' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih" />
                </SelectTrigger>
                <SelectContent>
                  {Y_T.map((j) => (
                    <SelectItem key={j} value={j}>
                      {j === 'Y' ? 'Ya' : 'Tidak'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nilai % Kemamputelusuran</Label>
              <Input
                type="number"
                step="any"
                value={p1m.nilaiTtp ?? ''}
                onChange={(e) =>
                  setP1m({
                    nilaiTtp: e.target.value === '' ? null : Number(e.target.value),
                  })
                }
                placeholder="0.95"
              />
            </div>
          </div>

          {/* Auto-derived TBS data from List Supplier TBS (read-only) */}
          <div className="rounded-md border border-permata-forest/20 bg-permata-green-light/30 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-medium text-permata-teal">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Data Sumber TBS — Otomatis dari tab &quot;2. List Supplier TBS&quot;
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Total TBS Diterima (Ton)</Label>
                <div className="text-sm font-semibold tabular-nums text-permata-teal">
                  {s.totalVolume.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">TBS Kebun Inti (Ton)</Label>
                <div className="text-sm font-semibold tabular-nums">
                  {s.internal.kebunInti.volume.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">TBS Plasma / KKPA / Kemitraan (Ton)</Label>
                <div className="text-sm font-semibold tabular-nums">
                  {s.internal.plasma.volume.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">TBS Pemasok Mandiri Pihak Ketiga (Ton)</Label>
                <div className="text-sm font-semibold tabular-nums">
                  {s.externalVolume.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-permata-forest/10">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">% TTP (Traceable)</Label>
                <div className="text-sm font-semibold tabular-nums text-permata-accent">
                  {(ttpPct * 100).toFixed(2)}%
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">DMA (Internal)</Label>
                <div className="text-sm font-semibold tabular-nums">
                  {dmaVolume.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton
                  {' '}
                  ({s.totalVolume > 0 ? ((dmaVolume / s.totalVolume) * 100).toFixed(1) : 0}%)
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Independent Plantation</Label>
                <div className="text-sm font-semibold tabular-nums">
                  {plantationVolume.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton
                  {' '}
                  ({s.totalVolume > 0 ? ((plantationVolume / s.totalVolume) * 100).toFixed(1) : 0}%)
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Independent Smallholder</Label>
                <div className="text-sm font-semibold tabular-nums">
                  {smallholderVolume.toLocaleString('id-ID', { maximumFractionDigits: 2 })} Ton
                  {' '}
                  ({s.totalVolume > 0 ? ((smallholderVolume / s.totalVolume) * 100).toFixed(1) : 0}%)
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">Total Pemasok</Label>
                <div className="text-sm font-semibold tabular-nums">
                  {s.internal.total.count + s.external.total.count} pemasok
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Detail Sistem Kemamputelusuran (SOP, Perhitungan, Dokumen Pendukung)
            </Label>
            <Textarea
              value={p1m.sistemDetail}
              onChange={(e) => setP1m({ sistemDetail: e.target.value })}
              placeholder="Contoh: 1. SOP Pendataaan pemasok. 2. Perhitungan..."
              className="min-h-[80px]"
            />
          </div>
          </fieldset>
        </CardContent>
      </Card>
    </div>
  )
}

function StatBox({
  label,
  value,
  derived,
  editable,
  highlight,
  onChange,
}: {
  label: string
  value: string
  derived?: boolean
  editable?: boolean
  highlight?: boolean
  onChange?: (v: number | null) => void
}) {
  return (
    <div
      className={`rounded-md border p-3 space-y-1 ${
        highlight ? 'bg-permata-green-light border-permata-accent/30' : derived ? 'bg-muted/30' : ''
      }`}
    >
      <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
      {editable && onChange ? (
        <Input
          type="number"
          step="any"
          value={value === '-' ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
          className="h-8 text-sm font-semibold tabular-nums"
        />
      ) : (
        <p className="text-sm font-semibold tabular-nums">{value}</p>
      )}
      {derived && (
        <p className="text-[10px] text-muted-foreground italic">otomatis</p>
      )}
    </div>
  )
}
