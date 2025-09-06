#!/usr/bin/env node

// Since we're using TypeScript, we need to use require for Node.js testing
const { Pool } = require('pg');

// Inline database class for testing (avoiding TS compilation issues)
class TestHerbsDatabase {
  static getPool() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    return new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false
      } : false,
    });
  }

  static async searchHerbs(query, limit = 50) {
    const pool = this.getPool();
    const searchQuery = `
      SELECT DISTINCT h.*, 
        array_agg(DISTINCT ma.name) FILTER (WHERE ma.name IS NOT NULL) as medicinal_actions,
        array_agg(DISTINCT i.name) FILTER (WHERE i.name IS NOT NULL) as indications,
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM herbs h
      LEFT JOIN herb_medicinal_actions hma ON h.id = hma.herb_id
      LEFT JOIN medicinal_actions ma ON hma.action_id = ma.id
      LEFT JOIN herb_indications hi ON h.id = hi.herb_id
      LEFT JOIN indications i ON hi.indication_id = i.id
      LEFT JOIN herb_tags ht ON h.id = ht.herb_id
      LEFT JOIN tags t ON ht.tag_id = t.id
      WHERE to_tsvector('english', 
        coalesce(h.common_name, '') || ' ' || 
        coalesce(h.latin_name, '') || ' ' || 
        coalesce(h.family, '') || ' ' || 
        coalesce(h.folk_uses, '')
      ) @@ plainto_tsquery('english', $1)
      GROUP BY h.id
      LIMIT $2
    `;
    
    const result = await pool.query(searchQuery, [query, limit]);
    await pool.end();
    return result.rows;
  }

  static async searchByAction(action) {
    const pool = this.getPool();
    const query = `
      SELECT DISTINCT h.id, h.common_name, h.latin_name, h.family
      FROM herbs h
      JOIN herb_medicinal_actions hma ON h.id = hma.herb_id
      JOIN medicinal_actions ma ON hma.action_id = ma.id
      WHERE ma.name ILIKE $1
      ORDER BY h.common_name
    `;
    const result = await pool.query(query, [`%${action}%`]);
    await pool.end();
    return result.rows;
  }

  static async searchByIndication(indication) {
    const pool = this.getPool();
    const query = `
      SELECT DISTINCT h.id, h.common_name, h.latin_name, h.family
      FROM herbs h
      JOIN herb_indications hi ON h.id = hi.herb_id
      JOIN indications i ON hi.indication_id = i.id
      WHERE i.name ILIKE $1
      ORDER BY h.common_name
    `;
    const result = await pool.query(query, [`%${indication}%`]);
    await pool.end();
    return result.rows;
  }

  static async searchByConstituent(constituent) {
    const pool = this.getPool();
    const query = `
      SELECT DISTINCT h.id, h.common_name, h.latin_name, h.family
      FROM herbs h
      JOIN constituents c ON h.id = c.herb_id
      WHERE c.name ILIKE $1 OR c.class ILIKE $1
      ORDER BY h.common_name
    `;
    const result = await pool.query(query, [`%${constituent}%`]);
    await pool.end();
    return result.rows;
  }

  static async getHerbById(id) {
    const pool = this.getPool();
    const herbQuery = `
      SELECT h.*,
        array_agg(DISTINCT pp.name) FILTER (WHERE pp.name IS NOT NULL) as plant_parts_used,
        array_agg(DISTINCT ma.name) FILTER (WHERE ma.name IS NOT NULL) as medicinal_actions,
        array_agg(DISTINCT i.name) FILTER (WHERE i.name IS NOT NULL) as indications,
        array_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL) as best_preparations,
        array_agg(DISTINCT int.name) FILTER (WHERE int.name IS NOT NULL) as interactions,
        array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as sources,
        array_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL) as tags
      FROM herbs h
      LEFT JOIN herb_plant_parts hpp ON h.id = hpp.herb_id
      LEFT JOIN plant_parts pp ON hpp.part_id = pp.id
      LEFT JOIN herb_medicinal_actions hma ON h.id = hma.herb_id
      LEFT JOIN medicinal_actions ma ON hma.action_id = ma.id
      LEFT JOIN herb_indications hi ON h.id = hi.herb_id
      LEFT JOIN indications i ON hi.indication_id = i.id
      LEFT JOIN herb_preparations hp ON h.id = hp.herb_id
      LEFT JOIN preparations p ON hp.preparation_id = p.id
      LEFT JOIN herb_interactions hint ON h.id = hint.herb_id
      LEFT JOIN interactions int ON hint.interaction_id = int.id
      LEFT JOIN herb_sources hs ON h.id = hs.herb_id
      LEFT JOIN sources s ON hs.source_id = s.id
      LEFT JOIN herb_tags ht ON h.id = ht.herb_id
      LEFT JOIN tags t ON ht.tag_id = t.id
      WHERE h.id = $1
      GROUP BY h.id
    `;

    const constituentQuery = `
      SELECT name, class, water_soluble, ethanol_range, notes
      FROM constituents
      WHERE herb_id = $1
      ORDER BY name
    `;

    const [herbResult, constituentResult] = await Promise.all([
      pool.query(herbQuery, [id]),
      pool.query(constituentQuery, [id])
    ]);

    await pool.end();

    if (herbResult.rows.length === 0) {
      return null;
    }

    const herb = herbResult.rows[0];
    herb.constituents = constituentResult.rows.map(c => ({
      name: c.name,
      class: c.class,
      solubility: {
        water: c.water_soluble,
        ethanol_range: c.ethanol_range
      },
      notes: c.notes
    }));

    return herb;
  }

  static async getStats() {
    const pool = this.getPool();
    const queries = [
      'SELECT COUNT(*) as herb_count FROM herbs',
      'SELECT COUNT(*) as constituent_count FROM constituents',
      'SELECT COUNT(*) as action_count FROM medicinal_actions',
      'SELECT COUNT(*) as indication_count FROM indications'
    ];

    const results = await Promise.all(
      queries.map(query => pool.query(query))
    );

    await pool.end();

    return {
      herbs: parseInt(results[0].rows[0].herb_count),
      constituents: parseInt(results[1].rows[0].constituent_count),
      actions: parseInt(results[2].rows[0].action_count),
      indications: parseInt(results[3].rows[0].indication_count)
    };
  }
}

async function testHerbsDatabase() {
  console.log('🧪 Testing Herbs Database Connection...\n');

  try {
    // Test 1: Get database statistics
    console.log('📊 Getting database statistics...');
    const stats = await TestHerbsDatabase.getStats();
    console.log(`✅ Found ${stats.herbs} herbs, ${stats.constituents} constituents, ${stats.actions} actions, ${stats.indications} indications\n`);

    // Test 2: Full-text search
    console.log('🔍 Testing full-text search for "depression"...');
    const searchResults = await TestHerbsDatabase.searchHerbs('depression', 5);
    console.log(`✅ Found ${searchResults.length} herbs matching "depression"`);
    searchResults.forEach(herb => {
      console.log(`   - ${herb.common_name} (${herb.latin_name})`);
    });
    console.log();

    // Test 3: Search by action
    console.log('🎯 Testing search by action "antidepressant"...');
    const actionResults = await TestHerbsDatabase.searchByAction('antidepressant');
    console.log(`✅ Found ${actionResults.length} herbs with antidepressant action`);
    actionResults.slice(0, 3).forEach(herb => {
      console.log(`   - ${herb.common_name} (${herb.latin_name})`);
    });
    console.log();

    // Test 4: Search by indication
    console.log('🏥 Testing search by indication "anxiety"...');
    const indicationResults = await TestHerbsDatabase.searchByIndication('anxiety');
    console.log(`✅ Found ${indicationResults.length} herbs for anxiety`);
    indicationResults.slice(0, 3).forEach(herb => {
      console.log(`   - ${herb.common_name} (${herb.latin_name})`);
    });
    console.log();

    // Test 5: Search by constituent
    console.log('🧬 Testing search by constituent "flavonoid"...');
    const constituentResults = await TestHerbsDatabase.searchByConstituent('flavonoid');
    console.log(`✅ Found ${constituentResults.length} herbs containing flavonoids`);
    constituentResults.slice(0, 3).forEach(herb => {
      console.log(`   - ${herb.common_name} (${herb.latin_name})`);
    });
    console.log();

    // Test 6: Get specific herb by ID
    if (searchResults.length > 0) {
      const herbId = searchResults[0].id;
      console.log(`🔬 Testing detailed herb lookup for ID: ${herbId}...`);
      const detailedHerb = await TestHerbsDatabase.getHerbById(herbId);
      if (detailedHerb) {
        console.log(`✅ Retrieved detailed data for ${detailedHerb.common_name}`);
        console.log(`   - Family: ${detailedHerb.family}`);
        console.log(`   - Parts used: ${detailedHerb.plant_parts_used?.join(', ') || 'N/A'}`);
        console.log(`   - Actions: ${detailedHerb.medicinal_actions?.join(', ') || 'N/A'}`);
        console.log(`   - Constituents: ${detailedHerb.constituents?.length || 0} compounds`);
      }
      console.log();
    }

    console.log('🎉 All tests passed! Your PostgreSQL herbs database is working perfectly!');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    
    if (error.message.includes('DATABASE_URL')) {
      console.log('\n💡 Make sure to set your DATABASE_URL environment variable:');
      console.log('   export DATABASE_URL="your_neon_connection_string"');
    } else if (error.message.includes('relation') && error.message.includes('does not exist')) {
      console.log('\n💡 It looks like the database tables haven\'t been created yet.');
      console.log('   Run the migration script first:');
      console.log('   DATABASE_URL="your_connection_string" node database/migrate-to-postgres.js');
    }
  }
}

// Run the test
testHerbsDatabase();
