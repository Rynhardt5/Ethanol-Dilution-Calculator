#!/usr/bin/env python3
"""
Migration script to merge improved herb data with existing database.
This script will:
1. Read the improved herb JSON data
2. Connect to the database
3. Update existing herbs with new data (preferring new data)
4. Insert new herbs that don't exist
"""

import json
import psycopg2
from psycopg2.extras import Json
import os
from datetime import datetime

def connect_to_database():
    """Connect to PostgreSQL database"""
    try:
        # Use DATABASE_URL if available, otherwise fall back to individual env vars
        database_url = os.getenv('DATABASE_URL')
        if database_url:
            conn = psycopg2.connect(database_url)
        else:
            conn = psycopg2.connect(
                host=os.getenv('DB_HOST', 'localhost'),
                database=os.getenv('DB_NAME', 'herbs_db'),
                user=os.getenv('DB_USER', 'postgres'),
                password=os.getenv('DB_PASSWORD', '')
            )
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return None

def generate_herb_id(latin_name):
    """Generate a consistent ID from latin name"""
    return latin_name.lower().replace(' ', '_').replace('.', '')

def upsert_herb(cursor, herb_data):
    """Insert or update herb data in the database"""
    latin_name = herb_data.get('latinName', '')
    
    # Prepare the data
    data = {
        'common_name': herb_data.get('commonName', ''),
        'latin_name': latin_name,
        'alternative_name': herb_data.get('alternativeName', ''),
        'family': herb_data.get('family', ''),
        'summary': herb_data.get('summary', ''),
        'habitat': herb_data.get('habitat', ''),
        'parts_used': herb_data.get('partsUsed', ''),
        'related_species': herb_data.get('relatedSpecies', ''),
        'key_constituents': Json(herb_data.get('keyConstituents', [])),
        'history_folklore': herb_data.get('historyFolklore', ''),
        'key_actions': Json(herb_data.get('keyActions', [])),
        'research': Json(herb_data.get('research', [])),
        'traditional_uses': Json(herb_data.get('traditionalUses', [])),
        'current_uses': Json(herb_data.get('currentUses', [])),
        'preparations': Json(herb_data.get('preparations', [])),
        'cautions': herb_data.get('cautions', ''),
        'therapeutic_categories': Json(herb_data.get('therapeuticCategories', [])),
        'updated_at': datetime.now()
    }
    
    # First, try to update all existing records with matching latin_name
    update_query = """
    UPDATE herbs SET
        common_name = %(common_name)s,
        alternative_name = %(alternative_name)s,
        family = %(family)s,
        summary = %(summary)s,
        habitat = %(habitat)s,
        parts_used = %(parts_used)s,
        related_species = %(related_species)s,
        key_constituents = %(key_constituents)s,
        history_folklore = %(history_folklore)s,
        key_actions = %(key_actions)s,
        research = %(research)s,
        traditional_uses = %(traditional_uses)s,
        current_uses = %(current_uses)s,
        preparations = %(preparations)s,
        cautions = %(cautions)s,
        therapeutic_categories = %(therapeutic_categories)s,
        updated_at = %(updated_at)s
    WHERE latin_name = %(latin_name)s
    """
    
    cursor.execute(update_query, data)
    
    # If no rows were updated, insert a new record
    if cursor.rowcount == 0:
        herb_id = generate_herb_id(latin_name)
        data['id'] = herb_id
        
        insert_query = """
        INSERT INTO herbs (
            id, common_name, latin_name, alternative_name, family, summary, habitat,
            parts_used, related_species, key_constituents, history_folklore, key_actions,
            research, traditional_uses, current_uses, preparations, cautions,
            therapeutic_categories, updated_at
        ) VALUES (
            %(id)s, %(common_name)s, %(latin_name)s, %(alternative_name)s, %(family)s,
            %(summary)s, %(habitat)s, %(parts_used)s, %(related_species)s,
            %(key_constituents)s, %(history_folklore)s, %(key_actions)s, %(research)s,
            %(traditional_uses)s, %(current_uses)s, %(preparations)s, %(cautions)s,
            %(therapeutic_categories)s, %(updated_at)s
        )
        """
        
        cursor.execute(insert_query, data)

def main():
    """Main migration function"""
    print("Starting herb data migration...")
    
    # Load the herb data from JSON file
    json_file = 'all-herbs-improved.json'  # Updated to use the improved herb data
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            herbs_data = json.load(f)
        print(f"Loaded {len(herbs_data)} herbs from JSON file")
    except FileNotFoundError:
        print(f"Error: {json_file} file not found")
        return
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON file: {e}")
        return
    
    # Connect to database
    conn = connect_to_database()
    if not conn:
        print("Failed to connect to database")
        return
    
    try:
        cursor = conn.cursor()
        
        # Process each herb
        updated_count = 0
        error_count = 0
        
        for i, herb in enumerate(herbs_data):
            try:
                upsert_herb(cursor, herb)
                updated_count += 1
                
                if (i + 1) % 50 == 0:
                    print(f"Processed {i + 1}/{len(herbs_data)} herbs...")
                    
            except Exception as e:
                error_count += 1
                print(f"Error processing herb {herb.get('latinName', 'Unknown')}: {e}")
                continue
        
        # Commit the transaction
        conn.commit()
        
        print(f"\nMigration completed!")
        print(f"Successfully processed: {updated_count} herbs")
        print(f"Errors: {error_count} herbs")
        
    except Exception as e:
        print(f"Database error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
