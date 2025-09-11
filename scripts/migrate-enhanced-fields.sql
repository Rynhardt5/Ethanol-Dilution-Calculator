-- Migration script to add enhanced herb data fields
-- Run this to update your existing herbs table

-- Add new JSONB columns for enhanced herb data
ALTER TABLE herbs 
ADD COLUMN IF NOT EXISTS botanical_info JSONB,
ADD COLUMN IF NOT EXISTS specific_applications JSONB,
ADD COLUMN IF NOT EXISTS enhanced_preparations JSONB,
ADD COLUMN IF NOT EXISTS safety_contraindications JSONB,
ADD COLUMN IF NOT EXISTS drug_interactions JSONB,
ADD COLUMN IF NOT EXISTS pubmed_data JSONB;

-- Create indexes for the new JSONB fields for better query performance
CREATE INDEX IF NOT EXISTS idx_herbs_specific_applications ON herbs USING gin(specific_applications);
CREATE INDEX IF NOT EXISTS idx_herbs_safety_contraindications ON herbs USING gin(safety_contraindications);
CREATE INDEX IF NOT EXISTS idx_herbs_drug_interactions ON herbs USING gin(drug_interactions);
CREATE INDEX IF NOT EXISTS idx_herbs_enhanced_preparations ON herbs USING gin(enhanced_preparations);
CREATE INDEX IF NOT EXISTS idx_herbs_pubmed_data ON herbs USING gin(pubmed_data);

-- Add a comment to track this migration
COMMENT ON COLUMN herbs.specific_applications IS 'JSONB array of specific therapeutic applications with evidence levels';
COMMENT ON COLUMN herbs.enhanced_preparations IS 'JSONB array of detailed preparation methods and dosages';
COMMENT ON COLUMN herbs.safety_contraindications IS 'JSONB array of safety warnings, contraindications, and precautions';
COMMENT ON COLUMN herbs.drug_interactions IS 'JSONB array of known drug interactions and their severity';
COMMENT ON COLUMN herbs.pubmed_data IS 'JSONB array of PubMed research studies and findings';

-- Update the updated_at timestamp for tracking
UPDATE herbs SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL;
