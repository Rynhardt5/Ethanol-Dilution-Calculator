-- Migration script to add new herb data fields to existing database
-- Run this before running the migrate-herb-data.py script

-- Add new columns to herbs table
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS alternative_name VARCHAR(255);
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS habitat TEXT;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS parts_used TEXT;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS related_species TEXT;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS key_constituents JSONB;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS history_folklore TEXT;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS key_actions JSONB;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS research JSONB;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS traditional_uses JSONB;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS current_uses JSONB;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS preparations JSONB;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS cautions TEXT;
ALTER TABLE herbs ADD COLUMN IF NOT EXISTS therapeutic_categories JSONB;

-- Add indexes for the new text search fields
CREATE INDEX IF NOT EXISTS idx_herbs_alternative_name ON herbs USING gin(to_tsvector('english', alternative_name));
CREATE INDEX IF NOT EXISTS idx_herbs_summary ON herbs USING gin(to_tsvector('english', summary));
CREATE INDEX IF NOT EXISTS idx_herbs_habitat ON herbs USING gin(to_tsvector('english', habitat));
CREATE INDEX IF NOT EXISTS idx_herbs_history_folklore ON herbs USING gin(to_tsvector('english', history_folklore));
CREATE INDEX IF NOT EXISTS idx_herbs_cautions ON herbs USING gin(to_tsvector('english', cautions));

-- Update the full-text search index to include new fields
DROP INDEX IF EXISTS idx_herbs_full_text;
CREATE INDEX idx_herbs_full_text ON herbs USING gin(
    to_tsvector('english', 
        coalesce(common_name, '') || ' ' || 
        coalesce(latin_name, '') || ' ' || 
        coalesce(alternative_name, '') || ' ' || 
        coalesce(family, '') || ' ' || 
        coalesce(summary, '') || ' ' || 
        coalesce(habitat, '') || ' ' || 
        coalesce(history_folklore, '') || ' ' || 
        coalesce(folk_uses, '')
    )
);

-- Add comment to track migration
COMMENT ON TABLE herbs IS 'Updated with enhanced herb data fields from improved parser';
