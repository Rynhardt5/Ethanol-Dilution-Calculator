#!/usr/bin/env python3
"""
Analyze the herbs.txt file to find why we're missing ~243 herbs
"""

import re
import json

def find_all_latin_names(text):
    """Find all potential Latin name patterns in the text"""
    # Focus on the most reliable pattern: Latin name followed by family in parentheses
    pattern = r'([A-Z][a-z]+\s+[a-z]+(?:\s+[a-z]+)?)\s+\(([A-Za-z]+)\)'
    
    found_names = set()
    matches = re.finditer(pattern, text, re.MULTILINE)
    
    for match in matches:
        latin_name = match.group(1).strip()
        family = match.group(2).strip()
        
        # Skip obvious false positives
        skip_words = [
            'volatile', 'essential', 'fixed', 'resin', 'key', 'parts', 
            'an annual', 'an aromatic', 'an erect', 'an evergreen', 'an herbaceous',
            'american remedy', 'acanthus flowers', 'an extensive'
        ]
        
        # Check if it contains spaced letters (page headers like "W O R D")
        if ' ' in latin_name and len([c for c in latin_name if c == ' ']) > 2:
            continue
            
        if not any(skip in latin_name.lower() for skip in skip_words):
            # Validate that it looks like a real Latin name
            words = latin_name.split()
            if len(words) >= 2 and all(word.isalpha() for word in words):
                # Check that family looks valid (common botanical families)
                valid_families = [
                    'asteraceae', 'rosaceae', 'lamiaceae', 'apiaceae', 'fabaceae',
                    'solanaceae', 'brassicaceae', 'ranunculaceae', 'malvaceae',
                    'euphorbiaceae', 'rubiaceae', 'scrophulariaceae', 'plantaginaceae',
                    'caryophyllaceae', 'polygonaceae', 'amaryllidaceae', 'liliaceae',
                    'iridaceae', 'orchidaceae', 'poaceae', 'cyperaceae', 'araceae',
                    'arecaceae', 'bromeliaceae', 'musaceae', 'zingiberaceae',
                    'meliaceae', 'rutaceae', 'myrtaceae', 'lauraceae', 'magnoliaceae',
                    'papaveraceae', 'fumariaceae', 'berberidaceae', 'menispermaceae',
                    'nymphaeaceae', 'aristolochiaceae', 'piperaceae', 'saururaceae',
                    'chloranthaceae', 'ceratophyllaceae', 'nelumbonaceae'
                ]
                
                if family.lower() in valid_families or len(family) > 4:
                    found_names.add(latin_name)
    
    return sorted(found_names)

def analyze_current_parsed():
    """Get Latin names from current parsed JSON"""
    try:
        with open('all-herbs-improved.json', 'r') as f:
            data = json.load(f)
        return [herb['latinName'] for herb in data]
    except FileNotFoundError:
        return []

def main():
    # Read the source text
    try:
        with open('herbs.txt', 'r', encoding='utf-8') as f:
            text = f.read()
    except FileNotFoundError:
        print("Error: herbs.txt not found")
        return
    
    # Find all potential Latin names
    all_potential = find_all_latin_names(text)
    print(f"Found {len(all_potential)} potential Latin names in source text")
    
    # Get currently parsed herbs
    current_parsed = analyze_current_parsed()
    print(f"Currently parsed: {len(current_parsed)} herbs")
    
    # Find missing ones
    current_set = set(current_parsed)
    potential_set = set(all_potential)
    
    missing = potential_set - current_set
    print(f"Potentially missing: {len(missing)} herbs")
    
    if missing:
        print("\nFirst 20 potentially missing herbs:")
        for i, name in enumerate(sorted(missing)[:20]):
            print(f"  {i+1}. {name}")
    
    # Show some examples of what we found
    print(f"\nFirst 10 potential herbs found:")
    for i, name in enumerate(all_potential[:10]):
        print(f"  {i+1}. {name}")

if __name__ == "__main__":
    main()
