const fs = require('fs').promises;

async function verifyUniqueIds() {
  try {
    console.log('🔍 Verifying unique IDs in herbs data...');
    
    const data = await fs.readFile('/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/herbs-data-pfaf-merged.json', 'utf8');
    const herbsData = JSON.parse(data);
    
    const ids = herbsData.map(herb => herb.id);
    const uniqueIds = new Set(ids);
    
    console.log(`📊 Total herbs: ${ids.length}`);
    console.log(`📊 Unique IDs: ${uniqueIds.size}`);
    
    if (ids.length === uniqueIds.size) {
      console.log('✅ All IDs are unique! React will have no duplicate key issues.');
    } else {
      console.log(`❌ Found ${ids.length - uniqueIds.size} duplicate IDs`);
      
      // Find duplicates
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('Duplicate IDs:', [...new Set(duplicates)]);
    }
    
    // Show a few example IDs
    console.log('\n📝 Sample IDs:');
    ids.slice(0, 5).forEach((id, index) => {
      console.log(`  ${index + 1}. ${id}`);
    });
    
  } catch (error) {
    console.error('❌ Error verifying IDs:', error);
  }
}

verifyUniqueIds();
