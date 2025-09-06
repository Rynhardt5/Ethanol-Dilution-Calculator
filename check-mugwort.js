const { Pool } = require('pg');

async function checkMugwort() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: false
    } : false
  });

  try {
    // Check for Artemisia vulgaris specifically
    console.log('Searching for Artemisia vulgaris...');
    const artemisiaResult = await pool.query(`
      SELECT id, common_name, latin_name, is_priority 
      FROM herbs 
      WHERE latin_name ILIKE '%Artemisia vulgaris%'
    `);
    
    console.log('Artemisia vulgaris results:', artemisiaResult.rows);

    // Check for mugwort by common name
    console.log('\nSearching for mugwort by common name...');
    const mugwortResult = await pool.query(`
      SELECT id, common_name, latin_name, is_priority 
      FROM herbs 
      WHERE common_name ILIKE '%mugwort%'
    `);
    
    console.log('Mugwort results:', mugwortResult.rows);

    // Check all Artemisia species
    console.log('\nAll Artemisia species in database:');
    const artemisiaAll = await pool.query(`
      SELECT id, common_name, latin_name, is_priority 
      FROM herbs 
      WHERE latin_name ILIKE 'Artemisia%'
      ORDER BY latin_name
    `);
    
    console.log(`Found ${artemisiaAll.rows.length} Artemisia species:`);
    artemisiaAll.rows.forEach(row => {
      console.log(`- ${row.latin_name} (${row.common_name}) - Priority: ${row.is_priority}`);
    });

    // Check total priority herbs count
    console.log('\nPriority herbs summary:');
    const priorityStats = await pool.query(`
      SELECT 
        COUNT(*) as total_herbs,
        COUNT(*) FILTER (WHERE is_priority = TRUE) as priority_herbs
      FROM herbs
    `);
    
    console.log(`Total herbs: ${priorityStats.rows[0].total_herbs}`);
    console.log(`Priority herbs: ${priorityStats.rows[0].priority_herbs}`);

  } catch (error) {
    console.error('Error checking mugwort:', error);
  } finally {
    await pool.end();
  }
}

checkMugwort().catch(console.error);
