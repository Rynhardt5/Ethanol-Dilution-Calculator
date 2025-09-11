#!/usr/bin/env python3
"""
Single-page PDF Herb Scraper for testing and debugging
"""

import pdfplumber
import json
import re
from collections import defaultdict

class SinglePageHerbScraper:
    def __init__(self, pdf_path, page_number=56):
        self.pdf_path = pdf_path
        self.page_number = page_number - 1  # Convert to 0-indexed
        
    def extract_page_text(self):
        """Extract text from a single page with detailed debugging"""
        print(f"Extracting text from page {self.page_number + 1}...")
        
        with pdfplumber.open(self.pdf_path) as pdf:
            if self.page_number >= len(pdf.pages):
                print(f"Page {self.page_number + 1} not found in PDF")
                return None
                
            page = pdf.pages[self.page_number]
            
            # Method 1: Simple text extraction
            print("\n=== METHOD 1: Simple text extraction ===")
            simple_text = page.extract_text()
            print("Simple text (first 500 chars):")
            print(simple_text[:500] if simple_text else "No text found")
            
            # Method 2: Extract with layout preservation
            print("\n=== METHOD 2: Layout-aware extraction ===")
            layout_text = page.extract_text(layout=True)
            print("Layout text (first 500 chars):")
            print(layout_text[:500] if layout_text else "No text found")
            
            # Method 3: Character-level extraction with coordinates
            print("\n=== METHOD 3: Character coordinates ===")
            chars = page.chars
            print(f"Found {len(chars)} characters")
            
            if chars:
                # Group characters by approximate y-coordinate (lines)
                lines = self.group_chars_by_line(chars)
                print(f"Grouped into {len(lines)} lines")
                
                # Show first few lines
                for i, line in enumerate(lines[:10]):
                    print(f"Line {i+1}: {line['text'][:100]}...")
            
            # Method 4: Try to extract tables/structured content
            print("\n=== METHOD 4: Table extraction ===")
            tables = page.extract_tables()
            print(f"Found {len(tables)} tables")
            
            return {
                'simple_text': simple_text,
                'layout_text': layout_text,
                'lines': lines if chars else [],
                'tables': tables
            }
    
    def group_chars_by_line(self, chars, y_tolerance=3):
        """Group characters into lines based on y-coordinate"""
        # Sort by y-coordinate (top to bottom)
        sorted_chars = sorted(chars, key=lambda c: c['top'])
        
        lines = []
        current_line_chars = []
        current_y = None
        
        for char in sorted_chars:
            if current_y is None or abs(char['top'] - current_y) <= y_tolerance:
                current_line_chars.append(char)
                current_y = char['top'] if current_y is None else current_y
            else:
                # Finish current line
                if current_line_chars:
                    # Sort characters in line by x-coordinate (left to right)
                    line_chars = sorted(current_line_chars, key=lambda c: c['x0'])
                    line_text = ''.join([c['text'] for c in line_chars])
                    lines.append({
                        'text': line_text.strip(),
                        'y': current_y,
                        'x_start': min([c['x0'] for c in line_chars]),
                        'x_end': max([c['x1'] for c in line_chars])
                    })
                
                # Start new line
                current_line_chars = [char]
                current_y = char['top']
        
        # Don't forget the last line
        if current_line_chars:
            line_chars = sorted(current_line_chars, key=lambda c: c['x0'])
            line_text = ''.join([c['text'] for c in line_chars])
            lines.append({
                'text': line_text.strip(),
                'y': current_y,
                'x_start': min([c['x0'] for c in line_chars]),
                'x_end': max([c['x1'] for c in line_chars])
            })
        
        return lines
    
    def find_herb_entries_in_lines(self, lines):
        """Find herb entries from line data"""
        print("\n=== FINDING HERB ENTRIES ===")
        
        herb_entries = []
        current_entry_lines = []
        in_herb = False
        
        for i, line in enumerate(lines):
            text = line['text']
            
            # Check if this line contains a Latin name (herb header)
            latin_match = re.search(r'([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)', text)
            if latin_match:
                print(f"Found herb header at line {i+1}: {text}")
                
                # Save previous entry if exists
                if current_entry_lines:
                    herb_entries.append(current_entry_lines)
                
                # Start new entry
                current_entry_lines = [line]
                in_herb = True
            elif in_herb and text.strip():
                current_entry_lines.append(line)
        
        # Don't forget the last entry
        if current_entry_lines:
            herb_entries.append(current_entry_lines)
        
        print(f"Found {len(herb_entries)} herb entries")
        return herb_entries
    
    def parse_herb_from_lines(self, entry_lines):
        """Parse herb data from line entries"""
        if not entry_lines:
            return None
        
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
        
        # Extract Latin name and family from first line
        first_line = entry_lines[0]['text']
        header_match = re.search(r'([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)', first_line)
        if header_match:
            herb['latinName'] = header_match.group(1).strip()
            herb['family'] = header_match.group(2).strip()
        
        # Look for common name in subsequent lines
        for i in range(1, min(5, len(entry_lines))):  # Check first few lines
            line_text = entry_lines[i]['text'].strip()
            if line_text and len(line_text) < 50:
                # Check if it looks like a common name (not a section header)
                if not any(keyword in line_text.lower() for keyword in 
                          ['habitat', 'constituents', 'actions', 'research', 'uses', 'parts']):
                    herb['commonName'] = line_text
                    break
        
        # Process all lines for content
        current_section = 'summary'
        section_content = defaultdict(list)
        
        for line in entry_lines[1:]:  # Skip the header line
            text = line['text'].strip()
            if not text:
                continue
            
            # Identify section headers
            text_lower = text.lower()
            if 'habitat' in text_lower and 'cultivation' in text_lower:
                current_section = 'habitat'
                continue
            elif 'key constituents' in text_lower:
                current_section = 'constituents'
                continue
            elif 'key actions' in text_lower:
                current_section = 'actions'
                continue
            elif 'research' in text_lower and len(text) < 20:  # Short line likely a header
                current_section = 'research'
                continue
            elif 'traditional' in text_lower and 'current' in text_lower:
                current_section = 'uses'
                continue
            elif 'preparations' in text_lower:
                current_section = 'preparations'
                continue
            elif 'parts used' in text_lower:
                current_section = 'parts'
                continue
            elif 'cautions' in text_lower and len(text) < 20:
                current_section = 'cautions'
                continue
            
            # Add content to current section
            section_content[current_section].append(text)
        
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
        
        # Process uses
        for line in section_content['uses']:
            if 'traditional' in line.lower():
                herb['traditionalUses'].append(line.strip())
            else:
                herb['currentUses'].append(line.strip())
        
        herb['preparations'] = [line.strip() for line in section_content['preparations'] if line.strip()]
        
        return herb
    
    def debug_single_page(self):
        """Debug extraction for a single page"""
        print(f"=== DEBUGGING PAGE {self.page_number + 1} ===")
        
        # Extract text using different methods
        page_data = self.extract_page_text()
        if not page_data:
            return
        
        # Try to find herb entries
        if page_data['lines']:
            herb_entries = self.find_herb_entries_in_lines(page_data['lines'])
            
            # Parse first herb entry for detailed analysis
            if herb_entries:
                print(f"\n=== PARSING FIRST HERB ENTRY ===")
                first_entry = herb_entries[0]
                print(f"Entry has {len(first_entry)} lines:")
                for i, line in enumerate(first_entry):
                    print(f"  {i+1}: {line['text']}")
                
                # Parse the herb
                herb_data = self.parse_herb_from_lines(first_entry)
                print(f"\n=== PARSED HERB DATA ===")
                print(json.dumps(herb_data, indent=2))
                
                # Save to file for inspection
                with open('single-page-debug.json', 'w') as f:
                    json.dump({
                        'page_number': self.page_number + 1,
                        'raw_lines': [line['text'] for line in first_entry],
                        'parsed_herb': herb_data
                    }, f, indent=2)
                
                print(f"\nSaved debug data to single-page-debug.json")

def main():
    pdf_path = 'herbs.pdf'
    
    # Try multiple pages to find actual herb content
    test_pages = [56, 57, 58, 59, 60, 65, 70]
    
    for page_num in test_pages:
        print(f"\n{'='*60}")
        print(f"TESTING PAGE {page_num}")
        print(f"{'='*60}")
        
        scraper = SinglePageHerbScraper(pdf_path, page_num)
        page_data = scraper.extract_page_text()
        
        if page_data and page_data['simple_text']:
            # Check if this page has herb content
            text = page_data['simple_text']
            latin_matches = re.findall(r'([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)', text)
            
            if latin_matches:
                print(f"✓ Found {len(latin_matches)} herb entries on page {page_num}:")
                for latin, family in latin_matches:
                    print(f"  - {latin} ({family})")
                
                # Debug this page in detail
                scraper.debug_single_page()
                break
            else:
                print(f"✗ No herb entries found on page {page_num}")
                print(f"Sample text: {text[:200]}...")
        else:
            print(f"✗ No text extracted from page {page_num}")
    
    print(f"\nIf no herb content was found, the PDF might use different page numbering.")

if __name__ == "__main__":
    main()
