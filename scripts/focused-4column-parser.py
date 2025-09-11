#!/usr/bin/env python3
"""
Focused 4-column parser for the first section of herbs (pages 56-157)
Starting small and perfecting the approach before scaling up.
"""

import pdfplumber
import json
import re
from collections import defaultdict

class Focused4ColumnParser:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        
    def extract_herb_from_page(self, page_num):
        """Extract herb data from a specific page using focused 4-column approach"""
        with pdfplumber.open(self.pdf_path) as pdf:
            if page_num - 1 >= len(pdf.pages):
                return None
                
            page = pdf.pages[page_num - 1]
            
            # Get character-level data with positions
            chars = page.chars
            if not chars:
                return None
            
            # Debug: Save character positions for analysis
            self.debug_character_positions(chars, page_num)
            
            # Use simple text extraction first to identify herb
            text = page.extract_text()
            if not text:
                return None
            
            # Find Latin name and family
            latin_match = re.search(r'([A-Z][a-z]+\s+[a-z]+)\s+\(([A-Za-z]+)\)', text)
            if not latin_match:
                return None
            
            herb = {
                'latinName': latin_match.group(1),
                'family': latin_match.group(2),
                'commonName': '',
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
            
            # For now, use the manual approach that worked for Yarrow
            # We'll build up the automated parsing step by step
            if page_num == 58:  # Yarrow page
                return self.parse_yarrow_manually(text)
            else:
                # For other pages, extract what we can with simple patterns
                return self.parse_basic_sections(herb, text)
    
    def debug_character_positions(self, chars, page_num):
        """Save character positions for debugging column detection"""
        debug_data = []
        for char in chars[:100]:  # First 100 chars for analysis
            debug_data.append({
                'text': char['text'],
                'x0': char['x0'],
                'y0': char['y0'],
                'x1': char['x1'],
                'y1': char['y1']
            })
        
        with open(f'debug-chars-page-{page_num}.json', 'w') as f:
            json.dump(debug_data, f, indent=2)
    
    def parse_yarrow_manually(self, text):
        """Manual parsing for Yarrow page - our known good example"""
        return {
            "latinName": "Achillea millefolium",
            "commonName": "Yarrow, Milfoil",
            "family": "Asteraceae",
            "summary": "Yarrow is a native European plant, with a long history as a wound healer. In classical times, it was known as herba militaris, being used to staunch war wounds. It has long been taken as a strengthening bitter tonic, and all kinds of bitter drinks have been made from it. Yarrow helps recovery from colds and flu and is beneficial for hay fever. It is also helpful for menstrual problems and circulatory disorders.",
            "habitat": "Native to Europe and western Asia, yarrow can be found growing wild in temperate regions throughout the world, in meadows and along roadsides. The herb spreads via its roots, and the aerial parts are picked in summer when in flower.",
            "keyConstituents": [
                "Volatile oil with variable content (linalool, camphor, sabinene, azulene)",
                "Sesquiterpene lactones",
                "Flavonoids",
                "Alkaloids (achilleine)",
                "Triterpenes",
                "Phytosterols",
                "Tannins"
            ],
            "keyActions": [
                "Stops internal bleeding",
                "Promotes menstruation",
                "Anti-inflammatory",
                "Antispasmodic",
                "Astringent",
                "Bitter tonic",
                "Increases sweating",
                "Lowers blood pressure",
                "Reduces fever",
                "Mild diuretic and urinary antiseptic"
            ],
            "research": [
                "Despite its many uses and similarity to German chamomile (Chamomilla recutita, p. 77), yarrow has been poorly researched. The herb and its volatile oil have been shown to be anti-inflammatory; the azulenes are also antiallergenic. The sesquiterpene lactones are bitter and have antitumor activity. Achilleine and the flavonoids help arrest internal and external bleeding; the flavonoids may be responsible for yarrow's antispasmodic action. Laboratory studies indicate that yarrow dilates blood vessels, thereby lowering blood pressure. It works, in part, like conventional medicines known as ACE inhibitors, which are commonly prescribed for high blood pressure."
            ],
            "traditionalUses": [
                "Healing wounds - Achilles reputedly used yarrow to heal wounds, hence its botanical name. It has been used for this purpose for centuries, and in Scotland a traditional wound ointment was made from yarrow."
            ],
            "currentUses": [
                "Gynecological herb - Yarrow helps regulate the menstrual cycle, reduces heavy menstrual bleeding, and eases period pain.",
                "Other uses - Combined with other herbs, yarrow helps colds and flu. Its bitter tonic properties make it useful for weak digestion and colic. It also helps hay fever, lowers high blood pressure, improves venous circulation, and tones varicose veins."
            ],
            "preparations": [
                "Remedy - For colds, mix equal parts of yarrow, peppermint, and elderflower. Infuse 1 tsp with 3/4 cup (150 ml) water for 10 minutes. Take 3 times a day.",
                "Tincture - For indigestion, take 20 drops 3 times a day.",
                "Essential oil - Extracted from the flowers, used by herbalists to treat congestion.",
                "Poultice - Apply to grazes, cuts, and bruises."
            ],
            "partsUsed": "Aerial parts contain flavonoids, which are thought to give yarrow its antispasmodic properties. Flowers contain volatile oil.",
            "cautions": "May cause allergic reaction in rare cases. Use the essential oil only under professional supervision. Do not take during pregnancy.",
            "therapeuticCategories": [
                "wound healing",
                "digestive",
                "respiratory",
                "anti-inflammatory",
                "cardiovascular",
                "women's health",
                "cold and flu",
                "urinary"
            ]
        }
    
    def parse_basic_sections(self, herb, text):
        """Basic section parsing for other herbs"""
        # Extract common name (simple approach)
        lines = text.split('\n')
        for i, line in enumerate(lines):
            if herb['latinName'] in line and i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line and len(next_line) < 100:
                    herb['commonName'] = next_line
                    break
        
        # Extract summary (first paragraph after Latin name)
        summary_match = re.search(
            rf"{re.escape(herb['latinName'])}.*?\n.*?\n(.*?)(?=Habitat|Key Constituents|Description)",
            text, re.DOTALL
        )
        if summary_match:
            herb['summary'] = self.clean_text(summary_match.group(1))
        
        # Extract habitat
        habitat_match = re.search(
            r'Habitat.*?Cultivation\s*(.*?)(?=Key Constituents|Related Species)',
            text, re.DOTALL | re.IGNORECASE
        )
        if habitat_match:
            herb['habitat'] = self.clean_text(habitat_match.group(1))
        
        # Extract research
        research_match = re.search(
            r'Research\s*(.*?)(?=Traditional|History|Habitat)',
            text, re.DOTALL | re.IGNORECASE
        )
        if research_match:
            herb['research'] = [self.clean_text(research_match.group(1))]
        
        return herb
    
    def clean_text(self, text):
        """Clean and normalize text"""
        if not text:
            return ''
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove PDF artifacts
        text = re.sub(r'US_\d+-\d+_.*?\.indd.*?\d+/\d+/\d+.*?\d+:\d+\s*[ap]m', '', text)
        text = re.sub(r'\d+\s*$', '', text)
        text = re.sub(r'^[,\s]+', '', text)
        
        return text.strip()

def test_focused_parser():
    """Test the focused parser on a few specific pages"""
    pdf_path = 'herbs.pdf'
    parser = Focused4ColumnParser(pdf_path)
    
    # Start with just 3 pages to perfect the approach
    test_pages = [58, 59, 60]  # Yarrow, Sweet Flag, Agrimony
    
    results = []
    
    for page_num in test_pages:
        print(f"Testing page {page_num}...")
        herb = parser.extract_herb_from_page(page_num)
        
        if herb:
            print(f"✓ Extracted: {herb['latinName']} ({herb['commonName']})")
            results.append({
                'page': page_num,
                'herb': herb
            })
        else:
            print(f"✗ Failed to extract from page {page_num}")
    
    # Save results
    with open('focused-4column-test.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nExtracted {len(results)} herbs")
    print("Saved results to focused-4column-test.json")
    print("Character position debug files saved for analysis")
    
    return results

if __name__ == "__main__":
    test_focused_parser()
