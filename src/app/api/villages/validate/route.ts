import { NextRequest, NextResponse } from 'next/server'
import { searchVillages } from '@/lib/db'

/**
 * POST /api/villages/validate
 * Batch-validate village names against the MSD SSD master database (18,510 villages).
 *
 * Request body: { names: string[] }
 * Response: {
 *   results: {
 *     [originalName: string]: {
 *       found: boolean,
 *       desa?: string,
 *       kecamatan?: string,
 *       kabupaten?: string,
 *       provinsi?: string,
 *       full?: string,
 *       alternatives?: string[]  // close matches if not found
 *     }
 *   }
 * }
 *
 * Matching logic:
 * - Exact case-insensitive match on `desa` column
 * - If multiple villages have the same name, returns the first match
 *   (supplier can manually fix if needed)
 * - If no exact match, searches for similar names (LIKE) as alternatives
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const names: string[] = body.names || []

  if (!Array.isArray(names) || names.length === 0) {
    return NextResponse.json({ results: {} })
  }

  // Deduplicate names to avoid redundant queries
  const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  const results: Record<string, any> = {}

  for (const name of uniqueNames) {
    // Try exact match first (case-insensitive)
    const exactMatches = await searchVillages(name, 50)

    // Filter to exact desa name matches (case-insensitive)
    const exact = exactMatches.filter(
      (v) => v.desa.toLowerCase() === name.toLowerCase()
    )

    if (exact.length > 0) {
      // Found exact match — parse the full string for kecamatan/kabupaten/provinsi
      const v = exact[0]
      const parts = v.full.split(',').map((p) => p.trim())
      results[name] = {
        found: true,
        desa: v.desa,
        kecamatan: parts[1] || '',
        kabupaten: parts[2] || '',
        provinsi: parts[3] || '',
        full: v.full,
        matchCount: exact.length,
        msdStatus: (v as any).msd_status || (v as any).msd_Status || '#N/A',
      }
    } else if (exactMatches.length > 0) {
      // No exact match, but found similar names — return alternatives
      results[name] = {
        found: false,
        alternatives: exactMatches.slice(0, 5).map((v) => v.desa),
      }
    } else {
      // No match at all
      results[name] = {
        found: false,
        alternatives: [],
      }
    }
  }

  return NextResponse.json({ results })
}
