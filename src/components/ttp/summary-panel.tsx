'use client'

import { useTtpStore } from '@/lib/ttp/store'
import { computeSummary, computeTtpPercent, type SupplierRow } from '@/lib/ttp/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TrendingUp, Layers, Trees, Users, Factory } from 'lucide-react'

function fmt(n: number, digits = 2) {
  if (!isFinite(n)) return '0'
  return n.toLocaleString('id-ID', { maximumFractionDigits: digits })
}

function pctStr(n: number, digits = 2) {
  if (!isFinite(n)) return '0%'
  return `${(n * 100).toFixed(digits)}%`
}

export function SummaryPanel() {
  const { suppliers, pks } = useTtpStore()
  const s = computeSummary(suppliers)
  const ttpPct = computeTtpPercent(suppliers)

  const cards = [
    {
      label: 'Total Volume TBS',
      value: `${fmt(s.totalVolume)} ton`,
      icon: Factory,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      label: 'Pasokan Internal',
      value: `${fmt(s.internalVolume)} ton (${pctStr(s.internalPct)})`,
      icon: Trees,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pasokan Eksternal',
      value: `${fmt(s.externalVolume)} ton (${pctStr(s.externalPct)})`,
      icon: Users,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: '% TTP (Bersertifikat)',
      value: pctStr(ttpPct),
      icon: TrendingUp,
      color: ttpPct >= 0.95 ? 'text-emerald-600' : ttpPct >= 0.5 ? 'text-amber-600' : 'text-rose-600',
      bg: ttpPct >= 0.95 ? 'bg-emerald-50' : ttpPct >= 0.5 ? 'bg-amber-50' : 'bg-rose-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.label}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    <p className="text-lg font-semibold tabular-nums">{c.value}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${c.bg}`}>
                    <Icon className={`h-4 w-4 ${c.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Internal vs External breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trees className="h-4 w-4 text-green-600" />
              Pasokan Internal
            </CardTitle>
            <CardDescription>
              Sumber TBS dari kebun inti dan plasma perusahaan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow
              label="Kebun Inti"
              count={s.internal.kebunInti.count}
              volume={s.internal.kebunInti.volume}
              pct={s.internal.kebunInti.pctVolume}
            />
            <SummaryRow
              label="Plasma"
              count={s.internal.plasma.count}
              volume={s.internal.plasma.volume}
              pct={s.internal.plasma.pctVolume}
            />
            <div className="pt-2 border-t">
              <SummaryRow
                label="Total Internal"
                count={s.internal.total.count}
                volume={s.internal.total.volume}
                pct={s.internal.total.pctVolume}
                bold
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-amber-600" />
              Pasokan Eksternal
            </CardTitle>
            <CardDescription>
              Sumber TBS dari pemasok pihak ketiga
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <SummaryRow
              label="Perusahaan Perkebunan Pihak Ketiga"
              count={s.external.perusahaan.count}
              volume={s.external.perusahaan.volume}
              pct={s.external.perusahaan.pctVolume}
            />
            <SummaryRow
              label="Kebun Pribadi Pihak Ketiga"
              count={s.external.pribadi.count}
              volume={s.external.pribadi.volume}
              pct={s.external.pribadi.pctVolume}
            />
            <SummaryRow
              label="Koperasi"
              count={s.external.koperasi.count}
              volume={s.external.koperasi.volume}
              pct={s.external.koperasi.pctVolume}
            />
            <SummaryRow
              label="Agen / Pengumpul / Ramp"
              count={s.external.agen.count}
              volume={s.external.agen.volume}
              pct={s.external.agen.pctVolume}
            />
            <SummaryRow
              label="Gapoktan / Poktan"
              count={s.external.gapoktan.count}
              volume={s.external.gapoktan.volume}
              pct={s.external.gapoktan.pctVolume}
            />
            <div className="pt-2 border-t">
              <SummaryRow
                label="Total Eksternal"
                count={s.external.total.count}
                volume={s.external.total.volume}
                pct={s.external.total.pctVolume}
                bold
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FFB Supply base - matches Excel H1-L18 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">FFB Supply Base & Traceability to Plantation</CardTitle>
          <CardDescription>
            Persentase kemamputelusuran ke kebon per kategori pemasok
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead className="text-right">Tonase</TableHead>
                <TableHead className="text-right">% Volume</TableHead>
                <TableHead className="min-w-[160px]">Distribusi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TtpRow label="Kebun Inti" volume={s.internal.kebunInti.volume} total={s.totalVolume} count={s.internal.kebunInti.count} />
              <TtpRow label="Plasma" volume={s.internal.plasma.volume} total={s.totalVolume} count={s.internal.plasma.count} />
              <TtpRow label="Perusahaan Perkebunan" volume={s.external.perusahaan.volume} total={s.totalVolume} count={s.external.perusahaan.count} />
              <TtpRow label="Kebun Pribadi" volume={s.external.pribadi.volume} total={s.totalVolume} count={s.external.pribadi.count} />
              <TtpRow label="Koperasi" volume={s.external.koperasi.volume} total={s.totalVolume} count={s.external.koperasi.count} />
              <TtpRow label="Agen / Pengumpul" volume={s.external.agen.volume} total={s.totalVolume} count={s.external.agen.count} />
              <TtpRow label="Gapoktan / Poktan" volume={s.external.gapoktan.volume} total={s.totalVolume} count={s.external.gapoktan.count} />
              <TableRow className="border-t-2 font-medium bg-muted/30">
                <TableCell>Total</TableCell>
                <TableCell className="text-right tabular-nums">
                  {s.internal.total.count + s.external.total.count}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmt(s.totalVolume)}
                </TableCell>
                <TableCell className="text-right tabular-nums">100.00%</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryRow({
  label,
  count,
  volume,
  pct,
  bold,
}: {
  label: string
  count: number
  volume: number
  pct: number
  bold?: boolean
}) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? 'font-semibold' : ''}`}>
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4 tabular-nums">
        <span className="text-xs text-muted-foreground w-10 text-right">{count} pms</span>
        <span className="w-24 text-right">{fmt(volume)}</span>
        <span className="w-16 text-right text-xs">{pctStr(pct)}</span>
      </div>
    </div>
  )
}

function TtpRow({
  label,
  volume,
  total,
  count,
}: {
  label: string
  volume: number
  total: number
  count: number
}) {
  const p = total > 0 ? (volume / total) * 100 : 0
  return (
    <TableRow>
      <TableCell className="font-medium">{label}</TableCell>
      <TableCell className="text-right tabular-nums">{count}</TableCell>
      <TableCell className="text-right tabular-nums">{fmt(volume)}</TableCell>
      <TableCell className="text-right tabular-nums">{p.toFixed(2)}%</TableCell>
      <TableCell>
        <Progress value={p} className="h-2" />
      </TableCell>
    </TableRow>
  )
}
