const { Pool } = require('pg');

async function checkRosemary() {
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
    // Check for Rosmarinus officinalis (old name)
    console.log('Searching for Rosmarinus officinalis...');
    const rosmarinusResult = await pool.query(`
      SELECT id, common_name, latin_name, is_priority 
      FROM herbs 
      WHERE latin_name ILIKE '%Rosmarinus officinalis%'
    `);
    
    console.log('Rosmarinus officinalis results:', rosmarinusResult.rows);

    // Check for Salvia rosmarinus (new name)
    console.log('\nSearching for Salvia rosmarinus...');
    const salviaResult = await pool.query(`
      SELECT id, common_name, latin_name, is_priority 
      FROM herbs 
      WHERE latin_name ILIKE '%Salvia rosmarinus%'
    `);
    
    console.log('Salvia rosmarinus results:', salviaResult.rows);

    // Check for rosemary by common name
    console.log('\nSearching for rosemary by common name...');
    const rosemaryResult = await pool.query(`
      SELECT id, common_name, latin_name, is_priority 
      FROM herbs 
      WHERE common_name ILIKE '%rosemary%'
    `);
    
    console.log('Rosemary results:', rosemaryResult.rows);

  } catch (error) {
    console.error('Error checking rosemary:', error);
  } finally {
    await pool.end();
  }
}

checkRosemary().catch(console.error);
