-- ============================================================================
-- 09_context_roots.sql
-- Context-Scoped System Roots Migration
-- ============================================================================
-- Purpose: Create system root folders that serve as "mount points" for 
--          different application contexts (e.g., household.todos, cloud.files)
--
-- These roots act as virtual boundaries within the resource hierarchy,
-- allowing each pane/view to have its own isolated tree while sharing
-- the same underlying resources table.
-- 
-- IMPORTANT: Run this migration AFTER 08_resource_graph.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: CREATE CONTEXT ROOTS FOR TEST USER 1
-- ============================================================================

-- household.todos - Root for To-Do/Task management
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
    created_by
)
SELECT 
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    NULL,
    'root'::ltree, -- Will be recalculated by trigger
    'folder'::resource_type,
    'household.todos',
    'System root for household to-do items',
    'active'::resource_status,
    '{"context": "household.todos", "is_system": true}'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
WHERE NOT EXISTS (
    SELECT 1 FROM resources 
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid 
    AND meta_data->>'context' = 'household.todos'
);

-- cloud.files - Root for Cloud file management
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
    created_by
)
SELECT 
    uuid_generate_v4(),
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    NULL,
    'root'::ltree, -- Will be recalculated by trigger
    'folder'::resource_type,
    'cloud.files',
    'System root for cloud file storage',
    'active'::resource_status,
    '{"context": "cloud.files", "is_system": true}'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
WHERE NOT EXISTS (
    SELECT 1 FROM resources 
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid 
    AND meta_data->>'context' = 'cloud.files'
);

-- ============================================================================
-- SECTION 2: CREATE CONTEXT ROOTS FOR TEST USER 2
-- ============================================================================

-- household.todos - Root for To-Do/Task management
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
    created_by
)
SELECT 
    uuid_generate_v4(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    NULL,
    NULL,
    'root'::ltree, -- Will be recalculated by trigger
    'folder'::resource_type,
    'household.todos',
    'System root for household to-do items',
    'active'::resource_status,
    '{"context": "household.todos", "is_system": true}'::jsonb,
    false,
    '22222222-2222-2222-2222-222222222222'::uuid
WHERE NOT EXISTS (
    SELECT 1 FROM resources 
    WHERE user_id = '22222222-2222-2222-2222-222222222222'::uuid 
    AND meta_data->>'context' = 'household.todos'
);

-- cloud.files - Root for Cloud file management
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
    created_by
)
SELECT 
    uuid_generate_v4(),
    '22222222-2222-2222-2222-222222222222'::uuid,
    NULL,
    NULL,
    'root'::ltree, -- Will be recalculated by trigger
    'folder'::resource_type,
    'cloud.files',
    'System root for cloud file storage',
    'active'::resource_status,
    '{"context": "cloud.files", "is_system": true}'::jsonb,
    false,
    '22222222-2222-2222-2222-222222222222'::uuid
WHERE NOT EXISTS (
    SELECT 1 FROM resources 
    WHERE user_id = '22222222-2222-2222-2222-222222222222'::uuid 
    AND meta_data->>'context' = 'cloud.files'
);

-- ============================================================================
-- SECTION 3: VERIFY MIGRATION
-- ============================================================================

DO $$
DECLARE
    context_root_count INT;
    r RECORD;
BEGIN
    SELECT COUNT(*) INTO context_root_count 
    FROM resources 
    WHERE meta_data->>'is_system' = 'true' 
    AND meta_data->>'context' IS NOT NULL;
    
    RAISE NOTICE '=== Context Roots Migration ===';
    RAISE NOTICE 'Total context roots created: %', context_root_count;
    
    -- List all context roots
    RAISE NOTICE 'Context roots:';
    FOR r IN 
        SELECT user_id, meta_data->>'context' as context, id, path 
        FROM resources 
        WHERE meta_data->>'is_system' = 'true'
        ORDER BY user_id, meta_data->>'context'
    LOOP
        RAISE NOTICE '  User: %, Context: %, ID: %, Path: %', 
            r.user_id, r.context, r.id, r.path;
    END LOOP;
END $$;

COMMIT;

-- ============================================================================
-- SECTION 4: REFERENCE - Available Context Namespaces
-- ============================================================================
-- Current namespaces:
--   household.todos  - To-Do lists and tasks (HouseholdPane > To-Do tab)
--   cloud.files      - Cloud file storage (CloudPane > Files tab)
--
-- Future namespaces (not yet implemented):
--   health.workouts  - Workout routines and exercises
--   health.logs      - Health metrics and measurements
--   finance.budget   - Budget and expense tracking
--   household.recipes - Recipe collection
--   household.shopping - Shopping lists
--   household.stock   - Inventory/stock tracking
-- ============================================================================
