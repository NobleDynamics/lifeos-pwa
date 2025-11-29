-- ============================================================================
-- 10_migrate_to_context_roots.sql
-- Migrate Existing Data to Context Roots
-- ============================================================================
-- Purpose: Move existing root-level resources to be children of the new
--          context roots, and recalculate their ltree paths.
--
-- IMPORTANT: Run this migration AFTER 09_context_roots.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: HELPER FUNCTION TO RECALCULATE PATHS
-- ============================================================================

-- Create a function to recursively update paths for a resource and its descendants
CREATE OR REPLACE FUNCTION recalculate_subtree_paths(p_resource_id UUID)
RETURNS VOID AS $$
DECLARE
    v_new_path ltree;
    v_parent_path ltree;
    v_parent_id UUID;
    v_child RECORD;
BEGIN
    -- Get the parent info for this resource
    SELECT parent_id INTO v_parent_id FROM resources WHERE id = p_resource_id;
    
    IF v_parent_id IS NULL THEN
        -- This is a root-level resource (or context root)
        v_new_path := ('root.' || REPLACE(p_resource_id::TEXT, '-', '_'))::ltree;
    ELSE
        -- Get parent's path
        SELECT path INTO v_parent_path FROM resources WHERE id = v_parent_id;
        v_new_path := (v_parent_path::TEXT || '.' || REPLACE(p_resource_id::TEXT, '-', '_'))::ltree;
    END IF;
    
    -- Update this resource's path
    UPDATE resources SET path = v_new_path WHERE id = p_resource_id;
    
    -- Recursively update all children
    FOR v_child IN 
        SELECT id FROM resources WHERE parent_id = p_resource_id AND deleted_at IS NULL
    LOOP
        PERFORM recalculate_subtree_paths(v_child.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 2: MIGRATE DATA FOR TEST USER 1
-- ============================================================================

DO $$
DECLARE
    v_context_root_id UUID;
    v_resource RECORD;
    v_moved_count INT := 0;
BEGIN
    -- Get the household.todos context root for User 1
    SELECT id INTO v_context_root_id
    FROM resources
    WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
    AND meta_data->>'context' = 'household.todos'
    AND deleted_at IS NULL;
    
    IF v_context_root_id IS NULL THEN
        RAISE NOTICE 'User 1: No household.todos context root found, skipping';
        RETURN;
    END IF;
    
    RAISE NOTICE 'User 1: Context root ID = %', v_context_root_id;
    
    -- Move all root-level resources (except context roots themselves) to be children of household.todos
    FOR v_resource IN
        SELECT id, title
        FROM resources
        WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
        AND parent_id IS NULL
        AND (meta_data->>'is_system' IS NULL OR meta_data->>'is_system' != 'true')
        AND deleted_at IS NULL
    LOOP
        -- Update parent_id
        UPDATE resources 
        SET parent_id = v_context_root_id
        WHERE id = v_resource.id;
        
        -- Recalculate paths for this resource and all its descendants
        PERFORM recalculate_subtree_paths(v_resource.id);
        
        v_moved_count := v_moved_count + 1;
        RAISE NOTICE 'User 1: Moved resource "%" (ID: %)', v_resource.title, v_resource.id;
    END LOOP;
    
    RAISE NOTICE 'User 1: Total resources moved: %', v_moved_count;
END $$;

-- ============================================================================
-- SECTION 3: MIGRATE DATA FOR TEST USER 2
-- ============================================================================

DO $$
DECLARE
    v_context_root_id UUID;
    v_resource RECORD;
    v_moved_count INT := 0;
BEGIN
    -- Get the household.todos context root for User 2
    SELECT id INTO v_context_root_id
    FROM resources
    WHERE user_id = '22222222-2222-2222-2222-222222222222'::uuid
    AND meta_data->>'context' = 'household.todos'
    AND deleted_at IS NULL;
    
    IF v_context_root_id IS NULL THEN
        RAISE NOTICE 'User 2: No household.todos context root found, skipping';
        RETURN;
    END IF;
    
    RAISE NOTICE 'User 2: Context root ID = %', v_context_root_id;
    
    -- Move all root-level resources (except context roots themselves) to be children of household.todos
    FOR v_resource IN
        SELECT id, title
        FROM resources
        WHERE user_id = '22222222-2222-2222-2222-222222222222'::uuid
        AND parent_id IS NULL
        AND (meta_data->>'is_system' IS NULL OR meta_data->>'is_system' != 'true')
        AND deleted_at IS NULL
    LOOP
        -- Update parent_id
        UPDATE resources 
        SET parent_id = v_context_root_id
        WHERE id = v_resource.id;
        
        -- Recalculate paths for this resource and all its descendants
        PERFORM recalculate_subtree_paths(v_resource.id);
        
        v_moved_count := v_moved_count + 1;
        RAISE NOTICE 'User 2: Moved resource "%" (ID: %)', v_resource.title, v_resource.id;
    END LOOP;
    
    RAISE NOTICE 'User 2: Total resources moved: %', v_moved_count;
END $$;

-- ============================================================================
-- SECTION 4: VERIFY MIGRATION
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== Migration Verification ===';
    
    -- List resources under each context root
    FOR r IN
        SELECT 
            cr.user_id,
            cr.meta_data->>'context' as context,
            cr.id as context_root_id,
            COUNT(child.id) as child_count
        FROM resources cr
        LEFT JOIN resources child ON child.parent_id = cr.id AND child.deleted_at IS NULL
        WHERE cr.meta_data->>'is_system' = 'true'
        AND cr.deleted_at IS NULL
        GROUP BY cr.user_id, cr.meta_data->>'context', cr.id
        ORDER BY cr.user_id, cr.meta_data->>'context'
    LOOP
        RAISE NOTICE 'User: %, Context: %, Direct children: %', 
            r.user_id, r.context, r.child_count;
    END LOOP;
    
    -- Check for any orphaned resources (root-level, non-system)
    RAISE NOTICE '';
    RAISE NOTICE 'Checking for orphaned resources...';
    FOR r IN
        SELECT id, user_id, title, type
        FROM resources
        WHERE parent_id IS NULL
        AND (meta_data->>'is_system' IS NULL OR meta_data->>'is_system' != 'true')
        AND deleted_at IS NULL
    LOOP
        RAISE WARNING 'Orphaned resource found: User: %, Title: %, ID: %', 
            r.user_id, r.title, r.id;
    END LOOP;
    
    RAISE NOTICE 'Verification complete.';
END $$;

-- ============================================================================
-- SECTION 5: CLEANUP
-- ============================================================================

-- Drop the helper function (optional - can keep for future use)
-- DROP FUNCTION IF EXISTS recalculate_subtree_paths(UUID);

COMMIT;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration:
-- 1. Moves all root-level (parent_id = NULL) resources to the household.todos context root
-- 2. Excludes system folders (context roots themselves) from being moved
-- 3. Recalculates ltree paths for all moved resources and their descendants
-- 4. Works for both test users
--
-- After running this migration:
-- - Old folders like "Work", "Personal" will appear under Household > To-Do
-- - All nested items will have correctly updated paths
-- - The hierarchy is preserved
-- ============================================================================
