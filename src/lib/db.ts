import { createClient, type Client } from '@libsql/client'

const globalForDb = globalThis as unknown as {
  libsqlClient: Client | undefined
}

function createDbClient(): Client {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Make sure to add it in your Vercel project settings (or .env locally).'
    )
  }

  if (url.startsWith('libsql://') || url.startsWith('https://')) {
    return createClient({ url, authToken })
  }

  // Local SQLite (development only)
  return createClient({ url })
}

/**
 * Raw LibSQL database client (Turso / local SQLite).
 *
 * We bypass Prisma entirely because Prisma's Rust engine has issues reading
 * env vars on Vercel serverless, causing URL_INVALID errors. Using @libsql/client
 * directly is simpler, faster (no Rust engine overhead), and works reliably
 * on serverless platforms.
 *
 * The schema is defined in prisma/schema.prisma (for IDE type hints and
 * migrations), but all queries go through this client.
 */
export const db = globalForDb.libsqlClient ?? createDbClient()

if (process.env.NODE_ENV !== 'production') globalForDb.libsqlClient = db

// Re-export the Client type for convenience
export type { Client } from '@libsql/client'
