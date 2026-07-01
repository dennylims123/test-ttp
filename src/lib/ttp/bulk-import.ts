// Bulk import parsing utilities for farmer data
// Supports: paste from Excel (tab-separated), CSV (comma), European CSV (semicolon)

import type { FarmerRow } from './types'

export interface ParsedFarmer {
  nama: string
  lintang: string
  bujur: string
  legalitas: string
  desa: string
  kecamatan: string
  kabupaten: string
  luasKebun: number | null
  _warnings: string[]
}

export interface ParseResult {
  farmers: ParsedFarmer[]
  skippedRows: number
  delimiter: string
  hadHeader: boolean
}

// Expected column order (8 columns):
// Nama, Lintang, Bujur, Legalitas, Desa, Kecamatan, Kabupaten, Luas (Ha)
const EXPECTED_COLUMNS = [
  'nama',
  'lintang',
  'bujur',
  'legalitas',
  'desa',
  'kecamatan',
  'kabupaten',
  'luas',
] as const

const HEADER_KEYWORDS = [
  'nama',
  'petani',
  'lintang',
  'latitude',
  'bujur',
  'longitude',
  'legalitas',
  'desa',
  'kecamatan',
  'kabupaten',
  'luas',
  'ha',
]

/**
 * Detect the most likely delimiter in the text.
 * Counts occurrences of tab, semicolon, and comma in the first few lines.
 */
function detectDelimiter(text: string): string {
  const lines = text.trim().split(/\r?\n/).slice(0, 5).filter(Boolean)
  if (lines.length === 0) return '\t'

  const counts = { '\t': 0, ';': 0, ',': 0 }
  for (const line of lines) {
    counts['\t'] += (line.match(/\t/g) || []).length
    counts[';'] += (line.match(/;/g) || []).length
    counts[','] += (line.match(/,/g) || []).length
  }

  // Prefer tab (Excel paste), then semicolon (European), then comma
  if (counts['\t'] >= counts[';'] && counts['\t'] >= counts[',']) return '\t'
  if (counts[';'] > counts[',']) return ';'
  return ','
}

/**
 * Check if a row looks like a header (contains keywords like "nama", "petani", etc.)
 */
function isHeaderRow(cells: string[]): boolean {
  const lower = cells.map((c) => c.toLowerCase().trim())
  return lower.some((c) => HEADER_KEYWORDS.some((kw) => c.includes(kw)))
}

/**
 * Parse a single cell value as a number (for lintang, bujur, luas).
 * Handles comma as decimal separator (European format: "3,5" → 3.5).
 */
function parseNumber(val: string): number | null {
  if (!val || !val.trim()) return null
  const cleaned = val.trim().replace(/\s/g, '').replace(',', '.')
  // Remove any non-numeric chars except . and -
  const matched = cleaned.match(/-?\d+\.?\d*/)
  if (!matched) return null
  const n = parseFloat(matched[0])
  return isNaN(n) ? null : n
}

/**
 * Parse pasted text (from Excel/clipboard) into farmer rows.
 */
export function parseBulkPaste(text: string): ParseResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { farmers: [], skippedRows: 0, delimiter: '\t', hadHeader: false }
  }

  const delimiter = detectDelimiter(trimmed)
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim())

  let hadHeader = false
  let skippedRows = 0
  const farmers: ParsedFarmer[] = []

  // Check if first row is a header
  const firstCells = splitLine(lines[0], delimiter)
  if (isHeaderRow(firstCells)) {
    hadHeader = true
    lines.shift()
  }

  for (const line of lines) {
    const cells = splitLine(line, delimiter)

    // Skip empty rows
    if (cells.every((c) => !c.trim())) {
      skippedRows++
      continue
    }

    // Need at least 1 column (nama)
    if (cells.length < 1) {
      skippedRows++
      continue
    }

    // Pad to 8 columns
    const padded = [...cells, '', '', '', '', '', '', '', ''].slice(0, 8)

    const warnings: string[] = []
    const nama = padded[0].trim()
    if (!nama) {
      skippedRows++
      continue
    }

    const lintang = padded[1].trim()
    const bujur = padded[2].trim()
    const legalitas = padded[3].trim()
    const desa = padded[4].trim()
    const kecamatan = padded[5].trim()
    const kabupaten = padded[6].trim()
    const luasKebun = parseNumber(padded[7])

    if (lintang && parseNumber(lintang) === null) {
      warnings.push('Lintang bukan angka')
    }
    if (bujur && parseNumber(bujur) === null) {
      warnings.push('Bujur bukan angka')
    }
    if (padded[7].trim() && luasKebun === null) {
      warnings.push('Luas bukan angka')
    }

    farmers.push({
      nama,
      lintang,
      bujur,
      legalitas,
      desa,
      kecamatan,
      kabupaten,
      luasKebun,
      _warnings: warnings,
    })
  }

  return { farmers, skippedRows, delimiter, hadHeader }
}

/**
 * Split a line by delimiter, handling quoted values (for CSV).
 */
function splitLine(line: string, delimiter: string): string[] {
  // Simple case: no quotes
  if (!line.includes('"')) {
    return line.split(delimiter)
  }

  // Handle quoted CSV values
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

/**
 * Parse a CSV file (File object) into farmer rows.
 */
export async function parseCsvFile(file: File): Promise<ParseResult> {
  const text = await file.text()
  return parseBulkPaste(text)
}

/**
 * Convert parsed farmers to FarmerRow[] for the store.
 */
export function toFarmerRows(parsed: ParsedFarmer[]): FarmerRow[] {
  return parsed.map((p, i) => ({
    no: i + 1,
    nama: p.nama,
    lintang: p.lintang,
    bujur: p.bujur,
    legalitas: p.legalitas,
    desa: p.desa,
    kecamatan: p.kecamatan,
    kabupaten: p.kabupaten,
    luasKebun: p.luasKebun,
  }))
}

/**
 * Generate a CSV template string that suppliers can download and fill.
 */
export function generateTemplateCsv(): string {
  const header = 'Nama Petani,Lintang,Bujur,Legalitas,Desa,Kecamatan,Kabupaten,Luas (Ha)'
  const examples = [
    'Pak Budi,-0.344560,109.937360,HGU,Amboyo Inti,Ngabang,Landak,3.5',
    'Pak Sari,-0.345058,109.924778,SKT,Amboyo Selatan,Ngabang,Landak,2.0',
    'Pak Joko,-0.376711,109.938492,SHM,Batu Godang,Ngabang,Landak,5.0',
  ]
  return [header, ...examples].join('\n')
}

/**
 * Download a string as a file (in the browser).
 */
export function downloadString(filename: string, content: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
