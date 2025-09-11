#!/usr/bin/env python3
"""
Advanced PDF Herb Scraper using pdfplumber for better column handling
"""

import pdfplumber
import json
import re
from collections import defaultdict
import sys

class AdvancedPDFHerbScraper:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.herbs = []
        self.therapeutic_categories = set()
        
    def extract_herbs_from_pdf(self):
        """Extract herbs using pdfplumber for better layout handling"""
        print("Extracting herbs using pdfplumber...")
        
        with pdfplumber.open(self.pdf_path) as pdf:
            # Process pages 56-283 (0-indexed: 55-282)
            for page_num in range(55, min(283, len(pdf.pages))):
                print(f"Processing page {page_num + 1}...")
                page = pdf.pages[page_num]
                
                # Extract text with bounding boxes
                chars = page.chars
                if not chars:
                    continue
                
                # Group characters into text blocks by position
                text_blocks = self.group_chars_into_blocks(chars)
                
                # Find herb entries in the text blocks
                herb_entries = self.find_herb_entries(text_blocks)
                
                for entry in herb_entries:
                    herb_data = self.parse_herb_entry(entry)
                    if herb_data and herb_data.get('latinName'):
                        self.herbs.append(herb_data)
        
        print(f"Successfully extracted {len(self.herbs)} herbs")
        return self.herbs
    
    def group_chars_into_blocks(self, chars):
        """Group characters into coherent text blocks based on position"""
        # Sort characters by y-coordinate (top to bottom), then x-coordinate (left to right)
        sorted_chars = sorted(chars, key=lambda c: (-c['top'], c['x0']))
        
        text_blocks = []
        current_block = []
        current_y = None
        y_tolerance = 2  # Allow small variations in y-coordinate
        
        for char in sorted_chars:
            if current_y is None or abs(char['top'] - current_y) <= y_tolerance:
                current_block.append(char)
                current_y = char['top']
            else:
                if current_block:
                    # Convert character block to text
                    block_text = ''.join([c['text'] for c in current_block])
                    if block_text.strip():
                        text_blocks.append({
                            'text': block_text.strip(),
                            'y': current_y,
                            'x': min([c['x0'] for c in current_block])
                        })
                current_block = [char]
                current_y = char['top']
        
        # Don't forget the last block
        if current_block:
            block_text = ''.join([c['text'] for c in current_block])
            if block_text.strip():
                text_blocks.append({
                    'text': block_text.strip(),
                    'y': current_y,
                    'x': min([c['x0'] for c in current_block])
                })
        
        return text_blocks
    
    def find_herb_entries(self, text_blocks):
        """Find herb entries from text blocks"""
        herb_entries = []
        current_entry = []
        in_herb = False
        
        for block in text_blocks:
            text = block['text']
            
            # Check if this is a herb header (Latin name with family)
            if re.match(r'^[A-Z][a-z]+\s+[a-z]+\s+\([A-Za-z]+\)', text):
                # Save previous entry if exists
                if current_entry:
                    herb_entries.append('\n'.join(current_entry))
                
                # Start new entry
                current_entry = [text]
                in_herb = True
            elif in_herb:
                # Continue collecting text for current herb
                current_entry.append(text)
        
        # Don't forget the last entry
        if current_entry:
            herb_entries.append('\n'.join(current_entry))
        
        return herb_entries
    
    def parse_herb_entry(self, entry_text):
        """Parse a single herb entry into structured data"""
        herb = {
            'latinName': '',
            'commonName': '',
            'family': '',
            'summary': '',
            'habitat': '',
            'keyConstituents': [],
            'keyActions': [],
            'research': [],
            'traditionalUses': [],
            'currentUses': [],
            'preparations': [],
            'partsUsed': '',
            'cautions': '',
            'therapeuticCategories': []
        }
        
        lines = entry_text.split('\n')
        
        # Extract Latin name and family from first line
        first_line = lines[0] if lines else ''
        header_match = re.match(r'([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)', first_line)
        if header_match:
            herb['latinName'] = header_match.group(1).strip()
            herb['family'] = header_match.group(2).strip()
        
        # Extract common name (usually second line)
        if len(lines) > 1:
            potential_common = lines[1].strip()
            if potential_common and len(potential_common) < 50 and not any(keyword in potential_common.lower() for keyword in ['habitat', 'constituents', 'actions']):
                herb['commonName'] = potential_common
        
        # Process remaining lines for sections
        current_section = 'summary'
        section_content = defaultdict(list)
        
        for line in lines[2:]:  # Skip header and common name
            line = line.strip()
            if not line:
                continue
            
            # Identify section headers
            if 'habitat' in line.lower() and 'cultivation' in line.lower():
                current_section = 'habitat'
            elif 'key constituents' in line.lower():
                current_section = 'constituents'
            elif 'key actions' in line.lower():
                current_section = 'actions'
            elif 'research' in line.lower():
                current_section = 'research'
            elif 'traditional' in line.lower() and 'current' in line.lower():
                current_section = 'uses'
            elif 'preparations' in line.lower():
                current_section = 'preparations'
            elif 'parts used' in line.lower():
                current_section = 'parts'
            elif 'cautions' in line.lower():
                current_section = 'cautions'
            else:
                # Add content to current section
                section_content[current_section].append(line)
        
        # Process collected sections
        herb['summary'] = ' '.join(section_content['summary'])
        herb['habitat'] = ' '.join(section_content['habitat'])
        herb['research'] = [' '.join(section_content['research'])] if section_content['research'] else []
        herb['partsUsed'] = ' '.join(section_content['parts'])
        herb['cautions'] = ' '.join(section_content['cautions'])
        
        # Process bullet-pointed sections
        for line in section_content['constituents']:
            if line.startswith('■') or line.startswith('•'):
                herb['keyConstituents'].append(line[1:].strip())
            elif line.strip():
                herb['keyConstituents'].append(line.strip())
        
        for line in section_content['actions']:
            if line.startswith('■') or line.startswith('•'):
                herb['keyActions'].append(line[1:].strip())
            elif line.strip():
                herb['keyActions'].append(line.strip())
        
        # Process uses (split into traditional and current)
        for line in section_content['uses']:
            if 'traditional' in line.lower():
                herb['traditionalUses'].append(line.strip())
            else:
                herb['currentUses'].append(line.strip())
        
        herb['preparations'] = [line.strip() for line in section_content['preparations'] if line.strip()]
        
        # Extract therapeutic categories
        herb['therapeuticCategories'] = self.extract_therapeutic_categories(herb)
        
        return herb
    
    def extract_therapeutic_categories(self, herb):
        """Extract therapeutic categories based on actions and uses"""
        categories = set()
        text = f"{herb['summary']} {' '.join(herb['keyActions'])} {' '.join(herb['currentUses'])} {' '.join(herb['traditionalUses'])}".lower()
        
        category_patterns = {
            'wound healing': r'wound|cut|bruise|injury|healing|vulnerary|antiseptic',
            'digestive': r'digest|stomach|gastric|intestinal|nausea|indigestion|dyspepsia',
            'respiratory': r'cough|bronchial|lung|respiratory|asthma|expectorant',
            'immune support': r'immune|infection|antimicrobial|antibacterial|antiviral',
            'anti-inflammatory': r'anti-inflammatory|inflammation|inflammatory',
            'cardiovascular': r'heart|cardiac|circulation|blood pressure|cardiovascular',
            'nervous system': r'nervous|anxiety|stress|sedative|calming|nerve',
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
                self.therapeutic_categories.add(category)
        
        return list(categories)
    
    def save_to_json(self, output_path='herbs-extracted-advanced.json'):
        """Save extracted herbs to JSON file"""
        data = {
            'extractedAt': '2025-01-09T09:37:00+10:00',
            'source': 'Advanced PDF Herb Scraper (pdfplumber)',
            'totalHerbs': len(self.herbs),
            'therapeuticCategories': list(self.therapeutic_categories),
            'herbs': self.herbs
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(self.herbs)} herbs to {output_path}")
        
        # Also save summary
        summary = {
            'totalHerbs': len(self.herbs),
            'therapeuticCategories': list(self.therapeutic_categories),
            'herbNames': [{'latin': h['latinName'], 'common': h['commonName']} for h in self.herbs]
        }
        
        summary_path = output_path.replace('.json', '-summary.json')
        with open(summary_path, 'w', encoding='utf-8') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        print(f"Saved summary to {summary_path}")

def main():
    pdf_path = 'herbs.pdf'
    
    try:
        scraper = AdvancedPDFHerbScraper(pdf_path)
        herbs = scraper.extract_herbs_from_pdf()
        scraper.save_to_json()
        
        print(f"\n=== SCRAPING COMPLETE ===")
        print(f"Total herbs extracted: {len(herbs)}")
        print(f"Therapeutic categories found: {len(scraper.therapeutic_categories)}")
        print("Files created:")
        print("- herbs-extracted-advanced.json (full data)")
        print("- herbs-extracted-advanced-summary.json (summary)")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
