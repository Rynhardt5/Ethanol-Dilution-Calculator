const { Pool } = require('pg')

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
})

class USDABotanicalDataMigration {
  static async searchUSDAPlants(latinName) {
    try {
      console.log(`Searching USDA for: ${latinName}`)

      // Clean up latin name for search
      const searchTerm = latinName
        .split(' ')
        .slice(0, 2)
        .join(' ')
        .toLowerCase()

      // Dynamic import for node-fetch (ES module)
      const fetch = (await import('node-fetch')).default

      const response = await fetch(
        `https://plantsdb.xyz/search?q=${encodeURIComponent(
          searchTerm
        )}&limit=5`,
        {
          headers: {
            'User-Agent': 'Herbal-Database-Bot/1.0',
          },
        }
      )

      if (!response.ok) {
        console.log(`USDA API error for ${latinName}: ${response.status}`)
        return null
      }

      const data = await response.json()

      if (data.data && data.data.length > 0) {
        // Find exact match or closest match
        const exactMatch = data.data.find(
          (plant) => plant.scientific_name?.toLowerCase() === searchTerm
        )

        const plant = exactMatch || data.data[0]

        return {
          family: plant.family,
          duration: plant.duration,
          growth_habit: plant.growth_habit,
        }
      }

      return null
    } catch (error) {
      console.error(`Error fetching USDA data for ${latinName}:`, error.message)
      return null
    }
  }

  static async updateHerbBotanicalInfo(herbId, botanicalData) {
    const query = `
      UPDATE herbs 
      SET 
        family = COALESCE($2, family),
        botanical_info = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `

    await pool.query(query, [
      herbId,
      botanicalData.family,
      JSON.stringify(botanicalData),
    ])
  }

  static async getAllHerbs() {
    const query = `
      SELECT id, common_name, latin_name, family
      FROM herbs 
      WHERE latin_name IS NOT NULL 
      AND latin_name != ''
      ORDER BY common_name
    `

    const result = await pool.query(query)
    return result.rows
  }

  static async migrateAllBotanicalData() {
    console.log('🌿 Starting USDA Plants API migration...')

    try {
      const herbs = await this.getAllHerbs()
      console.log(`Found ${herbs.length} herbs to process`)

      let processed = 0
      let updated = 0
      let errors = 0

      for (const herb of herbs) {
        try {
          // Skip if family already exists (already processed)
          if (herb.family && herb.family.trim() !== '') {
            console.log(
              `⏭️  Skipping ${herb.common_name} - already has family data`
            )
            processed++
            continue
          }

          console.log(`🔍 Processing: ${herb.common_name} (${herb.latin_name})`)

          const botanicalData = await this.searchUSDAPlants(herb.latin_name)

          if (botanicalData && botanicalData.family) {
            await this.updateHerbBotanicalInfo(herb.id, botanicalData)
            console.log(
              `✅ Updated ${herb.common_name} - Family: ${botanicalData.family}`
            )
            updated++
          } else {
            console.log(`❌ No data found for ${herb.common_name}`)
          }

          processed++

          // Rate limiting - wait 1 second between requests
          await new Promise((resolve) => setTimeout(resolve, 1000))

          // Progress update every 10 herbs
          if (processed % 10 === 0) {
            console.log(
              `📊 Progress: ${processed}/${herbs.length} processed, ${updated} updated, ${errors} errors`
            )
          }
        } catch (error) {
          console.error(
            `❌ Error processing ${herb.common_name}:`,
            error.message
          )
          errors++
        }
      }

      console.log('\n🎉 Migration completed!')
      console.log(`📊 Final stats:`)
      console.log(`   - Total herbs: ${herbs.length}`)
      console.log(`   - Processed: ${processed}`)
      console.log(`   - Updated: ${updated}`)
      console.log(`   - Errors: ${errors}`)
    } catch (error) {
      console.error('💥 Migration failed:', error)
    } finally {
      await pool.end()
    }
  }
}

// Run migration if called directly
if (require.main === module) {
  USDABotanicalDataMigration.migrateAllBotanicalData()
    .then(() => {
      console.log('✅ Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error)
      process.exit(1)
    })
}

module.exports = USDABotanicalDataMigration
