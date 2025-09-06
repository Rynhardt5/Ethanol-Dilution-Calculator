#!/usr/bin/env python3
"""
Extract medicinal plants from PFAF SQLite database and merge with existing herbs data.
"""

import sqlite3
import json
import re
from pathlib import Path
from typing import Dict, List, Any, Optional

def connect_to_pfaf_db(db_path: str) -> sqlite3.Connection:
    """Connect to the PFAF SQLite database."""
    return sqlite3.connect(db_path)

def extract_medicinal_plants(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    """
    Extract plants that have medicinal uses from the PFAF database.
    Filters for plants with:
    - medicinal_rating > 0
    - medicinal uses in the uses table
    - medicinal content in text fields
    """
    
    # First, let's check what columns actually exist
    cursor = conn.execute("PRAGMA table_info(plants)")
    columns_info = cursor.fetchall()
    print("Available columns in plants table:")
    for col in columns_info:
        print(f"  - {col[1]} ({col[2]})")
    
    query = """
    SELECT DISTINCT
        p.latin_name,
        p.common_name,
        p.family,
        p.medicinal_rating,
        p.edibility_rating,
        p.other_uses_rating,
        p.habit,
        p.height,
        p.hardiness,
        p.growth,
        p.soil,
        p.shade,
        p.moisture,
        p.known_hazards,
        p.habitats,
        p.range,
        p.summary,
        p.physical_characteristics,
        p.synonyms,
        p.medicinal_uses,
        p.edible_uses,
        p.other_uses,
        p.cultivation_details,
        p.propagation,
        p.other_names,
        p.found_in,
        p.weed_potential_section,
        p.conservation_status,
        p.expert_comment,
        p.author,
        p.botanical_references,
        GROUP_CONCAT(DISTINCT pu.name) as medicinal_use_names,
        GROUP_CONCAT(DISTINCT pc.care) as care_requirements
    FROM plants p
    LEFT JOIN plant_uses pus ON p.latin_name = pus.plant
    LEFT JOIN uses pu ON pus.category = pu.category AND pus.name = pu.name
    LEFT JOIN plant_care pc ON p.latin_name = pc.plant
    WHERE (
        p.medicinal_rating > 0 
        OR pu.category = 'medicinal uses'
        OR p.medicinal_uses IS NOT NULL AND p.medicinal_uses != ''
        OR LOWER(p.summary) LIKE '%medicin%'
        OR LOWER(p.summary) LIKE '%therap%'
        OR LOWER(p.summary) LIKE '%treat%'
        OR LOWER(p.other_uses) LIKE '%medicin%'
    )
    GROUP BY p.latin_name
    ORDER BY p.medicinal_rating DESC, p.common_name
    """
    
    cursor = conn.execute(query)
    columns = [description[0] for description in cursor.description]
    
    plants = []
    for row in cursor.fetchall():
        plant_dict = dict(zip(columns, row))
        plants.append(plant_dict)
    
    print(f"Found {len(plants)} medicinal plants in PFAF database")
    return plants

def transform_pfaf_to_herbs_format(pfaf_plants: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Transform PFAF plant data to match the herbs schema format."""
    
    herbs = []
    
    for plant in pfaf_plants:
        # Extract medicinal actions from text
        medicinal_actions = extract_medicinal_actions(plant.get('medicinal_uses', ''))
        
        # Extract indications from medicinal uses
        indications = extract_indications(plant.get('medicinal_uses', ''))
        
        # Extract plant parts from medicinal uses text since plant_parts_used column doesn't exist
        parts_used = extract_plant_parts(plant.get('medicinal_uses', '') + ' ' + plant.get('edible_uses', ''))
        
        # Extract constituents from medicinal uses text
        constituents = extract_constituents(plant.get('medicinal_uses', ''))
        
        herb = {
            "id": f"pfaf_{plant['latin_name'].lower().replace(' ', '_')}",
            "common_name": plant['common_name'] or plant['latin_name'],
            "latin_name": plant['latin_name'],
            "family": plant['family'] or "Unknown",
            "plant_parts_used": parts_used,
            "medicinal_actions": medicinal_actions,
            "indications": indications,
            "folk_uses": plant.get('summary', ''),
            "constituents": constituents,
            "best_preparations": extract_preparations(plant.get('medicinal_uses', '')),
            "solvent_recommendations": [],  # Will be enriched later
            "dosage": plant.get('dosage', ''),
            "safety": plant.get('known_hazards', ''),
            "interactions": [],  # Extract from safety text if available
            "sources": ["PFAF - Plants for a Future"],
            "tags": generate_tags(plant),
            "pfaf_data": {
                "medicinal_rating": plant.get('medicinal_rating', 0),
                "edibility_rating": plant.get('edibility_rating', 0),
                "other_uses_rating": plant.get('other_uses_rating', 0),
                "habit": plant.get('habit', ''),
                "height": plant.get('height', 0),
                "hardiness": plant.get('hardiness', ''),
                "growth": plant.get('growth', ''),
                "soil": plant.get('soil', ''),
                "shade": plant.get('shade', ''),
                "moisture": plant.get('moisture', ''),
                "habitats": plant.get('habitats', ''),
                "range": plant.get('range', ''),
                "cultivation_details": plant.get('cultivation_details', ''),
                "propagation": plant.get('propagation', ''),
                "care_requirements": plant.get('care_requirements', '').split(',') if plant.get('care_requirements') else []
            }
        }
        
        herbs.append(herb)
    
    return herbs

def extract_plant_parts(text: str) -> List[str]:
    """Extract plant parts used from text."""
    if not text:
        return []
    
    parts = []
    text_lower = text.lower()
    
    # Common plant parts
    part_patterns = [
        'root', 'roots', 'leaf', 'leaves', 'flower', 'flowers', 'flowering tops',
        'stem', 'stems', 'bark', 'seed', 'seeds', 'fruit', 'fruits', 'berry', 'berries',
        'rhizome', 'bulb', 'tuber', 'aerial parts', 'whole plant', 'tops'
    ]
    
    for part in part_patterns:
        if part in text_lower:
            # Normalize to singular form for consistency
            normalized = part.rstrip('s') if part.endswith('s') and part != 'tops' else part
            if normalized == 'leave':
                normalized = 'leaf'
            elif normalized == 'flowering top':
                normalized = 'flowering tops'
            parts.append(normalized)
    
    return list(set(parts)) or ['aerial parts']  # Default if none found

def extract_medicinal_actions(text: str) -> List[str]:
    """Extract medicinal actions from text using common patterns."""
    if not text:
        return []
    
    actions = []
    text_lower = text.lower()
    
    # Common medicinal action patterns
    action_patterns = {
        'anti-inflammatory': ['anti-inflammatory', 'antiinflammatory', 'reduces inflammation'],
        'antimicrobial': ['antimicrobial', 'antibacterial', 'antifungal', 'antiseptic'],
        'antioxidant': ['antioxidant', 'free radical'],
        'digestive': ['digestive', 'stomach', 'digestion', 'carminative'],
        'sedative': ['sedative', 'calming', 'relaxing', 'nervine'],
        'diuretic': ['diuretic', 'urinary'],
        'expectorant': ['expectorant', 'cough', 'respiratory'],
        'astringent': ['astringent', 'tannin'],
        'tonic': ['tonic', 'strengthening'],
        'antispasmodic': ['antispasmodic', 'spasm', 'cramp']
    }
    
    for action, patterns in action_patterns.items():
        if any(pattern in text_lower for pattern in patterns):
            actions.append(action)
    
    return list(set(actions))

def extract_indications(text: str) -> List[str]:
    """Extract medical indications/conditions from text."""
    if not text:
        return []
    
    indications = []
    text_lower = text.lower()
    
    # Common condition patterns
    condition_patterns = [
        'headache', 'fever', 'cold', 'flu', 'cough', 'sore throat',
        'indigestion', 'nausea', 'diarrhea', 'constipation',
        'anxiety', 'insomnia', 'stress', 'depression',
        'arthritis', 'rheumatism', 'joint pain', 'muscle pain',
        'wound', 'cut', 'burn', 'skin condition', 'eczema',
        'infection', 'inflammation', 'swelling'
    ]
    
    for condition in condition_patterns:
        if condition in text_lower:
            indications.append(condition)
    
    return list(set(indications))

def extract_constituents(text: str) -> List[Dict[str, Any]]:
    """Extract chemical constituents from medicinal uses text."""
    if not text:
        return []
    
    constituents = []
    text_lower = text.lower()
    
    # Common constituent patterns
    constituent_patterns = {
        'tannins': 'astringent compounds',
        'alkaloids': 'nitrogen-containing compounds',
        'flavonoids': 'antioxidant compounds',
        'essential oils': 'volatile aromatic compounds',
        'saponins': 'soap-like compounds',
        'glycosides': 'sugar-bound compounds',
        'mucilage': 'soothing gel-like compounds',
        'resins': 'protective compounds'
    }
    
    for constituent, description in constituent_patterns.items():
        if constituent in text_lower:
            constituents.append({
                "name": constituent.title(),
                "class": description,
                "solubility": {
                    "water": constituent in ['tannins', 'mucilage', 'saponins'],
                    "ethanol_range": "40-70%" if constituent in ['tannins', 'flavonoids'] else "70-95%"
                },
                "notes": f"Found in {constituent} analysis"
            })
    
    return constituents

def extract_preparations(text: str) -> List[str]:
    """Extract preparation methods from text."""
    if not text:
        return []
    
    preparations = []
    text_lower = text.lower()
    
    prep_patterns = ['tea', 'tincture', 'decoction', 'infusion', 'poultice', 'oil', 'salve', 'extract']
    
    for prep in prep_patterns:
        if prep in text_lower:
            preparations.append(prep)
    
    return list(set(preparations)) or ['infusion']  # Default to infusion

def generate_tags(plant: Dict[str, Any]) -> List[str]:
    """Generate tags based on plant properties."""
    tags = []
    
    # Add medicinal rating as tag
    if plant.get('medicinal_rating', 0) >= 3:
        tags.append('highly medicinal')
    elif plant.get('medicinal_rating', 0) >= 1:
        tags.append('medicinal')
    
    # Add edibility info
    if plant.get('edibility_rating', 0) > 0:
        tags.append('edible')
    
    # Add habitat tags
    habit = plant.get('habit', '').lower()
    if 'tree' in habit:
        tags.append('tree')
    elif 'shrub' in habit:
        tags.append('shrub')
    elif 'herb' in habit:
        tags.append('herb')
    
    return tags

def load_existing_herbs_data(file_path: str) -> List[Dict[str, Any]]:
    """Load existing herbs-data-merged.json file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"File {file_path} not found, starting with empty list")
        return []
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON file {file_path}: {e}")
        return []

def merge_herbs_data(existing_herbs: List[Dict[str, Any]], pfaf_herbs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Merge PFAF herbs with existing herbs data, avoiding duplicates."""
    
    # Create lookup for existing herbs by latin name
    existing_lookup = {herb.get('latin_name', '').lower(): herb for herb in existing_herbs}
    
    merged_herbs = existing_herbs.copy()
    new_count = 0
    enriched_count = 0
    
    for pfaf_herb in pfaf_herbs:
        latin_name = pfaf_herb['latin_name'].lower()
        
        if latin_name in existing_lookup:
            # Enrich existing herb with PFAF data
            existing_herb = existing_lookup[latin_name]
            
            # Add PFAF-specific data
            existing_herb['pfaf_data'] = pfaf_herb['pfaf_data']
            
            # Merge sources
            if 'PFAF - Plants for a Future' not in existing_herb.get('sources', []):
                existing_herb.setdefault('sources', []).append('PFAF - Plants for a Future')
            
            # Merge tags
            existing_tags = set(existing_herb.get('tags', []))
            pfaf_tags = set(pfaf_herb.get('tags', []))
            existing_herb['tags'] = list(existing_tags.union(pfaf_tags))
            
            # Enrich folk uses if empty
            if not existing_herb.get('folk_uses') and pfaf_herb.get('folk_uses'):
                existing_herb['folk_uses'] = pfaf_herb['folk_uses']
            
            enriched_count += 1
        else:
            # Add new herb from PFAF
            merged_herbs.append(pfaf_herb)
            new_count += 1
    
    print(f"Merged results: {new_count} new herbs added, {enriched_count} existing herbs enriched")
    return merged_herbs

def main():
    """Main function to extract and merge medicinal plants."""
    
    # Paths
    pfaf_db_path = "/Users/rynhardtsmith/Workspace/projects/pfaf-data/data.sqlite"
    herbs_data_path = "/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/herbs-data-merged.json"
    output_path = "/Users/rynhardtsmith/Workspace/projects/ethanol-dilution-calculator/herbs-data-pfaf-merged.json"
    
    # Check if PFAF database exists
    if not Path(pfaf_db_path).exists():
        print(f"PFAF database not found at {pfaf_db_path}")
        print("Please ensure the PFAF scraping has completed and data.sqlite exists")
        return
    
    # Extract medicinal plants from PFAF database
    print("Connecting to PFAF database...")
    conn = connect_to_pfaf_db(pfaf_db_path)
    
    print("Extracting medicinal plants...")
    pfaf_plants = extract_medicinal_plants(conn)
    conn.close()
    
    # Transform to herbs format
    print("Transforming PFAF data to herbs format...")
    pfaf_herbs = transform_pfaf_to_herbs_format(pfaf_plants)
    
    # Load existing herbs data
    print("Loading existing herbs data...")
    existing_herbs = load_existing_herbs_data(herbs_data_path)
    print(f"Found {len(existing_herbs)} existing herbs")
    
    # Merge the data
    print("Merging herbs data...")
    merged_herbs = merge_herbs_data(existing_herbs, pfaf_herbs)
    
    # Save merged data
    print(f"Saving merged data to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(merged_herbs, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Successfully created merged herbs database with {len(merged_herbs)} total herbs")
    print(f"📁 Output saved to: {output_path}")
    
    # Print some statistics
    medicinal_count = len([h for h in merged_herbs if h.get('pfaf_data', {}).get('medicinal_rating', 0) > 0])
    high_medicinal = len([h for h in merged_herbs if h.get('pfaf_data', {}).get('medicinal_rating', 0) >= 3])
    
    print(f"\n📊 Statistics:")
    print(f"   Total herbs: {len(merged_herbs)}")
    print(f"   With medicinal rating: {medicinal_count}")
    print(f"   Highly medicinal (rating ≥3): {high_medicinal}")

if __name__ == "__main__":
    main()
