-- ============================================================================
-- 13_seed_viewengine.sql
-- ViewEngine Test Data Seed
-- ============================================================================
-- Purpose: Seed the resources table with test data that includes ViewEngine
--          variant and slot configuration metadata.
--
-- This script:
--   1. Cleans existing test data (preserves profiles, households, connections)
--   2. Creates "Household" App Shell (layout_app_shell)
--   3. Creates "To-Do" Tab (view_directory)
--   4. Creates "Shopping" Tab (view_list_stack)
--   5. Populates tabs with folders and items
--
-- IMPORTANT: Run this migration AFTER all previous migrations
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: CLEAN SLATE - Delete existing resources for test users
-- ============================================================================

DELETE FROM resources 
WHERE user_id IN (
    '11111111-1111-1111-1111-111111111111'::uuid, 
    '22222222-2222-2222-2222-222222222222'::uuid
);

-- ============================================================================
-- SECTION 2: CREATE APP SHELL ROOT (Household)
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
    '00000000-0000-0000-0000-000000000100'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    NULL,
    'root.00000000_0000_0000_0000_000000000100'::ltree,
    'folder'::resource_type,
    'Household',
    'My Household App',
    'active'::resource_status,
    '{
        "context": "household.todos",
        "is_system": true,
        "variant": "layout_app_shell",
        "search_enabled": true,
        "action_label": "Add Item",
        "default_tab_id": "00000000-0000-0000-0000-000000000105"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 3: CREATE TABS (Children of App Shell)
-- ============================================================================

-- Tab 1: To-Do (View Directory)
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
    '00000000-0000-0000-0000-000000000105'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000100'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000105'::ltree,
    'folder'::resource_type,
    'To-Do',
    'Task Directory',
    'active'::resource_status,
    '{
        "variant": "view_directory",
        "icon": "CheckSquare",
        "placeholder": "Search tasks...",
        "__config": {
            "slot_search_placeholder": "placeholder"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Tab 2: Shopping (View List Stack)
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
    'Shopping',
    'Shopping List',
    'active'::resource_status,
    '{
        "variant": "view_list_stack",
        "icon": "ShoppingCart",
        "color": "#10b981"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 4: POPULATE TO-DO TAB
-- ============================================================================

-- Folder: Chores (Child of To-Do)
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
    '00000000-0000-0000-0000-000000000105'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000105.00000000_0000_0000_0000_000000000101'::ltree,
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

-- Folder: Work Projects (Child of To-Do)
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
    '00000000-0000-0000-0000-000000000105'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000105.00000000_0000_0000_0000_000000000102'::ltree,
    'folder'::resource_type,
    'Work Projects',
    'Professional tasks',
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

-- Task: Buy Milk (Child of Chores)
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
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000105.00000000_0000_0000_0000_000000000101.00000000_0000_0000_0000_000000000201'::ltree,
    'task'::resource_type,
    'Buy Milk',
    'Get 2% milk',
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

-- Task: Clean Kitchen (Child of Chores)
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
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000105.00000000_0000_0000_0000_000000000101.00000000_0000_0000_0000_000000000202'::ltree,
    'task'::resource_type,
    'Clean Kitchen',
    'Wipe counters',
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

-- Task: Take Out Trash (Child of Chores)
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
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000105.00000000_0000_0000_0000_000000000101.00000000_0000_0000_0000_000000000203'::ltree,
    'task'::resource_type,
    'Take Out Trash',
    'Weekly garbage',
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

-- Task: Q4 Report (Child of Work Projects)
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
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000105.00000000_0000_0000_0000_000000000102.00000000_0000_0000_0000_000000000301'::ltree,
    'task'::resource_type,
    'Q4 Report',
    'Review financials',
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

-- Task: Team Meeting Prep (Child of Work Projects)
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
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000105.00000000_0000_0000_0000_000000000102.00000000_0000_0000_0000_000000000302'::ltree,
    'task'::resource_type,
    'Team Meeting Prep',
    'Prepare slides',
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
-- SECTION 5: POPULATE SHOPPING TAB
-- ============================================================================

-- Task: Eggs (Child of Shopping)
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
    '1 dozen organic',
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

-- Task: Bread (Child of Shopping)
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
    'Whole wheat',
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
-- SECTION 6: CREATE ROOT-LEVEL TASK (Direct child of To-Do Tab)
-- ============================================================================

-- Task: Schedule Dentist Appointment
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
    '00000000-0000-0000-0000-000000000105'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000105.00000000_0000_0000_0000_000000000501'::ltree,
    'task'::resource_type,
    'Schedule Dentist Appointment',
    'Annual checkup',
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

COMMIT;
