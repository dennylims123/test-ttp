'use client'

import { useTtpStore } from '@/lib/ttp/store'
import { LEGALITAS_OPTIONS } from '@/lib/ttp/types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Plus,
  Trash2,
  ChevronDown,
  Link2,
  ExternalLink,
  Lock,
  Info,
  Upload,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { VillageAutocomplete } from './village-autocomplete'
import { BulkImportFarmers } from './bulk-import-dialog'
import { useState, useEffect, useRef } from 'react'

interface AgenFormProps {
  readOnly?: boolean
}

export function AgenForm({ readOnly = false }: AgenFormProps) {
  const {
    agen,
    addAgen,
    updateAgen,
    removeAgen,
    addFarmer,
    updateFarmer,
    removeFarmer,
    setFarmers,
    setActiveTab,
    focusAgenNo,
    clearFocusAgen,
  } = useTtpStore()

  const linkedCount = agen.filter((a) => a.linkedSupplierNo != null).length

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-base font-semibold">
            PHASE 2B. Pernyataan Pemasok TBS Tidak Langsung
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Untuk pemasok tidak langsung (Agen / Pengumpul / Ramp / Dealer). Tambahkan agen
            terlebih dahulu di tab <strong>&quot;2. List Supplier TBS&quot;</strong> dengan
            jenis pemasok <strong>&quot;Agen / Pengumpul / Ramp&quot;</strong> — agen akan
            otomatis muncul di sini dengan detail petani.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setActiveTab('supplier')}
        >
          <ExternalLink className="h-4 w-4 mr-1.5" />
          Buka List Supplier
        </Button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 text-blue-900 text-xs border border-blue-200">
        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
        <span>
          Nama agen, alamat, koordinat, dan volume TBS <strong>otomatis tersinkron</strong> dari
          data pemasok di tab List Supplier TBS. Pada tab ini, Anda hanya perlu mengisi{' '}
          <strong>Desa Sumber TBS</strong> dan <strong>daftar petani</strong> di bawah setiap agen.
        </span>
      </div>

      {agen.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground space-y-3">
            <p>Belum ada agen/pengumpul terdaftar.</p>
            <p className="text-xs">
              Untuk menambahkan, buka tab <strong>&quot;2. List Supplier TBS (P2.A)&quot;</strong>{' '}
              dan tambahkan pemasok eksternal dengan jenis <strong>&quot;Agen / Pengumpul / Ramp&quot;</strong>.
            </p>
            <Button variant="outline" size="sm" onClick={() => setActiveTab('supplier')}>
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Buka List Supplier TBS
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {linkedCount > 0 && (
            <div className="text-xs text-muted-foreground">
              {linkedCount} agen tertaut ke List Supplier TBS
              {agen.length > linkedCount && ` · ${agen.length - linkedCount} agen manual`}
            </div>
          )}
          {agen.map((a, idx) => (
            <AgenCard
              key={idx}
              agenIdx={idx}
              data={a}
              updateAgen={updateAgen}
              removeAgen={removeAgen}
              addFarmer={addFarmer}
              updateFarmer={updateFarmer}
              removeFarmer={removeFarmer}
              setFarmers={setFarmers}
              isFocused={focusAgenNo === a.no}
              onClearFocus={clearFocusAgen}
              onJumpToSupplier={() => {
                if (a.linkedSupplierNo != null) {
                  setActiveTab('supplier')
                }
              }}
              readOnly={readOnly}
            />
          ))}
        </>
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
  setFarmers: ReturnType<typeof useTtpStore.getState>['setFarmers']
  isFocused: boolean
  onClearFocus: () => void
  onJumpToSupplier: () => void
  readOnly?: boolean
}

function AgenCard({
  agenIdx,
  data,
  updateAgen,
  removeAgen,
  addFarmer,
  updateFarmer,
  removeFarmer,
  setFarmers,
  isFocused,
  onClearFocus,
  onJumpToSupplier,
  readOnly = false,
}: AgenCardProps) {
  const [open, setOpen] = useState(true)
  const [showImport, setShowImport] = useState(false)
  const [farmerPage, setFarmerPage] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const FARMERS_PER_PAGE = 50
  const totalFarmers = data.farmers.length
  const totalPages = Math.max(1, Math.ceil(totalFarmers / FARMERS_PER_PAGE))
  // Clamp page to valid range (derived, no setState needed)
  const currentPage = Math.max(0, Math.min(farmerPage, totalPages - 1))
  const pagedFarmers = data.farmers.slice(
    currentPage * FARMERS_PER_PAGE,
    (currentPage + 1) * FARMERS_PER_PAGE
  )

  useEffect(() => {
    if (isFocused && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Briefly highlight then clear focus
      const t = setTimeout(() => onClearFocus(), 2000)
      return () => clearTimeout(t)
    }
  }, [isFocused, onClearFocus])

  const totalLuas = data.farmers.reduce((acc, f) => acc + (f.luasKebun || 0), 0)
  const totalVolume = data.volumeTbs || 0
  const isLinked = data.linkedSupplierNo != null

  return (
    <div ref={cardRef}>
      <Card className={isFocused ? 'ring-2 ring-emerald-400 transition-shadow' : ''}>
        <Collapsible open={open} onOpenChange={setOpen}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-auto">
                  <div className="flex items-center gap-2 min-w-0">
                    <CardTitle className="text-sm font-semibold truncate">
                      Agen #{data.no}: {data.namaAgen || '(Belum dinamai)'}
                    </CardTitle>
                    {isLinked ? (
                      <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                        <Link2 className="h-2.5 w-2.5" />
                        Supplier #{data.linkedSupplierNo}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Manual
                      </Badge>
                    )}
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </Button>
              </CollapsibleTrigger>
              <div className="flex items-center gap-1 shrink-0">
                {isLinked && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={onJumpToSupplier}
                    title="Lihat di List Supplier TBS"
                  >
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    List Supplier
                  </Button>
                )}
                {!isLinked && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => removeAgen(agenIdx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    Nama Agen/Pengumpul*
                    {isLinked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input
                    value={data.namaAgen}
                    onChange={(e) =>
                      !isLinked && updateAgen(agenIdx, { namaAgen: e.target.value })
                    }
                    placeholder="Nama agen"
                    className="h-9 text-sm"
                    disabled={isLinked}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    Volume TBS yang dipasok ke PKS (ton)
                    {isLinked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={data.volumeTbs ?? ''}
                    onChange={(e) =>
                      !isLinked &&
                      updateAgen(agenIdx, {
                        volumeTbs: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="h-9 text-sm"
                    disabled={isLinked}
                  />
                  {isLinked && (
                    <p className="text-[10px] text-muted-foreground">
                      Disinkron dari volume TBS pemasok di List Supplier TBS.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1.5">
                  Alamat Agen / Pengumpul (Desa, Kecamatan, Kabupaten)
                  {isLinked && <Lock className="h-3 w-3 text-muted-foreground" />}
                </Label>
                {isLinked ? (
                  <div className="min-h-[60px] p-2 rounded-md border bg-muted/30 text-sm text-muted-foreground">
                    {data.alamat || '(alamat akan terisi otomatis dari desa/kecamatan/kabupaten pemasok)'}
                  </div>
                ) : (
                  <Textarea
                    value={data.alamat}
                    onChange={(e) => updateAgen(agenIdx, { alamat: e.target.value })}
                    placeholder="Alamat lengkap agen"
                    className="text-sm min-h-[60px]"
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    Lintang (Decimal Degree)
                    {isLinked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={data.lintang}
                    onChange={(e) =>
                      !isLinked && updateAgen(agenIdx, { lintang: e.target.value })
                    }
                    placeholder="-0.0"
                    className="h-9 text-sm"
                    disabled={isLinked}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1.5">
                    Bujur (Decimal Degree)
                    {isLinked && <Lock className="h-3 w-3 text-muted-foreground" />}
                  </Label>
                  <Input
                    type="number"
                    step="any"
                    value={data.bujur}
                    onChange={(e) =>
                      !isLinked && updateAgen(agenIdx, { bujur: e.target.value })
                    }
                    placeholder="0.0"
                    className="h-9 text-sm"
                    disabled={isLinked}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Desa Sumber TBS yang dipasok</Label>
                <VillageAutocomplete
                  value={data.desaSumber}
                  onChange={(val, v) => {
                    if (v) {
                      updateAgen(agenIdx, { desaSumber: val })
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
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="text-sm font-medium">
                    Informasi Petani ({data.farmers.length.toLocaleString('id-ID')} petani)
                    {totalPages > 1 && (
                      <span className="text-xs text-muted-foreground ml-2">
                        · Hal {currentPage + 1}/{totalPages}
                      </span>
                    )}
                  </h4>
                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addFarmer(agenIdx)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Tambah Petani
                      </Button>
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => setShowImport(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Upload className="h-3.5 w-3.5 mr-1" />
                        Import Massal
                      </Button>
                    </div>
                  )}
                </div>

                {/* Bulk import hint for empty farmer list */}
                {data.farmers.length === 0 && !readOnly && (
                  <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
                    <strong>Tip:</strong> Untuk agen dengan ratusan/ribuan petani, gunakan{' '}
                    <strong>&quot;Import Massal&quot;</strong> — tempel langsung dari Excel
                    (Ctrl+C → Ctrl+V) atau unggah file CSV. Tidak perlu mengisi satu per satu.
                  </div>
                )}

                <BulkImportFarmers
                  open={showImport}
                  agenName={data.namaAgen || `Agen #${data.no}`}
                  existingCount={data.farmers.length}
                  onImport={(newFarmers, mode) => {
                    if (mode === 'append') {
                      // Append to existing farmers
                      const combined = [...data.farmers, ...newFarmers]
                      setFarmers(agenIdx, combined)
                      // Jump to the page where new farmers start
                      const newPage = Math.floor((combined.length - 1) / FARMERS_PER_PAGE)
                      setFarmerPage(newPage)
                    } else {
                      // Replace all
                      setFarmers(agenIdx, newFarmers)
                      setFarmerPage(0)
                    }
                  }}
                  onClose={() => setShowImport(false)}
                />
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
                        <th className="px-2 py-1.5 text-left font-medium w-20">% Luas</th>
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
                        pagedFarmers.map((f, localIdx) => {
                          const fIdx = currentPage * FARMERS_PER_PAGE + localIdx
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
                                {!readOnly ? (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => removeFarmer(agenIdx, fIdx)}
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

                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-muted-foreground">
                      Menampilkan {currentPage * FARMERS_PER_PAGE + 1}–
                      {Math.min((currentPage + 1) * FARMERS_PER_PAGE, totalFarmers)} dari{' '}
                      {totalFarmers.toLocaleString('id-ID')} petani
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        onClick={() => setFarmerPage(0)}
                        disabled={currentPage === 0}
                      >
                        « Awal
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => setFarmerPage(currentPage - 1)}
                        disabled={currentPage === 0}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-xs px-2 tabular-nums">
                        {currentPage + 1} / {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 w-7 p-0"
                        onClick={() => setFarmerPage(currentPage + 1)}
                        disabled={currentPage >= totalPages - 1}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        onClick={() => setFarmerPage(totalPages - 1)}
                        disabled={currentPage >= totalPages - 1}
                      >
                        Akhir »
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  )
}
