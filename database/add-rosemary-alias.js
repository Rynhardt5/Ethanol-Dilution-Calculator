const { Pool } = require('pg');

async function addRosemaryAlias() {
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
    // First, check if Rosmarinus officinalis exists
    const existingRosemary = await pool.query(`
      SELECT id, common_name, latin_name, family, folk_uses, dosage, safety, is_priority
      FROM herbs 
      WHERE latin_name ILIKE 'Rosmarinus officinalis'
    `);

    if (existingRosemary.rows.length === 0) {
      console.log('Rosmarinus officinalis not found in database');
      return;
    }

    const originalRosemary = existingRosemary.rows[0];
    console.log('Found original rosemary:', originalRosemary);

    // Check if Salvia rosmarinus already exists
    const existingSalvia = await pool.query(`
      SELECT id FROM herbs WHERE latin_name ILIKE 'Salvia rosmarinus'
    `);

    if (existingSalvia.rows.length > 0) {
      console.log('Salvia rosmarinus already exists, updating priority...');
      await pool.query(`
        UPDATE herbs SET is_priority = TRUE WHERE latin_name ILIKE 'Salvia rosmarinus'
      `);
      return;
    }

    // Create new entry for Salvia rosmarinus
    console.log('Creating Salvia rosmarinus entry...');
    
    const newId = 'salvia_rosmarinus';
    const folkUsesWithNote = originalRosemary.folk_uses ? 
      `${originalRosemary.folk_uses}\n\nNote: This is the current accepted botanical name. Formerly known as Rosmarinus officinalis.` :
      'Note: This is the current accepted botanical name. Formerly known as Rosmarinus officinalis.';

    await pool.query(`
      INSERT INTO herbs (
        id, common_name, latin_name, family, folk_uses, dosage, safety, is_priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      newId,
      originalRosemary.common_name,
      'Salvia rosmarinus',
      originalRosemary.family,
      folkUsesWithNote,
      originalRosemary.dosage,
      originalRosemary.safety,
      true // Mark as priority
    ]);

    // Copy related data from original rosemary
    console.log('Copying related data...');

    // Copy plant parts
    await pool.query(`
      INSERT INTO herb_plant_parts (herb_id, part_id)
      SELECT $1, part_id FROM herb_plant_parts WHERE herb_id = $2
    `, [newId, originalRosemary.id]);

    // Copy medicinal actions
    await pool.query(`
      INSERT INTO herb_medicinal_actions (herb_id, action_id)
      SELECT $1, action_id FROM herb_medicinal_actions WHERE herb_id = $2
    `, [newId, originalRosemary.id]);

    // Copy indications
    await pool.query(`
      INSERT INTO herb_indications (herb_id, indication_id)
      SELECT $1, indication_id FROM herb_indications WHERE herb_id = $2
    `, [newId, originalRosemary.id]);

    // Copy preparations
    await pool.query(`
      INSERT INTO herb_preparations (herb_id, preparation_id)
      SELECT $1, preparation_id FROM herb_preparations WHERE herb_id = $2
    `, [newId, originalRosemary.id]);

    // Copy tags
    await pool.query(`
      INSERT INTO herb_tags (herb_id, tag_id)
      SELECT $1, tag_id FROM herb_tags WHERE herb_id = $2
    `, [newId, originalRosemary.id]);

    // Copy constituents
    await pool.query(`
      INSERT INTO constituents (herb_id, name, class, water_soluble, ethanol_range, notes)
      SELECT $1, name, class, water_soluble, ethanol_range, notes FROM constituents WHERE herb_id = $2
    `, [newId, originalRosemary.id]);

    // Copy solvent recommendations
    await pool.query(`
      INSERT INTO solvent_recommendations (herb_id, preparation_type, ethanol_percent, ratio, notes)
      SELECT $1, preparation_type, ethanol_percent, ratio, notes FROM solvent_recommendations WHERE herb_id = $2
    `, [newId, originalRosemary.id]);

    // Update the original entry to note the name change
    const originalFolkUsesWithNote = originalRosemary.folk_uses ? 
      `${originalRosemary.folk_uses}\n\nNote: The current accepted botanical name is Salvia rosmarinus.` :
      'Note: The current accepted botanical name is Salvia rosmarinus.';

    await pool.query(`
      UPDATE herbs 
      SET folk_uses = $1
      WHERE id = $2
    `, [originalFolkUsesWithNote, originalRosemary.id]);

    console.log('Successfully created Salvia rosmarinus entry and updated original entry');

    // Verify both entries
    const verification = await pool.query(`
      SELECT id, common_name, latin_name, is_priority 
      FROM herbs 
      WHERE latin_name ILIKE '%rosmarinus%' OR latin_name ILIKE 'Salvia rosmarinus'
      ORDER BY latin_name
    `);

    console.log('\nRosemary entries in database:');
    verification.rows.forEach(row => {
      console.log(`- ${row.latin_name} (${row.common_name}) - Priority: ${row.is_priority}`);
    });

  } catch (error) {
    console.error('Error adding rosemary alias:', error);
  } finally {
    await pool.end();
  }
}

addRosemaryAlias().catch(console.error);
