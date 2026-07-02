import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  // For Turso (production): DATABASE_URL is libsql://... and DATABASE_AUTH_TOKEN is set
  // For local SQLite (development): DATABASE_URL is file:... and no auth token needed
  const url = process.env.DATABASE_URL!
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (url.startsWith('libsql://') || url.startsWith('https://')) {
    // Turso / remote LibSQL
    const libsql = createClient({ url, authToken })
    const adapter = new PrismaLibSql(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite (development only)
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
