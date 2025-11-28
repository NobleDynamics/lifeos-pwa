-- ============================================================================
-- 08_resource_graph.sql
-- Universal Resource Graph Migration
-- ============================================================================
-- Purpose: Migrate from strict Todo hierarchy (categories → lists → items)
--          to a flexible Universal Resource Graph using PostgreSQL ltree
-- 
-- Architecture: Single 'resources' table with self-referential hierarchy
--               and lateral linking via 'resource_links' table
--
-- IMPORTANT: Run this migration in a transaction. If anything fails, ROLLBACK.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: ENABLE EXTENSIONS
-- ============================================================================

-- ltree provides hierarchical labels for tree-like structures
-- Allows queries like: "Get all descendants of node X"
CREATE EXTENSION IF NOT EXISTS ltree;

-- uuid-ossp for UUID generation (likely already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: CREATE RESOURCE TYPES
-- ============================================================================

-- Resource type enum for polymorphic resources
DO $$ BEGIN
    CREATE TYPE resource_type AS ENUM (
        'folder',      -- Container (like categories)
        'project',     -- Organized work (like lists)
        'task',        -- Actionable item (like todo_items)
        'recipe',      -- Cooking instructions
        'ingredient',  -- Recipe component
        'stock_item',  -- Inventory item
        'workout',     -- Exercise routine
        'exercise',    -- Single exercise within workout
        'document',    -- Notes/documents
        'event'        -- Calendar event
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Resource status enum
DO $$ BEGIN
    CREATE TYPE resource_status AS ENUM (
        'active',      -- Default state, in progress
        'completed',   -- Finished/done
        'archived'     -- Hidden but preserved
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Link type enum for lateral relationships
DO $$ BEGIN
    CREATE TYPE link_type AS ENUM (
        'ingredient_of',   -- X is ingredient of Y (recipe)
        'related_to',      -- Generic relationship
        'blocks',          -- X blocks Y (dependency)
        'dependency_of',   -- X depends on Y
        'duplicate_of',    -- X is duplicate of Y
        'child_of',        -- Alternative to parent_id for special cases
        'references'       -- X references Y (document link)
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 3: CREATE MASTER RESOURCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS resources (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Ownership
    user_id UUID NOT NULL,
    household_id UUID REFERENCES households(id) ON DELETE SET NULL,
    
    -- Hierarchy (Self-Referential)
    parent_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    
    -- ltree Path (Materialized Path Pattern)
    -- Format: root.{uuid_underscored}.{uuid_underscored}...
    -- Example: root.a1b2c3d4_e5f6_7890_abcd_ef1234567890
    -- Note: UUIDs have hyphens replaced with underscores (ltree constraint)
    path ltree NOT NULL,
    
    -- Polymorphic Type
    type resource_type NOT NULL DEFAULT 'task',
    
    -- Core Fields
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status resource_status NOT NULL DEFAULT 'active',
    
    -- Polymorphic Data (Flexible JSON storage)
    -- Examples:
    --   Folder: {"color": "#00EAFF", "icon": "folder"}
    --   Recipe: {"prep_time": 30, "cook_time": 45, "servings": 4}
    --   Task: {"priority": "high", "due_date": "2025-12-01"}
    --   Workout: {"muscle_groups": ["chest", "triceps"], "difficulty": "intermediate"}
    meta_data JSONB NOT NULL DEFAULT '{}',
    
    -- Scheduling
    is_schedulable BOOLEAN NOT NULL DEFAULT false,
    scheduled_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ, -- Soft delete
    
    -- Audit
    created_by UUID,
    
    -- Constraints
    CONSTRAINT valid_path CHECK (path IS NOT NULL),
    CONSTRAINT valid_title CHECK (LENGTH(TRIM(title)) > 0)
);

-- ============================================================================
-- SECTION 4: CREATE RESOURCE LINKS TABLE (Lateral Relationships)
-- ============================================================================

CREATE TABLE IF NOT EXISTS resource_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Link Endpoints
    source_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    target_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
    
    -- Link Type
    link_type link_type NOT NULL DEFAULT 'related_to',
    
    -- Link Metadata
    -- Examples:
    --   ingredient_of: {"quantity": 2, "unit": "cups"}
    --   blocks: {"reason": "Waiting for approval"}
    meta_data JSONB NOT NULL DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate links
    CONSTRAINT unique_link UNIQUE (source_id, target_id, link_type),
    -- Prevent self-links
    CONSTRAINT no_self_link CHECK (source_id != target_id)
);

-- ============================================================================
-- SECTION 5: CREATE LOG TABLES (Strict Temporal Data)
-- ============================================================================

-- Health Logs (Weight, calories, sleep, etc.)
CREATE TABLE IF NOT EXISTS health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    
    date DATE NOT NULL,
    value NUMERIC NOT NULL,
    metric_unit VARCHAR(50), -- 'kg', 'lbs', 'hours', 'ml', etc.
    
    -- Optional notes
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- One log per resource per date
    CONSTRAINT unique_health_log UNIQUE (resource_id, user_id, date)
);

-- Inventory Logs (Stock changes)
CREATE TABLE IF NOT EXISTS inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id) ON DELETE SET NULL,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    qty_change NUMERIC NOT NULL, -- Positive = add, Negative = remove
    reason VARCHAR(100), -- 'purchase', 'consumed', 'expired', 'adjustment'
    
    -- Optional metadata
    meta_data JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 6: INDEXES FOR PERFORMANCE
-- ============================================================================

-- ltree GIST index for hierarchy queries (CRITICAL for performance)
CREATE INDEX IF NOT EXISTS idx_resources_path_gist ON resources USING GIST (path);

-- B-tree indexes for common queries
CREATE INDEX IF NOT EXISTS idx_resources_parent ON resources (parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_resources_user ON resources (user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_resources_household ON resources (household_id) WHERE deleted_at IS NULL AND household_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_resources_type ON resources (type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_resources_status ON resources (status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_resources_scheduled ON resources (scheduled_at) WHERE deleted_at IS NULL AND is_schedulable = true;

-- Link indexes
CREATE INDEX IF NOT EXISTS idx_resource_links_source ON resource_links (source_id);
CREATE INDEX IF NOT EXISTS idx_resource_links_target ON resource_links (target_id);
CREATE INDEX IF NOT EXISTS idx_resource_links_type ON resource_links (link_type);

-- Log indexes
CREATE INDEX IF NOT EXISTS idx_health_logs_user_date ON health_logs (user_id, date);
CREATE INDEX IF NOT EXISTS idx_health_logs_resource ON health_logs (resource_id) WHERE resource_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_logs_household_date ON inventory_logs (household_id, date);
CREATE INDEX IF NOT EXISTS idx_inventory_logs_resource ON inventory_logs (resource_id) WHERE resource_id IS NOT NULL;

-- ============================================================================
-- SECTION 7: HELPER FUNCTIONS
-- ============================================================================

-- Function to convert UUID to ltree-safe label
-- UUIDs contain hyphens which are invalid in ltree labels
CREATE OR REPLACE FUNCTION uuid_to_ltree_label(uuid_val UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN REPLACE(uuid_val::TEXT, '-', '_');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate path for a new resource
CREATE OR REPLACE FUNCTION calculate_resource_path(
    p_id UUID,
    p_parent_id UUID
)
RETURNS ltree AS $$
DECLARE
    parent_path ltree;
    new_path ltree;
BEGIN
    IF p_parent_id IS NULL THEN
        -- Root level: path is 'root.{id}'
        new_path := ('root.' || uuid_to_ltree_label(p_id))::ltree;
    ELSE
        -- Get parent's path
        SELECT path INTO parent_path 
        FROM resources 
        WHERE id = p_parent_id;
        
        IF parent_path IS NULL THEN
            RAISE EXCEPTION 'Parent resource % not found', p_parent_id;
        END IF;
        
        -- Append this resource's ID to parent path
        new_path := (parent_path::TEXT || '.' || uuid_to_ltree_label(p_id))::ltree;
    END IF;
    
    RETURN new_path;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-calculate path on insert
CREATE OR REPLACE FUNCTION trigger_calculate_resource_path()
RETURNS TRIGGER AS $$
BEGIN
    -- Only calculate if path is not explicitly set or is placeholder
    IF NEW.path IS NULL OR NEW.path::TEXT = '' OR NEW.path::TEXT = 'root' THEN
        NEW.path := calculate_resource_path(NEW.id, NEW.parent_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION trigger_update_resource_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 8: TRIGGERS
-- ============================================================================

-- Auto-calculate path on insert (if not provided)
DROP TRIGGER IF EXISTS trg_resources_calculate_path ON resources;
CREATE TRIGGER trg_resources_calculate_path
    BEFORE INSERT ON resources
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_resource_path();

-- Auto-update timestamp on update
DROP TRIGGER IF EXISTS trg_resources_update_timestamp ON resources;
CREATE TRIGGER trg_resources_update_timestamp
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_resource_timestamp();

-- ============================================================================
-- SECTION 9: ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Resources: Users can access their own resources
-- Note: For household sharing, we use the household_id column directly
-- The is_shared flag in meta_data can be used for more granular control
CREATE POLICY "Users can view own resources"
    ON resources FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own resources"
    ON resources FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own resources"
    ON resources FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own resources"
    ON resources FOR DELETE
    USING (user_id = auth.uid());

-- Resource Links: Users can manage links where they own the source resource
CREATE POLICY "Users can view own resource links"
    ON resource_links FOR SELECT
    USING (
        source_id IN (SELECT id FROM resources WHERE user_id = auth.uid())
        OR target_id IN (SELECT id FROM resources WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own resource links"
    ON resource_links FOR INSERT
    WITH CHECK (
        source_id IN (SELECT id FROM resources WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own resource links"
    ON resource_links FOR DELETE
    USING (
        source_id IN (SELECT id FROM resources WHERE user_id = auth.uid())
    );

-- Health Logs: Users can access their own logs
CREATE POLICY "Users can view own health logs"
    ON health_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own health logs"
    ON health_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own health logs"
    ON health_logs FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own health logs"
    ON health_logs FOR DELETE
    USING (user_id = auth.uid());

-- Inventory Logs: Allow access based on household_id
-- Note: In production, this should check household membership
-- For now, we allow any authenticated user (RLS bypass will handle dev testing)
CREATE POLICY "Users can view inventory logs"
    ON inventory_logs FOR SELECT
    USING (true);  -- Will be restricted by dev bypass or auth in production

CREATE POLICY "Users can insert inventory logs"
    ON inventory_logs FOR INSERT
    WITH CHECK (true);  -- Will be restricted by dev bypass or auth in production

-- ============================================================================
-- SECTION 10: DATA MIGRATION (ETL from Legacy Tables)
-- ============================================================================
-- Note: This section migrates data from the old todo_* tables to the new
--       resources table, then renames the old tables with 'legacy_' prefix.

-- Step 10.1: Migrate todo_categories → resources (type='folder')
INSERT INTO resources (
    id,
    user_id,
    household_id,
    parent_id,
    path,
    type,
    title,
    description,
    status,
    meta_data,
    is_schedulable,
    created_at,
    updated_at,
    deleted_at,
    created_by
)
SELECT 
    tc.id,
    tc.user_id,
    tc.household_id,
    NULL, -- Categories are root-level
    ('root.' || REPLACE(tc.id::TEXT, '-', '_'))::ltree,
    'folder'::resource_type,
    tc.name,
    tc.description,
    'active'::resource_status,
    jsonb_build_object(
        'color', COALESCE(tc.color, '#00EAFF'),
        'is_shared', COALESCE(tc.is_shared, false),
        'legacy_type', 'todo_category'
    ),
    false, -- Not schedulable
    tc.created_at,
    tc.updated_at,
    tc.deleted_at,
    tc.created_by
FROM todo_categories tc
WHERE NOT EXISTS (
    SELECT 1 FROM resources r WHERE r.id = tc.id
);

-- Step 10.2: Migrate todo_lists → resources (type='project')
INSERT INTO resources (
    id,
    user_id,
    household_id,
    parent_id,
    path,
    type,
    title,
    description,
    status,
    meta_data,
    is_schedulable,
    scheduled_at,
    created_at,
    updated_at,
    deleted_at,
    created_by
)
SELECT 
    tl.id,
    tl.user_id,
    tl.household_id,
    tl.category_id, -- Parent is the category
    (
        (SELECT path FROM resources WHERE id = tl.category_id)::TEXT 
        || '.' 
        || REPLACE(tl.id::TEXT, '-', '_')
    )::ltree,
    'project'::resource_type,
    tl.name,
    tl.description,
    'active'::resource_status,
    jsonb_build_object(
        'is_shared', COALESCE(tl.is_shared, false),
        'location_name', tl.location_name,
        'location_coordinates', tl.location_coordinates,
        'legacy_type', 'todo_list'
    ),
    tl.due_date IS NOT NULL, -- Schedulable if has due date
    tl.due_date,
    tl.created_at,
    tl.updated_at,
    tl.deleted_at,
    tl.created_by
FROM todo_lists tl
WHERE EXISTS (
    SELECT 1 FROM resources r WHERE r.id = tl.category_id
)
AND NOT EXISTS (
    SELECT 1 FROM resources r WHERE r.id = tl.id
);

-- Step 10.3: Migrate todo_items → resources (type='task')
INSERT INTO resources (
    id,
    user_id,
    household_id,
    parent_id,
    path,
    type,
    title,
    description,
    status,
    meta_data,
    is_schedulable,
    scheduled_at,
    created_at,
    updated_at,
    deleted_at,
    created_by
)
SELECT 
    ti.id,
    ti.user_id,
    ti.household_id,
    ti.list_id, -- Parent is the list
    (
        (SELECT path FROM resources WHERE id = ti.list_id)::TEXT 
        || '.' 
        || REPLACE(ti.id::TEXT, '-', '_')
    )::ltree,
    'task'::resource_type,
    ti.name,
    ti.description,
    CASE 
        WHEN ti.status = 'completed' THEN 'completed'::resource_status
        ELSE 'active'::resource_status
    END,
    jsonb_build_object(
        'is_shared', COALESCE(ti.is_shared, false),
        'location_name', ti.location_name,
        'location_coordinates', ti.location_coordinates,
        'legacy_status', ti.status,
        'started_at', ti.started_at,
        'completed_at', ti.completed_at,
        'completed_by', ti.completed_by,
        'legacy_type', 'todo_item'
    ),
    ti.due_date IS NOT NULL, -- Schedulable if has due date
    ti.due_date,
    ti.created_at,
    ti.updated_at,
    ti.deleted_at,
    ti.created_by
FROM todo_items ti
WHERE EXISTS (
    SELECT 1 FROM resources r WHERE r.id = ti.list_id
)
AND NOT EXISTS (
    SELECT 1 FROM resources r WHERE r.id = ti.id
);

-- ============================================================================
-- SECTION 11: RENAME LEGACY TABLES (Safety Net)
-- ============================================================================
-- Rename old tables instead of dropping them. This allows rollback if needed.

-- Check if tables exist before renaming (idempotent)
DO $$ 
BEGIN
    -- Rename todo_categories
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'todo_categories' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_todo_categories' AND table_schema = 'public') THEN
            ALTER TABLE todo_categories RENAME TO legacy_todo_categories;
            RAISE NOTICE 'Renamed todo_categories to legacy_todo_categories';
        ELSE
            RAISE NOTICE 'legacy_todo_categories already exists, skipping rename';
        END IF;
    END IF;
    
    -- Rename todo_lists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'todo_lists' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_todo_lists' AND table_schema = 'public') THEN
            ALTER TABLE todo_lists RENAME TO legacy_todo_lists;
            RAISE NOTICE 'Renamed todo_lists to legacy_todo_lists';
        ELSE
            RAISE NOTICE 'legacy_todo_lists already exists, skipping rename';
        END IF;
    END IF;
    
    -- Rename todo_items
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'todo_items' AND table_schema = 'public') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_todo_items' AND table_schema = 'public') THEN
            ALTER TABLE todo_items RENAME TO legacy_todo_items;
            RAISE NOTICE 'Renamed todo_items to legacy_todo_items';
        ELSE
            RAISE NOTICE 'legacy_todo_items already exists, skipping rename';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- SECTION 12: VERIFY MIGRATION
-- ============================================================================

-- Output migration statistics
DO $$
DECLARE
    folder_count INT;
    project_count INT;
    task_count INT;
    total_count INT;
BEGIN
    SELECT COUNT(*) INTO folder_count FROM resources WHERE type = 'folder';
    SELECT COUNT(*) INTO project_count FROM resources WHERE type = 'project';
    SELECT COUNT(*) INTO task_count FROM resources WHERE type = 'task';
    SELECT COUNT(*) INTO total_count FROM resources;
    
    RAISE NOTICE '=== Migration Statistics ===';
    RAISE NOTICE 'Folders (from categories): %', folder_count;
    RAISE NOTICE 'Projects (from lists): %', project_count;
    RAISE NOTICE 'Tasks (from items): %', task_count;
    RAISE NOTICE 'Total resources: %', total_count;
END $$;

-- Verify path integrity (all paths should start with 'root.')
DO $$
DECLARE
    invalid_paths INT;
BEGIN
    SELECT COUNT(*) INTO invalid_paths 
    FROM resources 
    WHERE path::TEXT NOT LIKE 'root.%';
    
    IF invalid_paths > 0 THEN
        RAISE WARNING 'Found % resources with invalid paths (not starting with root.)', invalid_paths;
    ELSE
        RAISE NOTICE 'All resource paths are valid (start with root.)';
    END IF;
END $$;

COMMIT;

-- ============================================================================
-- SECTION 13: EXAMPLE QUERIES (Reference)
-- ============================================================================
-- These are not executed, just for documentation

/*
-- Get all children of a resource (direct children only)
SELECT * FROM resources 
WHERE parent_id = 'some-uuid' 
AND deleted_at IS NULL;

-- Get entire subtree of a resource (using ltree)
SELECT * FROM resources 
WHERE path <@ (SELECT path FROM resources WHERE id = 'some-uuid')
AND deleted_at IS NULL
ORDER BY path;

-- Get all ancestors of a resource (path to root)
SELECT * FROM resources 
WHERE path @> (SELECT path FROM resources WHERE id = 'some-uuid')
AND deleted_at IS NULL
ORDER BY nlevel(path);

-- Get depth of a resource
SELECT id, title, nlevel(path) - 1 as depth FROM resources;

-- Get all tasks in a folder (regardless of nesting depth)
SELECT * FROM resources 
WHERE path <@ (SELECT path FROM resources WHERE id = 'folder-uuid')
AND type = 'task'
AND deleted_at IS NULL;

-- Get siblings of a resource
SELECT * FROM resources 
WHERE parent_id = (SELECT parent_id FROM resources WHERE id = 'some-uuid')
AND id != 'some-uuid'
AND deleted_at IS NULL;

-- Move a resource to a new parent (requires recalculating all descendant paths)
-- This is complex - use the application layer for this operation
*/
