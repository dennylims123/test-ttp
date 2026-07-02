/**
 * Generate a CUID-like ID (compatible with the old Prisma @id @default(cuid()) format).
 * Format: c + timestamp base36 + random chars.
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 10)
  return `c${timestamp}${random}`.slice(0, 24)
}

/**
 * Convert a snake_case row from the database to camelCase for the API response.
 * Optionally maps specific columns.
 */
export function toCamelCase(row: Record<string, any>, mapping?: Record<string, string>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const key in row) {
    const camelKey = mapping?.[key] ?? key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
    result[camelKey] = row[key]
  }
  return result
}

/**
 * Escape a value for SQL interpolation (use sparingly — prefer prepared statements).
 */
export function escapeSql(value: string): string {
  return value.replace(/'/g, "''")
}
