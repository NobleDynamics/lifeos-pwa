-- ============================================================================
-- 14_seed_user_apps.sql
-- User Apps Seed Data: Finance, Photo Gallery, Notes
-- ============================================================================
-- Purpose: Seed the resources table with 3 new User Apps that showcase
--          the full range of ViewEngine components and variants.
--
-- Apps:
-- 1. Finance (💰) - Charts, Progress bars, Transaction history
-- 2. Photos (📸) - Gallery layouts, Media cards, Albums
-- 3. Notes (📝) - Note variants, Markdown content
--
-- UUID Ranges:
-- - Finance: 00000000-0000-0000-0000-000000010xxx
-- - Photos:  00000000-0000-0000-0000-000000020xxx
-- - Notes:   00000000-0000-0000-0000-000000030xxx
--
-- IMPORTANT: Run this migration AFTER 13_seed_viewengine.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- APP 1: FINANCE 💰
-- ============================================================================
-- Structure:
--   Finance (layout_app_shell)
--   ├── Dashboard (layout_top_tabs)
--   │   ├── Overview (view_dashboard_masonry)
--   │   ├── Charts (view_grid_fixed)
--   │   └── Progress (view_grid_fixed)
--   ├── Transactions (view_list_stack)
--   └── Budget (view_grid_fixed)

-- Finance App Root
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010000'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL, NULL,
    'root.00000000_0000_0000_0000_000000010000'::ltree,
    'folder'::resource_type,
    'Finance',
    'Track spending, budgets, and financial goals',
    'active'::resource_status,
    '{
        "context": "finance",
        "is_system": true,
        "is_system_app": true,
        "variant": "layout_app_shell",
        "icon": "DollarSign",
        "color": "#10b981",
        "default_tab_id": "00000000-0000-0000-0000-000000010001"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Tab 1: Dashboard (layout_top_tabs)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010000'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001'::ltree,
    'folder'::resource_type,
    'Dashboard',
    'Financial overview and analytics',
    'active'::resource_status,
    '{
        "variant": "layout_top_tabs",
        "icon": "LayoutDashboard",
        "default_tab_id": "00000000-0000-0000-0000-000000010010"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Dashboard Sub-Tab: Overview (view_dashboard_masonry)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010010'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010001'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010010'::ltree,
    'folder'::resource_type,
    'Overview',
    'At-a-glance financial summary',
    'active'::resource_status,
    '{
        "variant": "view_dashboard_masonry",
        "icon": "Eye"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Overview Widget 1: Total Balance (card_stat_hero)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010011'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010010'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010010.00000000_0000_0000_0000_000000010011'::ltree,
    'task'::resource_type,
    'Total Balance',
    'Current account balance',
    'active'::resource_status,
    '{
        "variant": "card_stat_hero",
        "value": "$12,458.32",
        "trend": "+$1,234",
        "trend_direction": "up",
        "accent_color": "#10b981",
        "col_span": 3
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Overview Widget 2: Monthly Spending (card_stat_hero)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010012'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010010'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010010.00000000_0000_0000_0000_000000010012'::ltree,
    'task'::resource_type,
    'Monthly Spending',
    'December expenses',
    'active'::resource_status,
    '{
        "variant": "card_stat_hero",
        "value": "$2,847.50",
        "trend": "-12%",
        "trend_direction": "down",
        "accent_color": "#ef4444",
        "col_span": 3
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Overview Widget 3: Budget Progress (card_progress_multi)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010013'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010010'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010010.00000000_0000_0000_0000_000000010013'::ltree,
    'task'::resource_type,
    'Category Budgets',
    'Monthly spending by category',
    'active'::resource_status,
    '{
        "variant": "card_progress_multi",
        "col_span": "full",
        "format": "currency",
        "items": [
            {"label": "Groceries", "value": 425, "max": 600, "color": "#10b981"},
            {"label": "Dining Out", "value": 180, "max": 200, "color": "#f59e0b"},
            {"label": "Transport", "value": 95, "max": 150, "color": "#06b6d4"},
            {"label": "Entertainment", "value": 75, "max": 100, "color": "#a855f7"}
        ]
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Overview Widget 4: Spending Pie Chart (card_chart_pie)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010014'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010010'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010010.00000000_0000_0000_0000_000000010014'::ltree,
    'task'::resource_type,
    'Spending Breakdown',
    'Where your money goes',
    'active'::resource_status,
    '{
        "variant": "card_chart_pie",
        "col_span": "full",
        "donut": true,
        "show_legend": true,
        "data": [
            {"name": "Groceries", "value": 425, "color": "#10b981"},
            {"name": "Dining", "value": 180, "color": "#f59e0b"},
            {"name": "Transport", "value": 95, "color": "#06b6d4"},
            {"name": "Utilities", "value": 245, "color": "#eab308"},
            {"name": "Entertainment", "value": 75, "color": "#a855f7"},
            {"name": "Shopping", "value": 320, "color": "#ec4899"}
        ]
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Dashboard Sub-Tab: Charts (view_grid_fixed)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010020'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010001'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010020'::ltree,
    'folder'::resource_type,
    'Charts',
    'Visual analytics',
    'active'::resource_status,
    '{
        "variant": "view_grid_fixed",
        "icon": "BarChart3",
        "gap": 4
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Charts: Bar Chart - Monthly Comparison
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010021'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010020'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010020.00000000_0000_0000_0000_000000010021'::ltree,
    'task'::resource_type,
    'Monthly Spending',
    '6-month comparison',
    'active'::resource_status,
    '{
        "variant": "card_chart_bar",
        "col_span": 6,
        "height": 250,
        "stacked": false,
        "data": [
            {"name": "Jul", "value": 2100},
            {"name": "Aug", "value": 2450},
            {"name": "Sep", "value": 1890},
            {"name": "Oct", "value": 2780},
            {"name": "Nov", "value": 2340},
            {"name": "Dec", "value": 2847}
        ]
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Charts: Line Chart - Spending Trend
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010022'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010020'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010020.00000000_0000_0000_0000_000000010022'::ltree,
    'task'::resource_type,
    'Spending Trend',
    'Daily spending this month',
    'active'::resource_status,
    '{
        "variant": "card_chart_line",
        "col_span": 6,
        "height": 250,
        "show_area": true,
        "curved": true,
        "data": [
            {"name": "Week 1", "value": 620},
            {"name": "Week 2", "value": 850},
            {"name": "Week 3", "value": 540},
            {"name": "Week 4", "value": 837}
        ]
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Charts: Pie Chart - Category Distribution
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010023'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010020'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010020.00000000_0000_0000_0000_000000010023'::ltree,
    'task'::resource_type,
    'Category Split',
    'Spending distribution',
    'active'::resource_status,
    '{
        "variant": "card_chart_pie",
        "col_span": 6,
        "donut": false,
        "show_legend": true,
        "data": [
            {"name": "Essential", "value": 1200, "color": "#10b981"},
            {"name": "Lifestyle", "value": 800, "color": "#f59e0b"},
            {"name": "Savings", "value": 500, "color": "#06b6d4"},
            {"name": "Other", "value": 347, "color": "#6b7280"}
        ]
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Charts: Radar Chart - Budget Health
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010024'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010020'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010020.00000000_0000_0000_0000_000000010024'::ltree,
    'task'::resource_type,
    'Budget Health',
    'Financial wellness radar',
    'active'::resource_status,
    '{
        "variant": "card_chart_radar",
        "col_span": 6,
        "show_legend": false,
        "fill_opacity": 0.4,
        "data": [
            {"name": "Savings", "value": 75},
            {"name": "Debt", "value": 90},
            {"name": "Emergency", "value": 60},
            {"name": "Investment", "value": 45},
            {"name": "Insurance", "value": 85},
            {"name": "Budget", "value": 70}
        ]
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Dashboard Sub-Tab: Progress (view_grid_fixed)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010030'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010001'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010030'::ltree,
    'folder'::resource_type,
    'Progress',
    'Goals and budgets',
    'active'::resource_status,
    '{
        "variant": "view_grid_fixed",
        "icon": "Target",
        "gap": 4
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Progress: Simple - Savings Goal
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010031'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010030'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010030.00000000_0000_0000_0000_000000010031'::ltree,
    'task'::resource_type,
    'Vacation Fund',
    'Summer 2025 trip',
    'active'::resource_status,
    '{
        "variant": "card_progress_simple",
        "col_span": 6,
        "value": 3200,
        "max": 5000,
        "format": "currency",
        "color": "#10b981"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Progress: Simple - Emergency Fund
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010032'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010030'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010030.00000000_0000_0000_0000_000000010032'::ltree,
    'task'::resource_type,
    'Emergency Fund',
    '6-month expenses goal',
    'active'::resource_status,
    '{
        "variant": "card_progress_simple",
        "col_span": 6,
        "value": 8500,
        "max": 15000,
        "format": "currency",
        "color": "#06b6d4"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Progress: Stacked - Monthly Budget
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010033'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010030'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010030.00000000_0000_0000_0000_000000010033'::ltree,
    'task'::resource_type,
    'December Budget',
    'Spending vs budget',
    'active'::resource_status,
    '{
        "variant": "card_progress_stacked",
        "col_span": 6,
        "max": 4000,
        "format": "currency",
        "segments": [
            {"label": "Essentials", "value": 1200, "color": "#10b981"},
            {"label": "Lifestyle", "value": 650, "color": "#f59e0b"},
            {"label": "Discretionary", "value": 497, "color": "#a855f7"},
            {"label": "Savings", "value": 500, "color": "#06b6d4"}
        ]
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Progress: Multi - All Goals
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010034'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010030'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010001.00000000_0000_0000_0000_000000010030.00000000_0000_0000_0000_000000010034'::ltree,
    'task'::resource_type,
    'Financial Goals',
    'Progress on all savings',
    'active'::resource_status,
    '{
        "variant": "card_progress_multi",
        "col_span": 6,
        "format": "currency",
        "items": [
            {"label": "New Car", "value": 12000, "max": 25000, "color": "#ef4444"},
            {"label": "Home Down Payment", "value": 45000, "max": 80000, "color": "#8b5cf6"},
            {"label": "Investment Account", "value": 8200, "max": 10000, "color": "#10b981"}
        ]
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Tab 2: Transactions (view_list_stack)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010050'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010000'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050'::ltree,
    'folder'::resource_type,
    'Transactions',
    'Recent activity',
    'active'::resource_status,
    '{
        "variant": "view_list_stack",
        "icon": "Receipt",
        "show_header": false
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 1
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010051'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010051'::ltree,
    'task'::resource_type,
    'Whole Foods Market',
    'Weekly groceries',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 156.78,
        "category": "Food",
        "date": "2024-12-04"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 2
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010052'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010052'::ltree,
    'task'::resource_type,
    'Shell Gas Station',
    'Fuel',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 62.45,
        "category": "Transport",
        "date": "2024-12-03"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 3
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010053'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010053'::ltree,
    'task'::resource_type,
    'Netflix',
    'Monthly subscription',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 15.99,
        "category": "Entertainment",
        "date": "2024-12-01"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 4
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010054'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010054'::ltree,
    'task'::resource_type,
    'Chipotle',
    'Lunch with team',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 24.50,
        "category": "Dining",
        "date": "2024-12-03"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 5
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010055'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010055'::ltree,
    'task'::resource_type,
    'Amazon',
    'Home supplies',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 89.99,
        "category": "Shopping",
        "date": "2024-12-02"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 6
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010056'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010056'::ltree,
    'task'::resource_type,
    'Electric Company',
    'December bill',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 145.00,
        "category": "Utilities",
        "date": "2024-12-01"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 7
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010057'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010057'::ltree,
    'task'::resource_type,
    'Starbucks',
    'Morning coffee',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 7.25,
        "category": "Coffee",
        "date": "2024-12-04"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 8
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010058'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010058'::ltree,
    'task'::resource_type,
    'CVS Pharmacy',
    'Prescriptions',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 35.00,
        "category": "Health",
        "date": "2024-12-02"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 9
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010059'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010059'::ltree,
    'task'::resource_type,
    'Uber',
    'Airport ride',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 42.00,
        "category": "Transport",
        "date": "2024-11-30"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 10
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010060'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010060'::ltree,
    'task'::resource_type,
    'Spotify',
    'Premium subscription',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": 10.99,
        "category": "Entertainment",
        "date": "2024-12-01"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Transaction 11 (Income)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010061'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010050'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010050.00000000_0000_0000_0000_000000010061'::ltree,
    'task'::resource_type,
    'Direct Deposit',
    'Bi-weekly paycheck',
    'active'::resource_status,
    '{
        "variant": "row_transaction_history",
        "amount": -3250.00,
        "category": "Income",
        "date": "2024-12-01"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Tab 3: Budget (view_grid_fixed)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010070'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010000'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010070'::ltree,
    'folder'::resource_type,
    'Budget',
    'Monthly budget limits',
    'active'::resource_status,
    '{
        "variant": "view_grid_fixed",
        "icon": "Wallet",
        "gap": 4
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Budget Category Cards
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010071'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010070'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010070.00000000_0000_0000_0000_000000010071'::ltree,
    'task'::resource_type,
    'Groceries Budget',
    'Food and household items',
    'active'::resource_status,
    '{
        "variant": "card_progress_simple",
        "col_span": 3,
        "value": 425,
        "max": 600,
        "format": "currency",
        "color": "#10b981"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010072'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010070'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010070.00000000_0000_0000_0000_000000010072'::ltree,
    'task'::resource_type,
    'Dining Budget',
    'Restaurants and takeout',
    'active'::resource_status,
    '{
        "variant": "card_progress_simple",
        "col_span": 3,
        "value": 180,
        "max": 200,
        "format": "currency",
        "color": "#f59e0b"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010073'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010070'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010070.00000000_0000_0000_0000_000000010073'::ltree,
    'task'::resource_type,
    'Transport Budget',
    'Gas and transit',
    'active'::resource_status,
    '{
        "variant": "card_progress_simple",
        "col_span": 3,
        "value": 95,
        "max": 150,
        "format": "currency",
        "color": "#06b6d4"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000010074'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000010070'::uuid,
    'root.00000000_0000_0000_0000_000000010000.00000000_0000_0000_0000_000000010070.00000000_0000_0000_0000_000000010074'::ltree,
    'task'::resource_type,
    'Entertainment Budget',
    'Streaming and fun',
    'active'::resource_status,
    '{
        "variant": "card_progress_simple",
        "col_span": 3,
        "value": 75,
        "max": 100,
        "format": "currency",
        "color": "#a855f7"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- ============================================================================
-- APP 2: PHOTOS 📸
-- ============================================================================
-- Structure:
--   Photos (layout_app_shell)
--   ├── All Photos (view_gallery_grid)
--   ├── Albums (view_grid_fixed)
--   └── Favorites (view_grid_fixed)

-- Photos App Root
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000020000'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL, NULL,
    'root.00000000_0000_0000_0000_000000020000'::ltree,
    'folder'::resource_type,
    'Photos',
    'Your photo gallery',
    'active'::resource_status,
    '{
        "context": "photos",
        "is_system": true,
        "is_system_app": true,
        "variant": "layout_app_shell",
        "icon": "Camera",
        "color": "#ec4899",
        "default_tab_id": "00000000-0000-0000-0000-000000020001"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Tab 1: All Photos (view_gallery_grid)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000020001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000020000'::uuid,
    'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001'::ltree,
    'folder'::resource_type,
    'All Photos',
    'Your complete photo library',
    'active'::resource_status,
    '{
        "variant": "view_gallery_grid",
        "icon": "Images"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Photo thumbnails (using picsum.photos for placeholder images)
INSERT INTO resources (id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by) VALUES
('00000000-0000-0000-0000-000000020011'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020011'::ltree, 'task'::resource_type, 'Mountain Sunset', 'Vacation 2024', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/mountain/400/400", "alt": "Mountain sunset"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020012'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020012'::ltree, 'task'::resource_type, 'Beach Day', 'Summer memories', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/beach/400/400", "alt": "Beach scene"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020013'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020013'::ltree, 'task'::resource_type, 'City Lights', 'Downtown nightlife', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/city/400/400", "alt": "City at night"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020014'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020014'::ltree, 'task'::resource_type, 'Forest Trail', 'Hiking adventure', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/forest/400/400", "alt": "Forest path"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020015'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020015'::ltree, 'task'::resource_type, 'Coffee Shop', 'Morning vibes', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/coffee/400/400", "alt": "Coffee shop"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020016'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020016'::ltree, 'task'::resource_type, 'Pet Portrait', 'Max the dog', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/dog/400/400", "alt": "Dog portrait"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020017'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020017'::ltree, 'task'::resource_type, 'Food Photography', 'Dinner date', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/food/400/400", "alt": "Gourmet food"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020018'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020018'::ltree, 'task'::resource_type, 'Architecture', 'Modern building', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/architecture/400/400", "alt": "Modern architecture"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020019'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020019'::ltree, 'task'::resource_type, 'Garden Flowers', 'Spring blooms', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/flowers/400/400", "alt": "Colorful flowers"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020020'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020020'::ltree, 'task'::resource_type, 'Lake Reflection', 'Peaceful morning', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/lake/400/400", "alt": "Lake reflection"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020021'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020021'::ltree, 'task'::resource_type, 'Street Art', 'Urban exploration', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/graffiti/400/400", "alt": "Street art mural"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020022'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020001'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020001.00000000_0000_0000_0000_000000020022'::ltree, 'task'::resource_type, 'Concert Night', 'Live music', 'active'::resource_status, '{"variant": "card_media_thumbnail", "url": "https://picsum.photos/seed/concert/400/400", "alt": "Concert crowd"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid);

-- Tab 2: Albums (view_grid_fixed with card_folder)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000020030'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000020000'::uuid,
    'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020030'::ltree,
    'folder'::resource_type,
    'Albums',
    'Organized photo collections',
    'active'::resource_status,
    '{
        "variant": "view_grid_fixed",
        "icon": "FolderOpen",
        "gap": 4
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Album folder cards
INSERT INTO resources (id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by) VALUES
('00000000-0000-0000-0000-000000020031'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020030'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020030.00000000_0000_0000_0000_000000020031'::ltree, 'folder'::resource_type, 'Vacation 2024', 'Summer trip photos', 'active'::resource_status, '{"variant": "card_folder", "icon": "Plane", "color": "#06b6d4", "neon_glow": true, "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020032'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020030'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020030.00000000_0000_0000_0000_000000020032'::ltree, 'folder'::resource_type, 'Family', 'Family memories', 'active'::resource_status, '{"variant": "card_folder", "icon": "Users", "color": "#ec4899", "neon_glow": true, "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020033'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020030'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020030.00000000_0000_0000_0000_000000020033'::ltree, 'folder'::resource_type, 'Pets', 'Furry friends', 'active'::resource_status, '{"variant": "card_folder", "icon": "Cat", "color": "#f59e0b", "neon_glow": true, "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020034'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020030'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020030.00000000_0000_0000_0000_000000020034'::ltree, 'folder'::resource_type, 'Nature', 'Outdoor adventures', 'active'::resource_status, '{"variant": "card_folder", "icon": "TreePine", "color": "#10b981", "neon_glow": true, "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020035'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020030'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020030.00000000_0000_0000_0000_000000020035'::ltree, 'folder'::resource_type, 'Food & Drinks', 'Culinary adventures', 'active'::resource_status, '{"variant": "card_folder", "icon": "UtensilsCrossed", "color": "#ef4444", "neon_glow": false, "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020036'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020030'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020030.00000000_0000_0000_0000_000000020036'::ltree, 'folder'::resource_type, 'Events', 'Celebrations and parties', 'active'::resource_status, '{"variant": "card_folder", "icon": "PartyPopper", "color": "#a855f7", "neon_glow": false, "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid);

-- Tab 3: Favorites (view_grid_fixed with card_media_cover_compact)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000020050'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000020000'::uuid,
    'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020050'::ltree,
    'folder'::resource_type,
    'Favorites',
    'Your best shots',
    'active'::resource_status,
    '{
        "variant": "view_grid_fixed",
        "icon": "Heart",
        "gap": 3
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Favorite photos (using card_media_cover_compact for 2-per-row layout)
INSERT INTO resources (id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by) VALUES
('00000000-0000-0000-0000-000000020051'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020050'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020050.00000000_0000_0000_0000_000000020051'::ltree, 'task'::resource_type, 'Golden Hour', 'Best sunset shot', 'active'::resource_status, '{"variant": "card_media_cover_compact", "url": "https://picsum.photos/seed/sunset1/400/500", "description": "Hawaii 2024", "neon_glow": true, "border_color": "#ec4899", "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020052'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020050'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020050.00000000_0000_0000_0000_000000020052'::ltree, 'task'::resource_type, 'Northern Lights', 'Aurora magic', 'active'::resource_status, '{"variant": "card_media_cover_compact", "url": "https://picsum.photos/seed/aurora/400/500", "description": "Iceland Trip", "neon_glow": true, "border_color": "#06b6d4", "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020053'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020050'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020050.00000000_0000_0000_0000_000000020053'::ltree, 'task'::resource_type, 'Cherry Blossoms', 'Spring beauty', 'active'::resource_status, '{"variant": "card_media_cover_compact", "url": "https://picsum.photos/seed/cherry/400/500", "description": "Japan 2023", "neon_glow": false, "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020054'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020050'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020050.00000000_0000_0000_0000_000000020054'::ltree, 'task'::resource_type, 'Mountain Peak', 'Summit victory', 'active'::resource_status, '{"variant": "card_media_cover_compact", "url": "https://picsum.photos/seed/peak/400/500", "description": "Colorado Hike", "neon_glow": false, "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020055'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020050'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020050.00000000_0000_0000_0000_000000020055'::ltree, 'task'::resource_type, 'City Skyline', 'Night views', 'active'::resource_status, '{"variant": "card_media_cover_compact", "url": "https://picsum.photos/seed/skyline/400/500", "description": "NYC at Night", "neon_glow": true, "border_color": "#a855f7", "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000020056'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000020050'::uuid, 'root.00000000_0000_0000_0000_000000020000.00000000_0000_0000_0000_000000020050.00000000_0000_0000_0000_000000020056'::ltree, 'task'::resource_type, 'Ocean Waves', 'Perfect timing', 'active'::resource_status, '{"variant": "card_media_cover_compact", "url": "https://picsum.photos/seed/waves/400/500", "description": "California Coast", "neon_glow": false, "col_span": 3}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid);


-- ============================================================================
-- APP 3: NOTES 📝
-- ============================================================================
-- Structure:
--   Notes (layout_app_shell)
--   ├── All Notes (view_list_stack) - row_note items
--   ├── Grid View (view_grid_fixed) - card_note + card_note_large
--   └── Categories (view_directory) - organized folders

-- Notes App Root
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000030000'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL, NULL,
    'root.00000000_0000_0000_0000_000000030000'::ltree,
    'folder'::resource_type,
    'Notes',
    'Your thoughts and ideas',
    'active'::resource_status,
    '{
        "context": "notes",
        "is_system": true,
        "is_system_app": true,
        "variant": "layout_app_shell",
        "icon": "StickyNote",
        "color": "#8b5cf6",
        "default_tab_id": "00000000-0000-0000-0000-000000030001"
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Tab 1: All Notes (view_list_stack with row_note)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000030001'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000030000'::uuid,
    'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030001'::ltree,
    'folder'::resource_type,
    'All Notes',
    'Your complete notes list',
    'active'::resource_status,
    '{
        "variant": "view_list_stack",
        "icon": "List",
        "show_header": false
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Note items using row_note variant
INSERT INTO resources (id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by) VALUES
('00000000-0000-0000-0000-000000030011'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030001'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030001.00000000_0000_0000_0000_000000030011'::ltree, 'task'::resource_type, 'Project Ideas', 'Brainstorming session', 'active'::resource_status, '{"variant": "row_note", "content": "# Project Ideas\n\n## App Concepts\n- [ ] Habit tracker with streaks\n- [ ] Recipe organizer with meal planning\n- [x] Finance dashboard\n\n## Features to Add\n1. Dark mode toggle\n2. Export to PDF\n3. Cloud sync", "updated_at": "2024-12-04T15:30:00Z", "accent_color": "#8b5cf6", "history": [{"content": "Initial brainstorm...", "savedAt": "2024-12-03T10:00:00Z"}]}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030012'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030001'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030001.00000000_0000_0000_0000_000000030012'::ltree, 'task'::resource_type, 'Meeting Notes - Q4 Planning', 'Team sync', 'active'::resource_status, '{"variant": "row_note", "content": "# Q4 Planning Meeting\n\n**Date:** Dec 2, 2024\n**Attendees:** Sarah, Mike, Lisa\n\n## Key Decisions\n- Launch date: Jan 15\n- Budget approved: $50k\n- Team expansion: 2 engineers\n\n## Action Items\n- [ ] @Sarah: Finalize designs\n- [ ] @Mike: Backend setup\n- [x] @Lisa: Stakeholder update", "updated_at": "2024-12-02T17:00:00Z", "accent_color": "#06b6d4", "history": []}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030013'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030001'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030001.00000000_0000_0000_0000_000000030013'::ltree, 'task'::resource_type, 'Book Notes: Atomic Habits', 'Reading summary', 'active'::resource_status, '{"variant": "row_note", "content": "# Atomic Habits - Key Takeaways\n\n## The Four Laws of Behavior Change\n1. **Make it obvious** - Design your environment\n2. **Make it attractive** - Bundle temptations\n3. **Make it easy** - Reduce friction\n4. **Make it satisfying** - Immediate rewards\n\n> \"You do not rise to the level of your goals. You fall to the level of your systems.\"\n\n## My Implementation\n- Morning routine checklist\n- Phone in another room while working\n- Habit stacking: After coffee → 10 min reading", "updated_at": "2024-12-01T09:00:00Z", "accent_color": "#10b981", "history": [{"content": "Started reading...", "savedAt": "2024-11-28T20:00:00Z"}]}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030014'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030001'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030001.00000000_0000_0000_0000_000000030014'::ltree, 'task'::resource_type, 'Recipe: Homemade Pasta', 'Italian cooking', 'active'::resource_status, '{"variant": "row_note", "content": "# Homemade Fresh Pasta\n\n## Ingredients\n- 2 cups all-purpose flour\n- 3 large eggs\n- 1 tbsp olive oil\n- Pinch of salt\n\n## Instructions\n1. Make a well in the flour\n2. Add eggs to center\n3. Gradually incorporate flour\n4. Knead 10 minutes until smooth\n5. Rest 30 min covered\n6. Roll and cut\n\n**Pro tip:** Let the dough rest longer for easier rolling!", "updated_at": "2024-11-30T14:00:00Z", "accent_color": "#f59e0b", "history": []}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030015'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030001'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030001.00000000_0000_0000_0000_000000030015'::ltree, 'task'::resource_type, 'Gift Ideas 2024', 'Holiday shopping', 'active'::resource_status, '{"variant": "row_note", "content": "# Gift Ideas 2024\n\n## For Mom\n- [x] Cashmere scarf - Nordstrom\n- [ ] Cookbook - \"Salt Fat Acid Heat\"\n- [ ] Spa gift card\n\n## For Dad\n- [ ] Noise-canceling headphones\n- [x] Coffee subscription\n- [ ] Golf lessons\n\n## For Sarah\n- [ ] Art supplies set\n- [ ] Concert tickets", "updated_at": "2024-12-03T20:00:00Z", "accent_color": "#ef4444", "history": []}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030016'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030001'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030001.00000000_0000_0000_0000_000000030016'::ltree, 'task'::resource_type, 'Code Snippets', 'Useful patterns', 'active'::resource_status, '{"variant": "row_note", "content": "# Useful Code Snippets\n\n## React Custom Hook\n```typescript\nfunction useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState(value);\n  \n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  \n  return debouncedValue;\n}\n```\n\n## SQL: Get hierarchy with ltree\n```sql\nSELECT * FROM resources\nWHERE path <@ ''root.folder_id''\nORDER BY nlevel(path);\n```", "updated_at": "2024-12-04T11:00:00Z", "accent_color": "#ec4899", "history": []}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid);

-- Tab 2: Grid View (view_grid_fixed with card_note variants)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000030020'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000030000'::uuid,
    'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030020'::ltree,
    'folder'::resource_type,
    'Grid View',
    'Notes as cards',
    'active'::resource_status,
    '{
        "variant": "view_grid_fixed",
        "icon": "LayoutGrid",
        "gap": 4
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Card note items (mix of card_note and card_note_large)
INSERT INTO resources (id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by) VALUES
('00000000-0000-0000-0000-000000030021'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030020'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030020.00000000_0000_0000_0000_000000030021'::ltree, 'task'::resource_type, 'Quick Thoughts', 'Daily musings', 'active'::resource_status, '{"variant": "card_note", "col_span": 3, "content": "# Random Thoughts\n\n- Life moves pretty fast\n- Remember to breathe\n- Small progress is still progress\n- Be kind to yourself", "updated_at": "2024-12-04T08:00:00Z", "accent_color": "#8b5cf6", "neon_glow": true, "history": []}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030022'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030020'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030020.00000000_0000_0000_0000_000000030022'::ltree, 'task'::resource_type, 'Shopping List', 'This week', 'active'::resource_status, '{"variant": "card_note", "col_span": 3, "content": "# Shopping\n\n- [ ] Milk\n- [ ] Eggs\n- [ ] Bread\n- [x] Coffee\n- [ ] Avocados", "updated_at": "2024-12-04T12:00:00Z", "accent_color": "#10b981", "neon_glow": false, "history": []}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030023'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030020'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030020.00000000_0000_0000_0000_000000030023'::ltree, 'task'::resource_type, 'Project Documentation', 'Technical overview', 'active'::resource_status, '{"variant": "card_note_large", "col_span": 6, "content": "# LifeOS Project Documentation\n\n## Overview\nLifeOS is a personal operating system PWA built with React, TypeScript, and Supabase. It uses a data-driven ViewEngine architecture where UI components are rendered from JSON configurations stored in the database.\n\n## Key Technologies\n- **Frontend:** React 18, TypeScript, TailwindCSS\n- **State:** TanStack Query, Zustand\n- **Backend:** Supabase (PostgreSQL + Auth)\n- **Styling:** Cyberpunk aesthetic with neon glows\n\n## Architecture Highlights\n- Slot-based component system for flexibility\n- ltree paths for hierarchical data\n- Smart aggregation hooks for dashboards", "updated_at": "2024-12-04T16:00:00Z", "accent_color": "#06b6d4", "neon_glow": true, "history": [{"content": "Initial draft", "savedAt": "2024-12-01T10:00:00Z"}]}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030024'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030020'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030020.00000000_0000_0000_0000_000000030024'::ltree, 'task'::resource_type, 'Daily Goals', 'Today''s focus', 'active'::resource_status, '{"variant": "card_note", "col_span": 3, "content": "# Today''s Goals\n\n1. [x] Morning workout\n2. [ ] Finish report\n3. [ ] Call Mom\n4. [ ] Grocery shopping", "updated_at": "2024-12-04T07:00:00Z", "accent_color": "#f59e0b", "neon_glow": false, "history": []}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030025'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030020'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030020.00000000_0000_0000_0000_000000030025'::ltree, 'task'::resource_type, 'Quotes Collection', 'Inspiration', 'active'::resource_status, '{"variant": "card_note", "col_span": 3, "content": "# Favorite Quotes\n\n> \"The best time to plant a tree was 20 years ago. The second best time is now.\"\n\n> \"Done is better than perfect.\"\n\n> \"Be the change you wish to see.\"", "updated_at": "2024-12-02T15:00:00Z", "accent_color": "#ec4899", "neon_glow": true, "history": []}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid);

-- Tab 3: Categories (view_directory with neon group folders)
INSERT INTO resources (
    id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by
) VALUES (
    '00000000-0000-0000-0000-000000030030'::uuid,
    '11111111-1111-1111-1111-111111111111'::uuid,
    NULL,
    '00000000-0000-0000-0000-000000030000'::uuid,
    'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030030'::ltree,
    'folder'::resource_type,
    'Categories',
    'Organized by topic',
    'active'::resource_status,
    '{
        "variant": "view_directory",
        "icon": "Folders",
        "placeholder": "Search categories..."
    }'::jsonb,
    false,
    '11111111-1111-1111-1111-111111111111'::uuid
);

-- Category folders using row_neon_group
INSERT INTO resources (id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by) VALUES
('00000000-0000-0000-0000-000000030031'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030030'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030030.00000000_0000_0000_0000_000000030031'::ltree, 'folder'::resource_type, 'Work Notes', 'Professional stuff', 'active'::resource_status, '{"variant": "row_neon_group", "icon": "Briefcase", "color": "#06b6d4", "description": "Meetings, projects, and tasks"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030032'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030030'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030030.00000000_0000_0000_0000_000000030032'::ltree, 'folder'::resource_type, 'Personal', 'Life stuff', 'active'::resource_status, '{"variant": "row_neon_group", "icon": "Heart", "color": "#ec4899", "description": "Goals, journals, and reflections"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030033'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030030'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030030.00000000_0000_0000_0000_000000030033'::ltree, 'folder'::resource_type, 'Ideas', 'Creative brainstorms', 'active'::resource_status, '{"variant": "row_neon_group", "icon": "Lightbulb", "color": "#f59e0b", "description": "App ideas, inventions, and dreams"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030034'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030030'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030030.00000000_0000_0000_0000_000000030034'::ltree, 'folder'::resource_type, 'Learning', 'Knowledge base', 'active'::resource_status, '{"variant": "row_neon_group", "icon": "GraduationCap", "color": "#8b5cf6", "description": "Book notes, courses, and tutorials"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030035'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030030'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030030.00000000_0000_0000_0000_000000030035'::ltree, 'folder'::resource_type, 'Recipes', 'Culinary collection', 'active'::resource_status, '{"variant": "row_neon_group", "icon": "ChefHat", "color": "#10b981", "description": "Cooking and meal plans"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid);

-- Add some sample notes inside Work Notes folder
INSERT INTO resources (id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by) VALUES
('00000000-0000-0000-0000-000000030041'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030031'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030030.00000000_0000_0000_0000_000000030031.00000000_0000_0000_0000_000000030041'::ltree, 'task'::resource_type, 'Sprint Planning', 'Dec Sprint', 'active'::resource_status, '{"variant": "row_note", "content": "# Sprint 24 Goals\n\n- [ ] Complete API refactor\n- [ ] Launch beta features\n- [x] Fix critical bugs", "updated_at": "2024-12-04T10:00:00Z", "accent_color": "#06b6d4"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid),
('00000000-0000-0000-0000-000000030042'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030031'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030030.00000000_0000_0000_0000_000000030031.00000000_0000_0000_0000_000000030042'::ltree, 'task'::resource_type, '1:1 with Manager', 'Weekly sync', 'active'::resource_status, '{"variant": "row_note", "content": "# Topics to Discuss\n\n- Career growth\n- Project feedback\n- Team dynamics", "updated_at": "2024-12-03T14:00:00Z", "accent_color": "#06b6d4"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid);

-- Add some sample notes inside Ideas folder
INSERT INTO resources (id, user_id, household_id, parent_id, path, type, title, description, status, meta_data, is_schedulable, created_by) VALUES
('00000000-0000-0000-0000-000000030043'::uuid, '11111111-1111-1111-1111-111111111111'::uuid, NULL, '00000000-0000-0000-0000-000000030033'::uuid, 'root.00000000_0000_0000_0000_000000030000.00000000_0000_0000_0000_000000030030.00000000_0000_0000_0000_000000030033.00000000_0000_0000_0000_000000030043'::ltree, 'task'::resource_type, 'Startup Ideas', 'Million dollar thoughts', 'active'::resource_status, '{"variant": "row_note", "content": "# Startup Concepts\n\n## SaaS Ideas\n- AI-powered meal planning\n- Remote team bonding platform\n- Personal finance automation\n\n## Hardware\n- Smart home dashboard display", "updated_at": "2024-12-02T21:00:00Z", "accent_color": "#f59e0b"}'::jsonb, false, '11111111-1111-1111-1111-111111111111'::uuid);

COMMIT;
