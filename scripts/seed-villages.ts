// Seed villages from /public/data/villages.json into the database
import { db } from '../src/lib/db'
import villages from '../public/data/villages.json'

async function main() {
  console.log(`Seeding ${villages.length} villages...`)

  // Clear existing
  await db.village.deleteMany({})

  // Insert in batches of 1000
  const batchSize = 1000
  for (let i = 0; i < villages.length; i += batchSize) {
    const batch = villages.slice(i, i + batchSize).map((v: any) => ({
      id: v.id,
      desa: v.desa,
      full: v.full,
    }))
    await db.village.createMany({ data: batch })
    console.log(`  Inserted ${Math.min(i + batchSize, villages.length)}/${villages.length}`)
  }

  const count = await db.village.count()
  console.log(`Done. Total villages in DB: ${count}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
