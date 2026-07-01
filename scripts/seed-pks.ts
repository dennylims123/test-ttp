// Seed PKS accounts and confirm admin PIN
import { db } from '../src/lib/db'

const SAMPLE_PKS = [
  { name: 'PKS Bunga Raya', pin: '111111' },
  { name: 'PKS Acek', pin: '222222' },
  { name: 'PKS Ngabang', pin: '333333' },
]

async function main() {
  console.log('Seeding PKS accounts...')
  for (const pks of SAMPLE_PKS) {
    const existing = await db.pksAccount.findFirst({ where: { name: pks.name } })
    if (existing) {
      // Update PIN if different
      if (existing.pin !== pks.pin) {
        await db.pksAccount.update({ where: { id: existing.id }, data: { pin: pks.pin } })
        console.log(`  Updated PIN for ${pks.name}`)
      } else {
        console.log(`  ${pks.name} already exists`)
      }
    } else {
      await db.pksAccount.create({ data: pks })
      console.log(`  Created ${pks.name} (PIN: ${pks.pin})`)
    }
  }

  const count = await db.pksAccount.count()
  console.log(`\nTotal PKS accounts: ${count}`)
  console.log(`\nAdmin PIN: ${process.env.ADMIN_PIN || '123456'} (default)`)
  console.log('\nSample PKS logins:')
  SAMPLE_PKS.forEach((p) => console.log(`  ${p.name} → PIN: ${p.pin}`))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
