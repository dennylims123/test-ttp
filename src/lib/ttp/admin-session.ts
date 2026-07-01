import { cookies } from 'next/headers'

export const ADMIN_PIN_COOKIE = 'ttp_admin_pin'

// Admin PIN — read from env or fallback to a default for dev.
// In production, set ADMIN_PIN in .env
const DEFAULT_ADMIN_PIN = '123456'

export function getAdminPin(): string {
  return process.env.ADMIN_PIN || DEFAULT_ADMIN_PIN
}

export interface AdminSession {
  isAdmin: boolean
}

export async function getAdminSession(): Promise<AdminSession> {
  const cookieStore = await cookies()
  const adminPin = cookieStore.get(ADMIN_PIN_COOKIE)?.value
  return { isAdmin: !!adminPin && adminPin === getAdminPin() }
}
