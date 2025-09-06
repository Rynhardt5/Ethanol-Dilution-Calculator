/* eslint-disable */
const fs = require('fs');

class DukeToHerbsTransformer {
  constructor() {
    this.dukeDatabase = null;
    this.transformedHerbs = [];
    this.partCodeMap = {
      'FL': 'flower',
      'LF': 'leaf', 
      'RT': 'root',
      'BK': 'bark',
      'FR': 'fruit',
      'SD': 'seed',
      'ST': 'stem',
      'WP': 'whole plant',
      'RZ': 'rhizome',
      'BU': 'bulb',
      'TB': 'tuber',
      'BR': 'branch',
      'TW': 'twig',
      'WD': 'wood',
      'SH': 'shoot',
      'PL': 'plant',
      'OL': 'oil',
      'EO': 'essential oil',
      'AN': 'anther',
      'AR': 'aril',
      'AS': 'ash',
      'EB': 'bark essential oil',
      'BT': 'bract',
      'BN': 'bran',
      'BD': 'bud'
    };
  }

  async loadDukeDatabase() {
    console.log('📖 Loading Duke herbs database...');
    try {
      const data = await fs.promises.readFile('/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/duke-herbs-database.json', 'utf8');
      this.dukeDatabase = JSON.parse(data);
      console.log(`✅ Loaded database with ${this.dukeDatabase.plants.length} plants`);
    } catch (error) {
      console.error('❌ Error loading Duke database:', error);
      throw error;
    }
  }

  async transformToHerbsSchema() {
    console.log('🔄 Starting transformation to herbs schema...');
    
    if (!this.dukeDatabase) {
      await this.loadDukeDatabase();
    }

    // Process each plant in the Duke database
    for (const plant of this.dukeDatabase.plants) {
      try {
        const transformedHerb = this.transformPlant(plant);
        if (transformedHerb) {
          this.transformedHerbs.push(transformedHerb);
        }
      } catch (error) {
        console.warn(`⚠️ Error transforming plant ${plant.taxon}:`, error.message);
      }
    }

    console.log(`✅ Transformed ${this.transformedHerbs.length} herbs`);
    return this.transformedHerbs;
  }

  transformPlant(plant) {
    // Skip plants without sufficient data
    if (!plant.genus || !plant.species || plant.chemicals.length === 0) {
      return null;
    }

    // Create unique ID
    const id = this.createId(plant.genus, plant.species);
    
    // Get primary common name
    const primaryCommonName = plant.commonNames.length > 0 ? 
      plant.commonNames[0].name : 
      `${plant.genus} ${plant.species}`;

    // Extract plant parts used
    const plantPartsUsed = this.extractPlantParts(plant.chemicals);

    // Extract constituents with solubility info
    const constituents = this.extractConstituents(plant.chemicals);

    // Extract medicinal actions from ethnobotanical uses and chemical activities
    const medicinalActions = this.extractMedicinalActions(plant);

    // Extract indications from ethnobotanical uses
    const indications = this.extractIndications(plant.ethnobotanicalUses);

    // Create folk uses from ethnobotanical data
    const folkUses = this.createFolkUses(plant.ethnobotanicalUses);

    // Generate solvent recommendations based on constituents
    const solventRecommendations = this.generateSolventRecommendations(constituents);

    // Create tags based on activities and family
    const tags = this.generateTags(plant, medicinalActions);

    return {
      id: id,
      common_name: primaryCommonName,
      latin_name: plant.taxon,
      family: plant.family || 'Unknown',
      plant_parts_used: plantPartsUsed,
      medicinal_actions: medicinalActions,
      indications: indications,
      folk_uses: folkUses,
      constituents: constituents,
      best_preparations: this.recommendPreparations(constituents),
      solvent_recommendations: solventRecommendations,
      dosage: "Consult herbalist for appropriate dosage.",
      safety: "Safety profile not established in Duke database.",
      interactions: [],
      sources: ["Duke Phytochemical Database"],
      tags: tags,
      duke_data: {
        fnf_num: plant.fnfNum,
        taxon_author: plant.taxonAuthor,
        total_chemicals: plant.chemicals.length,
        ethnobotanical_uses_count: plant.ethnobotanicalUses.length
      }
    };
  }

  createId(genus, species) {
    return `${genus.toLowerCase()}_${species.toLowerCase()}`.replace(/[^a-z0-9_]/g, '');
  }

  extractPlantParts(chemicals) {
    const parts = new Set();
    chemicals.forEach(chem => {
      if (chem.plantPart && this.partCodeMap[chem.plantPart]) {
        parts.add(this.partCodeMap[chem.plantPart]);
      }
    });
    return Array.from(parts).slice(0, 5); // Limit to 5 parts
  }

  extractConstituents(chemicals) {
    const constituentMap = new Map();
    
    chemicals.forEach(chem => {
      if (!chem.chemical) return;
      
      const chemName = this.cleanChemicalName(chem.chemical);
      const chemClass = this.classifyChemical(chemName);
      const solubility = this.determineSolubility(chemName, chemClass);
      
      if (!constituentMap.has(chemName)) {
        constituentMap.set(chemName, {
          name: chemName,
          class: chemClass,
          solubility: solubility,
          notes: this.generateChemicalNotes(chem, chemName),
          plant_parts: new Set()
        });
      }
      
      // Add plant part info
      if (chem.plantPart && this.partCodeMap[chem.plantPart]) {
        constituentMap.get(chemName).plant_parts.add(this.partCodeMap[chem.plantPart]);
      }
    });

    // Convert to array and clean up
    return Array.from(constituentMap.values())
      .slice(0, 10) // Limit to top 10 constituents
      .map(constituent => ({
        name: constituent.name,
        class: constituent.class,
        solubility: constituent.solubility,
        notes: constituent.notes
      }));
  }

  cleanChemicalName(chemical) {
    return chemical
      .replace(/['"]/g, '')
      .replace(/-/g, '-')
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  classifyChemical(chemName) {
    const name = chemName.toLowerCase();
    
    if (name.includes('flavon') || name.includes('quercetin') || name.includes('kaempferol')) {
      return 'flavonoid';
    }
    if (name.includes('acid') && (name.includes('caffeic') || name.includes('chlorogenic') || name.includes('ferulic'))) {
      return 'phenolic acid';
    }
    if (name.includes('tannin')) {
      return 'tannin';
    }
    if (name.includes('saponin')) {
      return 'saponin';
    }
    if (name.includes('alkaloid') || name.includes('ine') || name.includes('inine')) {
      return 'alkaloid';
    }
    if (name.includes('terpene') || name.includes('pinene') || name.includes('limonene')) {
      return 'terpene';
    }
    if (name.includes('oil') || name.includes('oleic') || name.includes('linoleic')) {
      return 'fatty acid/oil';
    }
    if (name.includes('sugar') || name.includes('glucose') || name.includes('fructose')) {
      return 'carbohydrate';
    }
    if (name.includes('protein') || name.includes('amino')) {
      return 'protein/amino acid';
    }
    
    return 'phytochemical';
  }

  determineSolubility(chemName, chemClass) {
    const name = chemName.toLowerCase();
    
    // Water-soluble compounds
    if (chemClass === 'carbohydrate' || 
        chemClass === 'protein/amino acid' ||
        chemClass === 'tannin' ||
        name.includes('acid') ||
        name.includes('salt')) {
      return {
        water: true,
        ethanol_range: "0–40%"
      };
    }
    
    // Alcohol-soluble compounds
    if (chemClass === 'alkaloid' ||
        chemClass === 'terpene' ||
        chemClass === 'fatty acid/oil' ||
        name.includes('oil') ||
        name.includes('resin')) {
      return {
        water: false,
        ethanol_range: "60–95%"
      };
    }
    
    // Mixed solubility (flavonoids, phenolic acids)
    if (chemClass === 'flavonoid' || 
        chemClass === 'phenolic acid' ||
        chemClass === 'saponin') {
      return {
        water: true,
        ethanol_range: "40–70%"
      };
    }
    
    // Default for unknown compounds
    return {
      water: true,
      ethanol_range: "25–60%"
    };
  }

  generateChemicalNotes(chem, _) {
    let notes = [];
    
    if (chem.amount && (chem.amount.low || chem.amount.high)) {
      const low = chem.amount.low || 0;
      const high = chem.amount.high || chem.amount.low || 0;
      if (high > 0) {
        notes.push(`Concentration: ${low}-${high} ppm`);
      }
    }
    
    if (chem.trace) {
      notes.push("Present in trace amounts");
    }
    
    if (chem.plantPart && this.partCodeMap[chem.plantPart]) {
      notes.push(`Found in ${this.partCodeMap[chem.plantPart]}`);
    }
    
    return notes.join('. ') || "Phytochemical constituent.";
  }

  extractMedicinalActions(plant) {
    const actions = new Set();
    
    // Extract from ethnobotanical uses
    plant.ethnobotanicalUses.forEach(use => {
      const activity = use.activity.toLowerCase();
      const mappedAction = this.mapActivityToAction(activity);
      if (mappedAction) {
        actions.add(mappedAction);
      }
    });
    
    // Extract from chemical activities via the database
    if (this.dukeDatabase && this.dukeDatabase.chemicalActivityRelations) {
      const plantChemicals = plant.chemicals.map(c => c.chemical.toUpperCase());
      
      this.dukeDatabase.chemicalActivityRelations.forEach(relation => {
        if (plantChemicals.includes(relation.chemical.toUpperCase())) {
          const mappedAction = this.mapActivityToAction(relation.activity);
          if (mappedAction) {
            actions.add(mappedAction);
          }
        }
      });
    }
    
    return Array.from(actions).slice(0, 8); // Limit to 8 actions
  }

  mapActivityToAction(activity) {
    const activityLower = activity.toLowerCase();
    
    const actionMap = {
      'antibacterial': 'antibacterial',
      'antiviral': 'antiviral',
      'antifungal': 'antifungal',
      'antiinflammatory': 'anti-inflammatory',
      'anti-inflammatory': 'anti-inflammatory',
      'antioxidant': 'antioxidant',
      'analgesic': 'analgesic',
      'sedative': 'sedative',
      'calmative': 'calmative',
      'digestive': 'digestive aid',
      'diuretic': 'diuretic',
      'expectorant': 'expectorant',
      'immunostimulant': 'immune stimulant',
      'hepatoprotective': 'hepatoprotective',
      'cardiotonic': 'cardiotonic',
      'antispasmodic': 'antispasmodic',
      'astringent': 'astringent',
      'vulnerary': 'vulnerary',
      'tonic': 'tonic',
      'adaptogen': 'adaptogenic'
    };
    
    // Direct mapping
    if (actionMap[activityLower]) {
      return actionMap[activityLower];
    }
    
    // Partial matching
    for (const [key, value] of Object.entries(actionMap)) {
      if (activityLower.includes(key) || key.includes(activityLower)) {
        return value;
      }
    }
    
    return null;
  }

  extractIndications(ethnobotanicalUses) {
    const indications = new Set();
    
    ethnobotanicalUses.forEach(use => {
      const activity = use.activity.toLowerCase();
      const indication = this.mapActivityToIndication(activity);
      if (indication) {
        indications.add(indication);
      }
    });
    
    return Array.from(indications).slice(0, 8); // Limit to 8 indications
  }

  mapActivityToIndication(activity) {
    const indicationMap = {
      'fever': 'fever',
      'pain': 'pain',
      'headache': 'headache',
      'cough': 'cough',
      'cold': 'cold',
      'flu': 'flu',
      'infection': 'infections',
      'wound': 'wounds',
      'cut': 'cuts',
      'burn': 'burns',
      'inflammation': 'inflammation',
      'arthritis': 'arthritis',
      'rheumatism': 'rheumatism',
      'digestive': 'digestive issues',
      'stomach': 'stomach problems',
      'diarrhea': 'diarrhea',
      'constipation': 'constipation',
      'nausea': 'nausea',
      'anxiety': 'anxiety',
      'insomnia': 'insomnia',
      'stress': 'stress',
      'hypertension': 'high blood pressure',
      'diabetes': 'diabetes support',
      'liver': 'liver support',
      'kidney': 'kidney support'
    };
    
    for (const [key, value] of Object.entries(indicationMap)) {
      if (activity.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  createFolkUses(ethnobotanicalUses) {
    if (ethnobotanicalUses.length === 0) {
      return "Traditional uses not documented in Duke database.";
    }
    
    const uses = ethnobotanicalUses.slice(0, 3).map(use => {
      let useText = `Used for ${use.activity.toLowerCase()}`;
      if (use.country) {
        useText += ` in ${use.country}`;
      }
      return useText;
    });
    
    return uses.join('. ') + '.';
  }

  recommendPreparations(constituents) {
    const preparations = new Set(['tincture']); // Always include tincture
    
    // Check if water-soluble constituents are present
    const hasWaterSoluble = constituents.some(c => c.solubility.water);
    if (hasWaterSoluble) {
      preparations.add('infusion');
    }
    
    // Check if alcohol-soluble constituents are present
    const hasAlcoholSoluble = constituents.some(c => !c.solubility.water);
    if (hasAlcoholSoluble) {
      preparations.add('tincture');
    }
    
    return Array.from(preparations);
  }

  generateSolventRecommendations(constituents) {
    const recommendations = [];
    
    // Always include a balanced tincture recommendation
    recommendations.push({
      preparation_type: "tincture",
      ethanol_percent: "50–60%",
      ratio: "1:5 dried plant material",
      notes: "Balanced extraction for mixed constituents."
    });
    
    // Add water extraction if water-soluble compounds present
    const hasWaterSoluble = constituents.some(c => c.solubility.water);
    if (hasWaterSoluble) {
      recommendations.push({
        preparation_type: "infusion",
        ethanol_percent: "0%",
        ratio: "1-2 tsp dried herb per cup hot water",
        notes: "For water-soluble compounds like tannins and polysaccharides."
      });
    }
    
    // Add high-alcohol extraction if needed
    const hasAlcoholSoluble = constituents.some(c => 
      !c.solubility.water && c.solubility.ethanol_range.includes('70')
    );
    if (hasAlcoholSoluble) {
      recommendations.push({
        preparation_type: "tincture",
        ethanol_percent: "70–80%",
        ratio: "1:5 dried plant material",
        notes: "For alcohol-soluble compounds like essential oils and resins."
      });
    }
    
    return recommendations;
  }

  generateTags(plant, medicinalActions) {
    const tags = new Set();
    
    // Add family-based tags
    if (plant.family) {
      const familyTag = plant.family.toLowerCase().replace('aceae', '');
      tags.add(familyTag);
    }
    
    // Add action-based tags
    medicinalActions.forEach(action => {
      if (action.includes('anti')) {
        tags.add('antimicrobial');
      }
      if (action.includes('digestive')) {
        tags.add('digestive');
      }
      if (action.includes('immune')) {
        tags.add('immune');
      }
      if (action.includes('nervous') || action.includes('calm') || action.includes('sedative')) {
        tags.add('nervous');
      }
      if (action.includes('respiratory') || action.includes('expectorant')) {
        tags.add('respiratory');
      }
    });
    
    // Add general tags
    if (plant.ethnobotanicalUses.length > 10) {
      tags.add('traditional');
    }
    if (plant.chemicals.length > 50) {
      tags.add('well-studied');
    }
    
    return Array.from(tags).slice(0, 6); // Limit to 6 tags
  }

  async saveTransformedDatabase() {
    const outputPath = '/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/herbs-data-duke-transformed.json';
    console.log(`💾 Saving transformed herbs database to ${outputPath}...`);
    
    try {
      await fs.promises.writeFile(outputPath, JSON.stringify(this.transformedHerbs, null, 2));
      console.log('✅ Transformed database saved successfully!');
      
      // Also create a merged version with existing herbs data
      await this.createMergedDatabase();
      
    } catch (error) {
      console.error('❌ Error saving transformed database:', error);
      throw error;
    }
  }

  async createMergedDatabase() {
    console.log('🔗 Creating merged database with existing herbs data...');
    
    try {
      // Load existing herbs data
      let existingHerbs = [];
      try {
        const existingData = await fs.promises.readFile('/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/herbs-data.json', 'utf8');
        existingHerbs = JSON.parse(existingData);
      } catch (_) {
        console.log('ℹ️ No existing herbs data found, creating new database');
      }
      
      // Merge databases (existing herbs first, then Duke herbs)
      const mergedDatabase = [...existingHerbs, ...this.transformedHerbs];
      
      const mergedPath = '/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/herbs-data-merged.json';
      await fs.promises.writeFile(mergedPath, JSON.stringify(mergedDatabase, null, 2));
      
      console.log(`✅ Merged database saved with ${mergedDatabase.length} total herbs`);
      console.log(`   - Original herbs: ${existingHerbs.length}`);
      console.log(`   - Duke herbs: ${this.transformedHerbs.length}`);
      
    } catch (error) {
      console.error('❌ Error creating merged database:', error);
    }
  }

  printStatistics() {
    console.log('\n📊 TRANSFORMATION STATISTICS:');
    console.log('===============================');
    console.log(`🌿 Total herbs transformed: ${this.transformedHerbs.length}`);
    
    const familyCounts = {};
    const actionCounts = {};
    
    this.transformedHerbs.forEach(herb => {
      // Count families
      if (herb.family && herb.family !== 'Unknown') {
        familyCounts[herb.family] = (familyCounts[herb.family] || 0) + 1;
      }
      
      // Count actions
      herb.medicinal_actions.forEach(action => {
        actionCounts[action] = (actionCounts[action] || 0) + 1;
      });
    });
    
    console.log(`🏷️ Top families: ${Object.entries(familyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([family, count]) => `${family} (${count})`)
      .join(', ')}`);
      
    console.log(`⚡ Top actions: ${Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => `${action} (${count})`)
      .join(', ')}`);
      
    console.log('===============================\n');
  }

  async run() {
    try {
      console.log('🚀 Starting Duke to Herbs transformation...');
      
      await this.loadDukeDatabase();
      await this.transformToHerbsSchema();
      await this.saveTransformedDatabase();
      
      this.printStatistics();
      
      console.log('✅ Transformation completed successfully!');
      
    } catch (error) {
      console.error('❌ Transformation failed:', error);
      throw error;
    }
  }
}

module.exports = DukeToHerbsTransformer;

// If run directly
if (require.main === module) {
  const transformer = new DukeToHerbsTransformer();
  transformer.run().catch(console.error);
}
