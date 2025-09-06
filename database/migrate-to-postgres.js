#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { Pool } from 'pg'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class HerbsDatabaseMigrator {
  constructor(connectionString) {
    this.pool = new Pool({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    })
  }

  async migrate() {
    console.log('🌿 Starting herbs database migration to PostgreSQL...')

    try {
      // Load JSON data
      const jsonPath = path.join(__dirname, '..', 'herbs-data-pfaf-merged.json')
      const herbsData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

      console.log(`📊 Found ${herbsData.length} herbs to migrate`)

      // Create schema
      // await this.createSchema()

      // Migrate data
      await this.migrateHerbs(herbsData)

      console.log('✅ Migration completed successfully!')
    } catch (error) {
      console.error('❌ Migration failed:', error)
      throw error
    } finally {
      await this.pool.end()
    }
  }

  async createSchema() {
    console.log('📋 Creating database schema...')
    const schemaSQL = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf8'
    )
    await this.pool.query(schemaSQL)
    console.log('✅ Schema created')
  }

  async migrateHerbs(herbsData) {
    const client = await this.pool.connect()

    try {
      await client.query('BEGIN')

      // Create lookup tables for normalized data
      const plantParts = new Map()
      const medicinalActions = new Map()
      const indications = new Map()
      const preparations = new Map()
      const interactions = new Map()
      const sources = new Map()
      const tags = new Map()

      // First pass: collect all unique values
      console.log('🔍 Analyzing data for normalization...')
      for (const herb of herbsData) {
        this.collectUniqueValues(herb, {
          plantParts,
          medicinalActions,
          indications,
          preparations,
          interactions,
          sources,
          tags,
        })
      }

      // Insert lookup table data
      await this.insertLookupData(client, {
        plantParts,
        medicinalActions,
        indications,
        preparations,
        interactions,
        sources,
        tags,
      })

      // Second pass: insert herbs and relationships in batches
      console.log('🌱 Inserting herbs data...')
      const batchSize = 50
      for (let i = 0; i < herbsData.length; i += batchSize) {
        const batch = herbsData.slice(i, i + batchSize)
        console.log(`Progress: ${i}/${herbsData.length} herbs processed`)

        // Process batch
        for (const herb of batch) {
          await this.insertHerb(client, herb, {
            plantParts,
            medicinalActions,
            indications,
            preparations,
            interactions,
            sources,
            tags,
          })
        }

        // Commit every batch to avoid long transactions
        await client.query('COMMIT')
        await client.query('BEGIN')
      }

      await client.query('COMMIT')
      console.log('✅ All data migrated successfully')
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  collectUniqueValues(herb, collections) {
    // Plant parts
    if (herb.plant_parts_used) {
      herb.plant_parts_used.forEach((part) =>
        collections.plantParts.set(part, null)
      )
    }

    // Medicinal actions
    if (herb.medicinal_actions) {
      herb.medicinal_actions.forEach((action) =>
        collections.medicinalActions.set(action, null)
      )
    }

    // Indications
    if (herb.indications) {
      herb.indications.forEach((indication) =>
        collections.indications.set(indication, null)
      )
    }

    // Preparations
    if (herb.best_preparations) {
      herb.best_preparations.forEach((prep) =>
        collections.preparations.set(prep, null)
      )
    }

    // Interactions
    if (herb.interactions) {
      herb.interactions.forEach((interaction) =>
        collections.interactions.set(interaction, null)
      )
    }

    // Sources
    if (herb.sources) {
      herb.sources.forEach((source) => collections.sources.set(source, null))
    }

    // Tags
    if (herb.tags) {
      herb.tags.forEach((tag) => collections.tags.set(tag, null))
    }
  }

  async insertLookupData(client, collections) {
    console.log('📚 Inserting lookup table data...')

    // Insert and get IDs for each lookup table
    for (const [tableName, collection] of Object.entries(collections)) {
      const dbTableName = this.getTableName(tableName)

      for (const name of collection.keys()) {
        const result = await client.query(
          `INSERT INTO ${dbTableName} (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
          [name]
        )
        collection.set(name, result.rows[0].id)
      }
    }
  }

  getTableName(collectionName) {
    const mapping = {
      plantParts: 'plant_parts',
      medicinalActions: 'medicinal_actions',
      indications: 'indications',
      preparations: 'preparations',
      interactions: 'interactions',
      sources: 'sources',
      tags: 'tags',
    }
    return mapping[collectionName]
  }

  async insertHerb(client, herb, lookups) {
    // Insert main herb record
    await client.query(
      `
      INSERT INTO herbs (id, common_name, latin_name, family, folk_uses, dosage, safety)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
      [
        herb.id,
        herb.common_name,
        herb.latin_name,
        herb.family,
        herb.folk_uses,
        herb.dosage,
        herb.safety,
      ]
    )

    // Insert relationships
    await this.insertRelationships(client, herb, lookups)

    // Insert constituents
    if (herb.constituents) {
      for (const constituent of herb.constituents) {
        // Keep water solubility as text to preserve granular information
        let waterSoluble = null
        if (constituent.solubility?.water !== undefined) {
          const waterValue = constituent.solubility.water
          if (typeof waterValue === 'boolean') {
            waterSoluble = waterValue ? 'true' : 'false'
          } else {
            waterSoluble = String(waterValue)
          }
        }

        await client.query(
          `
          INSERT INTO constituents (herb_id, name, class, water_soluble, ethanol_range, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
          [
            herb.id,
            constituent.name,
            constituent.class,
            waterSoluble,
            constituent.solubility?.ethanol_range,
            constituent.notes,
          ]
        )
      }
    }

    // Insert solvent recommendations
    if (herb.solvent_recommendations) {
      for (const rec of herb.solvent_recommendations) {
        await client.query(
          `
          INSERT INTO solvent_recommendations (herb_id, preparation_type, ethanol_percent, ratio, notes)
          VALUES ($1, $2, $3, $4, $5)
        `,
          [
            herb.id,
            rec.preparation_type,
            rec.ethanol_percent,
            rec.ratio,
            rec.notes,
          ]
        )
      }
    }
  }

  async insertRelationships(client, herb, lookups) {
    const relationships = [
      {
        array: herb.plant_parts_used,
        lookup: lookups.plantParts,
        table: 'herb_plant_parts',
        column: 'part_id',
      },
      {
        array: herb.medicinal_actions,
        lookup: lookups.medicinalActions,
        table: 'herb_medicinal_actions',
        column: 'action_id',
      },
      {
        array: herb.indications,
        lookup: lookups.indications,
        table: 'herb_indications',
        column: 'indication_id',
      },
      {
        array: herb.best_preparations,
        lookup: lookups.preparations,
        table: 'herb_preparations',
        column: 'preparation_id',
      },
      {
        array: herb.interactions,
        lookup: lookups.interactions,
        table: 'herb_interactions',
        column: 'interaction_id',
      },
      {
        array: herb.sources,
        lookup: lookups.sources,
        table: 'herb_sources',
        column: 'source_id',
      },
      {
        array: herb.tags,
        lookup: lookups.tags,
        table: 'herb_tags',
        column: 'tag_id',
      },
    ]

    for (const rel of relationships) {
      if (rel.array) {
        for (const item of rel.array) {
          const id = rel.lookup.get(item)
          if (id) {
            await client.query(
              `INSERT INTO ${rel.table} (herb_id, ${rel.column}) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
              [herb.id, id]
            )
          }
        }
      }
    }
  }
}

// CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    console.error('❌ Please set DATABASE_URL environment variable')
    console.log(
      'Example: DATABASE_URL="postgresql://user:pass@host:5432/dbname" node migrate-to-postgres.js'
    )
    process.exit(1)
  }

  const migrator = new HerbsDatabaseMigrator(connectionString)
  migrator.migrate().catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}

export default HerbsDatabaseMigrator
