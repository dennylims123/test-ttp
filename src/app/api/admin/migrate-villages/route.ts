import { NextResponse } from 'next/server'
import { getClient } from '@/lib/db'
import { readFile } from 'fs/promises'
import { join } from 'path'

// POST /api/admin/migrate-villages — TEMPORARILY PUBLIC
// Adds msd_status column + re-seeds all 32,237 villages with MSD classification.

export const runtime = 'nodejs'

export async function POST() {
  const client = getClient()
  const results: string[] = []

  try {
    // 1. Check if msd_status column exists
    const tableInfo = await client.execute("PRAGMA table_info(villages)")
    const columnNames = tableInfo.rows.map((r: any) => r.name)

    if (!columnNames.includes('msd_status')) {
      await client.execute('ALTER TABLE villages ADD COLUMN msd_status TEXT')
      results.push('✓ Added msd_status column')
    } else {
      results.push('msd_status column already exists')
    }

    // 2. Read villages.json directly from the filesystem
    // On Vercel, public/ files are available in the serverless function's working directory
    const villagesPath = join(process.cwd(), 'public', 'data', 'villages.json')
    let villages: Array<{ id: number; desa: string; full: string; msd_status: string }>

    try {
      const fileContent = await readFile(villagesPath, 'utf-8')
      villages = JSON.parse(fileContent)
      results.push(`✓ Loaded ${villages.length} villages from filesystem`)
    } catch (fileErr: any) {
      // Fallback: fetch from the public URL
      results.push(`Filesystem read failed: ${fileErr.message}, trying HTTP fetch...`)
      const fetchUrl = 'https://ttpform.vercel.app/data/villages.json'
      const response = await fetch(fetchUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch villages.json: HTTP ${response.status}`)
      }
      villages = await response.json()
      results.push(`✓ Loaded ${villages.length} villages via HTTP`)
    }

    // 3. Clear existing villages
    await client.execute('DELETE FROM villages')
    results.push('✓ Cleared old village data')

    // 4. Insert new villages in batches
    const batchSize = 200
    let inserted = 0
    for (let i = 0; i < villages.length; i += batchSize) {
      const batch = villages.slice(i, i + batchSize)
      const stmts = batch.map((v) => ({
        sql: 'INSERT INTO villages (id, desa, full, msd_status) VALUES (?, ?, ?, ?)',
        args: [v.id, v.desa, v.full, v.msd_status || '#N/A'],
      }))
      await client.batch(stmts, 'write')
      inserted += batch.length
      if (inserted % 5000 === 0 || inserted === villages.length) {
        results.push(`  Inserted ${inserted}/${villages.length}`)
      }
    }

    // 5. Verify
    const count = await client.execute('SELECT COUNT(*) as cnt FROM villages')
    const totalCount = (count.rows[0] as any).cnt

    // 6. MSD distribution
    const msdStats = await client.execute({
      sql: 'SELECT msd_status, COUNT(*) as cnt FROM villages GROUP BY msd_status',
      args: [],
    })
    const distribution: Record<string, number> = {}
    for (const row of msdStats.rows) {
      distribution[(row as any).msd_status || '#N/A'] = (row as any).cnt
    }

    results.push(`✓ Done! Total villages: ${totalCount}`)
    results.push(`Distribution: ${JSON.stringify(distribution)}`)

    return NextResponse.json({
      success: true,
      results,
      totalCount,
      distribution,
    })
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message, results },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}
