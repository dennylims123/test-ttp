'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useTtpStore } from '@/lib/ttp/store'
import { SupplierTable } from '@/components/ttp/supplier-table'
import { JENIS_PLANTATION, JENIS_SMALLHOLDER } from '@/lib/ttp/types'
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
  CheckCircle2,
  Lock,
  Save,
  Send,
  ArrowLeft,
  Eye,
  BarChart3,
  Shield,
  LogOut,
  Copy,
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
    <div className="min-h-screen bg-permata-green-light/30">
      {/* Permata Group top gradient bar */}
      <div className="h-1 bg-permata-accent-line" />
      <header className="sticky top-0 z-30 bg-permata-topbar text-white border-b border-permata-forest-dark/30">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Permata Group logo */}
            <img src="/permatagroup-logo.svg" alt="Permata Group" className="h-8 w-auto" />
            <div className="h-6 w-px bg-white/20" />
            <div>
              <h1 className="text-base font-semibold flex items-center gap-2 text-white">
                Rekap Admin
                <Badge className="text-[10px] bg-white/15 text-white hover:bg-white/20 border-0">
                  <Shield className="h-2.5 w-2.5 mr-0.5" />
                  Admin
                </Badge>
              </h1>
              <p className="text-xs text-white/60">
                Rekap semua laporan TTP
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onBackToForm} className="!text-white/80 hover:!text-white hover:!bg-white/10">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Kembali ke Form
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogoutAdmin} className="!text-red-300 hover:!text-red-200 hover:!bg-red-500/10">
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

  // Per-browser session: use localStorage to remember which report THIS browser is working on.
  // This prevents the bug where multiple people opening the link see the same draft.
  const SESSION_KEY = 'ttp_report_id'

  const loadMyReport = useCallback(async () => {
    try {
      const myReportId = localStorage.getItem(SESSION_KEY)
      if (!myReportId) return // No report for this browser — start fresh

      const r = await fetch(`/api/reports/${myReportId}`)
      if (!r.ok) {
        // Report was deleted or doesn't exist — clear localStorage
        localStorage.removeItem(SESSION_KEY)
        return
      }
      const data = await r.json()
      // Only auto-load if it's still a DRAFT (published reports are locked)
      if (data.status === 'DRAFT') {
        store.loadFromApi(data)
      } else {
        // Already published — clear localStorage so user starts fresh next time
        localStorage.removeItem(SESSION_KEY)
      }
    } catch (e) {
      // Silent fail — just start with empty form
    }
  }, [])

  useEffect(() => {
    if (adminViewingReportId) {
      loadReport(adminViewingReportId)
    } else {
      loadMyReport()
    }
  }, [adminViewingReportId, loadMyReport])

  // Auto-save (debounced) when dirty — admin can save published reports, supplier cannot
  const isSavingRef = useRef(false)

  useEffect(() => {
    if (!store.isDirty) return
    // Supplier cannot save published reports (locked)
    if (store.status === 'PUBLISHED' && !isFromAdmin) return
    const t = setTimeout(async () => {
      await saveAll(false)
    }, 2500)
    return () => clearTimeout(t)
  }, [store.isDirty, store.suppliers, store.agen, store.pks, store.p1m, store.status, isFromAdmin])

  const saveAll = async (showToast = true) => {
    // Use ref to prevent concurrent saves (race condition fix)
    if (isSavingRef.current) return
    isSavingRef.current = true
    store.setSaving(true)
    if (store.status === 'PUBLISHED' && !isFromAdmin) {
      if (showToast) toast.error('Laporan sudah dipublikasi, tidak dapat disimpan')
      isSavingRef.current = false
      store.setSaving(false)
      return
    }
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
        // Save to localStorage so this browser remembers its own report
        localStorage.setItem(SESSION_KEY, reportId)
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
      isSavingRef.current = false
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
      // Clear localStorage so supplier starts fresh next time
      localStorage.removeItem(SESSION_KEY)
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
    // Clear localStorage so this browser starts a fresh session
    localStorage.removeItem(SESSION_KEY)
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
  // Admin CAN edit published reports (for fixing duplicates, etc.)
  // Supplier CANNOT edit published reports (locked)
  const isLocked = isPublished && !isFromAdmin
  const canEdit = !isLocked

  return (
    <div className="min-h-screen bg-permata-green-light/20">
      {/* Header */}
      {/* Permata Group top gradient bar */}
      <div className="h-1 bg-permata-accent-line" />
      <header className="sticky top-0 z-30 bg-permata-topbar text-white border-b border-permata-forest-dark/30">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            {isFromAdmin ? (
              <Button variant="ghost" size="sm" onClick={onBackToAdmin} className="!text-white/80 hover:!text-white hover:!bg-white/10">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Kembali ke Rekap
              </Button>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                {/* Permata Group logo */}
                <img src="/permatagroup-logo.svg" alt="Permata Group" className="h-8 w-auto" />
                <div className="h-6 w-px bg-white/20" />
                <div className="min-w-0">
                  <h1 className="text-base font-semibold truncate text-white">
                    Form TTP
                  </h1>
                  <p className="text-xs text-white/60">
                    Traceability to Plantation
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isPublished && !isFromAdmin && (
              <Badge className="bg-permata-accent/20 text-permata-accent border border-permata-accent/30 hover:bg-permata-accent/30">
                <Lock className="h-3 w-3 mr-1" />
                Dipublikasi
              </Badge>
            )}
            {isFromAdmin && (
              <Badge className="bg-white/15 text-white border-0 hover:bg-white/20">
                <Shield className="h-3 w-3 mr-1" />
                Mode Edit (Admin)
              </Badge>
            )}

            {!isFromAdmin && (
              <>
                <Input
                  value={store.reportName}
                  onChange={(e) => store.setReportName(e.target.value)}
                  placeholder="Nama laporan..."
                  className="h-9 w-[180px] md:w-[240px] bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-white/30"
                  disabled={isLocked}
                />

                <Button
                  variant="outline"
                  size="sm"
                  onClick={newReport}
                  disabled={store.isSaving}
                  className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20 hover:!text-white"
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
                  className="!bg-permata-accent !text-white hover:!bg-permata-accent/90 !border-0"
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

            {/* Admin can save when editing a published report */}
            {isFromAdmin && (
              <Button
                size="sm"
                onClick={() => saveAll(true)}
                disabled={store.isSaving || !store.isDirty}
                className="!bg-permata-accent !text-white hover:!bg-permata-accent/90 !border-0"
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
            )}

            <Button variant="outline" size="sm" onClick={exportExcel} className="!border-white/30 !bg-white/10 !text-white hover:!bg-white/20 hover:!text-white">
              <Download className="h-4 w-4 mr-1.5" />
              Excel
            </Button>
          </div>
        </div>

        {/* Status bar */}
        <div className="max-w-[1400px] mx-auto px-4 pb-2 flex items-center gap-3 text-xs text-white/50 flex-wrap">
          {store.reportId ? (
            <Badge
              className="text-[10px] font-normal bg-white/10 text-white/70 border-white/15 hover:bg-white/20 cursor-pointer"
              onClick={() => {
                navigator.clipboard.writeText(store.reportId!)
                toast.success(`Kode laporan disalin: ${store.reportId}`)
              }}
              title="Klik untuk copy kode lengkap"
            >
              Kode: {store.reportId}
              <Copy className="h-2.5 w-2.5 ml-1 inline" />
            </Badge>
          ) : (
            <Badge className="text-[10px] font-normal bg-amber-500/20 text-amber-300 border-amber-400/30 hover:bg-amber-500/30">
              <AlertCircle className="h-3 w-3 mr-1" />
              Belum disimpan
            </Badge>
          )}
          {/* Buka dengan Kode — supplier can load a specific report by ID */}
          {!isFromAdmin && !store.reportId && (
            <div className="flex items-center gap-1">
              <Input
                placeholder="Buka dengan kode laporan..."
                className="h-7 w-[200px] text-[11px] bg-white/10 border-white/20 text-white placeholder:text-white/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const code = (e.target as HTMLInputElement).value.trim()
                    if (code) loadReport(code)
                  }
                }}
              />
            </div>
          )}
          {isPublished && (
            <span className="text-permata-accent">
              • Laporan dipublikasi
              {store.publishedAt &&
                ` pada ${new Date(store.publishedAt).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}`}
            </span>
          )}
          {!isPublished && store.isDirty && (
            <span className="text-amber-300">• Perubahan belum tersimpan (auto-save aktif)</span>
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
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              Laporan ini sudah dipublikasi dan terkunci. Untuk merevisi, hubungi admin
              atau buka laporan ini di Rekap Admin dan klik &quot;Buka kembali ke DRAFT&quot;.
            </span>
          </div>
        )}
        {/* Admin editing a published report */}
        {isFromAdmin && isPublished && !isLocked && (
          <div className="mb-4 rounded-md border border-permata-accent/30 bg-permata-green-light/50 p-3 text-xs text-permata-teal flex items-start gap-2">
            <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              <strong>Mode Edit Admin:</strong> Anda dapat mengedit laporan yang sudah dipublikasi.
              Perubahan akan tersimpan otomatis. Hapus duplikat atau perbaiki data yang salah,
              lalu klik Simpan.
            </span>
          </div>
        )}

        <Tabs value={store.activeTab} onValueChange={(v) => store.setActiveTab(v as any)} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto bg-permata-green-light/50">
            <TabsTrigger value="rekapan" className="data-[state=active]:!bg-permata-teal data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=active]:border-permata-teal">
              1. Rekapan TTP (P1.M)
            </TabsTrigger>
            <TabsTrigger value="supplier" className="data-[state=active]:!bg-permata-teal data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=active]:border-permata-teal">
              2. List Supplier TBS (P2.A)
              {supplierCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {supplierCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agen" className="data-[state=active]:!bg-permata-teal data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=active]:border-permata-teal">
              3. Agen-Pengumpul (P2.B)
              {agenCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 text-[10px]">
                  {agenCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:!bg-permata-teal data-[state=active]:!text-white data-[state=active]:shadow-sm data-[state=active]:border-permata-teal">
              4. Summary
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rekapan" className="mt-4">
            <RekapanTtp readOnly={isLocked} />
          </TabsContent>

          <TabsContent value="supplier" className="mt-4 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">A. Internal — DMA (Directly Managed Areas)</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Kebun Inti milik perusahaan dan Plasma / KKPA / Kemitraan
                </p>
              </CardHeader>
              <CardContent>
                <SupplierTable section="internal" readOnly={isLocked} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">B. Eksternal — Independent Plantation</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Perusahaan Perkebunan Pihak Ketiga, Kebun Pribadi Pihak Ketiga
                </p>
              </CardHeader>
              <CardContent>
                <SupplierTable section="external" readOnly={isLocked} jenisFilter={JENIS_PLANTATION} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">C. Eksternal — Independent Smallholder</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Agen / Pengumpul / Ramp, Koperasi, Gapoktan / Poktan
                </p>
              </CardHeader>
              <CardContent>
                <SupplierTable section="external" readOnly={isLocked} jenisFilter={JENIS_SMALLHOLDER} />
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
            <SummaryPanel isAdmin={isFromAdmin} />
          </TabsContent>
        </Tabs>

        <footer className="mt-10 pt-6 border-t border-permata-forest/30 text-xs text-permata-subtitle space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <img src="/permatagroup-logo.svg" alt="Permata Group" className="h-5 w-auto opacity-70" />
            <span className="text-permata-teal font-medium">Permata Group</span>
          </div>
          <p>
            <strong className="text-permata-teal">Form TTP</strong> — Traceability to Plantation.
            Sistem kemamputelusuran TBS ke kebun untuk Pabrik Kelapa Sawit (PKS).
            Mendukung: Pernyataan TTP (P1.M), List Supplier TBS (P2.A), Pemasok Tidak Langsung (P2.B),
            Summary otomatis, dan ekspor ke Excel.
          </p>
          <p>
            Data tersimpan otomatis di database cloud. Master data desa (18.510 entri) bersumber
            dari sheet MSD SSD. Setelah selesai mengisi, klik <strong className="text-permata-accent">Publikasi</strong> untuk
            mengunci laporan — laporan akan muncul di <strong className="text-permata-teal">Rekap Admin</strong>.
          </p>
        </footer>
      </main>
    </div>
  )
}
