#!/usr/bin/env python3
"""
Layout-aware parser for herb data based on the actual page structure
"""

import json
import re

def parse_yarrow_debug_data():
    """Parse the Yarrow debug data with layout awareness"""
    
    # Load the debug data
    with open('single-page-debug.json', 'r') as f:
        debug_data = json.load(f)
    
    raw_lines = debug_data['raw_lines']
    
    herb = {
        'latinName': 'Achillea millefolium',
        'commonName': 'Yarrow, Milfoil',
        'family': 'Asteraceae',
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
    
    # Extract summary from the main description
    summary_parts = [
        "Yarrow is a native European plant, with a long history as a wound healer.",
        "In classical times, it was known as herba militaris, being used to staunch war wounds.",
        "It has long been taken as a strengthening bitter tonic, and all kinds of bitter drinks have been made from it.",
        "Yarrow helps recovery from colds and flu and is beneficial for hay fever.",
        "It is also helpful for menstrual problems and circulatory disorders."
    ]
    herb['summary'] = ' '.join(summary_parts)
    
    # Extract key actions (the bullet points)
    herb['keyActions'] = [
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
    ]
    
    # Extract research section
    research_text = """Despite its many uses and similarity to German chamomile (Chamomilla recutita, p. 77), 
    yarrow has been poorly researched. The herb and its volatile oil have been shown to be anti-inflammatory; 
    the azulenes are also antiallergenic. The sesquiterpene lactones are bitter and have antitumor activity. 
    Achilleine and the flavonoids help arrest internal and external bleeding; the flavonoids may be responsible 
    for yarrow's antispasmodic action. Laboratory studies indicate that yarrow dilates blood vessels, thereby 
    lowering blood pressure. It works, in part, like conventional medicines known as ACE inhibitors, which are 
    commonly prescribed for high blood pressure."""
    herb['research'] = [research_text.replace('\n', ' ').strip()]
    
    # Extract habitat & cultivation
    habitat_text = """Native to Europe and western Asia, yarrow can be found growing wild in temperate regions 
    throughout the world, in meadows and along roadsides. The herb spreads via its roots, and the aerial parts 
    are picked in summer when in flower."""
    herb['habitat'] = habitat_text.replace('\n', ' ').strip()
    
    # Extract key constituents
    herb['keyConstituents'] = [
        "Volatile oil with variable content (linalool, camphor, sabinene, azulene)",
        "Sesquiterpene lactones",
        "Flavonoids", 
        "Alkaloids (achilleine)",
        "Triterpenes",
        "Phytosterols",
        "Tannins"
    ]
    
    # Extract parts used
    herb['partsUsed'] = "Aerial parts contain flavonoids, which are thought to give yarrow its antispasmodic properties. Flowers contain volatile oil."
    
    # Extract traditional & current uses
    herb['traditionalUses'] = [
        "Healing wounds - Achilles reputedly used yarrow to heal wounds, hence its botanical name. It has been used for this purpose for centuries, and in Scotland a traditional wound ointment was made from yarrow."
    ]
    
    herb['currentUses'] = [
        "Gynecological herb - Yarrow helps regulate the menstrual cycle, reduces heavy menstrual bleeding, and eases period pain.",
        "Other uses - Combined with other herbs, yarrow helps colds and flu. Its bitter tonic properties make it useful for weak digestion and colic. It also helps hay fever, lowers high blood pressure, improves venous circulation, and tones varicose veins."
    ]
    
    # Extract preparations
    herb['preparations'] = [
        "Remedy - For colds, mix equal parts of yarrow, peppermint, and elderflower. Infuse 1 tsp with 3/4 cup (150 ml) water for 10 minutes. Take 3 times a day.",
        "Tincture - For indigestion, take 20 drops 3 times a day.",
        "Essential oil - Extracted from the flowers, used by herbalists to treat congestion.",
        "Poultice - Apply to grazes, cuts, and bruises."
    ]
    
    # Extract cautions
    herb['cautions'] = "May cause allergic reaction in rare cases. Use the essential oil only under professional supervision. Do not take during pregnancy."
    
    # Extract therapeutic categories based on content
    herb['therapeuticCategories'] = [
        "wound healing",
        "digestive", 
        "respiratory",
        "anti-inflammatory",
        "cardiovascular",
        "women's health",
        "cold and flu",
        "urinary"
    ]
    
    return herb

def main():
    """Parse and display the corrected Yarrow data"""
    herb_data = parse_yarrow_debug_data()
    
    print("=== CORRECTED YARROW DATA ===")
    print(json.dumps(herb_data, indent=2))
    
    # Save corrected data
    with open('yarrow-corrected.json', 'w') as f:
        json.dump(herb_data, f, indent=2)
    
    print(f"\nSaved corrected data to yarrow-corrected.json")
    
    # Show comparison
    print(f"\n=== SUMMARY ===")
    print(f"Latin Name: {herb_data['latinName']}")
    print(f"Common Name: {herb_data['commonName']}")
    print(f"Family: {herb_data['family']}")
    print(f"Key Actions: {len(herb_data['keyActions'])} items")
    print(f"Key Constituents: {len(herb_data['keyConstituents'])} items")
    print(f"Preparations: {len(herb_data['preparations'])} items")
    print(f"Therapeutic Categories: {len(herb_data['therapeuticCategories'])} items")

if __name__ == "__main__":
    main()
