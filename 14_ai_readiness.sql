-- AI Readiness Schema Upgrade
-- Migration to support Hybrid Data (Strict Tables) and Complex Relationships (Inference)

-- 1. Refactor Relationships (Critical)
-- Rename existing type to allow creation of new one
ALTER TYPE link_type RENAME TO link_type_old;

-- Create the new Master Ontology Enum
CREATE TYPE link_type AS ENUM (
    'HIERARCHY',
    'COMPONENT',
    'DEPENDENCY',
    'TRANSACTIONAL',
    'SPATIAL',
    'TEMPORAL',
    'SOCIAL',
    'REFERENCE'
);

-- Drop default value to avoid casting errors
ALTER TABLE resource_links ALTER COLUMN link_type DROP DEFAULT;

-- Alter the column to use the new type, with mapping logic
ALTER TABLE resource_links 
    ALTER COLUMN link_type TYPE link_type 
    USING CASE 
        WHEN link_type::text = 'ingredient_of' THEN 'COMPONENT'::link_type
        WHEN link_type::text = 'child_of' THEN 'HIERARCHY'::link_type
        WHEN link_type::text = 'related_to' THEN 'REFERENCE'::link_type
        WHEN link_type::text = 'blocks' THEN 'DEPENDENCY'::link_type
        WHEN link_type::text = 'dependency_of' THEN 'DEPENDENCY'::link_type
        WHEN link_type::text = 'duplicate_of' THEN 'REFERENCE'::link_type
        WHEN link_type::text = 'references' THEN 'REFERENCE'::link_type
        ELSE 'REFERENCE'::link_type -- Fallback for any other values
    END;

-- Set new default value
ALTER TABLE resource_links ALTER COLUMN link_type SET DEFAULT 'REFERENCE'::link_type;

-- Drop the old type
DROP TYPE link_type_old;

-- 2. Add Hybrid Data Pointers
-- Allow Nodes to point to strict tables like 'transactions' or 'health_logs'
ALTER TABLE resources 
    ADD COLUMN pointer_table TEXT, -- e.g., 'transactions', 'health_logs'
    ADD COLUMN pointer_id UUID;

-- 3. Add Agenda Fields
-- Add duration for time blocking
ALTER TABLE resources 
    ADD COLUMN duration_minutes INTEGER DEFAULT 0;

-- 4. Performance Index
-- Create index for fast Agenda lookups
CREATE INDEX idx_resources_schedulable ON resources(is_schedulable) WHERE is_schedulable = true;
