'use client'

import { create } from 'zustand'
import type {
  PksInfo,
  P1MData,
  SupplierRow,
  AgenPengumpulRow,
  FarmerRow,
} from '@/lib/ttp/types'

const AGEN_JENIS = 'Agen / Pengumpul / Ramp'

const emptyPks: PksInfo = {
  pksName: '',
  pksAddress: '',
  pksLatitude: '',
  pksLongitude: '',
  reportDate: '',
  periode: '',
  totalTbs: null,
  pengisi: '',
}

const emptyP1m: P1MData = {
  produksiTbsBersertifikat: null,
  kapasitasPks: null,
  produksiCpo: null,
  fasilitasKernel: '',
  totalTbs: null,
  tbsKebunInti: null,
  tbsPlasma: null,
  tbsMandiri: null,
  sistemTtp: '',
  nilaiTtp: null,
  sistemDetail: '',
}

/**
 * Sync the agen array to match the external suppliers of jenisPemasok = 'Agen / Pengumpul / Ramp'.
 * - For each agen supplier in `suppliers`, ensure a linked agen entry exists.
 * - Auto-populate name/volume/alamat/koordinat from the supplier (read-only synced fields).
 * - Remove agen entries whose linked supplier no longer exists or is no longer an agen type.
 * - Preserve unlinked (legacy/manual) agen entries as-is.
 * - Preserve farmer list + desaSumber for existing linked agen.
 */
function syncAgenFromSuppliers(
  suppliers: SupplierRow[],
  existingAgen: AgenPengumpulRow[]
): AgenPengumpulRow[] {
  const agenSuppliers = suppliers.filter(
    (s) => s.section === 'external' && s.jenisPemasok === AGEN_JENIS
  )

  const result: AgenPengumpulRow[] = []

  // Re-add linked agen for each agen supplier (in supplier order)
  agenSuppliers.forEach((sup, idx) => {
    const existing = existingAgen.find((a) => a.linkedSupplierNo === sup.no)
    if (existing) {
      // Sync shared fields from supplier, preserve farmer list + desaSumber
      result.push({
        ...existing,
        no: idx + 1,
        namaAgen: sup.namaPemasok || '',
        alamat:
          [sup.desa, sup.kecamatan, sup.kabupaten].filter(Boolean).join(', ') ||
          existing.alamat,
        lintang: sup.lintang || existing.lintang,
        bujur: sup.bujur || existing.bujur,
        volumeTbs: sup.volumeTbs ?? existing.volumeTbs,
      })
    } else {
      // New linked agen
      result.push({
        no: idx + 1,
        namaAgen: sup.namaPemasok || '',
        alamat: [sup.desa, sup.kecamatan, sup.kabupaten].filter(Boolean).join(', '),
        lintang: sup.lintang || '',
        bujur: sup.bujur || '',
        desaSumber: '',
        volumeTbs: sup.volumeTbs ?? null,
        farmers: [],
        linkedSupplierNo: sup.no,
      })
    }
  })

  // Re-add unlinked (legacy/manual) agen entries at the end
  let unlinkedNo = result.length
  existingAgen
    .filter((a) => a.linkedSupplierNo == null)
    .forEach((a) => {
      unlinkedNo++
      result.push({ ...a, no: unlinkedNo })
    })

  return result
}

export type TabKey = 'rekapan' | 'supplier' | 'agen' | 'summary'

export interface TtpState {
  reportId: string | null
  reportName: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  pks: PksInfo
  p1m: P1MData
  suppliers: SupplierRow[]
  agen: AgenPengumpulRow[]
  activeTab: TabKey
  /** When jumping to the Agen tab, scroll/highlight this agen index. */
  focusAgenNo: number | null
  isDirty: boolean
  isSaving: boolean
  isPublishing: boolean
  lastSavedAt: string | null

  // navigation
  setActiveTab: (tab: TabKey) => void
  jumpToAgen: (supplierNo: number) => void
  clearFocusAgen: () => void

  // actions
  setReportId: (id: string | null) => void
  setReportName: (name: string) => void
  setPks: (patch: Partial<PksInfo>) => void
  setP1m: (patch: Partial<P1MData>) => void

  // suppliers
  setSuppliers: (rows: SupplierRow[]) => void
  addSupplier: (section: 'internal' | 'external', defaultJenis?: string) => void
  updateSupplier: (idx: number, patch: Partial<SupplierRow>) => void
  removeSupplier: (idx: number) => void

  // agen (manual/legacy) — most fields are now auto-synced for linked agen
  setAgen: (rows: AgenPengumpulRow[]) => void
  addAgen: () => void
  updateAgen: (idx: number, patch: Partial<AgenPengumpulRow>) => void
  removeAgen: (idx: number) => void

  // farmers within agen
  addFarmer: (agenIdx: number) => void
  updateFarmer: (agenIdx: number, fIdx: number, patch: Partial<FarmerRow>) => void
  removeFarmer: (agenIdx: number, fIdx: number) => void
  setFarmers: (agenIdx: number, farmers: FarmerRow[]) => void

  markClean: () => void
  setSaving: (s: boolean) => void
  setPublishing: (s: boolean) => void
  setLastSavedAt: (s: string | null) => void
  setStatus: (status: 'DRAFT' | 'PUBLISHED', publishedAt: string | null) => void

  loadFromApi: (data: any) => void
  reset: () => void
}

export const useTtpStore = create<TtpState>((set, get) => ({
  reportId: null,
  reportName: '',
  status: 'DRAFT',
  publishedAt: null,
  pks: { ...emptyPks },
  p1m: { ...emptyP1m },
  suppliers: [],
  agen: [],
  activeTab: 'rekapan',
  focusAgenNo: null,
  isDirty: false,
  isSaving: false,
  isPublishing: false,
  lastSavedAt: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  jumpToAgen: (supplierNo) => {
    const agenIdx = get().agen.findIndex((a) => a.linkedSupplierNo === supplierNo)
    set({
      activeTab: 'agen',
      focusAgenNo: agenIdx >= 0 ? get().agen[agenIdx].no : null,
    })
  },
  clearFocusAgen: () => set({ focusAgenNo: null }),

  setReportId: (id) => set({ reportId: id, isDirty: true }),
  setReportName: (name) => set({ reportName: name, isDirty: true }),
  setPks: (patch) => set((st) => ({ pks: { ...st.pks, ...patch }, isDirty: true })),
  setP1m: (patch) => set((st) => ({ p1m: { ...st.p1m, ...patch }, isDirty: true })),

  setSuppliers: (rows) =>
    set((st) => ({
      suppliers: rows,
      agen: syncAgenFromSuppliers(rows, st.agen),
      isDirty: true,
    })),

  addSupplier: (section, defaultJenis) =>
    set((st) => {
      const sectionRows = st.suppliers.filter((s) => s.section === section)
      const no = sectionRows.length + 1
      const newRow: SupplierRow = {
        section,
        no,
        namaPemasok: '',
        jenisPemasok: section === 'internal' ? 'Kebun Inti' : (defaultJenis || ''),
        jumlahPetani: null,
        sertifikasi: 'Tidak',
        desa: '',
        kecamatan: '',
        kabupaten: '',
        lintang: '',
        bujur: '',
        legalitas: '',
        luasAreal: null,
        petaKebun: 'Tidak',
        volumeTbs: null,
        msdStatus: null,
      }
      const newSuppliers = [...st.suppliers, newRow]
      return {
        suppliers: newSuppliers,
        agen: syncAgenFromSuppliers(newSuppliers, st.agen),
        isDirty: true,
      }
    }),

  updateSupplier: (idx, patch) =>
    set((st) => {
      const next = [...st.suppliers]
      next[idx] = { ...next[idx], ...patch }
      return {
        suppliers: next,
        agen: syncAgenFromSuppliers(next, st.agen),
        isDirty: true,
      }
    }),

  removeSupplier: (idx) =>
    set((st) => {
      const removed = st.suppliers[idx]
      const next = st.suppliers.filter((_, i) => i !== idx)
      // Re-number sequentially per section
      let intiNo = 0
      let extNo = 0
      const finalRows = next.map((row) => {
        if (row.section === 'internal') {
          intiNo++
          return { ...row, no: intiNo }
        } else {
          extNo++
          return { ...row, no: extNo }
        }
      })
      return {
        suppliers: finalRows,
        agen: syncAgenFromSuppliers(finalRows, st.agen),
        isDirty: true,
      }
    }),

  setAgen: (rows) => set({ agen: rows, isDirty: true }),

  addAgen: () =>
    set((st) => {
      // Manual (unlinked) agen — for legacy compatibility
      const no = st.agen.length + 1
      const newRow: AgenPengumpulRow = {
        no,
        namaAgen: '',
        alamat: '',
        lintang: '',
        bujur: '',
        desaSumber: '',
        volumeTbs: null,
        farmers: [],
        linkedSupplierNo: null,
      }
      return { agen: [...st.agen, newRow], isDirty: true }
    }),

  updateAgen: (idx, patch) =>
    set((st) => {
      const next = [...st.agen]
      // For linked agen, only allow desaSumber + volumeTbs + farmers to be edited
      // (other fields are synced from supplier). We allow the patch but ignore synced fields.
      const current = next[idx]
      if (current.linkedSupplierNo != null) {
        const allowed: Partial<AgenPengumpulRow> = {}
        if ('desaSumber' in patch) allowed.desaSumber = patch.desaSumber
        if ('volumeTbs' in patch) allowed.volumeTbs = patch.volumeTbs
        if ('farmers' in patch) allowed.farmers = patch.farmers
        next[idx] = { ...current, ...allowed }
      } else {
        next[idx] = { ...current, ...patch }
      }
      return { agen: next, isDirty: true }
    }),

  removeAgen: (idx) =>
    set((st) => {
      const target = st.agen[idx]
      if (target?.linkedSupplierNo != null) {
        // Can't delete a linked agen directly — must delete the supplier instead.
        // We'll just no-op here; UI should prevent this.
        return {}
      }
      const next = st.agen.filter((_, i) => i !== idx).map((a, i) => ({ ...a, no: i + 1 }))
      return { agen: next, isDirty: true }
    }),

  addFarmer: (agenIdx) =>
    set((st) => {
      const next = [...st.agen]
      const farmers = [...(next[agenIdx].farmers || [])]
      const no = farmers.length + 1
      farmers.push({
        no,
        nama: '',
        lintang: '',
        bujur: '',
        legalitas: '',
        desa: '',
        kecamatan: '',
        kabupaten: '',
        luasKebun: null,
        msdStatus: null,
      })
      next[agenIdx] = { ...next[agenIdx], farmers }
      return { agen: next, isDirty: true }
    }),
  updateFarmer: (agenIdx, fIdx, patch) =>
    set((st) => {
      const next = [...st.agen]
      const farmers = [...next[agenIdx].farmers]
      farmers[fIdx] = { ...farmers[fIdx], ...patch }
      next[agenIdx] = { ...next[agenIdx], farmers }
      return { agen: next, isDirty: true }
    }),
  removeFarmer: (agenIdx, fIdx) =>
    set((st) => {
      const next = [...st.agen]
      const farmers = next[agenIdx].farmers
        .filter((_, i) => i !== fIdx)
        .map((f, i) => ({ ...f, no: i + 1 }))
      next[agenIdx] = { ...next[agenIdx], farmers }
      return { agen: next, isDirty: true }
    }),

  setFarmers: (agenIdx, farmers) =>
    set((st) => {
      const next = [...st.agen]
      // Re-number sequentially
      const renumbered = farmers.map((f, i) => ({ ...f, no: i + 1 }))
      next[agenIdx] = { ...next[agenIdx], farmers: renumbered }
      return { agen: next, isDirty: true }
    }),

  markClean: () => set({ isDirty: false }),
  setSaving: (s) => set({ isSaving: s }),
  setPublishing: (s) => set({ isPublishing: s }),
  setLastSavedAt: (s) => set({ lastSavedAt: s }),
  setStatus: (status, publishedAt) => set({ status, publishedAt, isDirty: false }),

  loadFromApi: (data) => {
    // NOTE: The API returns snake_case column names from direct LibSQL queries
    // (e.g., nama_pemasok, pks_name, volume_tbs). We check BOTH camelCase and
    // snake_case to handle both formats.
    const suppliers: SupplierRow[] = (data.suppliers || []).map((s: any) => ({
      id: s.id,
      section: s.section,
      no: s.no,
      namaPemasok: s.namaPemasok || s.nama_pemasok || '',
      jenisPemasok: s.jenisPemasok || s.jenis_pemasok || '',
      jumlahPetani: s.jumlahPetani ?? s.jumlah_petani ?? null,
      sertifikasi: s.sertifikasi || '',
      desa: s.desa || '',
      kecamatan: s.kecamatan || '',
      kabupaten: s.kabupaten || '',
      lintang: s.lintang || '',
      bujur: s.bujur || '',
      legalitas: s.legalitas || '',
      luasAreal: s.luasAreal ?? s.luas_areal ?? null,
      petaKebun: s.petaKebun || s.peta_kebun || '',
      volumeTbs: s.volumeTbs ?? s.volume_tbs ?? null,
      msdStatus: s.msdStatus ?? s.msd_status ?? null,
    }))

    // DEDUPLICATE suppliers by (section + no) — prevents old DB duplicates from persisting
    const seenSuppliers = new Set<string>()
    const dedupedSuppliers = suppliers.filter((s) => {
      const key = `${s.section}-${s.no}`
      if (seenSuppliers.has(key)) return false
      seenSuppliers.add(key)
      return true
    })

    // Load existing agen (with farmer lists preserved), then re-sync from suppliers
    // DEDUPLICATE agen by no, and farmers by no within each agen
    const seenAgen = new Set<number>()
    const existingAgen: AgenPengumpulRow[] = (data.agenPengumpul || data.agen_pengumpul || [])
      .filter((a: any) => {
        if (seenAgen.has(a.no)) return false
        seenAgen.add(a.no)
        return true
      })
      .map((a: any) => ({
      id: a.id,
      no: a.no,
      namaAgen: a.namaAgen || a.nama_agen || '',
      alamat: a.alamat || '',
      lintang: a.lintang || '',
      bujur: a.bujur || '',
      desaSumber: a.desaSumber || a.desa_sumber || '',
      volumeTbs: a.volumeTbs ?? a.volume_tbs ?? null,
      linkedSupplierNo: a.linkedSupplierNo ?? a.linked_supplier_no ?? null,
      farmers: (() => {
        const seenFarmer = new Set<number>()
        return (a.farmers || []).filter((f: any) => {
          if (seenFarmer.has(f.no)) return false
          seenFarmer.add(f.no)
          return true
        }).map((f: any) => ({
          id: f.id,
          no: f.no,
          nama: f.nama || '',
          lintang: f.lintang || '',
          bujur: f.bujur || '',
          legalitas: f.legalitas || '',
          desa: f.desa || '',
          kecamatan: f.kecamatan || '',
          kabupaten: f.kabupaten || '',
          luasKebun: f.luasKebun ?? f.luas_kebun ?? null,
          msdStatus: f.msdStatus ?? f.msd_status ?? null,
        }))
      })(),
    }))

    set({
      reportId: data.id,
      reportName: data.name || '',
      status: (data.status as 'DRAFT' | 'PUBLISHED') || 'DRAFT',
      publishedAt: data.publishedAt || data.published_at || null,
      pks: {
        pksName: data.pksName || data.pks_name || '',
        pksAddress: data.pksAddress || data.pks_address || '',
        pksLatitude: data.pksLatitude || data.pks_latitude || '',
        pksLongitude: data.pksLongitude || data.pks_longitude || '',
        reportDate: data.reportDate || data.report_date || '',
        periode: data.periode || '',
        totalTbs: data.totalTbs ?? data.total_tbs ?? null,
        pengisi: data.pengisi || '',
      },
      p1m: {
        produksiTbsBersertifikat: data.p1mProduksiTbsBersertifikat ?? data.p1m_produksi_tbs_bersertifikat ?? null,
        kapasitasPks: data.p1mKapasitasPks ?? data.p1m_kapasitas_pks ?? null,
        produksiCpo: data.p1mProduksiCpo ?? data.p1m_produksi_cpo ?? null,
        fasilitasKernel: (data.p1mFasilitasKernel as any) || data.p1m_fasilitas_kernel || '',
        totalTbs: data.p1mTotalTbs ?? data.p1m_total_tbs ?? null,
        tbsKebunInti: data.p1mTbsKebunInti ?? data.p1m_tbs_kebun_inti ?? null,
        tbsPlasma: data.p1mTbsPlasma ?? data.p1m_tbs_plasma ?? null,
        tbsMandiri: data.p1mTbsMandiri ?? data.p1m_tbs_mandiri ?? null,
        sistemTtp: (data.p1mSistemTtp as any) || data.p1m_sistem_ttp || '',
        nilaiTtp: data.p1mNilaiTtp ?? data.p1m_nilai_ttp ?? null,
        sistemDetail: data.p1mSistemDetail || data.p1m_sistem_detail || '',
      },
      suppliers: dedupedSuppliers,
      agen: syncAgenFromSuppliers(dedupedSuppliers, existingAgen),
      isDirty: false,
    })
  },

  reset: () =>
    set({
      reportId: null,
      reportName: '',
      status: 'DRAFT',
      publishedAt: null,
      pks: { ...emptyPks },
      p1m: { ...emptyP1m },
      suppliers: [],
      agen: [],
      activeTab: 'rekapan',
      focusAgenNo: null,
      isDirty: false,
      isPublishing: false,
      lastSavedAt: null,
    }),
}))
