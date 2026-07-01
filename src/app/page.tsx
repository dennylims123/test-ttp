'use client'

import { useEffect, useState, useCallback } from 'react'
import { useTtpStore } from '@/lib/ttp/store'
import { SupplierTable } from '@/components/ttp/supplier-table'
import { AgenForm } from '@/components/ttp/agen-form'
import { SummaryPanel } from '@/components/ttp/summary-panel'
import { RekapanTtp } from '@/components/ttp/rekapan-ttp'
import { AdminRecap } from '@/components/ttp/admin-recap'
import { AdminPinDialog } from '@/components/ttp/admin-pin-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import {
  FileSpreadsheet,
  Plus,
  Download,
  Loader2,
  AlertCircle,
  Lock,
  Send,
  ArrowLeft,
  Eye,
  BarChart3,
  Shield,
  LogOut,
} from 'lucide-react'

type View = 'form' | 'admin'

interface ReportListItem {
  id: string
  name: string
  pksName: string | null
  status: 'DRAFT' | 'PUBLISHED'
  updatedAt: string
  _count: { suppliers: number; agenPengumpul: number }
  pksAccount: { name: string } | null
}

export default function Home() {
  // Initialize view from URL hash so refresh keeps you on the same screen
  const [view, setView] = useState<View>(() => {
    if (typeof window === 'undefined') return 'form'
    const hash = window.location.hash.replace('#', '')
    return hash === 'admin' ? 'admin' : 'form'
  })
  // When admin clicks "Lihat detail" on a report, we switch to form view with that report loaded
  const [adminViewingReportId, setAdminViewingReportId] = useState<string | null>(null)

  // Admin session state
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null) // null = loading
  const [showPinDialog, setShowPinDialog] = useState(false)

  // Check admin session on mount
  useEffect(() => {
    fetch('/api/auth/admin-me')
      .then((r) => r.json())
      .then((s: { isAdmin: boolean }) => setIsAdmin(s.isAdmin))
      .catch(() => setIsAdmin(false))
  }, [])

  // Sync view to URL hash
  useEffect(() => {
    window.location.hash = view === 'admin' ? 'admin' : ''
  }, [view])

  const refreshAdminSession = useCallback(async () => {
    const r = await fetch('/api/auth/admin-me')
    const s = await r.json()
    setIsAdmin(s.isAdmin)
    return s.isAdmin as boolean
  }, [])

  const openAdminRecap = async () => {
    setAdminViewingReportId(null)
    // Check if already admin
    const adminStatus = await refreshAdminSession()
    if (adminStatus) {
      setView('admin')
    } else {
      setShowPinDialog(true)
    }
  }

  const handlePinSuccess = async () => {
    setShowPinDialog(false)
    await refreshAdminSession()
    setView('admin')
  }

  const handlePinCancel = () => {
    setShowPinDialog(false)
    // If user was trying to access admin view but cancelled, return to form
    if (view === 'admin') {
      setView('form')
    }
  }

  const openForm = () => {
    setView('form')
    setAdminViewingReportId(null)
  }

  const openReportFromAdmin = (id: string) => {
    setAdminViewingReportId(id)
    setView('form')
  }

  const logoutAdmin = async () => {
    await fetch('/api/auth/admin-logout', { method: 'POST' })
    setIsAdmin(false)
    setView('form')
    toast.info('Keluar dari admin')
  }

  // If user lands on #admin URL but isn't admin, auto-show PIN dialog
  const shouldShowPinForAdminRoute = view === 'admin' && isAdmin === false

  return (
    <>
      <Toaster position="top-right" richColors />
      <AdminPinDialog
        open={showPinDialog || shouldShowPinForAdminRoute}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
      {view === 'admin' ? (
        <AdminView
          onBackToForm={openForm}
          onOpenReport={openReportFromAdmin}
          onLogoutAdmin={logoutAdmin}
        />
      ) : (
        <FormView
          adminViewingReportId={adminViewingReportId}
          onBackToAdmin={openAdminRecap}
          isFromAdmin={!!adminViewingReportId && !!isAdmin}
        />
      )}
    </>
  )
}

// ---------------- Admin View ----------------
function AdminView({
  onBackToForm,
  onOpenReport,
  onLogoutAdmin,
}: {
  onBackToForm: () => void
  onOpenReport: (id: string) => void
  onLogoutAdmin: () => void
}) {
  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-800 text-white">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-semibold flex items-center gap-2">
                Rekap Admin — Form TTP
                <Badge variant="secondary" className="text-[10px]">
                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                  Admin
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                Rekap semua laporan TTP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onBackToForm}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Kembali ke Form
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogoutAdmin} className="text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4 mr-1.5" />
              Keluar Admin
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <AdminRecap onOpenReport={onOpenReport} />
      </main>
    </div>
  )
}

// ---------------- Form View (PKS fills the form, or admin views a published report) ----------------
function FormView({
  adminViewingReportId,
  onBackToAdmin,
  isFromAdmin,
}: {
  adminViewingReportId: string | null
  onBackToAdmin: () => void
  isFromAdmin: boolean
}) {
  const store = useTtpStore()

  // Auto-load the most recent DRAFT report on mount (so suppliers don't lose work on reload)
  const autoLoadRecentDraft = useCallback(async () => {
    try {
      const r = await fetch('/api/reports')
      if (!r.ok) return
      const data: ReportListItem[] = await r.json()
      // Find the most recent DRAFT (not PUBLISHED — published reports are locked, no point resuming)
      const recentDraft = data.find((d) => d.status === 'DRAFT')
      if (recentDraft) {
        const full = await fetch(`/api/reports/${recentDraft.id}`)
        if (full.ok) {
          const reportData = await full.json()
          store.loadFromApi(reportData)
        }
      }
    } catch (e) {
      // Silent fail — just start with empty form
    }
  }, [])

  useEffect(() => {
    if (adminViewingReportId) {
      loadReport(adminViewingReportId)
    } else {
      autoLoadRecentDraft()
    }
  }, [adminViewingReportId, autoLoadRecentDraft])

  // Auto-save (debounced) when dirty — skip when viewing published report from admin
  useEffect(() => {
    if (!store.isDirty) return
    if (isFromAdmin) return // admin viewing a report doesn't auto-save
    if (store.status === 'PUBLISHED') return // locked
    const t = setTimeout(async () => {
      await saveAll(false)
    }, 2500)
    return () => clearTimeout(t)
  }, [store.isDirty, store.suppliers, store.agen, store.pks, store.p1m, store.status, isFromAdmin])

  const saveAll = async (showToast = true) => {
    if (store.isSaving) return
    if (store.status === 'PUBLISHED' && !isFromAdmin) {
      if (showToast) toast.error('Laporan sudah dipublikasi, tidak dapat disimpan')
      return
    }
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
        const r = await fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!r.ok) {
          const d = await r.json()
          throw new Error(d.error || 'Failed to create report')
        }
        const created = await r.json()
        reportId = created.id
        store.setReportId(reportId)
      } else {
        const r = await fetch(`/api/reports/${reportId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!r.ok) {
          const d = await r.json()
          throw new Error(d.error || 'Failed to update report')
        }
      }

      const sr = await fetch(`/api/reports/${reportId}/suppliers`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ suppliers: store.suppliers }),
      })
      if (!sr.ok) throw new Error('Failed to save suppliers')

      const ar = await fetch(`/api/reports/${reportId}/agen`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agen: store.agen }),
      })
      if (!ar.ok) throw new Error('Failed to save agen')

      store.markClean()
      store.setLastSavedAt(new Date().toISOString())
      if (showToast) toast.success('Laporan tersimpan')
    } catch (e: any) {
      console.error(e)
      if (showToast) toast.error('Gagal menyimpan: ' + e.message)
    } finally {
      store.setSaving(false)
    }
  }

  const publishReport = async () => {
    if (!store.reportId) {
      toast.error('Simpan laporan terlebih dahulu sebelum mempublikasi')
      return
    }
    if (store.suppliers.length === 0) {
      toast.error('Tambahkan minimal 1 pemasok sebelum mempublikasi')
      return
    }
    if (
      !confirm(
        'Publikasi laporan ini? Setelah dipublikasi, laporan tidak dapat diubah sampai dibuka kembali via Rekap Admin.'
      )
    )
      return

    store.setPublishing(true)
    try {
      await saveAll(false)
      const r = await fetch(`/api/reports/${store.reportId}/publish`, { method: 'POST' })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed to publish')
      store.setStatus('PUBLISHED', new Date().toISOString())
      toast.success('Laporan berhasil dipublikasi. Laporan akan muncul di Rekap Admin.')
    } catch (e: any) {
      toast.error('Gagal mempublikasi: ' + e.message)
    } finally {
      store.setPublishing(false)
    }
  }

  const newReport = () => {
    if (store.isDirty && !store.isPublished && !confirm('Buang perubahan yang belum disimpan?')) return
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
      toast.success(`Laporan "${data.name}" dimuat`)
    } catch (e: any) {
      toast.error('Gagal memuat: ' + e.message)
    }
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
  const isPublished = store.status === 'PUBLISHED'
  const isLocked = isPublished || isFromAdmin
  const canEdit = !isLocked

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background border-b">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {isFromAdmin ? (
              <Button variant="ghost" size="sm" onClick={onBackToAdmin}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Kembali ke Rekap
              </Button>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base font-semibold truncate">
                    Form TTP — Traceability to Plantation
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Kemamputelusuran TBS ke Kebun
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isPublished && !isFromAdmin && (
              <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                <Lock className="h-3 w-3 mr-1" />
                Dipublikasi
              </Badge>
            )}
            {isFromAdmin && (
              <Badge variant="secondary">
                <Eye className="h-3 w-3 mr-1" />
                Mode Lihat (Admin)
              </Badge>
            )}

            {!isFromAdmin && (
              <>
                <Input
                  value={store.reportName}
                  onChange={(e) => store.setReportName(e.target.value)}
                  placeholder="Nama laporan..."
                  className="h-9 w-[180px] md:w-[240px]"
                  disabled={isLocked}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={newReport}
                  disabled={store.isSaving}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Baru
                </Button>

                <Button
                  size="sm"
                  onClick={publishReport}
                  disabled={
                    isPublished || store.isPublishing || store.isSaving || !store.reportId
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {store.isPublishing ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : isPublished ? (
                    <Lock className="h-4 w-4 mr-1.5" />
                  ) : (
                    <Send className="h-4 w-4 mr-1.5" />
                  )}
                  {store.isPublishing
                    ? 'Mempublikasi...'
                    : isPublished
                    ? 'Dipublikasi'
                    : 'Publikasi'}
                </Button>
              </>
            )}

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
          {isPublished && (
            <span className="text-emerald-600">
              • Laporan dipublikasi
              {store.publishedAt &&
                ` pada ${new Date(store.publishedAt).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}`}
            </span>
          )}
          {!isPublished && store.isDirty && (
            <span className="text-amber-600">• Perubahan belum tersimpan (auto-save aktif)</span>
          )}
          {!isPublished && store.lastSavedAt && !store.isDirty && (
            <span>• Tersimpan {new Date(store.lastSavedAt).toLocaleTimeString('id-ID')}</span>
          )}
          <span className="ml-auto">
            {supplierCount} pemasok • {agenCount} agen
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-4 py-6">
        {isLocked && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
            {isFromAdmin ? (
              <Eye className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            ) : (
              <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            )}
            <span>
              {isFromAdmin
                ? 'Anda membuka laporan ini dari Rekap Admin. Untuk mengedit, buka kembali ke status DRAFT dari halaman Rekap Admin.'
                : 'Laporan ini sudah dipublikasi dan terkunci. Untuk merevisi, buka laporan ini di Rekap Admin dan klik "Buka kembali ke DRAFT".'}
            </span>
          </div>
        )}

        <Tabs value={store.activeTab} onValueChange={(v) => store.setActiveTab(v as any)} className="w-full">
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
            <RekapanTtp readOnly={isLocked} />
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
                <SupplierTable section="internal" readOnly={isLocked} />
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
                <SupplierTable section="external" readOnly={isLocked} />
              </CardContent>
            </Card>

            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Catatan:</strong> Untuk pemasok &quot;Agen / Pengumpul / Ramp&quot;, mohon isi
              detail petani pada tab &quot;Agen-Pengumpul (P2.B)&quot;. Estimasi Max TBS = 30
              ton/ha/thn untuk Perusahaan Perkebunan, 20 ton/ha/thn untuk kategori lainnya.
            </div>
          </TabsContent>

          <TabsContent value="agen" className="mt-4">
            <AgenForm readOnly={isLocked} />
          </TabsContent>

          <TabsContent value="summary" className="mt-4">
            <SummaryPanel />
          </TabsContent>
        </Tabs>

        <footer className="mt-10 pt-6 border-t text-xs text-muted-foreground space-y-2">
          <p>
            <strong>Form TTP Web App</strong> — Konversi digital dari Excel &quot;02. Form TTP (KOSONG)
            Cleaned.xlsm&quot;. Mendukung: Pernyataan TTP (P1.M), List Supplier TBS (P2.A),
            Pemasok Tidak Langsung (P2.B), Summary otomatis, dan ekspor ke Excel.
          </p>
          <p>
            Data tersimpan otomatis di database lokal. Master data desa (18.510 entri) bersumber
            dari sheet MSD SSD. Setelah selesai mengisi, klik <strong>Publikasi</strong> untuk
            mengunci laporan — laporan akan muncul di <strong>Rekap Admin</strong>.
          </p>
        </footer>
      </main>
    </div>
  )
}
