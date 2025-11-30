-- ============================================================================
-- 13_seed_viewengine.sql
-- ViewEngine Test Data Seed
-- ============================================================================
-- Purpose: Seed the resources table with test data that includes ViewEngine
--          variant and slot configuration metadata.
--
-- This script:
--   1. Cleans existing test data (preserves profiles, households, connections)
--   2. Creates context roots with view_directory variant
--   3. Creates folder hierarchy with row_neon_group variant
--   4. Creates task items with row_detail_check variant
--
-- IMPORTANT: Run this migration AFTER all previous migrations
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: CLEAN SLATE - Delete existing resources for test users
-- ============================================================================
-- This preserves profiles, households, and connections but removes resources
-- so we can re-seed with ViewEngine-compatible data.

DELETE FROM resources 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid, 
    '22222222-2222-2222-2222-222222222222'::uuid
);

-- ============================================================================
-- SECTION 2: CREATE CONTEXT ROOT FOR TEST USER 1
-- ============================================================================
-- The household.todos context root with view_directory variant

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
) VALUES (
    '00000000-0000-0000-0000-000000000100'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    NULL,
    'root.00000000_0000_0000_0000_000000000100'::ltree,
    'folder'::resource_type,
    'To-Do',
    'Your personal task list',
    'active'::resource_status,
    '{
        "context": "household.todos",
        "is_system": true,
        "variant": "view_directory",
        "placeholder": "Search tasks...",
        "__config": {
            "slot_search_placeholder": "placeholder"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 3: CREATE FOLDERS (row_neon_group variant)
-- ============================================================================

-- Folder: Chores
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
) VALUES (
    '00000000-0000-0000-0000-000000000101'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000100'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000101'::ltree,
    'folder'::resource_type,
    'Chores',
    'Weekly household chores',
    'active'::resource_status,
    '{
        "variant": "row_neon_group",
        "color": "#06b6d4",
        "icon": "home",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_accent_color": "color",
            "slot_icon_start": "icon"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Folder: Work Projects
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
) VALUES (
    '00000000-0000-0000-0000-000000000102'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000100'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000102'::ltree,
    'folder'::resource_type,
    'Work Projects',
    'Professional tasks and deadlines',
    'active'::resource_status,
    '{
        "variant": "row_neon_group",
        "color": "#8b5cf6",
        "icon": "briefcase",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_accent_color": "color",
            "slot_icon_start": "icon"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Folder: Shopping List
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
) VALUES (
    '00000000-0000-0000-0000-000000000103'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000100'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000103'::ltree,
    'folder'::resource_type,
    'Shopping List',
    'Items to buy this week',
    'active'::resource_status,
    '{
        "variant": "row_neon_group",
        "color": "#10b981",
        "icon": "shopping-cart",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_accent_color": "color",
            "slot_icon_start": "icon"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 4: CREATE TASKS IN CHORES FOLDER (row_detail_check variant)
-- ============================================================================

-- Task: Buy Milk
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
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000201'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000101'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000101.00000000_0000_0000_0000_000000000201'::ltree,
    'task'::resource_type,
    'Buy Milk',
    'Get 2% milk from Costco',
    'active'::resource_status,
    '{
        "variant": "row_detail_check",
        "status": "active",
        "priority": "high",
        "location": "Costco",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_status": "status",
            "slot_badge_1": "priority",
            "slot_badge_3": "location"
        }
    }'::jsonb,
    true,
    '2025-11-30T18:00:00Z',
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Task: Clean Kitchen
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
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000202'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000101'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000101.00000000_0000_0000_0000_000000000202'::ltree,
    'task'::resource_type,
    'Clean Kitchen',
    'Wipe counters and do dishes',
    'active'::resource_status,
    '{
        "variant": "row_detail_check",
        "status": "in_progress",
        "priority": "medium",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_status": "status",
            "slot_badge_1": "priority"
        }
    }'::jsonb,
    true,
    '2025-11-29T20:00:00Z',
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Task: Take Out Trash (completed)
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
) VALUES (
    '00000000-0000-0000-0000-000000000203'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000101'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000101.00000000_0000_0000_0000_000000000203'::ltree,
    'task'::resource_type,
    'Take Out Trash',
    'Weekly garbage pickup',
    'completed'::resource_status,
    '{
        "variant": "row_detail_check",
        "status": "completed",
        "priority": "low",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_status": "status",
            "slot_badge_1": "priority"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 5: CREATE TASKS IN WORK PROJECTS FOLDER
-- ============================================================================

-- Task: Q4 Report
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
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000301'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000102'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000102.00000000_0000_0000_0000_000000000301'::ltree,
    'task'::resource_type,
    'Q4 Report',
    'Review quarterly financials before Friday',
    'active'::resource_status,
    '{
        "variant": "row_detail_check",
        "status": "in_progress",
        "priority": "critical",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_status": "status",
            "slot_badge_1": "priority"
        }
    }'::jsonb,
    true,
    '2025-12-01T17:00:00Z',
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Task: Team Meeting Prep
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
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000302'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000102'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000102.00000000_0000_0000_0000_000000000302'::ltree,
    'task'::resource_type,
    'Team Meeting Prep',
    'Prepare slides for Monday standup',
    'active'::resource_status,
    '{
        "variant": "row_detail_check",
        "status": "active",
        "priority": "medium",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_status": "status",
            "slot_badge_1": "priority"
        }
    }'::jsonb,
    true,
    '2025-12-02T09:00:00Z',
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 6: CREATE TASKS IN SHOPPING LIST FOLDER
-- ============================================================================

-- Task: Eggs
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
) VALUES (
    '00000000-0000-0000-0000-000000000401'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000103'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000103.00000000_0000_0000_0000_000000000401'::ltree,
    'task'::resource_type,
    'Eggs',
    '1 dozen organic eggs',
    'active'::resource_status,
    '{
        "variant": "row_detail_check",
        "status": "active",
        "priority": "high",
        "location": "Safeway",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_status": "status",
            "slot_badge_3": "location"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Task: Bread
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
) VALUES (
    '00000000-0000-0000-0000-000000000402'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000103'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000103.00000000_0000_0000_0000_000000000402'::ltree,
    'task'::resource_type,
    'Bread',
    'Whole wheat loaf',
    'completed'::resource_status,
    '{
        "variant": "row_detail_check",
        "status": "completed",
        "priority": "low",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_status": "status"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 7: CREATE ROOT-LEVEL TASK (no parent folder)
-- ============================================================================

-- Task: Schedule Dentist Appointment (root level)
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
    created_by
) VALUES (
    '00000000-0000-0000-0000-000000000501'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000100'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000501'::ltree,
    'task'::resource_type,
    'Schedule Dentist Appointment',
    'Annual checkup overdue',
    'active'::resource_status,
    '{
        "variant": "row_detail_check",
        "status": "active",
        "priority": "medium",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_status": "status",
            "slot_badge_1": "priority"
        }
    }'::jsonb,
    true,
    '2025-12-15T10:00:00Z',
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 8: CREATE CONTEXT ROOT FOR TEST USER 2 (minimal)
-- ============================================================================

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
) VALUES (
    '00000000-0000-0000-0000-000000000600'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    NULL,
    NULL,
    'root.00000000_0000_0000_0000_000000000600'::ltree,
    'folder'::resource_type,
    'To-Do',
    'Your personal task list',
    'active'::resource_status,
    '{
        "context": "household.todos",
        "is_system": true,
        "variant": "view_directory",
        "placeholder": "Search tasks...",
        "__config": {
            "slot_search_placeholder": "placeholder"
        }
    }'::jsonb,
    false,
    '22222222-2222-2222-2222-222222222222'::uuid
);

-- One sample task for User 2
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
) VALUES (
    '00000000-0000-0000-0000-000000000601'::uuid,
    '22222222-2222-2222-2222-222222222222'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000600'::uuid,
    'root.00000000_0000_0000_0000_000000000600.00000000_0000_0000_0000_000000000601'::ltree,
    'task'::resource_type,
    'Welcome Task',
    'This is your first task!',
    'active'::resource_status,
    '{
        "variant": "row_detail_check",
        "status": "active",
        "priority": "low",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_status": "status",
            "slot_badge_1": "priority"
        }
    }'::jsonb,
    false,
    '22222222-2222-2222-2222-222222222222'::uuid
);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERY (run separately after COMMIT)
-- ============================================================================
-- SELECT 
--     id,
--     title,
--     type,
--     meta_data->>'variant' as variant,
--     nlevel(path) - 1 as depth
-- FROM resources 
-- WHERE user_id = '11111111-1111-1111-1111-111111111111'::uuid
-- AND deleted_at IS NULL
-- ORDER BY path;
