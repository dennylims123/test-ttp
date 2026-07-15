'use client'

import { useTtpStore } from '@/lib/ttp/store'
import {
  JENIS_INTERNAL,
  JENIS_EKSTERNAL,
  JENIS_PLANTATION,
  JENIS_SMALLHOLDER,
  LEGALITAS_OPTIONS,
  YA_TIDAK,
  estimateMaxTbs,
  type SupplierRow,
} from '@/lib/ttp/types'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Trash2, Plus, Users, ArrowRight } from 'lucide-react'
import { VillageAutocomplete } from './village-autocomplete'
import { Badge } from '@/components/ui/badge'

const AGEN_JENIS = 'Agen / Pengumpul / Ramp'

interface Props {
  section: 'internal' | 'external'
  readOnly?: boolean
  jenisFilter?: readonly string[]
  title?: string
}

export function SupplierTable({ section, readOnly = false, jenisFilter, title }: Props) {
  const { suppliers, addSupplier, updateSupplier, removeSupplier, jumpToAgen, agen } = useTtpStore()
  const rows = suppliers.filter((s) => {
    if (s.section !== section) return false
    if (jenisFilter && !jenisFilter.includes(s.jenisPemasok)) return false
    return true
  })
  const jenisOptions = section === 'internal' ? JENIS_INTERNAL : (jenisFilter ? jenisFilter : JENIS_EKSTERNAL)

  const subtotalVolume = rows.reduce((acc, r) => acc + (r.volumeTbs || 0), 0)
  const grandTotal = suppliers.reduce((acc, r) => acc + (r.volumeTbs || 0), 0)
  const pctOfTotal = grandTotal > 0 ? (subtotalVolume / grandTotal) * 100 : 0

  const updateRow = (no: number, patch: Partial<SupplierRow>) => {
    const idx = suppliers.findIndex((s) => s.section === section && s.no === no)
    if (idx >= 0) updateSupplier(idx, patch)
  }

  const handleVillageSelect = (no: number, villageDesa: string, full?: string, msdStatus?: string) => {
    if (full) {
      const parts = full.split(',').map((p) => p.trim())
      const patch: Partial<SupplierRow> = { desa: villageDesa, msdStatus: msdStatus || null }
      if (parts.length >= 2) patch.kecamatan = parts[1]
      if (parts.length >= 3) patch.kabupaten = parts[2]
      updateRow(no, patch)
    } else {
      // Manual input (village not from autocomplete) — clear MSD status
      updateRow(no, { desa: villageDesa, msdStatus: null })
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 sticky top-0">
            <tr>
              <th className="px-2 py-2 text-left font-medium w-10">No</th>
              <th className="px-2 py-2 text-left font-medium min-w-[160px]">Nama Pemasok*</th>
              <th className="px-2 py-2 text-left font-medium min-w-[160px]">Jenis Pemasok*</th>
              <th className="px-2 py-2 text-left font-medium w-20">Jumlah Petani</th>
              <th className="px-2 py-2 text-left font-medium w-24">Sertifikasi RSPO/ISPO</th>
              <th className="px-2 py-2 text-left font-medium min-w-[140px]">Desa</th>
              <th className="px-2 py-2 text-left font-medium min-w-[120px]">Kecamatan</th>
              <th className="px-2 py-2 text-left font-medium min-w-[120px]">Kabupaten</th>
              <th className="px-2 py-2 text-left font-medium w-24">Lintang</th>
              <th className="px-2 py-2 text-left font-medium w-24">Bujur</th>
              <th className="px-2 py-2 text-left font-medium w-28">Legalitas</th>
              <th className="px-2 py-2 text-left font-medium w-24">Luas (ha)</th>
              <th className="px-2 py-2 text-left font-medium w-24">Peta Kebun</th>
              <th className="px-2 py-2 text-left font-medium w-28">Volume TBS (ton)</th>
              <th className="px-2 py-2 text-left font-medium w-20">Est. Max TBS</th>
              <th className="px-2 py-2 text-left font-medium w-24">Status</th>
              {section === 'external' && <th className="px-2 py-2 text-left font-medium w-28">Petani</th>}
              <th className="px-2 py-2 text-left font-medium w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={section === 'external' ? 18 : 17} className="text-center text-muted-foreground py-8">
                  Belum ada data pemasok. Klik &quot;Tambah Baru&quot; untuk menambahkan.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const estMax = estimateMaxTbs(row)
                const isAgen = row.jenisPemasok === AGEN_JENIS
                const linkedAgen = agen.find((a) => a.linkedSupplierNo === row.no)
                const farmerCount = linkedAgen?.farmers.length || 0

                return (
                  <tr key={row.no} className="border-t hover:bg-muted/30">
                    <td className="px-2 py-1.5">{row.no}</td>
                    <td className="px-1 py-1">
                      <Input
                        value={row.namaPemasok}
                        onChange={(e) => updateRow(row.no, { namaPemasok: e.target.value })}
                        placeholder="Nama"
                        className="h-8 text-xs min-w-[140px]"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Select
                        value={row.jenisPemasok}
                        onValueChange={(v) => updateRow(row.no, { jenisPemasok: v })}
                      >
                        <SelectTrigger className="h-8 text-xs min-w-[140px]">
                          <SelectValue placeholder="Pilih jenis" />
                        </SelectTrigger>
                        <SelectContent>
                          {jenisOptions.map((j) => (
                            <SelectItem key={j} value={j} className="text-xs">
                              {j}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        type="number"
                        value={row.jumlahPetani ?? ''}
                        onChange={(e) =>
                          updateRow(row.no, {
                            jumlahPetani: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        placeholder="0"
                        className="h-8 text-xs w-20"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Select
                        value={row.sertifikasi || 'Tidak'}
                        onValueChange={(v) => updateRow(row.no, { sertifikasi: v })}
                      >
                        <SelectTrigger className="h-8 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YA_TIDAK.map((j) => (
                            <SelectItem key={j} value={j} className="text-xs">
                              {j}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1">
                      <VillageAutocomplete
                        value={row.desa}
                        onChange={(val, v) =>
                          v
                            ? handleVillageSelect(row.no, val, v.full, (v as any).msd_status)
                            : handleVillageSelect(row.no, val)
                        }
                        placeholder="Desa"
                        className="h-8 text-xs min-w-[120px]"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={row.kecamatan}
                        onChange={(e) => updateRow(row.no, { kecamatan: e.target.value })}
                        placeholder="Kecamatan"
                        className="h-8 text-xs min-w-[110px]"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        value={row.kabupaten}
                        onChange={(e) => updateRow(row.no, { kabupaten: e.target.value })}
                        placeholder="Kabupaten"
                        className="h-8 text-xs min-w-[110px]"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        type="number"
                        step="any"
                        value={row.lintang}
                        onChange={(e) => updateRow(row.no, { lintang: e.target.value })}
                        placeholder="-0.0"
                        className="h-8 text-xs w-24"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        type="number"
                        step="any"
                        value={row.bujur}
                        onChange={(e) => updateRow(row.no, { bujur: e.target.value })}
                        placeholder="0.0"
                        className="h-8 text-xs w-24"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Select
                        value={row.legalitas}
                        onValueChange={(v) => updateRow(row.no, { legalitas: v })}
                      >
                        <SelectTrigger className="h-8 text-xs w-28">
                          <SelectValue placeholder="Pilih" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEGALITAS_OPTIONS.map((j) => (
                            <SelectItem key={j} value={j} className="text-xs">
                              {j}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        type="number"
                        step="any"
                        value={row.luasAreal ?? ''}
                        onChange={(e) =>
                          updateRow(row.no, {
                            luasAreal: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        placeholder="0"
                        className="h-8 text-xs w-24"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <Select
                        value={row.petaKebun || 'Tidak'}
                        onValueChange={(v) => updateRow(row.no, { petaKebun: v })}
                      >
                        <SelectTrigger className="h-8 text-xs w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {YA_TIDAK.map((j) => (
                            <SelectItem key={j} value={j} className="text-xs">
                              {j}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-1 py-1">
                      <Input
                        type="number"
                        step="any"
                        value={row.volumeTbs ?? ''}
                        onChange={(e) =>
                          updateRow(row.no, {
                            volumeTbs: e.target.value === '' ? null : Number(e.target.value),
                          })
                        }
                        placeholder="0"
                        className={`h-8 text-xs w-28 font-medium ${
                          row.volumeTbs && estMax > 0 && row.volumeTbs > estMax
                            ? 'border-amber-500 bg-amber-50'
                            : ''
                        }`}
                      />
                    </td>
                    <td className="px-2 py-1 text-xs text-muted-foreground tabular-nums">
                      {estMax > 0 ? estMax.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="px-2 py-1">
                      {row.msdStatus ? (
                        <span className={
                          row.msdStatus === 'MSD'
                            ? 'text-[10px] font-medium px-1.5 py-0.5 rounded bg-permata-accent/15 text-permata-forest'
                            : row.msdStatus === 'Non-MSD'
                            ? 'text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700'
                            : 'text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500'
                        }>
                          {row.msdStatus}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </td>
                    {section === 'external' && (
                      <td className="px-1 py-1">
                        {isAgen ? (
                          <Button
                            size="sm"
                            variant={farmerCount > 0 ? 'default' : 'outline'}
                            className="h-7 text-[11px] gap-1"
                            onClick={() => jumpToAgen(row.no)}
                            title={farmerCount > 0 ? `${farmerCount} petani` : 'Belum ada petani'}
                          >
                            <Users className="h-3 w-3" />
                            {farmerCount > 0 ? `${farmerCount}` : 'Isi'}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground px-2">—</span>
                        )}
                      </td>
                    )}
                    <td className="px-1 py-1">
                      {!readOnly ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => {
                            const idx = suppliers.findIndex(
                              (s) => s.section === section && s.no === row.no
                            )
                            if (idx >= 0) removeSupplier(idx)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t-2 bg-muted/40 font-medium">
                <td colSpan={section === 'external' ? 14 : 13} className="px-2 py-2 text-right">
                  Sub-Total Volume TBS ({section === 'internal' ? 'Internal' : 'Eksternal'}):
                </td>
                <td className="px-2 py-2 text-right tabular-nums">
                  {subtotalVolume.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                </td>
                <td className="px-2 py-2 text-xs text-muted-foreground tabular-nums">
                  {pctOfTotal.toFixed(2)}%
                </td>
                {section === 'external' && <td></td>}
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        {!readOnly && (
          <Button variant="outline" size="sm" onClick={() => addSupplier(section)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Baru
          </Button>
        )}
        {section === 'external' && (
          <p className="text-[11px] text-muted-foreground">
            <strong>Agen / Pengumpul / Ramp</strong> — setelah memilih jenis ini, klik tombol{' '}
            <Badge variant="outline" className="text-[10px] mx-1">
              <Users className="h-2.5 w-2.5 mr-0.5" /> Isi <ArrowRight className="h-2.5 w-2.5" />
            </Badge>
            untuk mengisi daftar petani di tab Agen-Pengumpul.
          </p>
        )}
      </div>
    </div>
  )
}
