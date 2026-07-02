import { NextRequest, NextResponse } from 'next/server'

// POST /api/upload-shp — uploads a ZIP file containing SHP bundle to Vercel Blob.
// Returns { url, fileName, size }.

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const reportId = formData.get('reportId') as string | null
    const supplierNo = formData.get('supplierNo') as string | null

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 })
    }

    if (!reportId || !supplierNo) {
      return NextResponse.json(
        { error: 'reportId dan supplierNo wajib diisi' },
        { status: 400 }
      )
    }

    // Validate file type — must be .zip
    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'File harus berformat .zip (berisi .shp, .shx, .dbf, .prj)' },
        { status: 400 }
      )
    }

    // Validate file size — max 50MB
    const MAX_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file maksimal 50MB (file Anda: ${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      )
    }

    // Check if BLOB_READ_WRITE_TOKEN is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Server belum dikonfigurasi untuk upload file (BLOB_READ_WRITE_TOKEN missing). Hubungi admin untuk setup Vercel Blob Storage.' },
        { status: 500 }
      )
    }

    // Dynamic import to avoid build-time errors when BLOB_READ_WRITE_TOKEN isn't set
    const { put } = await import('@vercel/blob')

    // Upload to Vercel Blob
    const blobPath = `shp/${reportId}/supplier-${supplierNo}/${file.name}`

    const blob = await put(blobPath, file, {
      access: 'public',
      addRandomSuffix: true,
      contentType: 'application/zip',
    })

    return NextResponse.json({
      url: blob.url,
      fileName: file.name,
      size: file.size,
      path: blobPath,
    })
  } catch (e: any) {
    console.error('Upload SHP error:', e)
    return NextResponse.json(
      { error: 'Gagal upload file: ' + e.message },
      { status: 500 }
    )
  }
}
