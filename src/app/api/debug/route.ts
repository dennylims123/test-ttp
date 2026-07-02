import { NextResponse } from 'next/server'

// Debug endpoint — temporarily added to diagnose Vercel deploy issues.
// DELETE THIS FILE after debugging is done.

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  const dbToken = process.env.DATABASE_AUTH_TOKEN
  const adminPin = process.env.ADMIN_PIN

  const envStatus = {
    DATABASE_URL_set: !!dbUrl,
    DATABASE_URL_prefix: dbUrl ? dbUrl.slice(0, 40) : null,
    DATABASE_URL_is_libsql: dbUrl ? dbUrl.startsWith('libsql://') : false,
    DATABASE_URL_full_length: dbUrl?.length,
    DATABASE_AUTH_TOKEN_set: !!dbToken,
    DATABASE_AUTH_TOKEN_length: dbToken ? dbToken.length : 0,
    DATABASE_AUTH_TOKEN_first10: dbToken ? dbToken.slice(0, 10) : null,
    DATABASE_AUTH_TOKEN_last10: dbToken ? dbToken.slice(-10) : null,
    ADMIN_PIN_set: !!adminPin,
    ADMIN_PIN_length: adminPin ? adminPin.length : 0,
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_REGION: process.env.VERCEL_REGION,
  }

  // Try to actually connect to the DB with detailed error capture
  let dbTest: any = { step: 'not started' }
  try {
    dbTest.step = 'importing db module'
    const { db } = await import('@/lib/db')

    dbTest.step = 'calling db.village.count()'
    const villageCount = await (db as any).village.count()
    dbTest.step = 'count succeeded'
    dbTest.villageCount = villageCount

    dbTest.step = 'calling db.ttpReport.count()'
    const reportCount = await (db as any).ttpReport.count()
    dbTest.reportCount = reportCount

    dbTest.step = 'done'
    dbTest.success = true
  } catch (e: any) {
    dbTest.success = false
    dbTest.errorName = e?.name
    dbTest.errorCode = e?.code
    dbTest.errorMessage = e?.message
    dbTest.errorCause = e?.cause ? String(e.cause) : null
    dbTest.errorStack = e?.stack?.split('\n').slice(0, 8).join('\n')
    // For Prisma errors, also capture the full error object structure
    if (e?.clientVersion) dbTest.clientVersion = e.clientVersion
  }

  return NextResponse.json({
    env: envStatus,
    db: dbTest,
    timestamp: new Date().toISOString(),
  })
}
