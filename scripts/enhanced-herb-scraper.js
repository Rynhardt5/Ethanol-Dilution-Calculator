const { Pool } = require('pg')
const fetch = require('node-fetch')

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
})

class EnhancedHerbScraper {
  static async searchPubMedForHerbData(herbName, latinName) {
    try {
      console.log(`🔍 Searching PubMed for: ${herbName} (${latinName})`)
      
      // Enhanced search terms for specific applications, safety, and interactions
      const searchTerms = [
        `"${latinName}"[Title/Abstract] AND (medicinal OR therapeutic OR treatment)`,
        `"${latinName}" AND (contraindication OR "side effect" OR toxicity)`,
        `"${latinName}" AND ("drug interaction" OR pharmacokinetic OR pharmacodynamic)`,
        `"${latinName}" AND (preparation OR extract OR tincture OR dosage)`,
        `"${herbName}"[Title/Abstract] AND (safety OR adverse OR precaution)`
      ].join(' OR ')

      // Search for article IDs
      const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(
        searchTerms
      )}&retmax=20&retmode=json`

      const searchResponse = await fetch(searchUrl)
      const searchData = await searchResponse.json()

      if (!searchData.esearchresult?.idlist?.length) {
        console.log(`❌ No PubMed articles found for ${herbName}`)
        return null
      }

      // Fetch article details
      const ids = searchData.esearchresult.idlist.slice(0, 10).join(',') // Limit to 10 articles
      const fetchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids}&retmode=xml`

      const fetchResponse = await fetch(fetchUrl)
      const xmlText = await fetchResponse.text()

      return this.extractHerbDataFromPubMed(xmlText, herbName)
    } catch (error) {
      console.error(`❌ PubMed search error for ${herbName}:`, error.message)
      return null
    }
  }

  static extractHerbDataFromPubMed(xmlText, herbName) {
    const data = {
      specific_applications: [],
      safety_contraindications: [],
      drug_interactions: [],
      enhanced_preparations: [],
      pubmed_studies: []
    }

    try {
      // Extract articles
      const articleMatches = xmlText.match(/<PubmedArticle>[\s\S]*?<\/PubmedArticle>/g) || []

      for (const articleXml of articleMatches.slice(0, 10)) {
        const pmid = this.extractXMLContent(articleXml, 'PMID') || ''
        const title = this.extractXMLContent(articleXml, 'ArticleTitle') || ''
        const abstract = this.extractXMLContent(articleXml, 'AbstractText') || ''
        const pubDate = this.extractXMLContent(articleXml, 'PubDate') || ''

        if (!title || !abstract) continue

        // Extract specific applications
        const applications = this.extractApplicationsFromText(title + ' ' + abstract)
        data.specific_applications.push(...applications)

        // Extract safety data
        const safetyData = this.extractSafetyDataFromText(title + ' ' + abstract)
        data.safety_contraindications.push(...safetyData)

        // Extract drug interactions
        const interactions = this.extractInteractionsFromText(title + ' ' + abstract)
        data.drug_interactions.push(...interactions)

        // Extract preparation methods
        const preparations = this.extractPreparationsFromText(title + ' ' + abstract)
        data.enhanced_preparations.push(...preparations)

        // Store study reference
        data.pubmed_studies.push({
          pmid,
          title,
          year: this.extractYear(pubDate),
          findings: abstract.substring(0, 500) + '...'
        })
      }

      // Remove duplicates and enhance data
      data.specific_applications = this.removeDuplicateApplications(data.specific_applications)
      data.safety_contraindications = this.removeDuplicateSafety(data.safety_contraindications)
      data.drug_interactions = this.removeDuplicateInteractions(data.drug_interactions)
      data.enhanced_preparations = this.removeDuplicatePreparations(data.enhanced_preparations)

      console.log(`✅ Extracted data for ${herbName}:`)
      console.log(`   - Applications: ${data.specific_applications.length}`)
      console.log(`   - Safety items: ${data.safety_contraindications.length}`)
      console.log(`   - Interactions: ${data.drug_interactions.length}`)
      console.log(`   - Preparations: ${data.enhanced_preparations.length}`)

      return data
    } catch (error) {
      console.error('Error extracting PubMed data:', error)
      return data
    }
  }

  static extractApplicationsFromText(text) {
    const applications = []
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 30)

    // More specific therapeutic applications patterns
    const applicationPatterns = [
      { pattern: /(?:used to treat|treatment of|treating)\s+([a-zA-Z\s]{20,60})(?:\s+(?:in|with|by)|\.|,|$)/gi, type: 'Treatment of' },
      { pattern: /effective\s+(?:for|against|in treating)\s+([a-zA-Z\s]{20,60})(?:\s+(?:in|with|by)|\.|,|$)/gi, type: 'Effective for' },
      { pattern: /(?:indicated for|beneficial for)\s+([a-zA-Z\s]{20,60})(?:\s+(?:in|with|by)|\.|,|$)/gi, type: 'Indicated for' },
      { pattern: /therapeutic\s+(?:effects?|benefits?)\s+(?:in|for)\s+([a-zA-Z\s]{20,60})(?:\s+(?:patients|treatment)|\.|,|$)/gi, type: 'Therapeutic for' },
      { pattern: /management\s+of\s+([a-zA-Z\s]{20,60})(?:\s+(?:in|with|by)|\.|,|$)/gi, type: 'Management of' },
      { pattern: /prevention\s+of\s+([a-zA-Z\s]{20,60})(?:\s+(?:in|with|by)|\.|,|$)/gi, type: 'Prevention of' }
    ]

    sentences.forEach(sentence => {
      // Skip sentences that are clearly not about therapeutic uses
      if (sentence.match(/(?:study|research|analysis|investigation|methodology|FEEDAP|optimization|factors affecting)/i)) {
        return
      }

      applicationPatterns.forEach(({ pattern, type }) => {
        let match
        while ((match = pattern.exec(sentence)) !== null) {
          let condition = match[1]
          if (condition && condition.length > 15 && condition.length < 80) {
            // Clean up the condition text more thoroughly
            condition = condition.replace(/\s+/g, ' ').trim()
            condition = condition.replace(/^(the|a|an)\s+/i, '')
            condition = condition.replace(/\s+(and|or|but|namely|such as)\s*$/i, '')
            condition = condition.replace(/,\s*$/i, '')
            
            // Filter out incomplete or non-medical terms
            const invalidPatterns = [
              /^(study|research|analysis|investigation|methodology|optimization)/i,
              /^[A-Z]{2,}\s/,  // Acronyms at start
              /could not conclude/i,
              /factors affecting/i,
              /different factors/i,
              /^(the|a|an)\s*$/i
            ]

            const isValid = !invalidPatterns.some(pattern => condition.match(pattern)) &&
                          condition.length > 15 &&
                          condition.match(/[a-z]/i) && // Contains letters
                          !condition.match(/^\s*$/) // Not just whitespace

            if (isValid) {
              applications.push({
                condition: condition.trim(),
                usage: type,
                evidence_level: 'research',
                source: 'PubMed'
              })
            }
          }
        }
      })
    })

    return applications
  }

  static extractSafetyDataFromText(text) {
    const safetyData = []
    const textLower = text.toLowerCase()

    // Safety and contraindication patterns
    const safetyPatterns = [
      { pattern: /contraindicated?\s+(?:in|for|with)\s+([^.]{10,80})/gi, type: 'contraindication', severity: 'severe' },
      { pattern: /(?:side effect|adverse effect|adverse reaction)s?\s+(?:include|of|were)\s+([^.]{10,80})/gi, type: 'precaution', severity: 'moderate' },
      { pattern: /toxic(?:ity)?\s+(?:at|in|with)\s+([^.]{10,80})/gi, type: 'warning', severity: 'severe' },
      { pattern: /caution\s+(?:in|with|for)\s+([^.]{10,80})/gi, type: 'precaution', severity: 'mild' },
      { pattern: /avoid\s+(?:in|with|during)\s+([^.]{10,80})/gi, type: 'contraindication', severity: 'moderate' },
      { pattern: /not recommended\s+(?:for|in|with)\s+([^.]{10,80})/gi, type: 'contraindication', severity: 'moderate' }
    ]

    safetyPatterns.forEach(({ pattern, type, severity }) => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const condition = match[1]
        if (condition && condition.length > 5 && condition.length < 150) {
          safetyData.push({
            type,
            condition: condition.trim(),
            severity,
            description: `${type}: ${condition.trim()}`,
            source: 'PubMed'
          })
        }
      }
    })

    return safetyData
  }

  static extractInteractionsFromText(text) {
    const interactions = []

    // Drug interaction patterns
    const interactionPatterns = [
      { pattern: /interact(?:s|ion)?\s+with\s+([^.]{10,80})/gi, type: 'unknown' },
      { pattern: /potentiate(?:s)?\s+(?:the effect of\s+)?([^.]{10,80})/gi, type: 'synergistic' },
      { pattern: /antagonize(?:s)?\s+(?:the effect of\s+)?([^.]{10,80})/gi, type: 'antagonistic' },
      { pattern: /enhance(?:s)?\s+(?:the effect of\s+)?([^.]{10,80})/gi, type: 'additive' },
      { pattern: /contraindicated\s+with\s+([^.]{10,80})/gi, type: 'antagonistic' },
      { pattern: /avoid\s+(?:concurrent use\s+)?with\s+([^.]{10,80})/gi, type: 'unknown' }
    ]

    interactionPatterns.forEach(({ pattern, type }) => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const drugInfo = match[1]
        if (drugInfo && drugInfo.length > 5 && drugInfo.length < 100) {
          interactions.push({
            drug_class: drugInfo.trim(),
            interaction_type: type,
            severity: type === 'antagonistic' ? 'severe' : 'moderate',
            recommendation: `Monitor closely when used with ${drugInfo.trim()}`,
            source: 'PubMed'
          })
        }
      }
    })

    return interactions
  }

  static extractPreparationsFromText(text) {
    const preparations = []

    // Preparation method patterns
    const preparationPatterns = [
      { pattern: /extract(?:ed)?\s+(?:with|using)\s+([^.]{10,80})/gi, type: 'extract' },
      { pattern: /tincture\s+(?:prepared|made)\s+(?:with|using|at)\s+([^.]{10,80})/gi, type: 'tincture' },
      { pattern: /decoction\s+(?:prepared|made)\s+(?:with|using|by)\s+([^.]{10,80})/gi, type: 'decoction' },
      { pattern: /infusion\s+(?:prepared|made)\s+(?:with|using|by)\s+([^.]{10,80})/gi, type: 'infusion' },
      { pattern: /dosage\s+(?:of|was|used)\s+([^.]{10,80})/gi, type: 'dosage' },
      { pattern: /administered\s+(?:at|as)\s+([^.]{10,80})/gi, type: 'administration' }
    ]

    preparationPatterns.forEach(({ pattern, type }) => {
      let match
      while ((match = pattern.exec(text)) !== null) {
        const method = match[1]
        if (method && method.length > 5 && method.length < 150) {
          preparations.push({
            type,
            method: method.trim(),
            source: 'PubMed research',
            evidence_level: 'clinical'
          })
        }
      }
    })

    return preparations
  }

  // Helper methods for removing duplicates
  static removeDuplicateApplications(applications) {
    const seen = new Set()
    return applications.filter(app => {
      const key = app.condition.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  static removeDuplicateSafety(safetyData) {
    const seen = new Set()
    return safetyData.filter(item => {
      const key = item.condition.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  static removeDuplicateInteractions(interactions) {
    const seen = new Set()
    return interactions.filter(item => {
      const key = item.drug_class.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  static removeDuplicatePreparations(preparations) {
    const seen = new Set()
    return preparations.filter(prep => {
      const key = `${prep.type}-${prep.method}`.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  static extractXMLContent(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
    const match = xml.match(regex)
    return match ? match[1].replace(/<[^>]*>/g, '').trim() : ''
  }

  static extractYear(pubDate) {
    const yearMatch = pubDate.match(/(\d{4})/)
    return yearMatch ? yearMatch[1] : ''
  }

  // Database operations
  static async updateHerbWithEnhancedData(herbId, scrapedData) {
    const query = `
      UPDATE herbs 
      SET 
        specific_applications = $2,
        enhanced_preparations = $3,
        safety_contraindications = $4,
        drug_interactions = $5,
        pubmed_data = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `

    await pool.query(query, [
      herbId,
      JSON.stringify(scrapedData.specific_applications || []),
      JSON.stringify(scrapedData.enhanced_preparations || []),
      JSON.stringify(scrapedData.safety_contraindications || []),
      JSON.stringify(scrapedData.drug_interactions || []),
      JSON.stringify(scrapedData.pubmed_studies || [])
    ])
  }

  static async getAllHerbsForScraping() {
    const query = `
      SELECT id, common_name, latin_name, family
      FROM herbs 
      WHERE latin_name IS NOT NULL 
      AND latin_name != ''
      AND (specific_applications IS NULL OR pubmed_data IS NULL)
      ORDER BY common_name
    `

    const result = await pool.query(query)
    return result.rows
  }

  static async scrapeAllHerbData() {
    console.log('🌿 Starting Enhanced Herb Data Scraping...')
    console.log('📊 Targeting: Specific Applications, Preparations, Safety & Contraindications, Drug Interactions')

    try {
      const herbs = await this.getAllHerbsForScraping()
      console.log(`Found ${herbs.length} herbs to process`)

      let processed = 0
      let updated = 0
      let errors = 0

      for (const herb of herbs) {
        try {
          console.log(`\n🔍 Processing: ${herb.common_name} (${herb.latin_name})`)

          const scrapedData = await this.searchPubMedForHerbData(herb.common_name, herb.latin_name)

          if (scrapedData && (
            scrapedData.specific_applications.length > 0 ||
            scrapedData.safety_contraindications.length > 0 ||
            scrapedData.drug_interactions.length > 0 ||
            scrapedData.enhanced_preparations.length > 0
          )) {
            await this.updateHerbWithEnhancedData(herb.id, scrapedData)
            console.log(`✅ Updated ${herb.common_name} with enhanced data`)
            updated++
          } else {
            console.log(`⚠️  No enhanced data found for ${herb.common_name}`)
          }

          processed++

          // Rate limiting - wait 2 seconds between requests to be respectful to PubMed
          await new Promise((resolve) => setTimeout(resolve, 2000))

          // Progress update every 5 herbs
          if (processed % 5 === 0) {
            console.log(`\n📊 Progress: ${processed}/${herbs.length} processed, ${updated} updated, ${errors} errors`)
          }
        } catch (error) {
          console.error(`❌ Error processing ${herb.common_name}:`, error.message)
          errors++
        }
      }

      console.log('\n🎉 Enhanced Herb Data Scraping completed!')
      console.log(`📊 Final stats:`)
      console.log(`   - Total herbs: ${herbs.length}`)
      console.log(`   - Processed: ${processed}`)
      console.log(`   - Updated: ${updated}`)
      console.log(`   - Errors: ${errors}`)
    } catch (error) {
      console.error('💥 Scraping failed:', error)
    } finally {
      await pool.end()
    }
  }
}

// Run scraping if called directly
if (require.main === module) {
  EnhancedHerbScraper.scrapeAllHerbData()
    .then(() => {
      console.log('✅ Enhanced herb scraping completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Enhanced herb scraping failed:', error)
      process.exit(1)
    })
}

module.exports = EnhancedHerbScraper
