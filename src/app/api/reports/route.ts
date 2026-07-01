import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, getReportFilter } from '@/lib/ttp/session'

export async function GET() {
  const session = await getSession()
  if (session.role === 'guest') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const reports = await db.ttpReport.findMany({
    where: getReportFilter(session),
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { suppliers: true, agenPengumpul: true } },
      pksAccount: { select: { name: true } },
    },
  })
  return NextResponse.json(reports)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (session.role !== 'pks') {
    return NextResponse.json(
      { error: 'Hanya PKS yang dapat membuat laporan' },
      { status: 403 }
    )
  }

  const body = await req.json()
  const report = await db.ttpReport.create({
    data: {
      name: body.name || `Laporan TTP - ${new Date().toLocaleDateString('id-ID')}`,
      pksAccountId: session.pksAccountId,
      pksName: body.pksName || session.pksName || null,
      pksAddress: body.pksAddress || null,
      pksLatitude: body.pksLatitude || null,
      pksLongitude: body.pksLongitude || null,
      reportDate: body.reportDate || null,
      periode: body.periode || null,
      totalTbs: body.totalTbs ?? null,
      pengisi: body.pengisi || null,
      // P1M
      p1mProduksiTbsBersertifikat: body.p1mProduksiTbsBersertifikat ?? null,
      p1mKapasitasPks: body.p1mKapasitasPks ?? null,
      p1mProduksiCpo: body.p1mProduksiCpo ?? null,
      p1mFasilitasKernel: body.p1mFasilitasKernel || null,
      p1mTotalTbs: body.p1mTotalTbs ?? null,
      p1mTbsKebunInti: body.p1mTbsKebunInti ?? null,
      p1mTbsPlasma: body.p1mTbsPlasma ?? null,
      p1mTbsMandiri: body.p1mTbsMandiri ?? null,
      p1mSistemTtp: body.p1mSistemTtp || null,
      p1mNilaiTtp: body.p1mNilaiTtp ?? null,
      p1mSistemDetail: body.p1mSistemDetail || null,
    },
  })
  return NextResponse.json(report, { status: 201 })
}
