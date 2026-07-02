// Seed villages to Turso using batch inserts (much faster)
import { createClient } from '@libsql/client'

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url || !authToken) {
    console.error('Missing DATABASE_URL or DATABASE_AUTH_TOKEN')
    process.exit(1)
  }

  console.log(`Connecting to: ${url}`)
  const client = createClient({ url, authToken })

  const villagesModule = await import('../public/data/villages.json')
  const villages = villagesModule.default as Array<{ id: number; desa: string; full: string }>
  console.log(`Seeding ${villages.length} villages...`)

  // Clear existing
  await client.execute('DELETE FROM villages')
  console.log('Cleared existing villages')

  // Use batch API (much faster than individual inserts)
  const batchSize = 100
  let inserted = 0
  for (let i = 0; i < villages.length; i += batchSize) {
    const batch = villages.slice(i, i + batchSize)
    const stmts = batch.map((v) => ({
      sql: 'INSERT INTO villages (id, desa, full) VALUES (?, ?, ?)',
      args: [v.id, v.desa, v.full],
    }))
    await client.batch(stmts, 'write')
    inserted += batch.length
    if (inserted % 2000 === 0 || inserted === villages.length) {
      console.log(`  Inserted ${inserted}/${villages.length}`)
    }
  }

  // Verify
  const count = await client.execute('SELECT COUNT(*) as cnt FROM villages')
  console.log(`Done. Total villages in Turso: ${(count.rows[0] as any).cnt}`)

  const search = await client.execute({
    sql: 'SELECT * FROM villages WHERE desa LIKE ? LIMIT 5',
    args: ['%Ambo%'],
  })
  console.log('Sample search "Ambo":')
  for (const row of search.rows) {
    console.log(`  - ${(row as any).desa} (${(row as any).full})`)
  }

  client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
