import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/ttp/session'

async function getOwnedReport(id: string) {
  const session = await getSession()
  if (session.role === 'guest') return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }

  const report = await db.ttpReport.findUnique({
    where: { id },
    include: {
      _count: { select: { suppliers: true, agenPengumpul: true } },
      pksAccount: { select: { name: true } },
    },
  })
  if (!report) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }

  // PKS can only see their own reports; admin can see all
  if (session.role === 'pks' && report.pksAccountId !== session.pksAccountId) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { report, session }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getOwnedReport(id)
  if ('error' in r) return r.error

  const full = await db.ttpReport.findUnique({
    where: { id },
    include: {
      suppliers: { orderBy: { no: 'asc' } },
      agenPengumpul: {
        orderBy: { no: 'asc' },
        include: { farmers: { orderBy: { no: 'asc' } } },
      },
    },
  })
  return NextResponse.json(full)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getOwnedReport(id)
  if ('error' in r) return r.error

  // PKS cannot edit PUBLISHED reports
  if (r.session.role === 'pks' && r.report.status === 'PUBLISHED') {
    return NextResponse.json(
      { error: 'Laporan sudah dipublikasi dan tidak dapat diubah. Hubungi admin untuk membuka kembali.' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const report = await db.ttpReport.update({
    where: { id },
    data: {
      name: body.name,
      pksName: body.pksName ?? null,
      pksAddress: body.pksAddress ?? null,
      pksLatitude: body.pksLatitude ?? null,
      pksLongitude: body.pksLongitude ?? null,
      reportDate: body.reportDate ?? null,
      periode: body.periode ?? null,
      totalTbs: body.totalTbs ?? null,
      pengisi: body.pengisi ?? null,
      p1mProduksiTbsBersertifikat: body.p1mProduksiTbsBersertifikat ?? null,
      p1mKapasitasPks: body.p1mKapasitasPks ?? null,
      p1mProduksiCpo: body.p1mProduksiCpo ?? null,
      p1mFasilitasKernel: body.p1mFasilitasKernel ?? null,
      p1mTotalTbs: body.p1mTotalTbs ?? null,
      p1mTbsKebunInti: body.p1mTbsKebunInti ?? null,
      p1mTbsPlasma: body.p1mTbsPlasma ?? null,
      p1mTbsMandiri: body.p1mTbsMandiri ?? null,
      p1mSistemTtp: body.p1mSistemTtp ?? null,
      p1mNilaiTtp: body.p1mNilaiTtp ?? null,
      p1mSistemDetail: body.p1mSistemDetail ?? null,
    },
  })
  return NextResponse.json(report)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await getOwnedReport(id)
  if ('error' in r) return r.error

  // Only draft reports can be deleted by PKS; admin can delete any
  if (r.session.role === 'pks' && r.report.status === 'PUBLISHED') {
    return NextResponse.json(
      { error: 'Laporan yang sudah dipublikasi tidak dapat dihapus. Hubungi admin.' },
      { status: 403 }
    )
  }

  await db.ttpReport.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
