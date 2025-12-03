-- ============================================================================
-- 13_seed_viewengine.sql
-- ViewEngine Test Data Seed
-- ============================================================================
-- Purpose: Seed the resources table with test data that includes ViewEngine
--          variant and slot configuration metadata.
--
-- Structure:
-- 1. My Home (layout_app_shell)
--    2. Shopping (layout_top_tabs)
--       3. Lists (view_list_stack) -> Grocery List
--       3. Items (view_directory) -> All Products
--    2. Stock (view_grid_fixed)
--    2. To-Do (view_directory)
--    2. Finance (view_dashboard_masonry) **NEW**
--       3. Monthly Budget (card_progress_multi) - aggregates from Transactions
--       3. Spending Breakdown (card_chart_pie) - aggregates from Transactions
--       3. Transactions (view_list_stack)
--          4. 6x Transaction Items (row_input_currency)
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
    'My Home',
    'My Household App',
    'active'::resource_status,
    '{
        "context": "household.todos",
        "is_system": true,
        "is_system_app": true,
        "variant": "layout_app_shell",
        "search_enabled": true,
        "action_label": "Add Item",
        "default_tab_id": "00000000-0000-0000-0000-000000000103"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 3: CREATE TABS (Children of App Shell)
-- ============================================================================

-- Tab 1: Shopping (Layout Top Tabs)
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
    'Shopping Lists & Items',
    'active'::resource_status,
    '{
        "variant": "layout_top_tabs",
        "icon": "ShoppingCart",
        "default_tab_id": "00000000-0000-0000-0000-000000000131"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Tab 2: Stock (View Grid Fixed)
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
    '00000000-0000-0000-0000-000000000104'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000100'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000104'::ltree,
    'folder'::resource_type,
    'Stock',
    'Pantry Inventory',
    'active'::resource_status,
    '{
        "variant": "view_grid_fixed",
        "icon": "Package",
        "color": "#f59e0b"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Tab 3: To-Do (View Directory)
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

-- ============================================================================
-- SECTION 4: SHOPPING SUB-TABS (Children of Shopping)
-- ============================================================================

-- Sub-Tab A: Lists (View List Stack)
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
    '00000000-0000-0000-0000-000000000131'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000103'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000103.00000000_0000_0000_0000_000000000131'::ltree,
    'folder'::resource_type,
    'Lists',
    'My Shopping Lists',
    'active'::resource_status,
    '{
        "variant": "view_list_stack",
        "icon": "List"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Sub-Tab B: Items (View Directory)
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
    '00000000-0000-0000-0000-000000000132'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000103'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000103.00000000_0000_0000_0000_000000000132'::ltree,
    'folder'::resource_type,
    'Items',
    'All Products',
    'active'::resource_status,
    '{
        "variant": "view_directory",
        "icon": "Grid",
        "placeholder": "Search products..."
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 5: POPULATE LISTS (Grocery List)
-- ============================================================================

-- Grocery List (Child of Lists)
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
    '00000000-0000-0000-0000-000000000131'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000103.00000000_0000_0000_0000_000000000131.00000000_0000_0000_0000_000000000401'::ltree,
    'folder'::resource_type,
    'Grocery List',
    'Weekly Essentials',
    'active'::resource_status,
    '{
        "variant": "row_neon_group",
        "color": "#10b981",
        "icon": "ShoppingCart",
        "create_options": [
            { "label": "Add Item", "type": "item", "variant": "row_input_currency", "icon": "ShoppingBag" },
            { "label": "Add Note", "type": "item", "variant": "row_simple", "icon": "FileText" }
        ],
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

-- Item: Milk (Child of Grocery List) - NOW USING CURRENCY ROW
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000402'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000401'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000103.00000000_0000_0000_0000_000000000131.00000000_0000_0000_0000_000000000401.00000000_0000_0000_0000_000000000402'::ltree,
    'task'::resource_type,
    'Milk',
    '2% Organic',
    'active'::resource_status,
    '{
        "variant": "row_input_currency",
        "estimated_cost": 4.50,
        "status": "active",
        "__config": {
            "slot_headline": "title",
            "slot_value": "estimated_cost",
            "slot_status": "status"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 6: POPULATE ITEMS (All Products)
-- ============================================================================

-- Product: Apple (Child of Items) - NOW USING STEPPER ROW
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000501'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000132'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000103.00000000_0000_0000_0000_000000000132.00000000_0000_0000_0000_000000000501'::ltree,
    'stock_item'::resource_type,
    'Apple',
    'Fuji (Pantry Stock)',
    'active'::resource_status,
    '{
        "variant": "row_input_stepper",
        "quantity": 5,
        "min_qty": 2,
        "unit": "pcs",
        "__config": {
            "slot_headline": "title",
            "slot_subtext": "description",
            "slot_value": "quantity",
            "slot_min_threshold": "min_qty"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- SECTION 7: FINANCE TAB (Visualization Components Test)
-- ============================================================================
-- Purpose: Test Smart Aggregation with card_progress_multi and card_chart_pie
-- Structure:
--   Tab 4: Finance (view_dashboard_masonry)
--     - Widget 1: Monthly Budget (card_progress_multi)
--     - Widget 2: Spending Breakdown (card_chart_pie)
--     - Container: Transactions (view_list_stack)
--       - 6 Transaction Items (row_input_currency)

-- Tab 4: Finance (Child of My Home)
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
    '00000000-0000-0000-0000-000000000106'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000100'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106'::ltree,
    'folder'::resource_type,
    'Finance',
    'Budget & Spending Tracker',
    'active'::resource_status,
    '{
        "variant": "view_dashboard_masonry",
        "icon": "DollarSign",
        "color": "#10b981"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Widget 1: Monthly Budget (card_progress_multi) - Aggregates from Transactions
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
    '00000000-0000-0000-0000-000000000201'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000106'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106.00000000_0000_0000_0000_000000000201'::ltree,
    'folder'::resource_type,
    'Monthly Budget',
    'December 2024 spending by category',
    'active'::resource_status,
    '{
        "variant": "card_progress_multi",
        "icon": "PiggyBank",
        "max_value": 2000,
        "source_container_id": "00000000-0000-0000-0000-000000000203",
        "__config": {
            "mode": "aggregate_children",
            "target_key": "amount",
            "group_by": "category"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Widget 2: Spending Breakdown (card_chart_pie) - Aggregates from Transactions
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
    '00000000-0000-0000-0000-000000000202'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000106'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106.00000000_0000_0000_0000_000000000202'::ltree,
    'folder'::resource_type,
    'Spending Breakdown',
    'Category distribution',
    'active'::resource_status,
    '{
        "variant": "card_chart_pie",
        "icon": "PieChart",
        "source_container_id": "00000000-0000-0000-0000-000000000203",
        "__config": {
            "mode": "aggregate_children",
            "target_key": "amount",
            "group_by": "category"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Container: Transactions (view_list_stack) - Holds the data nodes
-- NOTE: col_span: "full" forces this container to span full width in masonry grid
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
    '00000000-0000-0000-0000-000000000106'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106.00000000_0000_0000_0000_000000000203'::ltree,
    'folder'::resource_type,
    'Transactions',
    'Recent expenses',
    'active'::resource_status,
    '{
        "variant": "view_list_stack",
        "icon": "Receipt",
        "color": "#6366f1",
        "col_span": "full"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 1: Groceries (Food category)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000204'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000203'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106.00000000_0000_0000_0000_000000000203.00000000_0000_0000_0000_000000000204'::ltree,
    'task'::resource_type,
    'Groceries',
    'Weekly shopping at Whole Foods',
    'active'::resource_status,
    '{
        "variant": "row_input_currency",
        "amount": 125.50,
        "category": "Food",
        "date": "2024-12-01",
        "__config": {
            "slot_headline": "title",
            "slot_value": "amount",
            "slot_subtext": "category"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 2: Coffee Shop (Food category)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000205'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000203'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106.00000000_0000_0000_0000_000000000203.00000000_0000_0000_0000_000000000205'::ltree,
    'task'::resource_type,
    'Coffee Shop',
    'Morning latte at Starbucks',
    'active'::resource_status,
    '{
        "variant": "row_input_currency",
        "amount": 6.75,
        "category": "Food",
        "date": "2024-12-02",
        "__config": {
            "slot_headline": "title",
            "slot_value": "amount",
            "slot_subtext": "category"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 3: Gas Station (Transport category)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000206'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000203'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106.00000000_0000_0000_0000_000000000203.00000000_0000_0000_0000_000000000206'::ltree,
    'task'::resource_type,
    'Gas Station',
    'Shell fuel up',
    'active'::resource_status,
    '{
        "variant": "row_input_currency",
        "amount": 58.00,
        "category": "Transport",
        "date": "2024-12-01",
        "__config": {
            "slot_headline": "title",
            "slot_value": "amount",
            "slot_subtext": "category"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 4: Electric Bill (Utilities category)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000207'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000203'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106.00000000_0000_0000_0000_000000000203.00000000_0000_0000_0000_000000000207'::ltree,
    'task'::resource_type,
    'Electric Bill',
    'December power bill',
    'active'::resource_status,
    '{
        "variant": "row_input_currency",
        "amount": 145.00,
        "category": "Utilities",
        "date": "2024-12-03",
        "__config": {
            "slot_headline": "title",
            "slot_value": "amount",
            "slot_subtext": "category"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 5: Netflix (Entertainment category)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000208'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000203'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106.00000000_0000_0000_0000_000000000203.00000000_0000_0000_0000_000000000208'::ltree,
    'task'::resource_type,
    'Netflix',
    'Monthly subscription',
    'active'::resource_status,
    '{
        "variant": "row_input_currency",
        "amount": 15.99,
        "category": "Entertainment",
        "date": "2024-12-01",
        "__config": {
            "slot_headline": "title",
            "slot_value": "amount",
            "slot_subtext": "category"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 6: Restaurant Dinner (Food category)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000000209'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000000203'::uuid,
    'root.00000000_0000_0000_0000_000000000100.00000000_0000_0000_0000_000000000106.00000000_0000_0000_0000_000000000203.00000000_0000_0000_0000_000000000209'::ltree,
    'task'::resource_type,
    'Restaurant Dinner',
    'Birthday dinner at Italian place',
    'active'::resource_status,
    '{
        "variant": "row_input_currency",
        "amount": 85.00,
        "category": "Food",
        "date": "2024-12-02",
        "__config": {
            "slot_headline": "title",
            "slot_value": "amount",
            "slot_subtext": "category"
        }
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

COMMIT;
