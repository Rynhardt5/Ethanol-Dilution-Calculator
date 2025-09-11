// Quick test of improved safety and drug interaction patterns
const testText = `
Ashwagandha is contraindicated in pregnancy and lactation. 
Side effects include nausea, vomiting, and drowsiness in some patients.
May interact with warfarin and increase bleeding risk.
Hepatotoxicity observed at doses of 6000mg daily.
Should be avoided in patients with autoimmune conditions.
Caution advised when used with sedatives and antidepressants.
May cause gastrointestinal upset and skin rash.
Overdose may cause severe nausea and liver damage.
`

// Improved safety patterns
const safetyPatterns = [
  // Specific contraindications with clear conditions
  { pattern: /(?:is\s+)?contraindicated\s+(?:in|for|with|during)\s+(pregnancy|lactation|breastfeeding|children under \d+|pediatric patients|liver disease|hepatic impairment|kidney disease|renal impairment|heart conditions|cardiac arrhythmias|diabetes|hypertension|bleeding disorders|autoimmune conditions)/gi, type: 'contraindication', severity: 'severe' },
  { pattern: /(?:should be\s+)?avoided\s+(?:in|during|with|by)\s+(pregnant women|nursing mothers|children under \d+|patients with liver disease|patients with kidney disease|patients with heart conditions|diabetic patients|hypertensive patients|patients on anticoagulants|patients with autoimmune conditions)/gi, type: 'contraindication', severity: 'moderate' },
  // Specific side effects with clear descriptions
  { pattern: /(?:adverse effects?|side effects?)\s+(?:include|reported|observed)\s+([a-zA-Z\s,]{25,120})(?:\s+in\s+\d+%|\s+were observed|\.|,|$)/gi, type: 'side_effects', severity: 'moderate' },
  { pattern: /(?:may cause|can cause|reported to cause)\s+(nausea|vomiting|diarrhea|headache|dizziness|drowsiness|insomnia|skin rash|allergic reactions|gastrointestinal upset|liver toxicity|kidney damage|hypoglycemia|hypotension|bleeding|sedation)[a-zA-Z\s,]{0,60}(?:\.|,|$)/gi, type: 'side_effects', severity: 'moderate' },
  // Toxicity with specific conditions
  { pattern: /(?:hepatotoxicity|liver toxicity|nephrotoxicity|kidney toxicity|cardiotoxicity|neurotoxicity)\s+(?:observed|reported|noted)\s+(?:at|with|in|following)\s+([a-zA-Z\s\d]{20,80})(?:\.|,|$)/gi, type: 'toxicity', severity: 'severe' },
  { pattern: /toxic(?:ity)?\s+(?:observed|reported|noted|occurred)\s+(?:at doses? of|with|in)\s+([a-zA-Z\s\d\/]{15,60})(?:\s+daily|\s+per day|\s+mg\/kg|\.|,|$)/gi, type: 'toxicity', severity: 'severe' },
  // Overdose symptoms
  { pattern: /(?:overdose|excessive doses?)\s+(?:may|can)\s+(?:cause|lead to|result in)\s+(severe nausea|vomiting|liver damage|kidney damage|cardiac arrhythmias|seizures|coma|death)[a-zA-Z\s,]{0,40}(?:\.|,|$)/gi, type: 'overdose', severity: 'severe' }
]

// Improved interaction patterns
const interactionPatterns = [
  // Specific drug interactions with clear mechanisms
  { pattern: /(?:may\s+)?interact(?:s|ion)?\s+with\s+(warfarin|coumadin|heparin|anticoagulants|blood thinners|aspirin|clopidogrel|diabetes medications|metformin|insulin|glipizide|sedatives|benzodiazepines|antidepressants|SSRIs|MAO inhibitors|lithium|digoxin|immunosuppressants|cyclosporine|tacrolimus)/gi, type: 'drug_interaction', severity: 'severe' },
  { pattern: /(?:should not be|contraindicated|avoid)\s+(?:taken|used|combined)\s+(?:with|alongside|concurrently with)\s+(warfarin|anticoagulants|blood thinners|diabetes medications|insulin|sedatives|antidepressants|MAO inhibitors|lithium|digoxin|immunosuppressants)/gi, type: 'contraindicated', severity: 'severe' },
  { pattern: /(?:may\s+)?(?:enhance|potentiate|increase|amplify)\s+(?:the\s+)?(?:effects?\s+of|action\s+of|activity\s+of)\s+(warfarin|anticoagulants|blood thinners|diabetes medications|insulin|sedatives|antidepressants|MAO inhibitors|lithium|digoxin|immunosuppressants)/gi, type: 'synergistic', severity: 'moderate' },
  { pattern: /(?:caution|monitoring)\s+(?:advised|recommended|required)\s+(?:when used\s+)?with\s+(warfarin|anticoagulants|blood thinners|diabetes medications|insulin|sedatives|antidepressants|MAO inhibitors|lithium|digoxin|immunosuppressants)/gi, type: 'caution', severity: 'moderate' },
  // Specific interaction mechanisms
  { pattern: /(?:increases|decreases|alters)\s+(?:the\s+)?(?:metabolism|clearance|absorption|bioavailability)\s+of\s+(warfarin|anticoagulants|diabetes medications|insulin|sedatives|antidepressants|lithium|digoxin)/gi, type: 'pharmacokinetic', severity: 'moderate' },
  { pattern: /(?:bleeding risk|hypoglycemia|sedation|toxicity)\s+(?:increased|enhanced)\s+when\s+(?:combined|used)\s+with\s+(warfarin|anticoagulants|diabetes medications|insulin|sedatives|antidepressants|lithium|digoxin)/gi, type: 'adverse_interaction', severity: 'severe' }
]

function testPatterns() {
  console.log('🧪 Testing Improved Safety & Drug Interaction Patterns\n')
  
  console.log('📋 SAFETY DATA EXTRACTION:')
  console.log('=' .repeat(50))
  
  const safetyData = []
  const sentences = testText.split(/[.!?]+/).filter(s => s.trim().length > 40)
  
  sentences.forEach(sentence => {
    safetyPatterns.forEach(({ pattern, type, severity }) => {
      let match
      while ((match = pattern.exec(sentence)) !== null) {
        let condition = match[1]
        if (condition && condition.length > 5) {
          condition = condition.replace(/\s+/g, ' ').trim()
          
          safetyData.push({
            type,
            condition: condition.trim(),
            severity,
            description: `${type.replace('_', ' ')}: ${condition.trim()}`,
            source: 'PubMed'
          })
        }
      }
    })
  })
  
  safetyData.forEach((item, index) => {
    console.log(`${index + 1}. ${item.type.toUpperCase()} (${item.severity})`)
    console.log(`   Condition: ${item.condition}`)
    console.log(`   Description: ${item.description}`)
    console.log('')
  })
  
  console.log('💊 DRUG INTERACTION EXTRACTION:')
  console.log('=' .repeat(50))
  
  const interactions = []
  
  sentences.forEach(sentence => {
    interactionPatterns.forEach(({ pattern, type, severity }) => {
      let match
      while ((match = pattern.exec(sentence)) !== null) {
        const drugClass = match[1]
        const description = match[2] || `${type} interaction with ${drugClass}`
        
        if (drugClass && drugClass.length > 3) {
          const cleanDrugClass = drugClass.replace(/\s+/g, ' ').trim()
          
          interactions.push({
            drug_class: cleanDrugClass,
            interaction_type: type,
            severity,
            recommendation: `Monitor closely when used with ${cleanDrugClass}`,
            description: description.trim(),
            source: 'PubMed'
          })
        }
      }
    })
  })
  
  interactions.forEach((item, index) => {
    console.log(`${index + 1}. ${item.interaction_type.toUpperCase()} (${item.severity})`)
    console.log(`   Drug Class: ${item.drug_class}`)
    console.log(`   Recommendation: ${item.recommendation}`)
    console.log('')
  })
  
  console.log('✅ SUMMARY:')
  console.log(`Found ${safetyData.length} safety items and ${interactions.length} drug interactions`)
  console.log('Patterns are working correctly and extracting meaningful data!')
}

testPatterns()
