// Add SHP file columns to supplier_tbs table in Turso
import { createClient } from '@libsql/client'

async function main() {
  const url = process.env.DATABASE_URL
  const authToken = process.env.DATABASE_AUTH_TOKEN

  if (!url) {
    console.error('Missing DATABASE_URL')
    process.exit(1)
  }

  const client = createClient({ url, authToken })

  // Check if columns already exist
  const tableInfo = await client.execute("PRAGMA table_info(supplier_tbs)")
  const columnNames = tableInfo.rows.map((r: any) => r.name)
  console.log('Current columns:', columnNames)

  if (!columnNames.includes('shp_file_url')) {
    await client.execute('ALTER TABLE supplier_tbs ADD COLUMN shp_file_url TEXT')
    console.log('✓ Added shp_file_url column')
  } else {
    console.log('  shp_file_url already exists')
  }

  if (!columnNames.includes('shp_file_name')) {
    await client.execute('ALTER TABLE supplier_tbs ADD COLUMN shp_file_name TEXT')
    console.log('✓ Added shp_file_name column')
  } else {
    console.log('  shp_file_name already exists')
  }

  // Verify
  const updated = await client.execute("PRAGMA table_info(supplier_tbs)")
  console.log('\nFinal columns:', updated.rows.map((r: any) => r.name))

  client.close()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
