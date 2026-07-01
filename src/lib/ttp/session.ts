import { cookies } from 'next/headers'
import { db } from '@/lib/db'

export const ADMIN_PIN_COOKIE = 'ttp_admin_pin'
export const PKS_ACCOUNT_ID_COOKIE = 'ttp_pks_id'

// Admin PIN — read from env or fallback to a default for dev.
// In production, set ADMIN_PIN in .env
const DEFAULT_ADMIN_PIN = '123456'

export function getAdminPin(): string {
  return process.env.ADMIN_PIN || DEFAULT_ADMIN_PIN
}

export interface SessionInfo {
  role: 'admin' | 'pks' | 'guest'
  pksAccountId?: string
  pksName?: string
}

export async function getSession(): Promise<SessionInfo> {
  const cookieStore = await cookies()
  const adminPin = cookieStore.get(ADMIN_PIN_COOKIE)?.value
  const pksAccountId = cookieStore.get(PKS_ACCOUNT_ID_COOKIE)?.value

  if (adminPin && adminPin === getAdminPin()) {
    return { role: 'admin' }
  }

  if (pksAccountId) {
    const acc = await db.pksAccount.findUnique({ where: { id: pksAccountId } })
    if (acc) {
      return { role: 'pks', pksAccountId: acc.id, pksName: acc.name }
    }
  }

  return { role: 'guest' }
}

/**
 * Resolve which report IDs the current session can access.
 * - admin: all reports
 * - pks: only their own reports (matching pksAccountId)
 * - guest: none
 */
export function getReportFilter(session: SessionInfo): { pksAccountId?: string } {
  if (session.role === 'admin') return {} // all
  if (session.role === 'pks' && session.pksAccountId) {
    return { pksAccountId: session.pksAccountId }
  }
  return { pksAccountId: '__none__' } // guest sees nothing
}
