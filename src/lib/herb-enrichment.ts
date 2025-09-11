// Herb data enrichment service
// Fetches additional information from PubMed and USDA Plants Database

interface PubMedArticle {
  pmid: string
  title: string
  abstract: string
  authors: string[]
  journal: string
  pubDate: string
}

interface USDAPlantInfo {
  symbol: string
  scientificName: string
  commonName: string
  family: string
  duration: string
  growthHabit: string
  nativeStatus: string
  characteristics: string[]
}

interface SpecificApplication {
  condition: string
  usage: string
  dosage?: string
  duration?: string
  evidence_level: 'traditional' | 'clinical' | 'research'
  notes?: string
}

interface EnhancedPreparation {
  type: string
  method: string
  ingredients: string[]
  ratios?: string
  extraction_time?: string
  dosage?: string
  administration: string
  storage?: string
  shelf_life?: string
  notes?: string
}

interface SafetyContraindication {
  type: 'contraindication' | 'precaution' | 'warning'
  condition: string
  severity: 'mild' | 'moderate' | 'severe'
  description: string
  source?: string
}

interface DrugInteraction {
  drug_class: string
  specific_drugs?: string[]
  interaction_type: 'synergistic' | 'antagonistic' | 'additive' | 'unknown'
  severity: 'mild' | 'moderate' | 'severe'
  mechanism?: string
  recommendation: string
  source?: string
}

interface PubMedResearchData {
  applications: SpecificApplication[]
  safety_data: SafetyContraindication[]
  interactions: DrugInteraction[]
  clinical_studies: Array<{
    title: string
    pmid: string
    findings: string
    year: string
  }>
}

interface EnrichedHerbData {
  description: string
  detailedUses: string[]
  preparations: Array<{
    type: string
    method: string
    dosage?: string
    notes?: string
  }>
  constituents: Array<{
    name: string
    type: string
    ethanolPercentage: number
    description: string
  }>
  botanicalInfo: USDAPlantInfo | null
  contraindications: string[]
  interactions: string[]
}

export class HerbEnrichmentService {
  private static readonly HERBAL_MEDICINE_KEYWORDS = [
    'medicinal use', 'therapeutic', 'treatment', 'remedy', 'healing',
    'contraindication', 'side effect', 'adverse reaction', 'toxicity',
    'drug interaction', 'pharmacokinetic', 'pharmacodynamic',
    'preparation', 'extract', 'tincture', 'decoction', 'infusion'
  ]
  private static readonly PUBMED_BASE_URL =
    'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
  private static readonly USDA_PLANTS_API = 'https://plantsdb.xyz'

  // Search PubMed for herb-related research
  static async searchPubMed(
    herbName: string,
    latinName: string
  ): Promise<PubMedArticle[]> {
    try {
      const searchTerms = [
        `"${latinName}"[Title/Abstract]`,
        `"${herbName}"[Title/Abstract] AND (medicinal OR therapeutic OR traditional)`,
        `"${latinName}" AND (phytochemistry OR pharmacology OR ethnobotany)`,
      ].join(' OR ')

      // Search for article IDs
      const searchUrl = `${
        this.PUBMED_BASE_URL
      }/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
        searchTerms
      )}&retmax=10&retmode=json`

      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()

      if (!searchData.esearchresult?.idlist?.length) {
        return []
      }

      // Fetch article details
      const ids = searchData.esearchresult.idlist.join(',')
      const fetchUrl = `${this.PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${ids}&retmode=xml`

      const fetchResponse = await fetch(fetchUrl)
      const xmlText = await fetchResponse.text()

      return this.parsePubMedXML(xmlText)
    } catch (error) {
      console.error('PubMed search error:', error)
      return []
    }
  }

  // Search USDA Plants Database
  static async searchUSDAPlants(
    latinName: string
  ): Promise<USDAPlantInfo | null> {
    try {
      const searchUrl = `${
        this.USDA_PLANTS_API
      }/search?scientific_name=${encodeURIComponent(latinName)}`

      const response = await fetch(searchUrl)
      const data = await response.json()

      if (data.data && data.data.length > 0) {
        const plant = data.data[0]
        return {
          symbol: plant.symbol,
          scientificName: plant.scientific_name,
          commonName: plant.common_name,
          family: plant.family,
          duration: plant.duration,
          growthHabit: plant.growth_habit,
          nativeStatus: plant.native_status,
          characteristics: plant.characteristics || [],
        }
      }

      return null
    } catch (error) {
      console.error('USDA Plants search error:', error)
      return null
    }
  }

  // Parse PubMed XML response
  private static parsePubMedXML(xmlText: string): PubMedArticle[] {
    const articles: PubMedArticle[] = []

    try {
      // Simple XML parsing - in production, use a proper XML parser
      const articleMatches =
        xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []

      for (const articleXml of articleMatches.slice(0, 5)) {
        // Limit to 5 articles
        const pmid = this.extractXMLContent(articleXml, 'PMID') || ''
        const title = this.extractXMLContent(articleXml, 'ArticleTitle') || ''
        const abstract =
          this.extractXMLContent(articleXml, 'AbstractText') || ''
        const journal = this.extractXMLContent(articleXml, 'Title') || ''
        const pubDate = this.extractXMLContent(articleXml, 'PubDate') || ''

        // Extract authors
        const authorMatches =
          articleXml.match(/<Author[^>]*>[\s\S]*?<\/Author>/g) || []
        const authors = authorMatches
          .map((authorXml) => {
            const lastName = this.extractXMLContent(authorXml, 'LastName') || ''
            const foreName = this.extractXMLContent(authorXml, 'ForeName') || ''
            return `${foreName} ${lastName}`.trim()
          })
          .filter((name) => name)

        if (pmid && title) {
          articles.push({
            pmid,
            title,
            abstract,
            authors,
            journal,
            pubDate,
          })
        }
      }
    } catch (error) {
      console.error('XML parsing error:', error)
    }

    return articles
  }

  private static extractXMLContent(xml: string, tag: string): string {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
    const match = xml.match(regex)
    return match ? match[1].replace(/<[^>]*>/g, '').trim() : ''
  }
  // Generate enhanced preparations based on actual constituents
  static generateEnhancedPreparations(
    herbName: string,
    actions: string[],
    constituents: Array<{ type: string; ethanolPercentage: number; name: string }>
  ): Array<{ type: string; method: string; dosage?: string; notes?: string }> {
    const preparations = []

    // Tea/Infusion (most common)
    preparations.push({
      type: 'Tea/Infusion',
      method:
        'Pour 1 cup boiling water over 1-2 tsp dried herb. Steep 10-15 minutes, strain.',
      dosage: '1-3 cups daily',
      notes:
        'Best for water-soluble compounds like tannins, mucilage, and some glycosides',
    })

    // Determine optimal tincture percentage based on actual constituents
    const ethanolPercentage = this.getOptimalEthanolPercentageFromConstituents(
      constituents
    )
    preparations.push({
      type: 'Tincture',
      method: `Alcohol extraction (1:5 ratio, ${ethanolPercentage}% ethanol). Macerate for 2-4 weeks.`,
      dosage: '1-3 ml, 3 times daily',
      notes: `${ethanolPercentage}% ethanol optimal for this herb's active compounds`,
    })

    // Add specific preparations based on actions
    if (
      actions.some(
        (action) =>
          action.toLowerCase().includes('anti-inflammatory') ||
          action.toLowerCase().includes('wound')
      )
    ) {
      preparations.push({
        type: 'Poultice',
        method:
          'Crush fresh herb or mix dried powder with water to form paste. Apply directly to affected area.',
        notes: 'For external use only. Cover with clean cloth.',
      })
    }

    if (
      actions.some(
        (action) =>
          action.toLowerCase().includes('respiratory') ||
          action.toLowerCase().includes('expectorant')
      )
    ) {
      preparations.push({
        type: 'Steam Inhalation',
        method:
          'Add 2-3 tbsp dried herb to bowl of hot water. Inhale steam with towel over head.',
        notes: 'For respiratory conditions. 10-15 minutes, 2-3 times daily.',
      })
    }

    if (
      actions.some(
        (action) =>
          action.toLowerCase().includes('digestive') ||
          action.toLowerCase().includes('carminative')
      )
    ) {
      preparations.push({
        type: 'Decoction',
        method: 'Simmer 1 tbsp herb in 1 cup water for 15-20 minutes. Strain.',
        dosage: '1/2 cup before meals',
        notes: 'Better for roots, bark, and tough plant materials',
      })
    }

    // Add constituent-specific extraction methods
    if (constituents.length > 0) {
      const hasAlkaloids = constituents.some(c => c.type.toLowerCase().includes('alkaloid'))
      const hasEssentialOils = constituents.some(c => c.type.toLowerCase().includes('essential oil') || c.type.toLowerCase().includes('terpenoid'))
      const hasPolysaccharides = constituents.some(c => c.type.toLowerCase().includes('polysaccharide'))

      if (hasAlkaloids) {
        preparations.push({
          type: 'Alkaloid-Targeted Tincture',
          method: 'Use 70-90% ethanol with slight acidification (few drops vinegar). 1:5 ratio, macerate 4 weeks.',
          dosage: '0.5-2 ml, 2-3 times daily',
          notes: 'Specifically targets alkaloid compounds for maximum potency'
        })
      }

      if (hasEssentialOils) {
        preparations.push({
          type: 'Essential Oil Extraction',
          method: 'Steam distillation or 95% ethanol extraction. Keep cool and sealed.',
          dosage: '2-5 drops in carrier oil or tea',
          notes: 'Captures volatile aromatic compounds - use sparingly'
        })
      }

      if (hasPolysaccharides) {
        preparations.push({
          type: 'Immune-Supporting Decoction',
          method: 'Simmer 2 tbsp herb in 2 cups water for 30 minutes. Strain while hot.',
          dosage: '1/2 cup, 2-3 times daily',
          notes: 'Extracts immune-supporting polysaccharides and water-soluble compounds'
        })
      }
    }

    return preparations
  }

  // Get optimal ethanol percentage based on actual constituents
  private static getOptimalEthanolPercentageFromConstituents(
    constituents: Array<{ type: string; ethanolPercentage: number }>
  ): number {
    if (constituents.length === 0) return 50

    // Calculate weighted average based on constituent types
    const totalPercentage = constituents.reduce((sum, c) => sum + c.ethanolPercentage, 0)
    return Math.round(totalPercentage / constituents.length)
  }

  // Legacy method for backward compatibility
  private static getOptimalEthanolPercentage(
    herbName: string,
    actions: string[]
  ): number {
    const herbLower = herbName.toLowerCase()
    const actionsLower = actions.map((a) => a.toLowerCase())

    // High ethanol herbs (70-95%) - resinous, aromatic, high essential oils
    if (
      herbLower.includes('myrrh') ||
      herbLower.includes('propolis') ||
      herbLower.includes('pine') ||
      herbLower.includes('frankincense')
    ) {
      return 95
    }

    // Medium-high ethanol (60-70%) - alkaloid-rich herbs
    if (
      herbLower.includes('goldenseal') ||
      herbLower.includes('echinacea') ||
      herbLower.includes('ginkgo') ||
      herbLower.includes('ginseng') ||
      actionsLower.some((a) => a.includes('alkaloid'))
    ) {
      return 65
    }

    // Medium ethanol (45-60%) - most herbs with mixed compounds
    if (
      actionsLower.some(
        (a) => a.includes('antimicrobial') || a.includes('anti-inflammatory')
      )
    ) {
      return 50
    }

    // Lower ethanol (25-45%) - high tannin, mucilaginous herbs
    if (
      herbLower.includes('marshmallow') ||
      herbLower.includes('slippery elm') ||
      herbLower.includes('plantain') ||
      actionsLower.some((a) => a.includes('demulcent'))
    ) {
      return 35
    }

    // Default for most herbs
    return 50
  }

  // Generate compound extraction data
  static generateCompounds(
    herbName: string,
    actions: string[]
  ): Array<{
    name: string
    type: string
    ethanolPercentage: number
    description: string
  }> {
    const compounds = []
    const herbLower = herbName.toLowerCase()

    // Common compounds based on herb name and actions
    if (actions.some((a) => a.toLowerCase().includes('anti-inflammatory'))) {
      compounds.push({
        name: 'Flavonoids',
        type: 'Polyphenol',
        ethanolPercentage: 60,
        description:
          'Plant pigments with anti-inflammatory and antioxidant properties',
      })
    }

    if (actions.some((a) => a.toLowerCase().includes('antimicrobial'))) {
      compounds.push({
        name: 'Essential Oils',
        type: 'Volatile Compounds',
        ethanolPercentage: 70,
        description:
          'Aromatic compounds with antimicrobial and therapeutic properties',
      })
    }

    if (
      actions.some(
        (a) =>
          a.toLowerCase().includes('bitter') ||
          a.toLowerCase().includes('digestive')
      )
    ) {
      compounds.push({
        name: 'Bitter Glycosides',
        type: 'Glycoside',
        ethanolPercentage: 45,
        description: 'Compounds that stimulate digestion and liver function',
      })
    }

    // Herb-specific compounds
    if (herbLower.includes('echinacea')) {
      compounds.push({
        name: 'Alkylamides',
        type: 'Alkaloid',
        ethanolPercentage: 65,
        description: 'Immune-stimulating compounds unique to Echinacea',
      })
      compounds.push({
        name: 'Polysaccharides',
        type: 'Carbohydrate',
        ethanolPercentage: 25,
        description: 'Large sugar molecules that support immune function',
      })
    }

    if (herbLower.includes('ginkgo')) {
      compounds.push({
        name: 'Ginkgolides',
        type: 'Terpenoid',
        ethanolPercentage: 80,
        description:
          'Unique compounds that improve circulation and brain function',
      })
    }

    if (herbLower.includes('ginseng')) {
      compounds.push({
        name: 'Ginsenosides',
        type: 'Saponin',
        ethanolPercentage: 70,
        description: 'Adaptogenic compounds that help the body manage stress',
      })
    }

    // Default compounds if none specific found
    if (compounds.length === 0) {
      compounds.push({
        name: 'Tannins',
        type: 'Polyphenol',
        ethanolPercentage: 40,
        description: 'Astringent compounds with antimicrobial properties',
      })
      compounds.push({
        name: 'Mucilage',
        type: 'Polysaccharide',
        ethanolPercentage: 0,
        description: 'Soothing gel-like substances, water-soluble only',
      })
    }

    return compounds
  }

  private static generateDetailedUses(actions: string[]): string[] {
    const detailedUses: string[] = []

    for (const action of actions) {
      const actionLower = action.toLowerCase()

      if (actionLower.includes('anti-inflammatory')) {
        detailedUses.push(
          'Reduces inflammation in joints, muscles, and tissues'
        )
      }
      if (
        actionLower.includes('antimicrobial') ||
        actionLower.includes('antibacterial')
      ) {
        detailedUses.push('Fights bacterial, viral, and fungal infections')
      }
      if (
        actionLower.includes('digestive') ||
        actionLower.includes('carminative')
      ) {
        detailedUses.push('Improves digestion, reduces gas and bloating')
      }
      if (actionLower.includes('nervine') || actionLower.includes('sedative')) {
        detailedUses.push(
          'Calms the nervous system, reduces anxiety and stress'
        )
      }
      if (actionLower.includes('expectorant')) {
        detailedUses.push('Helps clear mucus from respiratory tract')
      }
      if (actionLower.includes('diuretic')) {
        detailedUses.push(
          'Increases urine production, supports kidney function'
        )
      }
    }

    return detailedUses
  }

  private static generateContraindications(herbName: string): string[] {
    // Basic safety guidelines - in production, use a comprehensive database
    const common = [
      'Pregnancy and breastfeeding (consult healthcare provider)',
      'Children under 12 (adjust dosage or avoid)',
      'Severe liver or kidney disease',
    ]

    // Add herb-specific contraindications based on known data
    const herbLower = herbName.toLowerCase()

    if (herbLower.includes('willow') || herbLower.includes('wintergreen')) {
      common.push('Aspirin allergy or bleeding disorders')
    }

    if (herbLower.includes('ginseng')) {
      common.push('High blood pressure, insomnia, or anxiety disorders')
    }

    return common
  }

  private static generateInteractions(herbName: string): string[] {
    // Basic interaction warnings
    const interactions = [
      'Blood thinning medications (warfarin, aspirin)',
      'Diabetes medications (may affect blood sugar)',
      'Blood pressure medications',
    ]

    const herbLower = herbName.toLowerCase()

    if (herbLower.includes('ginseng')) {
      interactions.push('Stimulant medications, caffeine')
    }

    if (herbLower.includes('valerian') || herbLower.includes('passionflower')) {
      interactions.push('Sedative medications, alcohol')
    }

    return interactions
  }

  // Get herb constituents from database
  static async getHerbConstituentsFromDB(herbId: string) {
    try {
      const { HerbsDatabase } = await import('./database')
      const herb = await HerbsDatabase.getHerbById(herbId)
      return herb?.constituents || []
    } catch (error) {
      console.error('Error fetching constituents from database:', error)
      return []
    }
  }

  // Enrich herb data with database information
  static async enrichHerbData(herb: {
    id?: string
    common_name: string
    latin_name: string
    medicinal_actions?: string[]
    family?: string
    botanical_info?: USDAPlantInfo | null
  }): Promise<EnrichedHerbData> {
    // Get full herb data from database if ID provided
    let fullHerbData = null
    if (herb.id) {
      try {
        const { HerbsDatabase } = await import('./database')
        fullHerbData = await HerbsDatabase.getHerbById(herb.id)
      } catch (error) {
        console.error('Error fetching full herb data:', error)
      }
    }

    // Use database constituents with full compound information
    const constituents = fullHerbData?.constituents?.map((c: any) => ({
      name: c.name,
      type: c.class || 'Unknown',
      ethanolPercentage: this.parseEthanolRange(c.solubility?.ethanol_range),
      waterSoluble: c.solubility?.water || false,
      description: c.notes || this.getCompoundDescription(c.class || 'Unknown'),
      medicinalTooltip: this.getMedicinalTooltip(c.class || 'Unknown', c.name),
      extractionNotes: this.getExtractionNotes(c.class || 'Unknown', c.solubility?.ethanol_range)
    })) || []

    // Generate base preparations based on actual constituents
    const preparations = this.generateEnhancedPreparations(
      herb.common_name,
      herb.medicinal_actions || [],
      constituents
    )

    // Use botanical info from database
    const botanicalInfo = fullHerbData?.botanical_info || herb.botanical_info

    // Generate description from database data
    let description = `${herb.common_name} (${herb.latin_name}) is a medicinal plant`
    if (botanicalInfo?.family || herb.family || fullHerbData?.family) {
      description += ` in the ${botanicalInfo?.family || herb.family || fullHerbData?.family} family`
    }
    if (fullHerbData?.folk_uses) {
      description += `. Traditional uses: ${fullHerbData.folk_uses.substring(0, 200)}...`
    }
    description += '.'

    // Use scraped PubMed data from database if available
    const scrapedApplications = fullHerbData?.specific_applications || []
    const scrapedSafety = fullHerbData?.safety_contraindications || []
    const scrapedInteractions = fullHerbData?.drug_interactions || []
    const scrapedPreparations = fullHerbData?.enhanced_preparations || []

    // Combine database preparations with scraped preparations
    const allPreparations = [...preparations]
    if (scrapedPreparations.length > 0) {
      scrapedPreparations.forEach((prep: any) => {
        allPreparations.push({
          type: prep.type || 'Research-Based Method',
          method: prep.method || prep.description || 'See research notes',
          dosage: prep.dosage,
          notes: `From research: ${prep.source || 'PubMed studies'}`
        })
      })
    }

    // Use scraped applications or fall back to database indications
    const detailedUses = scrapedApplications.length > 0 
      ? scrapedApplications.map((app: any) => {
          // Clean up the condition text and make it more readable
          let condition = app.condition || app.usage || ''
          
          // Remove incomplete sentences and clean up text
          condition = condition.replace(/\b(the|of|in|for|with|but|namely)\s*$/i, '')
          condition = condition.replace(/\s+/g, ' ').trim()
          
          // Capitalize first letter
          condition = condition.charAt(0).toUpperCase() + condition.slice(1)
          
          // Only show evidence level if it's meaningful
          const evidenceLevel = app.evidence_level === 'research' ? 'Research-based' : app.evidence_level
          
          return condition.length > 10 ? `${condition} (${evidenceLevel})` : null
        }).filter(Boolean)
      : fullHerbData?.indications || this.generateDetailedUses(herb.medicinal_actions || [])

    // Use scraped safety data or fall back to generated
    const contraindications = scrapedSafety.length > 0
      ? scrapedSafety.map((safety: any) => {
          let description = safety.description || safety.condition || ''
          description = description.replace(/^(contraindication|precaution|warning):\s*/i, '')
          description = description.charAt(0).toUpperCase() + description.slice(1)
          return description.length > 10 ? `${description} (${safety.severity})` : null
        }).filter(Boolean)
      : fullHerbData?.safety ? [fullHerbData.safety] : this.generateContraindications(herb.common_name)

    // Use scraped interactions or fall back to generated
    const interactions = scrapedInteractions.length > 0
      ? scrapedInteractions.map((interaction: any) => {
          const drugClass = interaction.drug_class || 'Unknown medications'
          const recommendation = interaction.recommendation || 'Monitor closely'
          return `${drugClass}: ${recommendation} (${interaction.severity})`
        })
      : fullHerbData?.interactions || this.generateInteractions(herb.common_name)

    return {
      description,
      detailedUses,
      preparations: allPreparations,
      constituents,
      botanicalInfo,
      contraindications,
      interactions,
    }
  }

  // Parse ethanol range from database format (e.g., "40-60%" -> 50)
  private static parseEthanolRange(range: string | null | undefined): number {
    if (!range) return 50

    const match = range.match(/(\d+)(?:-(\d+))?%?/)
    if (!match) return 50

    const min = parseInt(match[1])
    const max = match[2] ? parseInt(match[2]) : min
    return Math.round((min + max) / 2)
  }

  // Get medicinal tooltip for compound targeting
  private static getMedicinalTooltip(compoundClass: string, compoundName: string): string {
    const tooltips: Record<string, string> = {
      'Alkaloid': `${compoundName} is an alkaloid - nitrogen-containing compounds with potent biological activity. Best extracted with 60-95% ethanol. Target for: nervous system effects, antimicrobial activity, pain relief.`,
      'Polyphenol': `${compoundName} is a polyphenol - antioxidant compounds that provide therapeutic benefits. Extract with 40-70% ethanol. Target for: anti-inflammatory, antioxidant, cardiovascular support.`,
      'Flavonoid': `${compoundName} is a flavonoid - plant pigments with anti-inflammatory properties. Extract with 50-70% ethanol. Target for: inflammation, circulation, immune support.`,
      'Glycoside': `${compoundName} is a glycoside - sugar-bound active compounds. Extract with 25-60% ethanol. Target for: heart conditions, digestive support, antimicrobial effects.`,
      'Terpenoid': `${compoundName} is a terpenoid - aromatic compounds with diverse therapeutic effects. Extract with 70-95% ethanol. Target for: antimicrobial, anti-inflammatory, respiratory support.`,
      'Saponin': `${compoundName} is a saponin - soap-like compounds with immune and anti-inflammatory effects. Extract with 50-70% ethanol. Target for: immune support, cholesterol management, expectorant effects.`,
      'Tannin': `${compoundName} is a tannin - astringent compounds that tighten tissues. Extract with 25-50% ethanol. Target for: wound healing, diarrhea, inflammation.`,
      'Essential Oil': `${compoundName} is from essential oils - volatile aromatic compounds. Extract with 90-95% ethanol or steam distillation. Target for: antimicrobial, respiratory, mood effects.`,
      'Polysaccharide': `${compoundName} is a polysaccharide - large sugar molecules with immune support properties. Water extraction preferred. Target for: immune modulation, soothing effects.`,
      'Phenolic Acid': `${compoundName} is a phenolic acid - antioxidant compounds with anti-inflammatory properties. Extract with 50-70% ethanol. Target for: antioxidant, liver support, anti-inflammatory effects.`
    }

    return tooltips[compoundClass] || `${compoundName} is a bioactive plant compound. Extraction method varies by compound type. Consult literature for specific therapeutic applications.`
  }

  // Get extraction notes for targeting specific compounds
  private static getExtractionNotes(compoundClass: string, ethanolRange?: string): string {
    const notes: Record<string, string> = {
      'Alkaloid': 'Use higher ethanol concentrations (60-95%). Add acid to improve extraction of basic alkaloids.',
      'Polyphenol': 'Moderate ethanol (40-70%) works well. Avoid excessive heat to prevent degradation.',
      'Flavonoid': 'Best with 50-70% ethanol. Can also use glycerin for gentler extraction.',
      'Glycoside': 'Lower to moderate ethanol (25-60%). Some are water-soluble, others need alcohol.',
      'Terpenoid': 'High ethanol (70-95%) or steam distillation for volatile terpenoids.',
      'Saponin': 'Moderate ethanol (50-70%). Foaming indicates successful saponin extraction.',
      'Tannin': 'Lower ethanol (25-50%) or water extraction. Astringent taste indicates presence.',
      'Essential Oil': 'Steam distillation or very high ethanol (90-95%). Volatile - avoid heat.',
      'Polysaccharide': 'Water extraction preferred. Heat may help break down cell walls.',
      'Phenolic Acid': 'Moderate ethanol (50-70%). pH adjustment may improve extraction.'
    }

    let note = notes[compoundClass] || 'Extraction method depends on compound solubility.'
    if (ethanolRange) {
      note += ` Database suggests: ${ethanolRange} ethanol.`
    }
    return note
  }

  // Get compound type description
  private static getCompoundDescription(type: string): string {
    const descriptions: Record<string, string> = {
      Alkaloid: 'Nitrogen-containing compounds with potent biological activity',
      Polyphenol: 'Antioxidant compounds that provide color and astringency',
      Glycoside:
        'Sugar-bound compounds that release active molecules when digested',
      Terpenoid:
        'Aromatic compounds responsible for scent and many therapeutic effects',
      Saponin: 'Soap-like compounds with anti-inflammatory and immune effects',
      Polysaccharide:
        'Large sugar molecules that provide immune support and soothing effects',
      'Essential Oil':
        'Volatile aromatic compounds with antimicrobial properties',
      Tannin:
        'Astringent compounds that tighten tissues and have antimicrobial effects',
    }

    return (
      descriptions[type] ||
      'Bioactive plant compound with therapeutic properties'
    )
  }
}
