const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

class HerbsDatabaseProcessor {
  constructor(csvFolderPath) {
    this.csvFolderPath = csvFolderPath;
    this.database = {
      plants: new Map(),
      chemicals: new Map(),
      activities: new Map(),
      ethnobotanicalUses: [],
      chemicalPlantRelations: [],
      chemicalActivityRelations: [],
      parts: new Map(),
      references: new Map(),
      commonNames: new Map()
    };
  }

  async processAllCSVs() {
    console.log('🌿 Starting Duke Herbs Database Processing...');
    
    try {
      // Process core reference data first
      await this.processActivities();
      await this.processChemicals();
      await this.processParts();
      await this.processReferences();
      await this.processPlants();
      await this.processCommonNames();
      
      // Process relationships
      await this.processFarmacy();
      await this.processFarmacyNew();
      await this.processAggregac();
      await this.processEthnobot();
      
      // Generate final database
      const finalDatabase = this.generateFinalDatabase();
      
      // Save to JSON
      await this.saveDatabaseToJSON(finalDatabase);
      
      console.log('✅ Database processing completed successfully!');
      this.printStatistics();
      
      return finalDatabase;
    } catch (error) {
      console.error('❌ Error processing database:', error);
      throw error;
    }
  }

  async processActivities() {
    console.log('📊 Processing activities...');
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(this.csvFolderPath, 'ACTIVITIES.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.ACTIVITY && row.ACTIVITY.trim()) {
            this.database.activities.set(row.ACTIVITY.toUpperCase(), {
              name: row.ACTIVITY,
              definition: row.DEFINITION || '',
              reference: row.REFERENCE || '',
              created: row.CREATED || '',
              modified: row.MODIFIED || ''
            });
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${this.database.activities.size} activities`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processChemicals() {
    console.log('🧪 Processing chemicals...');
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(this.csvFolderPath, 'CHEMICALS.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.CHEM && row.CHEM.trim()) {
            this.database.chemicals.set(row.CHEM.toUpperCase(), {
              name: row.CHEM,
              chemId: row.CHEMID || '',
              casNumber: row.CASNUM || '',
              created: row.CREATED || '',
              modified: row.MODIFIED || ''
            });
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${this.database.chemicals.size} chemicals`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processParts() {
    console.log('🌱 Processing plant parts...');
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(this.csvFolderPath, 'PARTS.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.PPCO && row.PPNA) {
            this.database.parts.set(row.PPCO, {
              code: row.PPCO,
              name: row.PPNA,
              created: row.CREATED || '',
              modified: row.MODIFIED || ''
            });
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${this.database.parts.size} plant parts`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processReferences() {
    console.log('📚 Processing references...');
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(this.csvFolderPath, 'REFERENCES.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.REFERENCE) {
            this.database.references.set(row.REFERENCE, {
              reference: row.REFERENCE,
              longReference: row.LONGREF || '',
              note: row.NOTE || '',
              created: row.CREATED || '',
              modified: row.MODIFIED || ''
            });
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${this.database.references.size} references`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processPlants() {
    console.log('🌿 Processing plants taxonomy...');
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(this.csvFolderPath, 'FNFTAX.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.FNFNUM && row.TAXON) {
            this.database.plants.set(row.FNFNUM, {
              fnfNum: row.FNFNUM,
              taxon: row.TAXON,
              taxonAuthor: row.TAXAUTHOR || '',
              genus: row.GENUS || '',
              species: row.SPECIES || '',
              subspecies: row.SUBSPECIES || '',
              variety: row.VARIETY || '',
              forma: row.FORMA || '',
              cultivar: row.CULTIVAR || '',
              family: row.FAMILY || '',
              commonNames: [],
              chemicals: [],
              ethnobotanicalUses: [],
              created: row.CREATED || '',
              modified: row.MODIFIED || ''
            });
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${this.database.plants.size} plants`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processCommonNames() {
    console.log('🏷️ Processing common names...');
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(this.csvFolderPath, 'COMMON_NAMES.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.CNNAM && row.FNFNUM) {
            const plant = this.database.plants.get(row.FNFNUM);
            if (plant) {
              plant.commonNames.push({
                name: row.CNNAM,
                id: row.CNID || '',
                created: row.CREATED || ''
              });
            }
            
            this.database.commonNames.set(row.CNNAM.toUpperCase(), {
              name: row.CNNAM,
              fnfNum: row.FNFNUM,
              id: row.CNID || ''
            });
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${this.database.commonNames.size} common names`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processFarmacy() {
    console.log('💊 Processing farmacy (chemical-plant relationships)...');
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(this.csvFolderPath, 'FARMACY.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.FNFNUM && row.CHEM && row.PPCO) {
            const relation = {
              plantId: row.FNFNUM,
              chemical: row.CHEM,
              plantPart: row.PPCO,
              amount: {
                low: this.parseNumber(row.AMT_LO),
                high: this.parseNumber(row.AMT_OR_HI),
                plus: row.AMT_PLUS || ''
              },
              essential_oil_percent: {
                low: this.parseNumber(row.EOPCT_LO),
                high: this.parseNumber(row.EOPCT_OR_HI)
              },
              reference: row.REFERENCE || '',
              assay: row.ASSAY || '',
              individual: row.INDIVIDUAL || '',
              trace: row.TRACE === 'T',
              lessThan: row.LESSTHAN === 'T',
              created: row.CREATED || ''
            };
            
            this.database.chemicalPlantRelations.push(relation);
            
            // Add to plant's chemical list
            const plant = this.database.plants.get(row.FNFNUM);
            if (plant) {
              plant.chemicals.push(relation);
            }
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${this.database.chemicalPlantRelations.length} chemical-plant relationships`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processFarmacyNew() {
    console.log('💊 Processing farmacy new (additional chemical-plant relationships)...');
    return new Promise((resolve, reject) => {
      let count = 0;
      fs.createReadStream(path.join(this.csvFolderPath, 'FARMACY_NEW.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.FNFNUM && row.CHEM && row.PPCO) {
            const relation = {
              plantId: row.FNFNUM,
              chemical: row.CHEM,
              chemicalClass: row.CHEMCLASS || '',
              plantPart: row.PPCO,
              amount: {
                low: this.parseNumber(row.AMT_LO),
                orLow: this.parseNumber(row.AMT_OR_LO),
                high: this.parseNumber(row.AMT_HI),
                orHigh: this.parseNumber(row.AMT_OR_HI),
                ultraHigh: this.parseNumber(row.AMT_ULHI)
              },
              essential_oil_percent: {
                low: this.parseNumber(row.EOPCT_LO),
                orLow: this.parseNumber(row.EOPCT_OR_LO),
                high: this.parseNumber(row.EOPCT_HI),
                orHigh: this.parseNumber(row.EOPCT_OR_HI)
              },
              quantUnit: row.QUANT_UNIT || '',
              reference: row.REFERENCE || '',
              referenceYear: row.REFYR || '',
              individual: row.INDIVIDUAL || '',
              trace: row.TRACE === 'T',
              lessThan: row.LT === 'T',
              created: row.CREATED || '',
              source: 'FARMACY_NEW'
            };
            
            this.database.chemicalPlantRelations.push(relation);
            count++;
            
            // Add to plant's chemical list
            const plant = this.database.plants.get(row.FNFNUM);
            if (plant) {
              plant.chemicals.push(relation);
            }
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${count} additional chemical-plant relationships`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processAggregac() {
    console.log('⚡ Processing chemical activities...');
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(this.csvFolderPath, 'AGGREGAC.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.CHEM && row.ACTIVITY) {
            const relation = {
              chemical: row.CHEM,
              activity: row.ACTIVITY,
              dosage: row.DOSAGE || '',
              reference: row.REFERENCE || '',
              majorActivity: row.MAJORACT === 'T',
              aggregateNumber: row.AGGNO || '',
              created: row.CREATED || ''
            };
            
            this.database.chemicalActivityRelations.push(relation);
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${this.database.chemicalActivityRelations.length} chemical-activity relationships`);
          resolve();
        })
        .on('error', reject);
    });
  }

  async processEthnobot() {
    console.log('🌍 Processing ethnobotanical uses...');
    return new Promise((resolve, reject) => {
      fs.createReadStream(path.join(this.csvFolderPath, 'ETHNOBOT.csv'))
        .pipe(csv())
        .on('data', (row) => {
          if (row.GENUS && row.SPECIES && row.ACTIVITY) {
            const use = {
              ethnoId: row.ETHNO || '',
              activity: row.ACTIVITY,
              genus: row.GENUS,
              species: row.SPECIES,
              speciesAuthor: row.SPAUT || '',
              speciesRank: row.SPRANK || '',
              family: row.FAMILY || '',
              commonName: row.CNAME || '',
              country: row.COUNTRY || '',
              reference: row.REFERENCE || '',
              longReference: row.LONGREF || '',
              effective: row.EFFECTIVE || '',
              taxon: row.TAXON || '',
              taxonAuthor: row.TAXAUTHOR || '',
              created: row.CREATED || ''
            };
            
            this.database.ethnobotanicalUses.push(use);
            
            // Try to link to existing plants
            const matchingPlant = Array.from(this.database.plants.values()).find(plant => 
              plant.genus.toLowerCase() === row.GENUS.toLowerCase() && 
              plant.species.toLowerCase() === row.SPECIES.toLowerCase()
            );
            
            if (matchingPlant) {
              matchingPlant.ethnobotanicalUses.push(use);
            }
          }
        })
        .on('end', () => {
          console.log(`   ✓ Processed ${this.database.ethnobotanicalUses.length} ethnobotanical uses`);
          resolve();
        })
        .on('error', reject);
    });
  }

  parseNumber(value) {
    if (!value || value === '') return null;
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  generateFinalDatabase() {
    console.log('🔄 Generating final database structure...');
    
    // Convert Maps to Objects for JSON serialization
    const finalDb = {
      metadata: {
        source: 'Dr. James Duke Phytochemical Database',
        processedAt: new Date().toISOString(),
        totalPlants: this.database.plants.size,
        totalChemicals: this.database.chemicals.size,
        totalActivities: this.database.activities.size,
        totalEthnobotanicalUses: this.database.ethnobotanicalUses.length,
        totalChemicalPlantRelations: this.database.chemicalPlantRelations.length,
        totalChemicalActivityRelations: this.database.chemicalActivityRelations.length
      },
      plants: Array.from(this.database.plants.values()),
      chemicals: Array.from(this.database.chemicals.values()),
      activities: Array.from(this.database.activities.values()),
      parts: Array.from(this.database.parts.values()),
      references: Array.from(this.database.references.values()),
      commonNames: Array.from(this.database.commonNames.values()),
      ethnobotanicalUses: this.database.ethnobotanicalUses,
      chemicalPlantRelations: this.database.chemicalPlantRelations,
      chemicalActivityRelations: this.database.chemicalActivityRelations
    };

    return finalDb;
  }

  async saveDatabaseToJSON(database) {
    const outputPath = '/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/duke-herbs-database.json';
    console.log(`💾 Saving database to ${outputPath}...`);
    
    try {
      await fs.promises.writeFile(outputPath, JSON.stringify(database, null, 2));
      console.log('✅ Database saved successfully!');
    } catch (error) {
      console.error('❌ Error saving database:', error);
      throw error;
    }
  }

  printStatistics() {
    console.log('\n📊 DATABASE STATISTICS:');
    console.log('========================');
    console.log(`🌿 Plants: ${this.database.plants.size}`);
    console.log(`🧪 Chemicals: ${this.database.chemicals.size}`);
    console.log(`⚡ Activities: ${this.database.activities.size}`);
    console.log(`🌱 Plant Parts: ${this.database.parts.size}`);
    console.log(`📚 References: ${this.database.references.size}`);
    console.log(`🏷️ Common Names: ${this.database.commonNames.size}`);
    console.log(`🌍 Ethnobotanical Uses: ${this.database.ethnobotanicalUses.length}`);
    console.log(`💊 Chemical-Plant Relations: ${this.database.chemicalPlantRelations.length}`);
    console.log(`⚡ Chemical-Activity Relations: ${this.database.chemicalActivityRelations.length}`);
    console.log('========================\n');
  }
}

module.exports = HerbsDatabaseProcessor;

// If run directly
if (require.main === module) {
  const processor = new HerbsDatabaseProcessor('/Users/rynhardtsmith/Downloads/24660351/Duke-Source-CSV');
  processor.processAllCSVs().catch(console.error);
}
