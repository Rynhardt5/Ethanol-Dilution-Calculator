const fs = require('fs').promises;
const crypto = require('crypto');

class HerbsUniqueIdGenerator {
  constructor() {
    this.inputFile = '/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/herbs-data-pfaf-merged.json';
    this.outputFile = '/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/herbs-data-pfaf-merged.json';
    this.backupFile = '/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/herbs-data-pfaf-merged-backup.json';
  }

  /**
   * Generate a unique ID based on herb data
   * Uses latin name as primary identifier with fallback to common name
   * Adds a short hash to ensure uniqueness
   */
  generateUniqueId(herb, index) {
    // Use latin name if available, otherwise common name
    const baseName = herb.latin_name || herb.common_name || `herb_${index}`;
    
    // Clean the name: lowercase, replace spaces and special chars with underscores
    const cleanName = baseName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    // Create a short hash from the herb's content to ensure uniqueness
    const herbContent = JSON.stringify(herb);
    const hash = crypto.createHash('md5').update(herbContent).digest('hex').substring(0, 8);
    
    return `${cleanName}_${hash}`;
  }

  /**
   * Load the herbs data from the input file
   */
  async loadHerbsData() {
    try {
      console.log('📖 Loading herbs data...');
      const data = await fs.readFile(this.inputFile, 'utf8');
      const herbsData = JSON.parse(data);
      console.log(`✅ Loaded ${herbsData.length} herbs from database`);
      return herbsData;
    } catch (error) {
      console.error('❌ Error loading herbs data:', error);
      throw error;
    }
  }

  /**
   * Create a backup of the original file
   */
  async createBackup() {
    try {
      console.log('💾 Creating backup of original file...');
      await fs.copyFile(this.inputFile, this.backupFile);
      console.log(`✅ Backup created: ${this.backupFile}`);
    } catch (error) {
      console.error('❌ Error creating backup:', error);
      throw error;
    }
  }

  /**
   * Generate unique IDs for all herbs
   */
  async generateUniqueIds() {
    try {
      // Create backup first
      await this.createBackup();
      
      // Load the data
      const herbsData = await this.loadHerbsData();
      
      console.log('🔄 Generating unique IDs...');
      
      // Track used IDs to ensure absolute uniqueness
      const usedIds = new Set();
      let duplicateCount = 0;
      
      // Generate new unique IDs for each herb
      const updatedHerbs = herbsData.map((herb, index) => {
        let newId = this.generateUniqueId(herb, index);
        
        // If ID already exists, add a counter
        let counter = 1;
        const originalId = newId;
        while (usedIds.has(newId)) {
          newId = `${originalId}_${counter}`;
          counter++;
          duplicateCount++;
        }
        
        usedIds.add(newId);
        
        return {
          ...herb,
          id: newId
        };
      });
      
      console.log(`✅ Generated ${updatedHerbs.length} unique IDs`);
      if (duplicateCount > 0) {
        console.log(`⚠️  Resolved ${duplicateCount} potential duplicate IDs`);
      }
      
      // Save the updated data
      await this.saveUpdatedData(updatedHerbs);
      
      // Verify uniqueness
      await this.verifyUniqueness(updatedHerbs);
      
      return updatedHerbs;
      
    } catch (error) {
      console.error('❌ Error generating unique IDs:', error);
      throw error;
    }
  }

  /**
   * Save the updated herbs data
   */
  async saveUpdatedData(herbsData) {
    try {
      console.log('💾 Saving updated herbs data...');
      const jsonData = JSON.stringify(herbsData, null, 2);
      await fs.writeFile(this.outputFile, jsonData, 'utf8');
      console.log(`✅ Updated herbs data saved to: ${this.outputFile}`);
    } catch (error) {
      console.error('❌ Error saving updated data:', error);
      throw error;
    }
  }

  /**
   * Verify that all IDs are unique
   */
  async verifyUniqueness(herbsData) {
    console.log('🔍 Verifying ID uniqueness...');
    
    const ids = herbsData.map(herb => herb.id);
    const uniqueIds = new Set(ids);
    
    if (ids.length === uniqueIds.size) {
      console.log('✅ All IDs are unique!');
      console.log(`📊 Total herbs: ${ids.length}`);
      console.log(`📊 Unique IDs: ${uniqueIds.size}`);
    } else {
      console.error('❌ Duplicate IDs found!');
      console.log(`📊 Total herbs: ${ids.length}`);
      console.log(`📊 Unique IDs: ${uniqueIds.size}`);
      console.log(`📊 Duplicates: ${ids.length - uniqueIds.size}`);
      
      // Find and log duplicates
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      console.log('🔍 Duplicate IDs:', [...new Set(duplicates)]);
    }
  }

  /**
   * Main execution method
   */
  async run() {
    try {
      console.log('🚀 Starting unique ID generation process...');
      console.log('=' .repeat(50));
      
      const updatedHerbs = await this.generateUniqueIds();
      
      console.log('=' .repeat(50));
      console.log('🎉 Unique ID generation completed successfully!');
      console.log(`📁 Original file backed up to: ${this.backupFile}`);
      console.log(`📁 Updated file saved to: ${this.outputFile}`);
      
      return updatedHerbs;
      
    } catch (error) {
      console.error('💥 Process failed:', error);
      process.exit(1);
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const generator = new HerbsUniqueIdGenerator();
  generator.run();
}

module.exports = HerbsUniqueIdGenerator;
