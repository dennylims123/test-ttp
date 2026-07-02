import { NextResponse } from 'next/server'
import { getClient } from '@/lib/db'

// POST /api/admin/migrate — TEMPORARILY PUBLIC (no auth) for one-time migration.
// Adds missing columns to supplier_tbs for SHP file upload.
// Idempotent — safe to call multiple times.
// TODO: Re-add auth check after migration is done, then delete this file.

export async function POST() {
  const client = getClient()
  const results: string[] = []

  // Check current columns
  const tableInfo = await client.execute("PRAGMA table_info(supplier_tbs)")
  const columnNames = tableInfo.rows.map((r: any) => r.name)

  // Add shp_file_url if missing
  if (!columnNames.includes('shp_file_url')) {
    try {
      await client.execute('ALTER TABLE supplier_tbs ADD COLUMN shp_file_url TEXT')
      results.push('✓ Added shp_file_url')
    } catch (e: any) {
      results.push(`shp_file_url: ${e.message}`)
    }
  } else {
    results.push('shp_file_url already exists')
  }

  // Add shp_file_name if missing
  if (!columnNames.includes('shp_file_name')) {
    try {
      await client.execute('ALTER TABLE supplier_tbs ADD COLUMN shp_file_name TEXT')
      results.push('✓ Added shp_file_name')
    } catch (e: any) {
      results.push(`shp_file_name: ${e.message}`)
    }
  } else {
    results.push('shp_file_name already exists')
  }

  // Verify
  const updated = await client.execute("PRAGMA table_info(supplier_tbs)")
  const finalColumns = updated.rows.map((r: any) => r.name)

  return NextResponse.json({
    results,
    finalColumns,
  })
}

// Also allow GET for easy browser testing
export async function GET() {
  return POST()
}
