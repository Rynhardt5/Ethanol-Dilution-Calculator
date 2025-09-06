-- Herbs Database Schema for PostgreSQL
-- Optimized for fast text search and complex queries

-- Main herbs table
CREATE TABLE herbs (
    id VARCHAR(255) PRIMARY KEY,
    common_name VARCHAR(255) NOT NULL,
    latin_name VARCHAR(255) NOT NULL,
    family VARCHAR(255),
    folk_uses TEXT,
    dosage TEXT,
    safety TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Plant parts used (many-to-many)
CREATE TABLE plant_parts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE herb_plant_parts (
    herb_id VARCHAR(255) REFERENCES herbs(id) ON DELETE CASCADE,
    part_id INTEGER REFERENCES plant_parts(id) ON DELETE CASCADE,
    PRIMARY KEY (herb_id, part_id)
);

-- Medicinal actions (many-to-many)
CREATE TABLE medicinal_actions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE herb_medicinal_actions (
    herb_id VARCHAR(255) REFERENCES herbs(id) ON DELETE CASCADE,
    action_id INTEGER REFERENCES medicinal_actions(id) ON DELETE CASCADE,
    PRIMARY KEY (herb_id, action_id)
);

-- Indications (many-to-many)
CREATE TABLE indications (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE herb_indications (
    herb_id VARCHAR(255) REFERENCES herbs(id) ON DELETE CASCADE,
    indication_id INTEGER REFERENCES indications(id) ON DELETE CASCADE,
    PRIMARY KEY (herb_id, indication_id)
);

-- Constituents
CREATE TABLE constituents (
    id SERIAL PRIMARY KEY,
    herb_id VARCHAR(255) REFERENCES herbs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    class VARCHAR(255),
    water_soluble VARCHAR(50),
    ethanol_range VARCHAR(50),
    notes TEXT
);

-- Best preparations (many-to-many)
CREATE TABLE preparations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE herb_preparations (
    herb_id VARCHAR(255) REFERENCES herbs(id) ON DELETE CASCADE,
    preparation_id INTEGER REFERENCES preparations(id) ON DELETE CASCADE,
    PRIMARY KEY (herb_id, preparation_id)
);

-- Solvent recommendations
CREATE TABLE solvent_recommendations (
    id SERIAL PRIMARY KEY,
    herb_id VARCHAR(255) REFERENCES herbs(id) ON DELETE CASCADE,
    preparation_type VARCHAR(100),
    ethanol_percent VARCHAR(20),
    ratio VARCHAR(100),
    notes TEXT
);

-- Interactions (many-to-many)
CREATE TABLE interactions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE herb_interactions (
    herb_id VARCHAR(255) REFERENCES herbs(id) ON DELETE CASCADE,
    interaction_id INTEGER REFERENCES interactions(id) ON DELETE CASCADE,
    PRIMARY KEY (herb_id, interaction_id)
);

-- Sources (many-to-many)
CREATE TABLE sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE herb_sources (
    herb_id VARCHAR(255) REFERENCES herbs(id) ON DELETE CASCADE,
    source_id INTEGER REFERENCES sources(id) ON DELETE CASCADE,
    PRIMARY KEY (herb_id, source_id)
);

-- Tags (many-to-many)
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE herb_tags (
    herb_id VARCHAR(255) REFERENCES herbs(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (herb_id, tag_id)
);

-- Indexes for fast searching
CREATE INDEX idx_herbs_common_name ON herbs USING gin(to_tsvector('english', common_name));
CREATE INDEX idx_herbs_latin_name ON herbs USING gin(to_tsvector('english', latin_name));
CREATE INDEX idx_herbs_family ON herbs(family);
CREATE INDEX idx_herbs_folk_uses ON herbs USING gin(to_tsvector('english', folk_uses));

CREATE INDEX idx_constituents_name ON constituents USING gin(to_tsvector('english', name));
CREATE INDEX idx_constituents_class ON constituents(class);
CREATE INDEX idx_constituents_water_soluble ON constituents(water_soluble);

CREATE INDEX idx_medicinal_actions_name ON medicinal_actions(name);
CREATE INDEX idx_indications_name ON indications(name);
CREATE INDEX idx_tags_name ON tags(name);

-- Full-text search index combining multiple fields
CREATE INDEX idx_herbs_full_text ON herbs USING gin(
    to_tsvector('english', 
        coalesce(common_name, '') || ' ' || 
        coalesce(latin_name, '') || ' ' || 
        coalesce(family, '') || ' ' || 
        coalesce(folk_uses, '')
    )
);
