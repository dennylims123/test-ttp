import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const report = await db.ttpReport.findUnique({
    where: { id },
    include: {
      suppliers: { orderBy: { no: 'asc' } },
      agenPengumpul: {
        orderBy: { no: 'asc' },
        include: { farmers: { orderBy: { no: 'asc' } } },
      },
    },
  })
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(report)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  await db.ttpReport.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
