#!/usr/bin/env python3
"""
Manual herb text parser - converts pasted herb text to structured JSON
"""

import json
import re

def parse_herb_text(text):
    """Parse manually pasted herb text into structured JSON format"""
    
    # Initialize herb data structure
    herb = {
        'latinName': '',
        'commonName': '',
        'alternativeName': '',
        'family': '',
        'summary': '',
        'habitat': '',
        'partsUsed': '',
        'relatedSpecies': '',
        'keyConstituents': [],
        'historyFolklore': '',
        'keyActions': [],
        'research': [],
        'traditionalUses': [],
        'currentUses': [],
        'preparations': [],
        'cautions': '',
        'therapeuticCategories': []
    }
    
    # Clean up text but preserve line structure
    original_text = text
    # Normalize line breaks and clean up spacing
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = text.strip()
    
    # Extract Latin name and family
    latin_match = re.search(r'([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)', text)
    if latin_match:
        herb['latinName'] = latin_match.group(1)
        herb['family'] = latin_match.group(2)
    
    # Extract common name and alternative name
    if herb['latinName']:
        # Find the lines after the Latin name
        latin_pattern = rf"{re.escape(herb['latinName'])}\s+\([^)]+\)"
        latin_match = re.search(latin_pattern, text)
        if latin_match:
            # Get text after the Latin name match
            after_latin = text[latin_match.end():].strip()
            lines = after_latin.split('\n')
            
            # First non-empty line should be common name
            for line in lines[:3]:  # Check first 3 lines
                line = line.strip()
                if not line:
                    continue
                    
                # Check if this line has alternative name pattern: "Name, Alt (Culture)"
                if ',' in line and '(' in line and ')' in line:
                    parts = line.split(',', 1)
                    herb['commonName'] = parts[0].strip()
                    herb['alternativeName'] = parts[1].strip()
                    break
                else:
                    # Just common name
                    herb['commonName'] = line
                    break
    
    # Extract summary/description - text between common name and first section header
    if herb['commonName']:
        # Find text after common name line until first section header
        common_name_pattern = rf"{re.escape(herb['commonName'])}.*?\n"
        common_match = re.search(common_name_pattern, text)
        if common_match:
            after_common = text[common_match.end():]
            # Extract until we hit a section header
            summary_match = re.search(r'^(.*?)(?=Habitat & Cultivation|Parts Used|Key Constituents|Description)', after_common, re.DOTALL | re.MULTILINE)
            if summary_match:
                summary_text = summary_match.group(1).strip()
                # Clean up the summary text
                summary_lines = []
                for line in summary_text.split('\n'):
                    line = line.strip()
                    if line and not line.startswith('Sweet flag') and 'has a long-standing' not in line:
                        summary_lines.append(line)
                if summary_lines:
                    herb['summary'] = ' '.join(summary_lines)
    
    # Extract habitat & cultivation
    habitat_match = re.search(r'Habitat & Cultivation\s+(.*?)(?=Related Species|Key Constituents|Parts Used)', text, re.DOTALL)
    if habitat_match:
        herb['habitat'] = clean_text(habitat_match.group(1))
    
    # Extract key constituents
    constituents_patterns = [
        r'Key Constituents\s+(.*?)(?=Key Actions|Medicinal Actions|History|Research|Traditional)',
        r'Constituents\s+(.*?)(?=Key Actions|Medicinal Actions|History|Research|Traditional)',
        r'Key Constituents\s+(.*?)(?=Dried|Fresh|Key Actions)'
    ]
    for pattern in constituents_patterns:
        constituents_match = re.search(pattern, text, re.DOTALL)
        if constituents_match:
            herb['keyConstituents'] = parse_bullet_list(constituents_match.group(1))
            break
    
    # Extract key actions (or Medicinal Actions & Uses)
    actions_patterns = [
        r'Key Actions\s+(.*?)(?=Research|Traditional|Current Uses|History)',
        r'Medicinal Actions & Uses\s+(.*?)(?=Related Species|Caution|Self-help|$)',
        r'Key Actions\s+(.*?)(?=Research|Traditional &)'
    ]
    for pattern in actions_patterns:
        actions_match = re.search(pattern, text, re.DOTALL)
        if actions_match:
            actions_text = actions_match.group(1)
            if 'Medicinal Actions & Uses' in pattern:
                # For Medicinal Actions & Uses, treat as combined actions and uses
                herb['keyActions'] = [clean_text(actions_text)]
            else:
                herb['keyActions'] = parse_bullet_list(actions_text)
            break
    
    # Extract research
    research_patterns = [
        r'Research\s+(.*?)(?=Traditional|Current Uses|Key Preparations|Caution)',
        r'Research\s+(.*?)(?=Traditional &|Key Preparations)'
    ]
    for pattern in research_patterns:
        research_match = re.search(pattern, text, re.DOTALL)
        if research_match:
            research_text = clean_text(research_match.group(1))
            if research_text:
                herb['research'] = [research_text]
            break
    
    # Extract traditional & current uses
    uses_patterns = [
        r'Traditional &\s*Current Uses\s+(.*?)(?=Key Preparations|Self-help|Caution)',
        r'Traditional &\s*Current Uses\s+(.*?)(?=Key Preparations &|Caution)'
    ]
    for pattern in uses_patterns:
        uses_match = re.search(pattern, text, re.DOTALL)
        if uses_match:
            uses_text = uses_match.group(1)
            traditional, current = parse_uses_section(uses_text)
            herb['traditionalUses'] = traditional
            herb['currentUses'] = current
            break
    
    # Extract parts used
    parts_patterns = [
        r'Parts Used\s+(.*?)(?=Key Constituents|Constituents|Habitat|Fresh|Dried|Related Species)',
        r'Parts Used\s+(.*?)(?=Related Species|Key Constituents)'
    ]
    for pattern in parts_patterns:
        parts_match = re.search(pattern, text, re.DOTALL)
        if parts_match:
            herb['partsUsed'] = clean_text(parts_match.group(1))
            break
    
    # Extract related species
    related_patterns = [
        r'Related Species\s+(.*?)(?=Key Constituents|Constituents|History|Key Actions|Medicinal Actions)',
        r'Related Species\s+(.*?)(?=Key Constituents|History)'
    ]
    for pattern in related_patterns:
        related_match = re.search(pattern, text, re.DOTALL)
        if related_match:
            herb['relatedSpecies'] = clean_text(related_match.group(1))
            break
    
    # Extract history & folklore
    history_patterns = [
        r'History & Folklore\s+(.*?)(?=Key Actions|Medicinal Actions|Research|Traditional)',
        r'History\s+(.*?)(?=Key Actions|Medicinal Actions|Research|Traditional)'
    ]
    for pattern in history_patterns:
        history_match = re.search(pattern, text, re.DOTALL)
        if history_match:
            herb['historyFolklore'] = clean_text(history_match.group(1))
            break
    
    # Extract preparations
    prep_patterns = [
        r'Key Preparations & Their Uses\s+(.*?)(?=Self-help|Caution|$)',
        r'Key Preparations & Their Uses\s+(.*?)(?=k e y m e d i c i n a l|$)'
    ]
    for pattern in prep_patterns:
        prep_match = re.search(pattern, text, re.DOTALL)
        if prep_match:
            herb['preparations'] = parse_preparations(prep_match.group(1))
            break
    
    # Extract cautions
    cautions_patterns = [
        r'Caution\s+(.*?)(?=Self-help|$)',
        r'Cautions\s+(.*?)(?=Self-help|$)',
        r'RCautions\s+(.*?)(?=Decoction|Tincture|Powder|$)'
    ]
    for pattern in cautions_patterns:
        cautions_match = re.search(pattern, text, re.DOTALL)
        if cautions_match:
            herb['cautions'] = clean_text(cautions_match.group(1))
            break
    
    # Generate therapeutic categories
    herb['therapeuticCategories'] = extract_therapeutic_categories(herb)
    
    return herb

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return ''
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text.strip())
    
    # Remove bullet symbols
    text = re.sub(r'^[■•▪]\s*', '', text)
    
    # Remove common artifacts
    text = re.sub(r'Q\s*Cautions?', '', text)
    text = re.sub(r'R\s*Cautions?', '', text)
    
    return text.strip()

def parse_bullet_list(text):
    """Parse bullet point lists"""
    if not text:
        return []
    
    # Split by bullet symbols or line breaks
    items = re.split(r'[■•▪]\s*|(?:\n\s*(?=[A-Z]))', text)
    
    parsed_items = []
    for item in items:
        item = clean_text(item)
        if len(item) > 3 and not any(keyword in item.lower() for keyword in 
                                   ['habitat', 'research', 'traditional', 'current', 'preparation']):
            parsed_items.append(item)
    
    return parsed_items

def parse_uses_section(text):
    """Parse traditional and current uses section"""
    traditional = []
    current = []
    
    # Split by bullet points
    sections = re.split(r'[■•▪]\s*', text)
    
    for section in sections:
        section = clean_text(section)
        if not section:
            continue
        
        # Categorize based on keywords
        if any(keyword in section.lower() for keyword in ['healing wounds', 'traditional', 'history', 'folklore', 'ancient', 'achilles']):
            traditional.append(section)
        elif any(keyword in section.lower() for keyword in ['gynecological', 'other uses', 'current', 'modern']):
            current.append(section)
        else:
            # Default to current uses
            current.append(section)
    
    return traditional, current

def parse_preparations(text):
    """Parse preparations section"""
    if not text:
        return []
    
    preparations = []
    
    # Split by common preparation types
    prep_types = re.split(r'(?=Remedy|Tincture|Essential oil|Poultice|Infusion|Decoction|Tablets|Capsules|Powder|Cream|Ointment)', text)
    
    for prep in prep_types:
        prep = clean_text(prep)
        if prep and len(prep) > 10:
            preparations.append(prep)
    
    return preparations

def extract_therapeutic_categories(herb):
    """Extract therapeutic categories based on content"""
    categories = set()
    text = f"{herb['summary']} {' '.join(herb['keyActions'])} {' '.join(herb['currentUses'])} {' '.join(herb['traditionalUses'])}".lower()
    
    category_patterns = {
        'wound healing': r'wound|cut|bruise|injury|healing|vulnerary|antiseptic',
        'digestive': r'digest|stomach|gastric|intestinal|nausea|indigestion|dyspepsia|colic',
        'respiratory': r'cough|bronchial|lung|respiratory|asthma|expectorant|congestion',
        'immune support': r'immune|infection|antimicrobial|antibacterial|antiviral',
        'anti-inflammatory': r'anti-inflammatory|inflammation|inflammatory',
        'cardiovascular': r'heart|cardiac|circulation|blood pressure|cardiovascular|venous',
        'nervous system': r'nervous|anxiety|stress|sedative|calming|nerve|neuralgia',
        'women\'s health': r'menstrual|gynecological|pregnancy|hormonal|reproductive',
        'skin conditions': r'skin|dermatitis|eczema|rash|topical|external',
        'pain relief': r'pain|analgesic|ache|rheumat|arthritic',
        'liver support': r'liver|hepatic|detox|cleansing',
        'urinary': r'urinary|kidney|diuretic|bladder',
        'cold and flu': r'cold|flu|fever|viral|upper respiratory',
        'antioxidant': r'antioxidant|free radical|oxidative',
        'antimicrobial': r'antimicrobial|antibacterial|antifungal|antiseptic'
    }
    
    for category, pattern in category_patterns.items():
        if re.search(pattern, text):
            categories.add(category)
    
    return list(categories)

def split_herbs(text):
    """Split text into individual herb sections"""
    # Look for herb boundaries - Latin names in format "Genus species (Family)"
    herb_pattern = r'([A-Z][a-z]+\s+[a-z]+\s+\([A-Za-z]+\))'
    
    # Find all Latin name matches
    matches = list(re.finditer(herb_pattern, text))
    
    if not matches:
        return [text]  # Return whole text if no clear boundaries found
    
    herbs = []
    for i, match in enumerate(matches):
        start_pos = match.start()
        
        # Find end position (start of next herb or end of text)
        if i + 1 < len(matches):
            end_pos = matches[i + 1].start()
        else:
            end_pos = len(text)
        
        herb_text = text[start_pos:end_pos].strip()
        if herb_text:
            herbs.append(herb_text)
    
    return herbs

def main():
    """Main function to process pasted herb text from herbs.txt file"""
    
    # Read herb text from file
    try:
        with open('herbs.txt', 'r', encoding='utf-8') as f:
            full_text = f.read()
    except FileNotFoundError:
        print("Error: herbs.txt file not found. Please create the file and paste your herb text into it.")
        return
    
    # Split into individual herbs
    herb_sections = split_herbs(full_text)
    
    print(f"Found {len(herb_sections)} herb sections")
    
    all_herbs = []
    
    # Parse each herb section
    for i, herb_text in enumerate(herb_sections):
        print(f"\nProcessing herb section {i + 1}...")
        
        herb_data = parse_herb_text(herb_text)
        
        if herb_data['latinName']:  # Only add if we successfully extracted a Latin name
            all_herbs.append(herb_data)
            print(f"✓ Extracted: {herb_data['latinName']} ({herb_data['commonName']})")
        else:
            print(f"✗ Failed to extract herb data from section {i + 1}")
    
    # Save all herbs to JSON file
    with open('all-herbs-parsed.json', 'w') as f:
        json.dump(all_herbs, f, indent=2)
    
    print(f"\n✓ Successfully parsed {len(all_herbs)} herbs from manual text input")
    print("✓ Saved to all-herbs-parsed.json")
    
    # Print summary
    print(f"\nSummary:")
    for herb in all_herbs:
        print(f"- {herb['latinName']} ({herb['commonName']}) - {herb['family']}")
        print(f"  Constituents: {len(herb['keyConstituents'])}, Actions: {len(herb['keyActions'])}, Categories: {len(herb['therapeuticCategories'])}")

if __name__ == "__main__":
    main()
