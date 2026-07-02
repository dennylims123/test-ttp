import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Make sure to add it in your Vercel project settings (or .env locally).'
    )
  }

  // For Turso (production): DATABASE_URL is libsql://... and DATABASE_AUTH_TOKEN is set
  // For local SQLite (development): DATABASE_URL is file:... and no auth token needed
  if (url.startsWith('libsql://') || url.startsWith('https://')) {
    const libsql = createClient({ url, authToken })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }

  // Local SQLite (development only) — uses Prisma's built-in driver
  return new PrismaClient({
    log: ['error', 'warn'],
  })
}

/**
 * Lazy Prisma client proxy.
 *
 * The actual PrismaClient is only instantiated on first property access,
 * which avoids build-time crashes when DATABASE_URL isn't available yet
 * (Vercel injects env vars at runtime, not at build time).
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    return (globalForPrisma.prisma as any)[prop]
  },
})
