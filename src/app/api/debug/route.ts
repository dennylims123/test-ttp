import { NextResponse } from 'next/server'

// Debug endpoint — temporarily added to diagnose Vercel deploy issues.
// Returns which env vars are set (without exposing values) and tests the DB connection.
// DELETE THIS FILE after debugging is done.

export async function GET() {
  const dbUrl = process.env.DATABASE_URL
  const dbToken = process.env.DATABASE_AUTH_TOKEN
  const adminPin = process.env.ADMIN_PIN

  const envStatus = {
    DATABASE_URL_set: !!dbUrl,
    DATABASE_URL_prefix: dbUrl ? dbUrl.slice(0, 30) + '...' : null,
    DATABASE_URL_is_libsql: dbUrl ? dbUrl.startsWith('libsql://') : false,
    DATABASE_AUTH_TOKEN_set: !!dbToken,
    DATABASE_AUTH_TOKEN_length: dbToken ? dbToken.length : 0,
    ADMIN_PIN_set: !!adminPin,
    ADMIN_PIN_length: adminPin ? adminPin.length : 0,
    ADMIN_PIN_is_123456: adminPin === '123456',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_REGION: process.env.VERCEL_REGION,
  }

  // Try to actually connect to the DB
  let dbTest: any = { step: 'not started' }
  try {
    dbTest.step = 'importing prisma client'
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
    dbTest.error = e.message
    dbTest.errorStack = e.stack?.split('\n').slice(0, 5).join('\n')
  }

  return NextResponse.json({
    env: envStatus,
    db: dbTest,
    timestamp: new Date().toISOString(),
  })
}
