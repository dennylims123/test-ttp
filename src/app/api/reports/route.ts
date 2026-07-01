import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const reports = await db.ttpReport.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      _count: { select: { suppliers: true, agenPengumpul: true } },
      pksAccount: { select: { name: true } },
    },
  })
  return NextResponse.json(reports)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const report = await db.ttpReport.create({
    data: {
      name: body.name || `Laporan TTP - ${new Date().toLocaleDateString('id-ID')}`,
      pksName: body.pksName || null,
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
