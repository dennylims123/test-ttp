import { NextResponse } from 'next/server'
import { searchVillages, listReports } from '@/lib/db'

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

  let dbTest: any = { step: 'not started' }
  try {
    dbTest.step = 'searching villages'
    const villages = await searchVillages('Ambo', 3)
    dbTest.step = 'village search succeeded'
    dbTest.sampleVillages = villages.length
    dbTest.firstVillage = villages[0]?.desa

    dbTest.step = 'listing reports'
    const reports = await listReports()
    dbTest.reportCount = reports.length

    dbTest.step = 'done'
    dbTest.success = true
  } catch (e: any) {
    dbTest.success = false
    dbTest.errorName = e?.name
    dbTest.errorMessage = e?.message
    dbTest.errorStack = e?.stack?.split('\n').slice(0, 5).join('\n')
  }

  return NextResponse.json({
    env: envStatus,
    db: dbTest,
    timestamp: new Date().toISOString(),
  })
}
