const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class PDFHerbScraper {
  constructor(pdfPath) {
    this.pdfPath = pdfPath
    this.herbs = []
    this.therapeuticCategories = new Set()
  }

  // Extract text from PDF using pdftotext (poppler-utils)
  async extractTextFromPDF() {
    try {
      console.log('Extracting text from PDF...');
      // Extract only pages 56-283 as specified
      // Use -layout to preserve column structure, then we'll process it properly
      const command = `pdftotext -f 56 -l 283 -layout "${this.pdfPath}" -`;
      const text = execSync(command, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
      
      // Process the multi-column layout
      const processedText = this.processMultiColumnLayout(text);
      return processedText;
    } catch (error) {
      console.error('Error extracting PDF text:', error.message);
      console.log('Make sure poppler-utils is installed: brew install poppler');
      throw error;
    }
  }

  // Process the multi-column layout
  processMultiColumnLayout(text) {
    console.log('Processing multi-column layout...');
    
    // Split text into pages
    const pages = text.split('\f');
    let processedPages = [];
    
    for (let pageText of pages) {
      if (!pageText.trim()) continue;
      
      // Split each page into lines
      const lines = pageText.split('\n');
      let processedLines = [];
      
      // Group lines that belong to the same herb entry
      // Look for herb headers and group subsequent content
      let currentHerbLines = [];
      let inHerbEntry = false;
      
      for (let line of lines) {
        // Check if this line contains a Latin name (herb header)
        if (/[A-Z][a-z]+\s+[a-z]+\s+\([A-Za-z]+\)/.test(line)) {
          // Save previous herb if exists
          if (currentHerbLines.length > 0) {
            processedLines.push(this.reconstructHerbEntry(currentHerbLines));
            currentHerbLines = [];
          }
          // Start new herb
          currentHerbLines.push(line);
          inHerbEntry = true;
        } else if (inHerbEntry && line.trim()) {
          currentHerbLines.push(line);
        } else if (!line.trim() && currentHerbLines.length > 0) {
          // Empty line might indicate end of section
          currentHerbLines.push(line);
        }
      }
      
      // Don't forget the last herb on the page
      if (currentHerbLines.length > 0) {
        processedLines.push(this.reconstructHerbEntry(currentHerbLines));
      }
      
      processedPages.push(processedLines.join('\n\n'));
    }
    
    return processedPages.join('\n\n=== PAGE BREAK ===\n\n');
  }
  
  // Reconstruct herb entry from fragmented lines
  reconstructHerbEntry(lines) {
    let reconstructed = [];
    let currentSection = '';
    
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      
      // Identify section headers
      if (line.includes('Habitat & Cultivation')) {
        currentSection = 'HABITAT';
        reconstructed.push('\n=== HABITAT ===');
      } else if (line.includes('Key Constituents')) {
        currentSection = 'CONSTITUENTS';
        reconstructed.push('\n=== CONSTITUENTS ===');
      } else if (line.includes('Key Actions')) {
        currentSection = 'ACTIONS';
        reconstructed.push('\n=== ACTIONS ===');
      } else if (line.includes('Research')) {
        currentSection = 'RESEARCH';
        reconstructed.push('\n=== RESEARCH ===');
      } else if (line.includes('Traditional') && line.includes('Current')) {
        currentSection = 'USES';
        reconstructed.push('\n=== USES ===');
      } else if (line.includes('Key Preparations')) {
        currentSection = 'PREPARATIONS';
        reconstructed.push('\n=== PREPARATIONS ===');
      } else if (line.includes('Parts Used')) {
        currentSection = 'PARTS';
        reconstructed.push('\n=== PARTS ===');
      } else {
        // Regular content line
        if (line.startsWith('■') || line.startsWith('•')) {
          reconstructed.push('• ' + line.substring(1).trim());
        } else {
          reconstructed.push(line);
        }
      }
    }
    
    return reconstructed.join('\n');
  }

  // Clean and structure the extracted text
  cleanExtractedText(text) {
    console.log('Cleaning extracted text...')
    
    // Remove excessive whitespace and normalize line breaks
    let cleaned = text
      .replace(/\r\n/g, '\n')  // Normalize line endings
      .replace(/\n{3,}/g, '\n\n')  // Reduce multiple line breaks to double
      .replace(/[ \t]{2,}/g, ' ')  // Reduce multiple spaces to single
      .replace(/^\s+/gm, '')  // Remove leading whitespace from lines
      .trim()

    // Add clear section markers for better parsing
    cleaned = cleaned
      .replace(/Habitat & Cultivation/g, '\n\n=== HABITAT ===\n')
      .replace(/Key Constituents/g, '\n\n=== CONSTITUENTS ===\n')
      .replace(/Key Actions/g, '\n\n=== ACTIONS ===\n')
      .replace(/Research/g, '\n\n=== RESEARCH ===\n')
      .replace(/Traditional &\s*Current Uses/g, '\n\n=== USES ===\n')
      .replace(/Key Preparations & Their Uses/g, '\n\n=== PREPARATIONS ===\n')
      .replace(/Self-help Uses/g, '\n\n=== SELF-HELP ===\n')
      .replace(/Parts Used/g, '\n\n=== PARTS ===\n')

    // Clean up bullet points
    cleaned = cleaned
      .replace(/■\s*/g, '• ')  // Normalize bullet points
      .replace(/^\s*•\s*/gm, '• ')  // Ensure consistent bullet formatting

    return cleaned
  }

  // Parse the extracted text and identify herb entries
  parseHerbEntries(text) {
    console.log('Parsing herb entries...');
    
    // Split text by herb headers - look for Latin name (Genus species) followed by family in parentheses
    const herbSplitRegex = /([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)/g;
    
    // Find all herb headers with their positions
    const herbHeaders = [];
    let match;
    while ((match = herbSplitRegex.exec(text)) !== null) {
      herbHeaders.push({
        latinName: match[1],
        family: match[2],
        startIndex: match.index,
        fullMatch: match[0]
      });
    }
    
    console.log(`Found ${herbHeaders.length} herb headers`);
    
    // Extract text for each herb
    const herbEntries = [];
    for (let i = 0; i < herbHeaders.length; i++) {
      const currentHeader = herbHeaders[i];
      const nextHeader = herbHeaders[i + 1];
      
      const startIndex = currentHeader.startIndex;
      const endIndex = nextHeader ? nextHeader.startIndex : text.length;
      
      const herbText = text.substring(startIndex, endIndex).trim();
      
      // Only include if it contains actual herb data sections
      if (herbText.includes('=== HABITAT ===') || 
          herbText.includes('=== CONSTITUENTS ===') || 
          herbText.includes('=== ACTIONS ===') ||
          herbText.includes('=== RESEARCH ===')) {
        herbEntries.push(herbText);
      }
    }
    
    console.log(`Valid herb entries after filtering: ${herbEntries.length}`);
    return herbEntries;
  }

  // Extract structured data from a single herb entry
  extractHerbData(herbText) {
    const herb = {
      latinName: '',
      commonName: '',
      family: '',
      summary: '',
      habitat: '',
      relatedSpecies: '',
      keyConstituents: [],
      keyActions: [],
      research: [],
      traditionalUses: [],
      currentUses: [],
      preparations: [],
      therapeuticCategories: [],
      partsUsed: '',
      cautions: ''
    };

    // Extract Latin name and family from header pattern: "Achillea millefolium (Asteraceae)"
    const headerMatch = herbText.match(/([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)/);
    if (headerMatch) {
      herb.latinName = headerMatch[1].trim();
      herb.family = headerMatch[2].trim();
    }

    // Extract common name - usually appears after the Latin name
    const lines = herbText.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(herb.latinName) && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine && !nextLine.includes('===') && nextLine.length < 50) {
          herb.commonName = nextLine;
          break;
        }
      }
    }

    // Extract summary - text before first section marker
    const summaryMatch = herbText.match(/\([A-Za-z]+\)[\s\S]*?\n(.*?)(?=\n=== |$)/s);
    if (summaryMatch) {
      let summary = summaryMatch[1].trim();
      // Clean up summary by removing section headers that might have leaked in
      summary = summary.replace(/Habitat & Cultivation|Key Constituents|Key Actions|Research|Traditional|Parts Used/g, '').trim();
      herb.summary = summary.replace(/\s+/g, ' ');
    }

    // Extract sections using the structured markers
    const sections = this.extractSections(herbText);

    // Extract Habitat & Cultivation
    if (sections.HABITAT) {
      herb.habitat = sections.HABITAT.replace(/\s+/g, ' ').trim();
    }

    // Extract Key Constituents
    if (sections.CONSTITUENTS) {
      herb.keyConstituents = sections.CONSTITUENTS
        .split(/\n•\s*/)
        .filter(item => item.trim())
        .map(item => item.trim());
    }

    // Extract Key Actions
    if (sections.ACTIONS) {
      herb.keyActions = sections.ACTIONS
        .split(/\n•\s*/)
        .filter(item => item.trim())
        .map(item => item.trim());
    }

    // Extract Research
    if (sections.RESEARCH) {
      herb.research = [sections.RESEARCH.replace(/\s+/g, ' ').trim()];
    }

    // Extract Traditional & Current Uses
    if (sections.USES) {
      const usesText = sections.USES;
      const usesList = usesText.split(/\n•\s*/).filter(item => item.trim());
      
      usesList.forEach(use => {
        const cleanUse = use.trim();
        if (cleanUse.toLowerCase().includes('traditional') || cleanUse.toLowerCase().includes('historically')) {
          herb.traditionalUses.push(cleanUse);
        } else {
          herb.currentUses.push(cleanUse);
        }
      });
    }

    // Extract Parts Used
    if (sections.PARTS) {
      herb.partsUsed = sections.PARTS.replace(/\s+/g, ' ').trim();
    }

    // Extract Preparations
    if (sections.PREPARATIONS) {
      const prepLines = sections.PREPARATIONS.split('\n').filter(line => line.trim());
      herb.preparations = prepLines;
    }

    // Extract Cautions
    const cautionsMatch = herbText.match(/Cautions?\s*(.*?)(?=\n=== |\n\n|$)/s);
    if (cautionsMatch) {
      herb.cautions = cautionsMatch[1].trim().replace(/\s+/g, ' ');
    }

    // Extract therapeutic categories from actions and uses
    herb.therapeuticCategories = this.extractTherapeuticCategories(herb);

    return herb;
  }

  // Extract sections from structured text
  extractSections(text) {
    const sections = {};
    const sectionRegex = /=== (\w+) ===\n([\s\S]*?)(?=\n=== |\n\n=== |$)/g;
    
    let match;
    while ((match = sectionRegex.exec(text)) !== null) {
      const sectionName = match[1];
      const sectionContent = match[2].trim();
      sections[sectionName] = sectionContent;
    }
    
    return sections;
  }

  // Extract therapeutic categories based on actions and uses
  extractTherapeuticCategories(herb) {
    const categories = new Set()
    const text = `${herb.summary} ${herb.keyActions.join(
      ' '
    )} ${herb.currentUses.join(' ')} ${herb.traditionalUses.join(
      ' '
    )}`.toLowerCase()

    // Define therapeutic category patterns
    const categoryPatterns = {
      'wound healing': /wound|cut|bruise|injury|healing|vulnerary|antiseptic/,
      digestive:
        /digest|stomach|gastric|intestinal|nausea|indigestion|dyspepsia/,
      respiratory: /cough|bronchial|lung|respiratory|asthma|expectorant/,
      'immune support':
        /immune|infection|antimicrobial|antibacterial|antiviral/,
      'anti-inflammatory': /anti-inflammatory|inflammation|inflammatory/,
      cardiovascular: /heart|cardiac|circulation|blood pressure|cardiovascular/,
      'nervous system': /nervous|anxiety|stress|sedative|calming|nerve/,
      "women's health":
        /menstrual|gynecological|pregnancy|hormonal|reproductive/,
      'skin conditions': /skin|dermatitis|eczema|rash|topical|external/,
      'pain relief': /pain|analgesic|ache|rheumat|arthritic/,
      'liver support': /liver|hepatic|detox|cleansing/,
      urinary: /urinary|kidney|diuretic|bladder/,
      'cold and flu': /cold|flu|fever|viral|upper respiratory/,
      antioxidant: /antioxidant|free radical|oxidative/,
      antimicrobial: /antimicrobial|antibacterial|antifungal|antiseptic/,
    }

    for (const [category, pattern] of Object.entries(categoryPatterns)) {
      if (pattern.test(text)) {
        categories.add(category)
        this.therapeuticCategories.add(category)
      }
    }

    return Array.from(categories)
  }

  // Main scraping function
  async scrapeHerbs() {
    try {
      console.log('Starting PDF herb scraping...')

      // Extract text from PDF
      const pdfText = await this.extractTextFromPDF()

      // Parse herb entries
      const herbEntries = this.parseHerbEntries(pdfText)
      console.log(`Found ${herbEntries.length} potential herb entries`)

      // Process each herb entry
      for (let i = 0; i < herbEntries.length; i++) {
        console.log(`Processing herb ${i + 1}/${herbEntries.length}...`)
        const herbData = this.extractHerbData(herbEntries[i])

        // Only add if we successfully extracted a Latin name
        if (herbData.latinName) {
          this.herbs.push(herbData)
        }
      }

      console.log(`Successfully extracted ${this.herbs.length} herbs`)
      console.log(
        `Found ${this.therapeuticCategories.size} therapeutic categories`
      )

      return {
        herbs: this.herbs,
        therapeuticCategories: Array.from(this.therapeuticCategories),
        totalExtracted: this.herbs.length,
      }
    } catch (error) {
      console.error('Error during scraping:', error)
      throw error
    }
  }

  // Save results to JSON file
  async saveToJSON(outputPath = './herbs-extracted.json') {
    const data = {
      extractedAt: new Date().toISOString(),
      source: 'PDF Herb Reference',
      totalHerbs: this.herbs.length,
      therapeuticCategories: Array.from(this.therapeuticCategories),
      herbs: this.herbs,
    }

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2))
    console.log(`Saved ${this.herbs.length} herbs to ${outputPath}`)

    // Also save a summary
    const summary = {
      totalHerbs: this.herbs.length,
      therapeuticCategories: Array.from(this.therapeuticCategories),
      herbNames: this.herbs.map((h) => ({
        latin: h.latinName,
        common: h.commonName,
      })),
    }

    const summaryPath = outputPath.replace('.json', '-summary.json')
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
    console.log(`Saved summary to ${summaryPath}`)
  }
}

// Usage
async function main() {
  const pdfPath = './herbs.pdf' // Make sure to rename your PDF to this

  if (!fs.existsSync(pdfPath)) {
    console.error(`PDF file not found: ${pdfPath}`)
    console.log(
      'Please rename your PDF file to "herbs.pdf" and place it in the scripts directory'
    )
    return
  }

  const scraper = new PDFHerbScraper(pdfPath)

  try {
    const results = await scraper.scrapeHerbs()
    await scraper.saveToJSON('./herbs-extracted.json')

    console.log('\n=== SCRAPING COMPLETE ===')
    console.log(`Total herbs extracted: ${results.totalExtracted}`)
    console.log(
      `Therapeutic categories found: ${results.therapeuticCategories.length}`
    )
    console.log('Files created:')
    console.log('- herbs-extracted.json (full data)')
    console.log('- herbs-extracted-summary.json (summary)')
  } catch (error) {
    console.error('Scraping failed:', error.message)
  }
}

if (require.main === module) {
  main()
}

module.exports = PDFHerbScraper
