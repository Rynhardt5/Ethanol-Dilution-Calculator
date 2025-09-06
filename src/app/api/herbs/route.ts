import { NextResponse } from 'next/server'
import HerbsDatabase from '@/lib/database'

interface Constituent {
  name: string
  class: string
  solubility: {
    water: boolean | string
    ethanol_range: string
  }
  notes: string
}

interface SolventRecommendation {
  preparation_type: string
  ethanol_percent: string
  ratio: string
  notes: string
}

interface Herb {
  id: string
  common_name: string
  latin_name: string
  family: string
  plant_parts_used: string[]
  medicinal_actions: string[]
  indications: string[]
  folk_uses: string
  constituents: Constituent[]
  best_preparations: string[]
  solvent_recommendations: SolventRecommendation[]
  dosage: string
  safety: string
  interactions: string[]
  sources: string[]
  tags: string[]
}

// Sample herb data - fallback if Gist is not available
const sampleHerbs: Herb[] = [
  {
    id: 'echinacea_purpurea',
    common_name: 'Echinacea',
    latin_name: 'Echinacea purpurea',
    family: 'Asteraceae',
    plant_parts_used: ['root', 'flower'],
    medicinal_actions: ['immune stimulant', 'antiviral', 'anti-inflammatory'],
    indications: ['colds', 'flu', 'sore throat', 'wound healing'],
    folk_uses: 'Used by Native American tribes for infections and snakebites.',
    constituents: [
      {
        name: 'Alkylamides',
        class: 'lipophilic compounds',
        solubility: { water: false, ethanol_range: '50–70%' },
        notes: 'Cause tongue-tingling sensation, immunomodulatory.',
      },
      {
        name: 'Polysaccharides',
        class: 'polysaccharide',
        solubility: { water: true, ethanol_range: '0–25%' },
        notes:
          'Support immune activity; best extracted in teas or low-alcohol tinctures.',
      },
      {
        name: 'Caffeic acid derivatives',
        class: 'phenolic compounds',
        solubility: { water: true, ethanol_range: '25–50%' },
        notes: 'Antioxidant properties.',
      },
    ],
    best_preparations: ['tincture', 'infusion'],
    solvent_recommendations: [
      {
        preparation_type: 'tincture',
        ethanol_percent: '50–60%',
        ratio: '1:5 dried root',
        notes: 'Captures both alkylamides and polysaccharides.',
      },
      {
        preparation_type: 'infusion',
        ethanol_percent: '0%',
        ratio: 'Hot water steep 10–15 min',
        notes: 'Best for polysaccharides.',
      },
    ],
    dosage: '2–4 mL tincture, 3x daily.',
    safety: 'Avoid in autoimmune conditions without supervision.',
    interactions: ['immunosuppressants'],
    sources: ['Tilgner 2009', 'Hoffmann 2003'],
    tags: ['immune', 'respiratory', 'antiviral'],
  },
  {
    id: 'matricaria_chamomilla',
    common_name: 'Chamomile',
    latin_name: 'Matricaria chamomilla',
    family: 'Asteraceae',
    plant_parts_used: ['flower'],
    medicinal_actions: ['calmative', 'anti-inflammatory', 'digestive aid'],
    indications: ['insomnia', 'anxiety', 'indigestion', 'colic'],
    folk_uses: "Gentle children's remedy for restlessness and stomach upset.",
    constituents: [
      {
        name: 'Volatile oils (chamazulene, bisabolol)',
        class: 'essential oil',
        solubility: { water: false, ethanol_range: '70–95%' },
        notes: 'Anti-inflammatory and calming compounds.',
      },
      {
        name: 'Flavonoids (apigenin)',
        class: 'flavonoid',
        solubility: { water: true, ethanol_range: '40–60%' },
        notes: 'Sedative and antispasmodic effects.',
      },
    ],
    best_preparations: ['infusion', 'tincture'],
    solvent_recommendations: [
      {
        preparation_type: 'infusion',
        ethanol_percent: '0%',
        ratio: '2 tsp dried flowers per cup',
        notes: 'Soothes digestion and nerves.',
      },
      {
        preparation_type: 'tincture',
        ethanol_percent: '50–60%',
        ratio: '1:5 dried flowers',
        notes: 'Balances flavonoids and oils.',
      },
    ],
    dosage: '1 cup tea up to 3x daily, or 2–4 mL tincture 3x daily.',
    safety: 'Avoid if allergic to daisies.',
    interactions: ['may potentiate sedatives'],
    sources: ['Hoffmann 2003'],
    tags: ['digestive', 'nervous', 'calming'],
  },
  {
    id: 'hypericum_perforatum',
    common_name: "St John's Wort",
    latin_name: 'Hypericum perforatum',
    family: 'Hypericaceae',
    plant_parts_used: ['flowering tops'],
    medicinal_actions: ['antidepressant', 'antiviral', 'wound healing'],
    indications: ['mild depression', 'nerve pain', 'viral infections'],
    folk_uses:
      "Traditionally used for melancholy and 'warding off evil spirits'.",
    constituents: [
      {
        name: 'Hypericin',
        class: 'naphthodianthrone',
        solubility: { water: false, ethanol_range: '60–80%' },
        notes: 'Red pigment with antidepressant and antiviral properties.',
      },
      {
        name: 'Hyperforin',
        class: 'phloroglucinol derivative',
        solubility: { water: false, ethanol_range: '70–95%' },
        notes:
          'Primary antidepressant compound, affects neurotransmitter reuptake.',
      },
      {
        name: 'Flavonoids',
        class: 'flavonoid',
        solubility: { water: true, ethanol_range: '40–60%' },
        notes: 'Anti-inflammatory and antioxidant effects.',
      },
    ],
    best_preparations: ['tincture', 'oil infusion'],
    solvent_recommendations: [
      {
        preparation_type: 'tincture',
        ethanol_percent: '70–80%',
        ratio: '1:5 fresh tops',
        notes: 'Extracts hypericin and hyperforin.',
      },
      {
        preparation_type: 'oil infusion',
        ethanol_percent: '0%',
        ratio: 'Fresh tops in olive oil',
        notes: 'Traditional red oil for wounds.',
      },
    ],
    dosage: '2–4 mL tincture, 3x daily.',
    safety: 'Photosensitivity in high doses. Major drug interactions.',
    interactions: ['SSRIs', 'oral contraceptives', 'antivirals'],
    sources: ['Tilgner 2009'],
    tags: ['mood', 'nervous system', 'antiviral'],
  },
  {
    id: 'zingiber_officinale',
    common_name: 'Ginger',
    latin_name: 'Zingiber officinale',
    family: 'Zingiberaceae',
    plant_parts_used: ['rhizome'],
    medicinal_actions: ['carminative', 'anti-nausea', 'circulatory stimulant'],
    indications: [
      'nausea',
      'cold hands/feet',
      'indigestion',
      'motion sickness',
    ],
    folk_uses:
      'Used widely in Ayurveda and Chinese medicine as a warming digestive aid.',
    constituents: [
      {
        name: 'Gingerols',
        class: 'phenolic compounds',
        solubility: { water: 'partial', ethanol_range: '60–80%' },
        notes: 'Pungent compounds responsible for warming effects.',
      },
      {
        name: 'Shogaols',
        class: 'phenolic compounds',
        solubility: { water: 'partial', ethanol_range: '60–80%' },
        notes:
          'Formed from gingerols during drying, more potent anti-nausea effects.',
      },
      {
        name: 'Volatile oils',
        class: 'essential oil',
        solubility: { water: false, ethanol_range: '70–95%' },
        notes: 'Aromatic compounds that stimulate digestion.',
      },
    ],
    best_preparations: ['tea', 'tincture'],
    solvent_recommendations: [
      {
        preparation_type: 'decoction',
        ethanol_percent: '0%',
        ratio: '1–2 tsp dried rhizome simmered 10 min',
        notes: 'Best for colds and digestion.',
      },
      {
        preparation_type: 'tincture',
        ethanol_percent: '70%',
        ratio: '1:5 dried rhizome',
        notes: 'Captures pungent gingerols and shogaols.',
      },
    ],
    dosage: '2–4 mL tincture, or tea 2–3x daily.',
    safety: 'Generally safe; high doses may thin blood.',
    interactions: ['anticoagulants'],
    sources: ['Hoffmann 2003'],
    tags: ['digestive', 'circulatory', 'warming'],
  },
  {
    id: 'curcuma_longa',
    common_name: 'Turmeric',
    latin_name: 'Curcuma longa',
    family: 'Zingiberaceae',
    plant_parts_used: ['rhizome'],
    medicinal_actions: ['anti-inflammatory', 'antioxidant', 'liver support'],
    indications: ['arthritis', 'liver stagnation', 'skin inflammation'],
    folk_uses: 'Sacred spice in India, used in food and medicine.',
    constituents: [
      {
        name: 'Curcuminoids',
        class: 'polyphenols',
        solubility: { water: 'poor', ethanol_range: '60–95%' },
        notes: 'Yellow pigments with powerful anti-inflammatory effects.',
      },
      {
        name: 'Volatile oils',
        class: 'essential oil',
        solubility: { water: false, ethanol_range: '70–95%' },
        notes:
          'Aromatic compounds that enhance absorption and bioavailability.',
      },
    ],
    best_preparations: ['powder in food', 'tincture', 'decoction'],
    solvent_recommendations: [
      {
        preparation_type: 'tincture',
        ethanol_percent: '70–90%',
        ratio: '1:5 dried rhizome',
        notes: 'Extracts curcuminoids and oils.',
      },
      {
        preparation_type: 'powder',
        ethanol_percent: '0%',
        ratio: 'Culinary use with fat and black pepper',
        notes: 'Traditional absorption enhancer.',
      },
    ],
    dosage: '2–5 g/day powdered root; 2–4 mL tincture 3x daily.',
    safety: 'Avoid in gallstones or bile duct obstruction.',
    interactions: ['anticoagulants'],
    sources: ['Tilgner 2009'],
    tags: ['anti-inflammatory', 'liver', 'antioxidant'],
  },
  {
    id: 'mentha_piperita',
    common_name: 'Peppermint',
    latin_name: 'Mentha piperita',
    family: 'Lamiaceae',
    plant_parts_used: ['leaf'],
    medicinal_actions: ['carminative', 'antispasmodic', 'cooling'],
    indications: ['indigestion', 'IBS', 'headache', 'nausea'],
    folk_uses: 'Cooling digestive and nervine herb used worldwide.',
    constituents: [
      {
        name: 'Menthol',
        class: 'monoterpene alcohol',
        solubility: { water: 'low', ethanol_range: '60–95%' },
        notes: 'Cooling compound that relaxes smooth muscle.',
      },
      {
        name: 'Flavonoids',
        class: 'flavonoid',
        solubility: { water: true, ethanol_range: '40–60%' },
        notes: 'Anti-inflammatory and antispasmodic effects.',
      },
    ],
    best_preparations: ['tea', 'tincture'],
    solvent_recommendations: [
      {
        preparation_type: 'infusion',
        ethanol_percent: '0%',
        ratio: '1 tsp dried leaf per cup',
        notes: 'Relieves gas and cramping.',
      },
      {
        preparation_type: 'tincture',
        ethanol_percent: '60–70%',
        ratio: '1:5 dried leaf',
        notes: 'Captures volatile oils and flavonoids.',
      },
    ],
    dosage: '1 cup tea after meals, or 2–4 mL tincture 3x daily.',
    safety: 'Avoid high doses in young children. May worsen reflux.',
    interactions: ['antacids'],
    sources: ['Hoffmann 2003'],
    tags: ['digestive', 'cooling', 'antispasmodic'],
  },
  {
    id: 'achillea_millefolium',
    common_name: 'Yarrow',
    latin_name: 'Achillea millefolium',
    family: 'Asteraceae',
    plant_parts_used: ['flowering tops'],
    medicinal_actions: ['styptic', 'anti-inflammatory', 'digestive aid'],
    indications: ['wounds', 'fever', 'poor digestion'],
    folk_uses: "Named for Achilles, who used it to heal soldiers' wounds.",
    constituents: [
      {
        name: 'Volatile oils',
        class: 'essential oil',
        solubility: { water: 'low', ethanol_range: '70–95%' },
        notes: 'Anti-inflammatory and antimicrobial compounds.',
      },
      {
        name: 'Sesquiterpene lactones',
        class: 'bitter compound',
        solubility: { water: 'partial', ethanol_range: '40–60%' },
        notes: 'Bitter compounds that stimulate digestion.',
      },
      {
        name: 'Flavonoids',
        class: 'flavonoid',
        solubility: { water: true, ethanol_range: '40–60%' },
        notes: 'Anti-inflammatory and wound healing properties.',
      },
    ],
    best_preparations: ['infusion', 'tincture'],
    solvent_recommendations: [
      {
        preparation_type: 'infusion',
        ethanol_percent: '0%',
        ratio: '1 tsp dried tops per cup',
        notes: 'Diaphoretic for fevers.',
      },
      {
        preparation_type: 'tincture',
        ethanol_percent: '50–60%',
        ratio: '1:5 dried tops',
        notes: 'Extracts bitters and flavonoids.',
      },
    ],
    dosage: '2–4 mL tincture 3x daily, or tea as needed.',
    safety:
      'Avoid in pregnancy. May cause allergy in daisy-sensitive individuals.',
    interactions: [],
    sources: ['Tilgner 2009'],
    tags: ['wound healing', 'fever', 'digestive'],
  },
  {
    id: 'urtica_dioica',
    common_name: 'Nettle',
    latin_name: 'Urtica dioica',
    family: 'Urticaceae',
    plant_parts_used: ['leaf', 'seed', 'root'],
    medicinal_actions: ['nutritive tonic', 'diuretic', 'anti-allergic'],
    indications: ['allergies', 'fatigue', 'urinary issues', 'hair health'],
    folk_uses: 'Used as a spring tonic and mineral-rich food.',
    constituents: [
      {
        name: 'Minerals (iron, calcium)',
        class: 'inorganic',
        solubility: { water: true, ethanol_range: '0%' },
        notes: 'High mineral content makes it nutritionally valuable.',
      },
      {
        name: 'Flavonoids',
        class: 'flavonoid',
        solubility: { water: true, ethanol_range: '40–60%' },
        notes: 'Anti-allergic and anti-inflammatory effects.',
      },
      {
        name: 'Lectins',
        class: 'protein',
        solubility: { water: true, ethanol_range: '0%' },
        notes: 'May contribute to immune-modulating effects.',
      },
    ],
    best_preparations: ['infusion', 'food'],
    solvent_recommendations: [
      {
        preparation_type: 'infusion',
        ethanol_percent: '0%',
        ratio: '1 tbsp dried leaf per cup',
        notes: 'Rich in minerals.',
      },
      {
        preparation_type: 'powder/food',
        ethanol_percent: '0%',
        ratio: 'Added to soups or smoothies',
        notes: 'Nutritive tonic.',
      },
    ],
    dosage: '1 cup tea 2–3x daily.',
    safety: 'Generally safe. Seeds stimulating in high doses.',
    interactions: [],
    sources: ['Hoffmann 2003'],
    tags: ['nutritive', 'allergies', 'tonic'],
  },
  {
    id: 'calendula_officinalis',
    common_name: 'Calendula',
    latin_name: 'Calendula officinalis',
    family: 'Asteraceae',
    plant_parts_used: ['flower'],
    medicinal_actions: ['vulnerary', 'anti-inflammatory', 'lymphatic'],
    indications: ['wounds', 'skin inflammation', 'swollen glands'],
    folk_uses: 'Sacred flower in Europe, used for skin and wound care.',
    constituents: [
      {
        name: 'Triterpenoid saponins',
        class: 'saponin',
        solubility: { water: 'partial', ethanol_range: '40–60%' },
        notes: 'Anti-inflammatory and wound healing properties.',
      },
      {
        name: 'Flavonoids',
        class: 'flavonoid',
        solubility: { water: true, ethanol_range: '40–60%' },
        notes: 'Antioxidant and anti-inflammatory effects.',
      },
      {
        name: 'Resins',
        class: 'resin',
        solubility: { water: false, ethanol_range: '70–95%' },
        notes: 'Antimicrobial and protective properties for topical use.',
      },
    ],
    best_preparations: ['oil infusion', 'tincture', 'salve'],
    solvent_recommendations: [
      {
        preparation_type: 'oil infusion',
        ethanol_percent: '0%',
        ratio: 'Fresh flowers in oil',
        notes: 'Traditional skin remedy.',
      },
      {
        preparation_type: 'tincture',
        ethanol_percent: '50–60%',
        ratio: '1:5 dried flowers',
        notes: 'Good for internal lymphatic support.',
      },
    ],
    dosage: '2–4 mL tincture, 3x daily. External use as oil or salve.',
    safety: 'Avoid if allergic to daisies.',
    interactions: [],
    sources: ['Tilgner 2009'],
    tags: ['skin', 'lymphatic', 'anti-inflammatory'],
  },
  {
    id: 'valeriana_officinalis',
    common_name: 'Valerian',
    latin_name: 'Valeriana officinalis',
    family: 'Caprifoliaceae',
    plant_parts_used: ['root'],
    medicinal_actions: ['sedative', 'antispasmodic', 'nervine'],
    indications: ['insomnia', 'anxiety', 'muscle tension'],
    folk_uses: 'Used in medieval Europe as a calming agent and sleep aid.',
    constituents: [
      {
        name: 'Valepotriates',
        class: 'iridoids',
        solubility: { water: 'poor', ethanol_range: '60–80%' },
        notes:
          'Sedative compounds that break down quickly when exposed to heat or light.',
      },
      {
        name: 'Volatile oils',
        class: 'essential oil',
        solubility: { water: false, ethanol_range: '70–95%' },
        notes: 'Characteristic strong odor, contributes to sedative effects.',
      },
    ],
    best_preparations: ['tincture', 'capsules'],
    solvent_recommendations: [
      {
        preparation_type: 'tincture',
        ethanol_percent: '70%',
        ratio: '1:5 dried root',
        notes: 'Captures valepotriates and oils.',
      },
      {
        preparation_type: 'powder/capsules',
        ethanol_percent: '0%',
        ratio: 'Ground dried root',
        notes: 'Traditional sedative form.',
      },
    ],
    dosage: '2–4 mL tincture, or 400–900 mg root before bed.',
    safety:
      'May cause grogginess. Paradoxical stimulation in some individuals.',
    interactions: ['sedatives', 'alcohol'],
    sources: ['Hoffmann 2003'],
    tags: ['sleep', 'nervous system', 'relaxant'],
  },
]

async function fetchHerbsFromGist(): Promise<Herb[]> {
  try {
    const gistId = process.env.GITHUB_GIST_ID // Using same gist as orders
    const token = process.env.GITHUB_TOKEN

    if (!gistId || !token) {
      console.log(
        'Using sample data - GITHUB_GIST_ID or GITHUB_TOKEN not configured'
      )
      return sampleHerbs
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error('Failed to fetch herbs from Gist:', response.statusText)
      return sampleHerbs
    }

    const gist = await response.json()
    const herbsFile = gist.files['herbs-data.json']

    if (!herbsFile) {
      console.log('herbs-data.json file not found in Gist, using sample data')
      return sampleHerbs
    }

    // Check if the file is truncated by GitHub
    if (herbsFile.truncated) {
      console.log('Gist file is truncated, fetching raw content...')
      
      try {
        const rawResponse = await fetch(herbsFile.raw_url, {
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        })
        
        if (!rawResponse.ok) {
          console.error('Failed to fetch raw content:', rawResponse.statusText)
          return sampleHerbs
        }
        
        const rawContent = await rawResponse.text()
        const herbs = JSON.parse(rawContent)
        console.log(`Loaded ${herbs.length} herbs from Gist (via raw URL)`)
        return herbs
      } catch (error) {
        console.error('Error fetching raw content:', error)
        return sampleHerbs
      }
    }

    // Log the content to debug the issue
    console.log('Gist file content length:', herbsFile.content?.length || 0)
    console.log('Gist file content preview:', herbsFile.content?.substring(0, 100) || 'No content')
    
    if (!herbsFile.content || herbsFile.content.trim() === '') {
      console.log('herbs-data.json file is empty in Gist, using sample data')
      return sampleHerbs
    }

    try {
      const herbs = JSON.parse(herbsFile.content)
      console.log(`Loaded ${herbs.length} herbs from Gist`)
      return herbs
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Content that failed to parse (first 500 chars):', herbsFile.content?.substring(0, 500))
      console.log('Falling back to sample data due to JSON parse error')
      return sampleHerbs
    }
  } catch (error) {
    console.error('Error fetching herbs from Gist:', error)
    return sampleHerbs
  }
}

async function updateHerbsInGist(herbs: Herb[]): Promise<boolean> {
  try {
    const gistId = process.env.GITHUB_GIST_ID
    const token = process.env.GITHUB_TOKEN

    if (!gistId || !token) {
      console.error('GITHUB_GIST_ID or GITHUB_TOKEN not configured')
      return false
    }

    const response = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `token ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          'herbs-data.json': {
            content: JSON.stringify(herbs, null, 2),
          },
        },
      }),
    })

    if (!response.ok) {
      console.error('Failed to update herbs in Gist:', response.statusText)
      return false
    }

    console.log('Successfully updated herbs in Gist')
    return true
  } catch (error) {
    console.error('Error updating herbs in Gist:', error)
    return false
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const action = searchParams.get('action')
    const preparation = searchParams.get('preparation')
    const indication = searchParams.get('indication')
    const constituent = searchParams.get('constituent')
    const id = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '24')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get specific herb by ID
    if (id) {
      const herb = await HerbsDatabase.getHerbById(id)
      if (!herb) {
        return NextResponse.json({ error: 'Herb not found' }, { status: 404 })
      }
      return NextResponse.json(herb)
    }

    // Combined search with filters
    const herbs = await HerbsDatabase.searchHerbsWithFilters({
      query,
      action,
      preparation,
      indication,
      constituent,
      limit,
      offset
    })

    // Get total count for pagination
    const totalCount = await HerbsDatabase.getHerbsCount({
      query,
      action,
      preparation,
      indication,
      constituent
    })

    return NextResponse.json({
      herbs,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error in herbs API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch herbs' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const newHerb: Herb = await request.json()

    // Fetch current herbs
    const currentHerbs = await fetchHerbsFromGist()

    // Add new herb
    const updatedHerbs = [...currentHerbs, newHerb]

    // Update Gist
    const success = await updateHerbsInGist(updatedHerbs)

    if (success) {
      return NextResponse.json({ success: true, herb: newHerb })
    } else {
      return NextResponse.json(
        { error: 'Failed to save herb to Gist' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error adding herb:', error)
    return NextResponse.json({ error: 'Failed to add herb' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const updatedHerb: Herb = await request.json()

    // Fetch current herbs
    const currentHerbs = await fetchHerbsFromGist()

    // Update the herb
    const herbIndex = currentHerbs.findIndex((h) => h.id === updatedHerb.id)
    if (herbIndex === -1) {
      return NextResponse.json({ error: 'Herb not found' }, { status: 404 })
    }

    currentHerbs[herbIndex] = updatedHerb

    // Update Gist
    const success = await updateHerbsInGist(currentHerbs)

    if (success) {
      return NextResponse.json({ success: true, herb: updatedHerb })
    } else {
      return NextResponse.json(
        { error: 'Failed to update herb in Gist' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error updating herb:', error)
    return NextResponse.json(
      { error: 'Failed to update herb' },
      { status: 500 }
    )
  }
}
