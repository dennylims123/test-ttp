'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Download, RefreshCw, Lock, Unlock, Eye, Factory, TrendingUp, BarChart3, Layers } from 'lucide-react'
import { toast } from 'sonner'

interface AdminReport {
  id: string
  name: string
  status: 'DRAFT' | 'PUBLISHED'
  publishedAt: string | null
  updatedAt: string
  pksName: string | null
  periode: string | null
  pksAccount: { name: string } | null
  stats: {
    totalVolume: number
    internalVolume: number
    externalVolume: number
    ttpPct: number
    supplierCount: number
    agenCount: number
  }
}

type SortKey = 'updatedAt' | 'pksName' | 'totalVolume' | 'ttpPct' | 'status'

interface Props {
  onOpenReport: (id: string) => void
}

export function AdminRecap({ onOpenReport }: Props) {
  const [reports, setReports] = useState<AdminReport[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED'>('ALL')
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt')
  const [sortAsc, setSortAsc] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'ALL') params.set('status', statusFilter)
      if (search) params.set('q', search)
      const r = await fetch(`/api/admin/reports?${params}`)
      if (!r.ok) throw new Error('Failed to load')
      const data = await r.json()
      setReports(data)
    } catch (e: any) {
      toast.error('Gagal memuat laporan: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => {
    refresh()
  }, [refresh])

  const sorted = [...reports].sort((a, b) => {
    let av: any, bv: any
    switch (sortKey) {
      case 'pksName':
        av = (a.pksAccount?.name || a.pksName || '').toLowerCase()
        bv = (b.pksAccount?.name || b.pksName || '').toLowerCase()
        break
      case 'totalVolume':
        av = a.stats.totalVolume
        bv = b.stats.totalVolume
        break
      case 'ttpPct':
        av = a.stats.ttpPct
        bv = b.stats.ttpPct
        break
      case 'status':
        av = a.status
        bv = b.status
        break
      case 'updatedAt':
      default:
        av = new Date(a.updatedAt).getTime()
        bv = new Date(b.updatedAt).getTime()
        break
    }
    if (av < bv) return sortAsc ? -1 : 1
    if (av > bv) return sortAsc ? 1 : -1
    return 0
  })

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortAsc(!sortAsc)
    else {
      setSortKey(k)
      setSortAsc(true)
    }
  }

  const rejectReport = async (id: string, name: string) => {
    if (!confirm(`Buka kembali laporan "${name}" ke status DRAFT? PKS dapat mengedit kembali.`)) return
    try {
      const r = await fetch(`/api/reports/${id}/publish`, { method: 'DELETE' })
      if (!r.ok) throw new Error('Failed')
      toast.success('Laporan dibuka kembali ke DRAFT')
      refresh()
    } catch (e: any) {
      toast.error('Gagal: ' + e.message)
    }
  }

  const exportReport = async (id: string, name: string) => {
    try {
      const r = await fetch(`/api/reports/${id}/export`)
      if (!r.ok) throw new Error('Export failed')
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${name || 'TTP'}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Excel diunduh')
    } catch (e: any) {
      toast.error('Gagal ekspor: ' + e.message)
    }
  }

  // Aggregate stats
  const totalPublished = reports.filter((r) => r.status === 'PUBLISHED').length
  const totalDraft = reports.filter((r) => r.status === 'DRAFT').length
  const totalVolume = reports
    .filter((r) => r.status === 'PUBLISHED')
    .reduce((acc, r) => acc + r.stats.totalVolume, 0)
  const avgTtp =
    reports.filter((r) => r.status === 'PUBLISHED').length > 0
      ? reports.filter((r) => r.status === 'PUBLISHED').reduce((acc, r) => acc + r.stats.ttpPct, 0) /
        reports.filter((r) => r.status === 'PUBLISHED').length
      : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rekap Laporan TTP
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Daftar semua laporan TTP dari seluruh PKS. Klik baris untuk melihat detail, atau
            kelola status publikasi.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Laporan" value={reports.length.toString()} icon={Layers} />
        <StatCard label="Sudah Dipublikasi" value={totalPublished.toString()} icon={Lock} color="emerald" />
        <StatCard label="Masih Draft" value={totalDraft.toString()} icon={Unlock} color="amber" />
        <StatCard label="Total Volume (Publik)" value={`${totalVolume.toLocaleString('id-ID', { maximumFractionDigits: 0 })} ton`} icon={Factory} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center gap-3 flex-wrap">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama PKS atau laporan..."
              className="max-w-xs"
            />
            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="PUBLISHED">Sudah Dipublikasi</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-xs text-muted-foreground ml-auto">
              {sorted.length} laporan
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('pksName')}>
                  PKS / Nama Laporan {sortKey === 'pksName' && (sortAsc ? '↑' : '↓')}
                </TableHead>
                <TableHead>Periode</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
                  Status {sortKey === 'status' && (sortAsc ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right cursor-pointer select-none" onClick={() => toggleSort('totalVolume')}>
                  Total TBS (ton) {sortKey === 'totalVolume' && (sortAsc ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">% TTP</TableHead>
                <TableHead className="text-center">Pemasok</TableHead>
                <TableHead className="text-center">Agen</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('updatedAt')}>
                  Diperbarui {sortKey === 'updatedAt' && (sortAsc ? '↑' : '↓')}
                </TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    {loading ? 'Memuat...' : 'Tidak ada laporan'}
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((r) => (
                  <TableRow
                    key={r.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => onOpenReport(r.id)}
                  >
                    <TableCell>
                      <div className="font-medium">{r.pksAccount?.name || r.pksName || '—'}</div>
                      <div className="text-xs text-muted-foreground">{r.name}</div>
                    </TableCell>
                    <TableCell className="text-xs">{r.periode || '—'}</TableCell>
                    <TableCell>
                      {r.status === 'PUBLISHED' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                          <Lock className="h-3 w-3 mr-1" />
                          Dipublikasi
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-700 border-amber-300">
                          <Unlock className="h-3 w-3 mr-1" />
                          Draft
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.stats.totalVolume.toLocaleString('id-ID', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span
                        className={
                          r.stats.ttpPct >= 0.95
                            ? 'text-emerald-600 font-medium'
                            : r.stats.ttpPct >= 0.5
                            ? 'text-amber-600 font-medium'
                            : 'text-rose-600 font-medium'
                        }
                      >
                        {(r.stats.ttpPct * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center tabular-nums">{r.stats.supplierCount}</TableCell>
                    <TableCell className="text-center tabular-nums">{r.stats.agenCount}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(r.updatedAt).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7"
                          onClick={() => onOpenReport(r.id)}
                          title="Lihat detail"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7"
                          onClick={() => exportReport(r.id, r.name)}
                          title="Export Excel"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        {r.status === 'PUBLISHED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-amber-700 hover:text-amber-800"
                            onClick={() => rejectReport(r.id, r.name)}
                            title="Buka kembali ke DRAFT"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Footer note */}
      <div className="text-xs text-muted-foreground">
        Rata-rata % TTP dari laporan yang dipublikasi:{' '}
        <strong className="text-foreground">{(avgTtp * 100).toFixed(1)}%</strong>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  color = 'default',
}: {
  label: string
  value: string
  icon: any
  color?: 'default' | 'emerald' | 'amber'
}) {
  const bg = color === 'emerald' ? 'bg-emerald-50' : color === 'amber' ? 'bg-amber-50' : 'bg-muted/40'
  const fg = color === 'emerald' ? 'text-emerald-600' : color === 'amber' ? 'text-amber-600' : 'text-foreground'
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-lg font-semibold tabular-nums">{value}</p>
          </div>
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`h-4 w-4 ${fg}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
