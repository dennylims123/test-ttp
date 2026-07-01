'use client'

import { useTtpStore } from '@/lib/ttp/store'
import { LEGALITAS_OPTIONS } from '@/lib/ttp/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Plus, Trash2, ChevronDown, MapPin } from 'lucide-react'
import { VillageAutocomplete } from './village-autocomplete'
import { useState } from 'react'

export function AgenForm() {
  const { agen, addAgen, updateAgen, removeAgen, addFarmer, updateFarmer, removeFarmer } =
    useTtpStore()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">
            PHASE 2B. Pernyataan Pemasok TBS Tidak Langsung
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Untuk pemasok tidak langsung (Agen / Pengumpul / Ramp / Dealer). Catat semua petani
            yang memasok TBS melalui agen ini.
          </p>
        </div>
        <Button size="sm" onClick={addAgen}>
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah Agen
        </Button>
      </div>

      {agen.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada agen/pengumpul. Klik &quot;Tambah Agen&quot; untuk memulai.
          </CardContent>
        </Card>
      ) : (
        agen.map((a, idx) => (
          <AgenCard
            key={idx}
            agenIdx={idx}
            data={a}
            updateAgen={updateAgen}
            removeAgen={removeAgen}
            addFarmer={addFarmer}
            updateFarmer={updateFarmer}
            removeFarmer={removeFarmer}
          />
        ))
      )}
    </div>
  )
}

interface AgenCardProps {
  agenIdx: number
  data: ReturnType<typeof useTtpStore.getState>['agen'][number]
  updateAgen: ReturnType<typeof useTtpStore.getState>['updateAgen']
  removeAgen: ReturnType<typeof useTtpStore.getState>['removeAgen']
  addFarmer: ReturnType<typeof useTtpStore.getState>['addFarmer']
  updateFarmer: ReturnType<typeof useTtpStore.getState>['updateFarmer']
  removeFarmer: ReturnType<typeof useTtpStore.getState>['removeFarmer']
}

function AgenCard({
  agenIdx,
  data,
  updateAgen,
  removeAgen,
  addFarmer,
  updateFarmer,
  removeFarmer,
}: AgenCardProps) {
  const [open, setOpen] = useState(true)

  const totalLuas = data.farmers.reduce((acc, f) => acc + (f.luasKebun || 0), 0)
  const totalVolume = data.volumeTbs || 0

  return (
    <Card>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                <CardTitle className="text-sm font-semibold">
                  Agen #{data.no}: {data.namaAgen || '(Belum dinamai)'}
                </CardTitle>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </Button>
            </CollapsibleTrigger>
            <Button
              size="icon"
              variant="ghost"
              className="text-destructive hover:text-destructive shrink-0"
              onClick={() => removeAgen(agenIdx)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Nama Agen/Pengumpul*</Label>
                <Input
                  value={data.namaAgen}
                  onChange={(e) => updateAgen(agenIdx, { namaAgen: e.target.value })}
                  placeholder="Nama agen"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Volume TBS yang dipasok ke PKS (ton)</Label>
                <Input
                  type="number"
                  step="any"
                  value={data.volumeTbs ?? ''}
                  onChange={(e) =>
                    updateAgen(agenIdx, {
                      volumeTbs: e.target.value === '' ? null : Number(e.target.value),
                    })
                  }
                  placeholder="0"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Alamat Agen / Pengumpul (Desa, Kecamatan, Kabupaten)</Label>
              <Textarea
                value={data.alamat}
                onChange={(e) => updateAgen(agenIdx, { alamat: e.target.value })}
                placeholder="Alamat lengkap agen"
                className="text-sm min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Lintang (Decimal Degree)</Label>
                <Input
                  type="number"
                  step="any"
                  value={data.lintang}
                  onChange={(e) => updateAgen(agenIdx, { lintang: e.target.value })}
                  placeholder="-0.0"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Bujur (Decimal Degree)</Label>
                <Input
                  type="number"
                  step="any"
                  value={data.bujur}
                  onChange={(e) => updateAgen(agenIdx, { bujur: e.target.value })}
                  placeholder="0.0"
                  className="h-9 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Desa Sumber TBS yang dipasok</Label>
              <VillageAutocomplete
                value={data.desaSumber}
                onChange={(val, v) => {
                  if (v) {
                    const parts = v.full.split(',').map((p) => p.trim())
                    updateAgen(agenIdx, {
                      desaSumber: val,
                      alamat: [v.full, data.alamat].filter(Boolean).join('\n'),
                    })
                  } else {
                    updateAgen(agenIdx, { desaSumber: val })
                  }
                }}
                placeholder="Cari desa sumber TBS..."
              />
              <p className="text-[11px] text-muted-foreground">
                Pisahkan dengan koma jika lebih dari satu desa.
              </p>
            </div>

            {/* Farmers table */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Informasi Petani ({data.farmers.length} petani)</h4>
                <Button size="sm" variant="outline" onClick={() => addFarmer(agenIdx)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah Petani
                </Button>
              </div>
              <div className="rounded-md border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-2 py-1.5 text-left font-medium w-10">No</th>
                      <th className="px-2 py-1.5 text-left font-medium min-w-[140px]">Nama Petani</th>
                      <th className="px-2 py-1.5 text-left font-medium w-24">Lintang</th>
                      <th className="px-2 py-1.5 text-left font-medium w-24">Bujur</th>
                      <th className="px-2 py-1.5 text-left font-medium w-28">Legalitas</th>
                      <th className="px-2 py-1.5 text-left font-medium min-w-[120px]">Desa</th>
                      <th className="px-2 py-1.5 text-left font-medium min-w-[110px]">Kecamatan</th>
                      <th className="px-2 py-1.5 text-left font-medium min-w-[110px]">Kabupaten</th>
                      <th className="px-2 py-1.5 text-left font-medium w-24">Luas (Ha)</th>
                      <th className="px-2 py-1.5 text-left font-medium w-24">% Luas</th>
                      <th className="px-2 py-1.5 text-left font-medium w-20">Est. Volume</th>
                      <th className="px-2 py-1.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.farmers.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="text-center text-muted-foreground py-6">
                          Belum ada data petani.
                        </td>
                      </tr>
                    ) : (
                      data.farmers.map((f, fIdx) => {
                        const pctLuas = totalLuas > 0 ? (f.luasKebun || 0) / totalLuas : 0
                        const estVol = pctLuas * totalVolume
                        return (
                          <tr key={fIdx} className="border-t hover:bg-muted/30">
                            <td className="px-2 py-1">{f.no}</td>
                            <td className="px-1 py-1">
                              <Input
                                value={f.nama}
                                onChange={(e) =>
                                  updateFarmer(agenIdx, fIdx, { nama: e.target.value })
                                }
                                placeholder="Nama"
                                className="h-8 text-xs min-w-[120px]"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <Input
                                type="number"
                                step="any"
                                value={f.lintang}
                                onChange={(e) =>
                                  updateFarmer(agenIdx, fIdx, { lintang: e.target.value })
                                }
                                className="h-8 text-xs w-24"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <Input
                                type="number"
                                step="any"
                                value={f.bujur}
                                onChange={(e) =>
                                  updateFarmer(agenIdx, fIdx, { bujur: e.target.value })
                                }
                                className="h-8 text-xs w-24"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <Select
                                value={f.legalitas}
                                onValueChange={(v) =>
                                  updateFarmer(agenIdx, fIdx, { legalitas: v })
                                }
                              >
                                <SelectTrigger className="h-8 text-xs w-28">
                                  <SelectValue placeholder="-" />
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
                              <VillageAutocomplete
                                value={f.desa}
                                onChange={(val, v) => {
                                  if (v) {
                                    const parts = v.full.split(',').map((p) => p.trim())
                                    updateFarmer(agenIdx, fIdx, {
                                      desa: val,
                                      kecamatan: parts[1] || f.kecamatan,
                                      kabupaten: parts[2] || f.kabupaten,
                                    })
                                  } else {
                                    updateFarmer(agenIdx, fIdx, { desa: val })
                                  }
                                }}
                                placeholder="Desa"
                                className="h-8 text-xs min-w-[100px]"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <Input
                                value={f.kecamatan}
                                onChange={(e) =>
                                  updateFarmer(agenIdx, fIdx, { kecamatan: e.target.value })
                                }
                                className="h-8 text-xs min-w-[100px]"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <Input
                                value={f.kabupaten}
                                onChange={(e) =>
                                  updateFarmer(agenIdx, fIdx, { kabupaten: e.target.value })
                                }
                                className="h-8 text-xs min-w-[100px]"
                              />
                            </td>
                            <td className="px-1 py-1">
                              <Input
                                type="number"
                                step="any"
                                value={f.luasKebun ?? ''}
                                onChange={(e) =>
                                  updateFarmer(agenIdx, fIdx, {
                                    luasKebun:
                                      e.target.value === '' ? null : Number(e.target.value),
                                  })
                                }
                                placeholder="0"
                                className="h-8 text-xs w-24"
                              />
                            </td>
                            <td className="px-2 py-1 text-xs tabular-nums text-muted-foreground">
                              {(pctLuas * 100).toFixed(2)}%
                            </td>
                            <td className="px-2 py-1 text-xs tabular-nums text-muted-foreground">
                              {estVol > 0
                                ? estVol.toLocaleString('id-ID', { maximumFractionDigits: 2 })
                                : '-'}
                            </td>
                            <td className="px-1 py-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={() => removeFarmer(agenIdx, fIdx)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                  {data.farmers.length > 0 && (
                    <tfoot>
                      <tr className="border-t-2 bg-muted/40 font-medium">
                        <td colSpan={8} className="px-2 py-1.5 text-right">
                          Total Luasan:
                        </td>
                        <td className="px-2 py-1.5 text-right tabular-nums">
                          {totalLuas.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-2 py-1.5 text-xs tabular-nums text-muted-foreground">
                          100%
                        </td>
                        <td className="px-2 py-1.5 text-xs tabular-nums">
                          {totalVolume.toLocaleString('id-ID', { maximumFractionDigits: 2 })}
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
