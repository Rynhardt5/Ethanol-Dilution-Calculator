const { Pool } = require('pg');

// Top 50 medicinal plants from the article
const featuredHerbs = [
  // Native American herbs
  'Echinacea purpurea',
  'Hydrastis canadensis', // Goldenseal
  'Achillea millefolium', // Yarrow
  'Actaea racemosa', // Black Cohosh
  'Salix alba', // Willow Bark
  'Sambucus nigra', // Elderberry
  'Juniperus communis', // Juniper
  'Prunus serotina', // Wild Cherry Bark
  'Verbascum thapsus', // Mullein
  'Thuja occidentalis', // Cedar
  
  // Ayurvedic herbs
  'Withania somnifera', // Ashwagandha
  'Curcuma longa', // Turmeric
  'Ocimum tenuiflorum', // Holy Basil
  'Azadirachta indica', // Neem
  'Zingiber officinale', // Ginger
  'Bacopa monnieri', // Brahmi
  'Phyllanthus emblica', // Amla
  'Commiphora mukul', // Guggul
  'Asparagus racemosus', // Shatavari
  
  // Traditional Chinese Medicine herbs
  'Panax ginseng', // Ginseng
  'Astragalus membranaceus', // Astragalus
  'Glycyrrhiza glabra', // Licorice Root
  'Ginkgo biloba', // Ginkgo Biloba
  'Ganoderma lucidum', // Reishi Mushroom
  'Angelica sinensis', // Dong Quai
  'Schisandra chinensis', // Schisandra
  'Lycium barbarum', // Goji Berry
  'Crataegus monogyna', // Hawthorn
  'Scutellaria baicalensis', // Chinese Skullcap
  
  // African medicine herbs
  'Siphonochilus aethiopicus', // African Ginger
  'Adansonia digitata', // Baobab
  'Harpagophytum procumbens', // Devil's Claw
  'Hypoxis hemerocallidea', // African Potato
  'Senna alexandrina', // Senna
  'Aspalathus linearis', // Rooibos
  'Kigelia africana', // Kigelia
  'Agathosma betulina', // Buchu
  'Hoodia gordonii', // Hoodia
  'Sclerocarya birrea', // Marula
  
  // Other notable herbs
  'Mentha piperita', // Peppermint
  'Matricaria chamomilla', // Chamomile
  'Lavandula angustifolia', // Lavender
  'Aloe barbadensis', // Aloe Vera
  'Hypericum perforatum', // St. John's Wort
  'Calendula officinalis', // Calendula
  'Silybum marianum', // Milk Thistle
  'Eucalyptus globulus', // Eucalyptus
  'Valeriana officinalis', // Valerian
  'Rosmarinus officinalis' // Rosemary (already priority)
];

async function markFeaturedHerbs() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('🌟 Adding is_featured column to herbs table...');
    
    // Add the is_featured column if it doesn't exist
    await pool.query(`
      ALTER TABLE herbs 
      ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
    `);
    
    console.log('✅ Column added successfully');
    
    console.log('🌟 Marking featured herbs...');
    
    let markedCount = 0;
    let notFoundCount = 0;
    
    for (const latinName of featuredHerbs) {
      try {
        const result = await pool.query(
          'UPDATE herbs SET is_featured = TRUE WHERE latin_name ILIKE $1',
          [latinName]
        );
        
        if (result.rowCount > 0) {
          console.log(`✅ Marked ${latinName} as featured (${result.rowCount} entries)`);
          markedCount += result.rowCount;
        } else {
          console.log(`⚠️  Herb not found: ${latinName}`);
          notFoundCount++;
        }
      } catch (error) {
        console.error(`❌ Error marking ${latinName}:`, error.message);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Featured herbs marked: ${markedCount}`);
    console.log(`   Herbs not found: ${notFoundCount}`);
    console.log(`   Total featured herbs attempted: ${featuredHerbs.length}`);
    
    // Show some featured herbs
    const featuredResult = await pool.query(`
      SELECT latin_name, common_name, is_featured, is_priority 
      FROM herbs 
      WHERE is_featured = TRUE 
      ORDER BY latin_name 
      LIMIT 10
    `);
    
    console.log('\n🌟 Sample featured herbs:');
    featuredResult.rows.forEach(herb => {
      const priority = herb.is_priority ? '⭐' : '';
      console.log(`   ${herb.latin_name} (${herb.common_name}) ${priority}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

// Check if DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

markFeaturedHerbs().catch(console.error);
