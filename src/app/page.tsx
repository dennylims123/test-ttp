'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTtpStore } from '@/lib/ttp/store'
import { SupplierTable } from '@/components/ttp/supplier-table'
import { AgenForm } from '@/components/ttp/agen-form'
import { SummaryPanel } from '@/components/ttp/summary-panel'
import { RekapanTtp } from '@/components/ttp/rekapan-ttp'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  Save,
  FileSpreadsheet,
  Plus,
  FolderOpen,
  Trash2,
  Download,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

interface ReportListItem {
  id: string
  name: string
  pksName: string | null
  updatedAt: string
  _count: { suppliers: number; agenPengumpul: number }
}

export default function Home() {
  const store = useTtpStore()
  const [reports, setReports] = useState<ReportListItem[]>([])
  const [loadingList, setLoadingList] = useState(false)
  const [openList, setOpenList] = useState(false)

  // Load report list on mount
  const refreshReports = useCallback(async () => {
    setLoadingList(true)
    try {
      const r = await fetch('/api/reports')
      const data = await r.json()
      setReports(data)
    } finally {
      setLoadingList(false)
    }
  }, [])

  useEffect(() => {
    refreshReports()
  }, [refreshReports])

  // Auto-save (debounced) when dirty
  useEffect(() => {
    if (!store.isDirty) return
    const t = setTimeout(async () => {
      await saveAll(false)
    }, 2500)
    return () => clearTimeout(t)
  }, [store.isDirty, store.suppliers, store.agen, store.pks, store.p1m])

  const saveAll = async (showToast = true) => {
    if (store.isSaving) return
    store.setSaving(true)
    try {
      const payload = {
        name: store.reportName || `Laporan TTP - ${store.pks.pksName || 'Tanpa Nama'}`,
        ...store.pks,
        p1mProduksiTbsBersertifikat: store.p1m.produksiTbsBersertifikat,
        p1mKapasitasPks: store.p1m.kapasitasPks,
        p1mProduksiCpo: store.p1m.produksiCpo,
        p1mFasilitasKernel: store.p1m.fasilitasKernel,
        p1mTotalTbs: store.p1m.totalTbs,
        p1mTbsKebunInti: store.p1m.tbsKebunInti,
        p1mTbsPlasma: store.p1m.tbsPlasma,
        p1mTbsMandiri: store.p1m.tbsMandiri,
        p1mSistemTtp: store.p1m.sistemTtp,
        p1mNilaiTtp: store.p1m.nilaiTtp,
        p1mSistemDetail: store.p1m.sistemDetail,
      }

      let reportId = store.reportId
      if (!reportId) {
        // Create
        const r = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!r.ok) throw new Error('Failed to create report')
        const created = await r.json()
        reportId = created.id
        store.setReportId(reportId)
      } else {
        // Update main
        const r = await fetch(`/api/reports/${reportId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!r.ok) throw new Error('Failed to update report')
      }

      // Update suppliers
      const sr = await fetch(`/api/reports/${reportId}/suppliers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suppliers: store.suppliers }),
      })
      if (!sr.ok) throw new Error('Failed to save suppliers')

      // Update agen
      const ar = await fetch(`/api/reports/${reportId}/agen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agen: store.agen }),
      })
      if (!ar.ok) throw new Error('Failed to save agen')

      store.markClean()
      store.setLastSavedAt(new Date().toISOString())
      if (showToast) toast.success('Laporan tersimpan')
      await refreshReports()
    } catch (e: any) {
      console.error(e)
      if (showToast) toast.error('Gagal menyimpan: ' + e.message)
    } finally {
      store.setSaving(false)
    }
  }

  const newReport = () => {
    if (store.isDirty && !confirm('Buang perubahan yang belum disimpan?')) return
    store.reset()
    toast.info('Laporan baru dimulai')
  }

  const loadReport = async (id: string) => {
    if (store.isDirty && !confirm('Buang perubahan yang belum disimpan?')) return
    try {
      const r = await fetch(`/api/reports/${id}`)
      if (!r.ok) throw new Error('Not found')
      const data = await r.json()
      store.loadFromApi(data)
      setOpenList(false)
      toast.success(`Laporan "${data.name}" dimuat`)
    } catch (e: any) {
      toast.error('Gagal memuat: ' + e.message)
    }
  }

  const deleteReport = async (id: string, name: string) => {
    if (!confirm(`Hapus laporan "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
    await fetch(`/api/reports/${id}`, { method: 'DELETE' })
    if (store.reportId === id) store.reset()
    await refreshReports()
    toast.success('Laporan dihapus')
  }

  const exportExcel = async () => {
    if (!store.reportId) {
      toast.error('Simpan laporan terlebih dahulu sebelum ekspor')
      return
    }
    try {
      const r = await fetch(`/api/reports/${store.reportId}/export`)
      if (!r.ok) throw new Error('Export failed')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${store.reportName || 'TTP'}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Excel berhasil diunduh')
    } catch (e: any) {
      toast.error('Gagal ekspor: ' + e.message)
    }
  }

  const supplierCount = store.suppliers.length
  const agenCount = store.agen.length

  return (
    <div className="min-h-screen bg-muted/20">
      <Toaster position="top-right" richColors />

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-600 text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">
                Form TTP — Traceability to Plantation
              </h1>
              <p className="text-xs text-muted-foreground">
                Kemamputelusuran TBS ke Kebun — Palm Oil Mill FFB Traceability Form
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Input
              value={store.reportName}
              onChange={(e) => store.setReportName(e.target.value)}
              placeholder="Nama laporan..."
              className="h-9 w-[180px] md:w-[240px]"
            />

            <Button variant="outline" size="sm" onClick={newReport}>
              <Plus className="h-4 w-4 mr-1.5" />
              Baru
            </Button>

            <Sheet open={openList} onOpenChange={setOpenList}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" onClick={refreshReports}>
                  <FolderOpen className="h-4 w-4 mr-1.5" />
                  Buka
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Laporan Tersimpan</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {loadingList ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
                    </div>
                  ) : reports.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Belum ada laporan tersimpan.
                    </div>
                  ) : (
                    reports.map((r) => (
                      <div
                        key={r.id}
                        className={`rounded-md border p-3 hover:bg-muted/40 cursor-pointer transition-colors ${
                          store.reportId === r.id ? 'bg-emerald-50 border-emerald-200' : ''
                        }`}
                        onClick={() => loadReport(r.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{r.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {r.pksName || '—'}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-[10px]">
                                {r._count.suppliers} pemasok
                              </Badge>
                              <Badge variant="secondary" className="text-[10px]">
                                {r._count.agenPengumpul} agen
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(r.updatedAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteReport(r.id, r.name)
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Button
              size="sm"
              onClick={() => saveAll(true)}
              disabled={store.isSaving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {store.isSaving ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : store.isDirty ? (
                <Save className="h-4 w-4 mr-1.5" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
              )}
              {store.isSaving ? 'Menyimpan...' : store.isDirty ? 'Simpan' : 'Tersimpan'}
            </Button>

            <Button variant="outline" size="sm" onClick={exportExcel}>
              <Download className="h-4 w-4 mr-1.5" />
              Excel
            </Button>
          </div>
        </div>

        {/* Status bar */}
        <div className="max-w-[1400px] mx-auto px-4 pb-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {store.reportId ? (
            <Badge variant="outline" className="text-[10px] font-normal">
              ID: {store.reportId.slice(-8)}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] font-normal text-amber-700 border-amber-300">
              <AlertCircle className="h-3 w-3 mr-1" />
              Belum disimpan
            </Badge>
          )}
          {store.isDirty && (
            <span className="text-amber-600">• Perubahan belum tersimpan (auto-save aktif)</span>
          )}
          {store.lastSavedAt && !store.isDirty && (
            <span>
              • Tersimpan {new Date(store.lastSavedAt).toLocaleTimeString('id-ID')}
            </span>
          )}
          <span className="ml-auto">
            {supplierCount} pemasok • {agenCount} agen
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <Tabs defaultValue="rekapan" className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto">
            <TabsTrigger value="rekapan" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              1. Rekapan TTP (P1.M)
            </TabsTrigger>
            <TabsTrigger value="supplier" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              2. List Supplier TBS (P2.A)
              {supplierCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {supplierCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agen" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              3. Agen-Pengumpul (P2.B)
              {agenCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {agenCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700">
              4. Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rekapan" className="mt-4">
            <RekapanTtp />
          </TabsContent>

          <TabsContent value="supplier" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">A. Internal — Kebun Inti & Plasma</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Sumber TBS yang berasal dari Kebun Inti milik perusahaan dan Plasma / KKPA / Kemitraan
                </p>
              </CardHeader>
              <CardContent>
                <SupplierTable section="internal" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">B. Eksternal — Pemasok Pihak Ketiga</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Perusahaan Perkebunan, Kebun Pribadi, Koperasi, Agen/Pengumpul, Gapoktan/Poktan
                </p>
              </CardHeader>
              <CardContent>
                <SupplierTable section="external" />
              </CardContent>
            </Card>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Catatan:</strong> Untuk pemasok &quot;Agen / Pengumpul / Ramp&quot;, mohon isi
              detail petani pada tab &quot;Agen-Pengumpul (P2.B)&quot;. Estimasi Max TBS = 30
              ton/ha/thn untuk Perusahaan Perkebunan, 20 ton/ha/thn untuk kategori lainnya.
            </div>
          </TabsContent>

          <TabsContent value="agen" className="mt-4">
            <AgenForm />
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <SummaryPanel />
          </TabsContent>
        </Tabs>

        {/* Help / Footer info */}
        <footer className="mt-10 pt-6 border-t text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Form TTP Web App</strong> — Konversi digital dari Excel &quot;02. Form TTP (KOSONG)
            Cleaned.xlsm&quot;. Mendukung: Pernyataan TTP (P1.M), List Supplier TBS (P2.A),
            Pemasok Tidak Langsung (P2.B), Summary otomatis, dan ekspor ke Excel.
          </p>
          <p>
            Data tersimpan otomatis di database lokal. Master data desa (18.510 entri) bersumber
            dari sheet MSD SSD.
          </p>
        </footer>
      </main>
    </div>
  )
}
