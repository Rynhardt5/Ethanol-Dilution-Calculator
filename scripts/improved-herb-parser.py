#!/usr/bin/env python3
"""
Improved manual herb text parser - converts pasted herb text to structured JSON
Handles all section variations and alternative names properly
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
    
    # Normalize text - preserve line breaks but clean spacing
    text = re.sub(r'\r\n|\r', '\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    lines = [line.strip() for line in text.split('\n')]
    
    # Extract Latin name and family
    latin_match = re.search(r'([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)', text)
    if latin_match:
        herb['latinName'] = latin_match.group(1)
        herb['family'] = latin_match.group(2)
    
    # Find the line with Latin name to start parsing from there
    latin_line_idx = -1
    for i, line in enumerate(lines):
        if herb['latinName'] and herb['latinName'] in line:
            latin_line_idx = i
            break
    
    if latin_line_idx >= 0:
        # Extract common name and alternative name from next lines
        # Handle cases where common name might be split across multiple lines
        common_name_parts = []
        alternative_name = ''
        
        for i in range(latin_line_idx + 1, min(latin_line_idx + 6, len(lines))):
            line = lines[i].strip()
            if not line:
                continue
            
            # Stop if we hit a section header
            if any(header in line for header in ['Description', 'Habitat', 'Parts Used', 'Constituents']):
                break
            
            # Check for alternative name pattern: "Alt Name (Culture)"
            if re.match(r'^[A-Z][^(]*\([^)]+\)$', line):
                alternative_name = line
                continue
            
            # Check for alternative name pattern: "Common Name, Alt Name (Culture)"
            if ',' in line and '(' in line and ')' in line:
                parts = line.split(',', 1)
                common_name_parts.append(parts[0].strip())
                alternative_name = parts[1].strip()
                break
            elif len(line) > 2 and not line.startswith(('■', '•', '▪')):
                # Add to common name parts
                common_name_parts.append(line.rstrip(','))
                
                # If we have enough parts or hit a natural break, stop
                if len(common_name_parts) >= 2 or i == latin_line_idx + 2:
                    break
        
        # Combine common name parts
        if common_name_parts:
            herb['commonName'] = ' '.join(common_name_parts)
        
        if alternative_name:
            herb['alternativeName'] = alternative_name
    
    # Extract sections using improved patterns
    sections = extract_sections(text)
    
    # Extract summary manually - text after common name until first section header
    if herb['commonName']:
        # Find descriptive text after the common name line
        common_name_idx = -1
        for i, line in enumerate(lines):
            if herb['commonName'] in line:
                common_name_idx = i
                break
        
        if common_name_idx >= 0:
            summary_lines = []
            start_idx = common_name_idx + 1
            
            # Skip alternative name if it exists
            if herb['alternativeName'] and start_idx < len(lines):
                if herb['alternativeName'] in lines[start_idx]:
                    start_idx += 1
            
            for i in range(start_idx, len(lines)):
                line = lines[i]
                # Stop at section headers
                if any(header in line for header in ['Habitat & Cultivation', 'Parts Used', 'Key Constituents', 'Description', 'Constituents']):
                    break
                # Skip alternative name lines that might appear later
                if herb['alternativeName'] and herb['alternativeName'] in line:
                    continue
                if line and not line.startswith(('■', '•', '▪')) and not re.match(r'^[A-Z][^(]*\([^)]+\)$', line):
                    summary_lines.append(line)
            
            if summary_lines:
                herb['summary'] = ' '.join(summary_lines)
    
    # Parse each section
    if 'description' in sections:
        herb['summary'] = clean_text(sections['description'])
    elif 'summary' in sections:
        herb['summary'] = clean_text(sections['summary'])
    
    if 'habitat' in sections:
        herb['habitat'] = clean_text(sections['habitat'])
    
    if 'parts_used' in sections:
        herb['partsUsed'] = clean_text(sections['parts_used'])
    
    if 'constituents' in sections:
        herb['keyConstituents'] = parse_bullet_list(sections['constituents'])
    
    if 'related_species' in sections:
        herb['relatedSpecies'] = clean_text(sections['related_species'])
    
    if 'history_folklore' in sections:
        herb['historyFolklore'] = clean_text(sections['history_folklore'])
    
    if 'medicinal_actions' in sections:
        herb['keyActions'] = parse_bullet_list(sections['medicinal_actions'])
        # Also extract current uses from medicinal actions
        herb['currentUses'] = parse_bullet_list(sections['medicinal_actions'])
    
    if 'research' in sections:
        herb['research'] = parse_bullet_list(sections['research'])
    
    if 'traditional_current_uses' in sections:
        herb['traditionalUses'] = parse_bullet_list(sections['traditional_current_uses'])
        herb['currentUses'] = parse_bullet_list(sections['traditional_current_uses'])
    
    if 'preparations' in sections:
        herb['preparations'] = parse_bullet_list(sections['preparations'])
    
    if 'cautions' in sections:
        herb['cautions'] = clean_text(sections['cautions'])
    
    # Generate therapeutic categories
    herb['therapeuticCategories'] = extract_therapeutic_categories(herb)
    
    return herb

def extract_sections(text):
    """Extract different sections from herb text"""
    sections = {}
    
    # Define section patterns with their variations
    section_patterns = {
        'description': [
            r'Description\s+(.*?)(?=Habitat & Cultivation|Part Used|Constituents|History & Folklore|Medicinal Actions|Research|Related Species|$)',
        ],
        'habitat': [
            r'Habitat & Cultivation\s+(.*?)(?=Part Used|Constituents|History & Folklore|Medicinal Actions|Research|Related Species|$)',
        ],
        'parts_used': [
            r'Part Used\s+(.*?)(?=Constituents|History & Folklore|Medicinal Actions|Research|Related Species|$)',
            r'Parts Used\s+(.*?)(?=Constituents|History & Folklore|Medicinal Actions|Research|Related Species|$)',
        ],
        'constituents': [
            r'Constituents\s+(.*?)(?=History & Folklore|Medicinal Actions|Research|Related Species|$)',
            r'Key Constituents\s+(.*?)(?=History & Folklore|Medicinal Actions|Research|Related Species|$)',
        ],
        'history_folklore': [
            r'History & Folklore\s+(.*?)(?=Medicinal Actions & Uses|Key Actions|Research|Related Species|$)',
        ],
        'medicinal_actions': [
            r'Medicinal Actions & Uses\s+(.*?)(?=Research|Related Species|$)',
            r'Key Actions\s+(.*?)(?=Research|Related Species|$)',
        ],
        'research': [
            r'Research\s+(.*?)(?=Related Species|Traditional|Key Preparations|Caution|$)',
        ],
        'related_species': [
            r'Related Species\s+(.*?)(?=Traditional|Key Preparations|Caution|$)',
        ],
        'traditional_current_uses': [
            r'Traditional &\s*Current Uses\s+(.*?)(?=Key Preparations|Caution|$)',
        ],
        'preparations': [
            r'Key Preparations & Their Uses\s+(.*?)(?=Self-help|Caution|$)',
        ],
        'cautions': [
            r'Caution\s+(.*?)(?=Self-help|$)',
            r'Cautions\s+(.*?)(?=Self-help|$)',
        ]
    }
    
    # Extract each section
    for section_name, patterns in section_patterns.items():
        for pattern in patterns:
            try:
                match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
                if match and len(match.groups()) > 0:
                    sections[section_name] = match.group(1).strip()
                    break
            except IndexError:
                continue
    
    return sections

def clean_text(text):
    """Clean and normalize text"""
    if not text:
        return ''
    
    # Remove page headers (spaced out herb names like "V i n c a R o s e a")
    text = re.sub(r'\b[A-Z]\s+[a-z]\s+[a-z]\s+[a-z]\s+[A-Z]\s+[a-z]\s+[a-z]\s+[a-z]\b', '', text)
    text = re.sub(r'\b[A-Z]\s+[a-z]\s+[a-z]\s+[a-z]\s+[A-Z]\s+[a-z]\s+[a-z]\b', '', text)
    text = re.sub(r'\b[A-Z]\s+[a-z]\s+[a-z]\s+[a-z]\b', '', text)
    
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
    
    # Clean the text first to remove page headers
    text = clean_text(text)
    
    # Split by bullet symbols or line breaks
    items = re.split(r'[■•▪]\s*|(?:\n\s*(?=[A-Z]))', text)
    
    parsed_items = []
    for item in items:
        item = clean_text(item)
        if item and len(item) > 5:  # Filter out very short items
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
        
        # Categorize based on keywords and section headers
        section_lower = section.lower()
        if any(keyword in section_lower for keyword in ['early uses', 'traditional', 'history', 'folklore', 'ancient', 'regarded as an aphrodisiac']):
            traditional.append(section)
        elif any(keyword in section_lower for keyword in ['ayurvedic medicine', 'western herbalism', 'gynecological', 'other uses', 'current', 'modern', 'circulatory system']):
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
    """Extract therapeutic categories based on herb content"""
    categories = set()
    
    # Combine all text for analysis
    all_text_parts = []
    
    # Add summary
    if herb.get('summary'):
        all_text_parts.append(herb.get('summary'))
    
    # Add key actions (handle both string and list)
    key_actions = herb.get('keyActions', [])
    if isinstance(key_actions, list):
        all_text_parts.extend(key_actions)
    elif key_actions:
        all_text_parts.append(key_actions)
    
    # Add traditional uses
    traditional_uses = herb.get('traditionalUses', [])
    if isinstance(traditional_uses, list):
        all_text_parts.extend(traditional_uses)
    elif traditional_uses:
        all_text_parts.append(traditional_uses)
    
    # Add current uses
    current_uses = herb.get('currentUses', [])
    if isinstance(current_uses, list):
        all_text_parts.extend(current_uses)
    elif current_uses:
        all_text_parts.append(current_uses)
    
    # Add research
    research = herb.get('research', [])
    if isinstance(research, list):
        all_text_parts.extend(research)
    elif research:
        all_text_parts.append(research)
    
    # Add history and folklore
    if herb.get('historyFolklore'):
        all_text_parts.append(herb.get('historyFolklore'))
    
    text = ' '.join(all_text_parts).lower()
    
    # Enhanced category patterns
    category_patterns = {
        'digestive': r'digest|stomach|gastro|intestin|bowel|diarrhea|constipat|nausea|acid|indigestion|reflux|ulcer',
        'respiratory': r'lung|bronch|cough|asthma|respiratory|breath|pneumonia|cold|flu|throat',
        'cardiovascular': r'heart|blood|circulation|pressure|cardiovascular|vessel|cardiac|cholesterol',
        'nervous system': r'nerv|anxiety|stress|sedative|calm|sleep|insomnia|depression|brain|mental|irritability|restlessness|qi tonic',
        'immune system': r'immune|infection|antibacterial|antiviral|antimicrobial|resistance|antiallergenic',
        'anti-inflammatory': r'inflammat|arthritis|rheumat|joint|pain|analgesic|anti-inflammatory',
        'liver support': r'liver|hepat|detox|bile|gallbladder|liver function|liver ailments',
        'urinary': r'kidney|urin|bladder|diuretic|nephrit|acid residues',
        'skin': r'skin|dermat|wound|burn|eczema|rash|topical',
        'women\'s health': r'menstrual|pregnancy|lactation|uterine|ovarian|hormonal',
        'pain relief': r'pain|analgesic|headache|migraine|toothache|ache|gout|lumbago|sciatica|osteoarthritis',
        'cold and flu': r'cold|flu|fever|chill|viral|upper respiratory',
        'energy and vitality': r'stamina|endurance|strength|weight gain|muscular strength|qi tonic|vitality',
        'nutritional': r'vitamin|mineral|nutritional|nutrient|calcium|phosphorus|iron'
    }
    
    for category, pattern in category_patterns.items():
        if re.search(pattern, text):
            categories.add(category)
    
    return list(categories)

def split_herbs(text):
    """Split the large text into individual herb sections"""
    # Look for Latin name and family pattern to identify herb boundaries
    herb_pattern = r'(?:^\n\s*)([A-Z][a-z]+\s+[a-z]+(?:\s+[a-z]+)?\s+\([A-Za-z]+\))'
    matches = list(re.finditer(herb_pattern, text, re.MULTILINE))
    
    herbs = []
    for i, match in enumerate(matches):
        start = match.start()
        # Find the end of this herb (start of next herb or end of text)
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        
        herb_text = text[start:end].strip()
        
        # Validate that this looks like a real herb section
        # Skip if it's too short or doesn't contain expected content
        if len(herb_text) < 100:
            continue
            
        # Skip if it looks like a false positive (e.g., "Volatile oil")
        latin_name = match.group(1)
        if any(skip_word in latin_name.lower() for skip_word in ['volatile', 'essential', 'fixed', 'resin']):
            continue
        
        # Additional cleaning: remove content that clearly belongs to other herbs
        # Look for another Latin name pattern within the text and truncate there
        inner_herb_pattern = r'\n\s*([A-Z][a-z]+\s+[a-z]+(?:\s+[a-z]+)?\s+\([A-Za-z]+\))'
        inner_matches = list(re.finditer(inner_herb_pattern, herb_text))
        
        if inner_matches:
            # If we find another herb name inside, truncate at that point
            first_inner_match = inner_matches[0]
            # Check if this inner match is actually a different herb
            inner_latin = first_inner_match.group(1)
            if inner_latin != latin_name:
                herb_text = herb_text[:first_inner_match.start()].strip()
        
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
            if herb_data['alternativeName']:
                print(f"  Alternative: {herb_data['alternativeName']}")
        else:
            print(f"✗ Failed to extract herb data from section {i + 1}")
    
    # Save all herbs to JSON file
    with open('all-herbs-improved.json', 'w') as f:
        json.dump(all_herbs, f, indent=2)
    
    print(f"\n✓ Successfully parsed {len(all_herbs)} herbs from manual text input")
    print("✓ Saved to all-herbs-improved.json")
    
    # Print summary
    print(f"\nSummary:")
    for herb in all_herbs:
        print(f"- {herb['latinName']} ({herb['commonName']}) - {herb['family']}")
        if herb['alternativeName']:
            print(f"  Alt: {herb['alternativeName']}")
        print(f"  Constituents: {len(herb['keyConstituents'])}, Actions: {len(herb['keyActions'])}, Categories: {len(herb['therapeuticCategories'])}")

if __name__ == "__main__":
    main()
