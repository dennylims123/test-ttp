'use client'

import { create } from 'zustand'
import type {
  PksInfo,
  P1MData,
  SupplierRow,
  AgenPengumpulRow,
  FarmerRow,
} from '@/lib/ttp/types'

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

export interface TtpState {
  reportId: string | null
  reportName: string
  pks: PksInfo
  p1m: P1MData
  suppliers: SupplierRow[]
  agen: AgenPengumpulRow[]
  isDirty: boolean
  isSaving: boolean
  lastSavedAt: string | null

  // actions
  setReportId: (id: string | null) => void
  setReportName: (name: string) => void
  setPks: (patch: Partial<PksInfo>) => void
  setP1m: (patch: Partial<P1MData>) => void

  // suppliers
  setSuppliers: (rows: SupplierRow[]) => void
  addSupplier: (section: 'internal' | 'external') => void
  updateSupplier: (idx: number, patch: Partial<SupplierRow>) => void
  removeSupplier: (idx: number) => void

  // agen
  setAgen: (rows: AgenPengumpulRow[]) => void
  addAgen: () => void
  updateAgen: (idx: number, patch: Partial<AgenPengumpulRow>) => void
  removeAgen: (idx: number) => void

  // farmers within agen
  addFarmer: (agenIdx: number) => void
  updateFarmer: (agenIdx: number, fIdx: number, patch: Partial<FarmerRow>) => void
  removeFarmer: (agenIdx: number, fIdx: number) => void

  markClean: () => void
  setSaving: (s: boolean) => void
  setLastSavedAt: (s: string | null) => void

  loadFromApi: (data: any) => void
  reset: () => void
}

export const useTtpStore = create<TtpState>((set, get) => ({
  reportId: null,
  reportName: '',
  pks: { ...emptyPks },
  p1m: { ...emptyP1m },
  suppliers: [],
  agen: [],
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,

  setReportId: (id) => set({ reportId: id, isDirty: true }),
  setReportName: (name) => set({ reportName: name, isDirty: true }),
  setPks: (patch) => set((st) => ({ pks: { ...st.pks, ...patch }, isDirty: true })),
  setP1m: (patch) => set((st) => ({ p1m: { ...st.p1m, ...patch }, isDirty: true })),

  setSuppliers: (rows) => set({ suppliers: rows, isDirty: true }),
  addSupplier: (section) =>
    set((st) => {
      const sectionRows = st.suppliers.filter((s) => s.section === section)
      const no = sectionRows.length + 1
      const newRow: SupplierRow = {
        section,
        no,
        namaPemasok: '',
        jenisPemasok: section === 'internal' ? 'Kebun Inti' : '',
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
      }
      return { suppliers: [...st.suppliers, newRow], isDirty: true }
    }),
  updateSupplier: (idx, patch) =>
    set((st) => {
      const next = [...st.suppliers]
      next[idx] = { ...next[idx], ...patch }
      return { suppliers: next, isDirty: true }
    }),
  removeSupplier: (idx) =>
    set((st) => {
      const removed = st.suppliers[idx]
      const next = st.suppliers.filter((_, i) => i !== idx)
      // Re-number rows within the same section
      const renumbered = next.map((row) => {
        if (row.section === removed.section) {
          // count position
          const position = next.filter((r) => r.section === removed.section && r.no <= row.no).length
          // simpler: re-number sequentially
          return row
        }
        return row
      })
      // Re-number sequentially
      let intiNo = 0
      let extNo = 0
      const finalRows = renumbered.map((row) => {
        if (row.section === 'internal') {
          intiNo++
          return { ...row, no: intiNo }
        } else {
          extNo++
          return { ...row, no: extNo }
        }
      })
      return { suppliers: finalRows, isDirty: true }
    }),

  setAgen: (rows) => set({ agen: rows, isDirty: true }),
  addAgen: () =>
    set((st) => {
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
      }
      return { agen: [...st.agen, newRow], isDirty: true }
    }),
  updateAgen: (idx, patch) =>
    set((st) => {
      const next = [...st.agen]
      next[idx] = { ...next[idx], ...patch }
      return { agen: next, isDirty: true }
    }),
  removeAgen: (idx) =>
    set((st) => {
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

  markClean: () => set({ isDirty: false }),
  setSaving: (s) => set({ isSaving: s }),
  setLastSavedAt: (s) => set({ lastSavedAt: s }),

  loadFromApi: (data) => {
    set({
      reportId: data.id,
      reportName: data.name || '',
      pks: {
        pksName: data.pksName || '',
        pksAddress: data.pksAddress || '',
        pksLatitude: data.pksLatitude || '',
        pksLongitude: data.pksLongitude || '',
        reportDate: data.reportDate || '',
        periode: data.periode || '',
        totalTbs: data.totalTbs ?? null,
        pengisi: data.pengisi || '',
      },
      p1m: {
        produksiTbsBersertifikat: data.p1mProduksiTbsBersertifikat ?? null,
        kapasitasPks: data.p1mKapasitasPks ?? null,
        produksiCpo: data.p1mProduksiCpo ?? null,
        fasilitasKernel: (data.p1mFasilitasKernel as any) || '',
        totalTbs: data.p1mTotalTbs ?? null,
        tbsKebunInti: data.p1mTbsKebunInti ?? null,
        tbsPlasma: data.p1mTbsPlasma ?? null,
        tbsMandiri: data.p1mTbsMandiri ?? null,
        sistemTtp: (data.p1mSistemTtp as any) || '',
        nilaiTtp: data.p1mNilaiTtp ?? null,
        sistemDetail: data.p1mSistemDetail || '',
      },
      suppliers: (data.suppliers || []).map((s: any) => ({
        id: s.id,
        section: s.section,
        no: s.no,
        namaPemasok: s.namaPemasok || '',
        jenisPemasok: s.jenisPemasok || '',
        jumlahPetani: s.jumlahPetani ?? null,
        sertifikasi: s.sertifikasi || '',
        desa: s.desa || '',
        kecamatan: s.kecamatan || '',
        kabupaten: s.kabupaten || '',
        lintang: s.lintang || '',
        bujur: s.bujur || '',
        legalitas: s.legalitas || '',
        luasAreal: s.luasAreal ?? null,
        petaKebun: s.petaKebun || '',
        volumeTbs: s.volumeTbs ?? null,
      })),
      agen: (data.agenPengumpul || []).map((a: any) => ({
        id: a.id,
        no: a.no,
        namaAgen: a.namaAgen || '',
        alamat: a.alamat || '',
        lintang: a.lintang || '',
        bujur: a.bujur || '',
        desaSumber: a.desaSumber || '',
        volumeTbs: a.volumeTbs ?? null,
        farmers: (a.farmers || []).map((f: any) => ({
          id: f.id,
          no: f.no,
          nama: f.nama || '',
          lintang: f.lintang || '',
          bujur: f.bujur || '',
          legalitas: f.legalitas || '',
          desa: f.desa || '',
          kecamatan: f.kecamatan || '',
          kabupaten: f.kabupaten || '',
          luasKebun: f.luasKebun ?? null,
        })),
      })),
      isDirty: false,
    })
  },

  reset: () =>
    set({
      reportId: null,
      reportName: '',
      pks: { ...emptyPks },
      p1m: { ...emptyP1m },
      suppliers: [],
      agen: [],
      isDirty: false,
      lastSavedAt: null,
    }),
}))
