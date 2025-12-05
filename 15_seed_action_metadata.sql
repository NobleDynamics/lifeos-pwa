-- ============================================================================
-- 15_seed_action_metadata.sql
-- Add header_action and child_context_menu metadata for testing JSONB actions
-- ============================================================================
-- Purpose: Update existing resources with header_action and child_context_menu
--          metadata to enable testing the new action system.
--
-- This adds:
-- 1. header_action configs to view containers (tabs)
-- 2. child_context_menu configs to parent views (applies to their children)
--
-- IMPORTANT: Run this migration AFTER 14_seed_user_apps.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- PHOTOS APP: Add header_action and context menus
-- ============================================================================

-- Update "All Photos" tab with header_action for adding photos
UPDATE resources
SET meta_data = meta_data || '{
    "header_action": {
        "label": "Add",
        "icon": "Plus",
        "options": [
            {
                "id": "upload_photo",
                "label": "Upload Photo",
                "icon": "Upload",
                "action_type": "create",
                "create_node_type": "item",
                "create_variant": "card_media_thumbnail",
                "create_schema": [
                    { "key": "url", "label": "Photo URL", "type": "text", "required": true, "placeholder": "https://picsum.photos/..." },
                    { "key": "title", "label": "Title", "type": "text", "required": true },
                    { "key": "alt", "label": "Description", "type": "textarea" }
                ]
            },
            {
                "id": "take_photo",
                "label": "Take Photo",
                "icon": "Camera",
                "action_type": "custom",
                "custom_handler": "open_camera"
            }
        ]
    },
    "child_context_menu": {
        "options": [
            { "id": "view", "label": "View Full Size", "icon": "Maximize2", "action_type": "navigate" },
            { "id": "edit", "label": "Edit Details", "icon": "Pencil", "action_type": "edit", "edit_schema": [
                { "key": "title", "label": "Title", "type": "text", "required": true },
                { "key": "alt", "label": "Description", "type": "textarea" }
            ]},
            { "id": "favorite", "label": "Add to Favorites", "icon": "Heart", "action_type": "custom", "custom_handler": "toggle_favorite" },
            { "id": "share", "label": "Share", "icon": "Share2", "action_type": "custom", "custom_handler": "share_item" },
            { "id": "move", "label": "Move to Album", "icon": "FolderInput", "action_type": "move" },
            { "id": "delete", "label": "Delete", "icon": "Trash2", "color": "#ef4444", "divider_before": true, "action_type": "delete" }
        ]
    }
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000020001'::uuid;

-- Update "Albums" tab with header_action for creating albums
UPDATE resources
SET meta_data = meta_data || '{
    "header_action": {
        "label": "New Album",
        "icon": "FolderPlus",
        "options": [
            {
                "id": "create_album",
                "label": "Create Album",
                "icon": "FolderPlus",
                "action_type": "create",
                "create_node_type": "container",
                "create_variant": "card_folder",
                "create_schema": [
                    { "key": "title", "label": "Album Name", "type": "text", "required": true },
                    { "key": "description", "label": "Description", "type": "textarea" },
                    { "key": "icon", "label": "Icon", "type": "icon" },
                    { "key": "color", "label": "Color", "type": "color" },
                    { "key": "neon_glow", "label": "Neon Glow Effect", "type": "toggle", "default_value": true }
                ]
            }
        ]
    },
    "child_context_menu": {
        "options": [
            { "id": "open", "label": "Open Album", "icon": "FolderOpen", "action_type": "navigate" },
            { "id": "rename", "label": "Rename", "icon": "Pencil", "action_type": "edit", "edit_schema": [
                { "key": "title", "label": "Album Name", "type": "text", "required": true },
                { "key": "description", "label": "Description", "type": "textarea" }
            ]},
            { "id": "change_cover", "label": "Change Cover", "icon": "Image", "action_type": "custom", "custom_handler": "change_album_cover" },
            { "id": "delete", "label": "Delete Album", "icon": "Trash2", "color": "#ef4444", "divider_before": true, "action_type": "delete" }
        ]
    }
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000020030'::uuid;

-- Update "Favorites" tab with context menu (no header action - can't create favorites directly)
UPDATE resources
SET meta_data = meta_data || '{
    "show_header_action": false,
    "child_context_menu": {
        "options": [
            { "id": "view", "label": "View Full Size", "icon": "Maximize2", "action_type": "navigate" },
            { "id": "remove", "label": "Remove from Favorites", "icon": "HeartOff", "action_type": "custom", "custom_handler": "remove_favorite" },
            { "id": "share", "label": "Share", "icon": "Share2", "action_type": "custom", "custom_handler": "share_item" }
        ]
    }
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000020050'::uuid;

-- ============================================================================
-- NOTES APP: Add header_action and context menus
-- ============================================================================

-- Update "All Notes" tab with header_action for creating notes
UPDATE resources
SET meta_data = meta_data || '{
    "header_action": {
        "label": "New Note",
        "icon": "Plus",
        "options": [
            {
                "id": "quick_note",
                "label": "Quick Note",
                "icon": "StickyNote",
                "action_type": "create",
                "create_node_type": "item",
                "create_variant": "row_note",
                "create_schema": [
                    { "key": "title", "label": "Title", "type": "text", "required": true },
                    { "key": "content", "label": "Content", "type": "textarea", "placeholder": "Start writing..." },
                    { "key": "accent_color", "label": "Color", "type": "color" }
                ]
            },
            {
                "id": "from_template",
                "label": "From Template",
                "icon": "FileText",
                "action_type": "custom",
                "custom_handler": "show_templates"
            }
        ]
    },
    "child_context_menu": {
        "options": [
            { "id": "open", "label": "Open Note", "icon": "ExternalLink", "action_type": "navigate" },
            { "id": "edit", "label": "Edit", "icon": "Pencil", "action_type": "edit", "edit_schema": [
                { "key": "title", "label": "Title", "type": "text", "required": true },
                { "key": "content", "label": "Content", "type": "textarea" },
                { "key": "accent_color", "label": "Color", "type": "color" }
            ]},
            { "id": "duplicate", "label": "Duplicate", "icon": "Copy", "action_type": "custom", "custom_handler": "duplicate_note" },
            { "id": "move", "label": "Move to Folder", "icon": "FolderInput", "action_type": "move" },
            { "id": "export", "label": "Export as PDF", "icon": "Download", "action_type": "custom", "custom_handler": "export_pdf" },
            { "id": "delete", "label": "Delete", "icon": "Trash2", "color": "#ef4444", "divider_before": true, "action_type": "delete" }
        ]
    }
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000030001'::uuid;

-- Update "Grid View" tab
UPDATE resources
SET meta_data = meta_data || '{
    "header_action": {
        "label": "New",
        "icon": "Plus",
        "options": [
            {
                "id": "card_note",
                "label": "Small Card",
                "icon": "Square",
                "action_type": "create",
                "create_node_type": "item",
                "create_variant": "card_note",
                "create_schema": [
                    { "key": "title", "label": "Title", "type": "text", "required": true },
                    { "key": "content", "label": "Content", "type": "textarea" },
                    { "key": "accent_color", "label": "Color", "type": "color" },
                    { "key": "neon_glow", "label": "Neon Glow", "type": "toggle" }
                ]
            },
            {
                "id": "card_note_large",
                "label": "Large Card",
                "icon": "RectangleHorizontal",
                "action_type": "create",
                "create_node_type": "item",
                "create_variant": "card_note_large",
                "create_schema": [
                    { "key": "title", "label": "Title", "type": "text", "required": true },
                    { "key": "content", "label": "Content", "type": "textarea" },
                    { "key": "accent_color", "label": "Color", "type": "color" },
                    { "key": "neon_glow", "label": "Neon Glow", "type": "toggle" }
                ]
            }
        ]
    },
    "child_context_menu": {
        "options": [
            { "id": "open", "label": "Open Note", "icon": "ExternalLink", "action_type": "navigate" },
            { "id": "edit", "label": "Edit", "icon": "Pencil", "action_type": "edit", "edit_schema": [
                { "key": "title", "label": "Title", "type": "text", "required": true },
                { "key": "content", "label": "Content", "type": "textarea" },
                { "key": "accent_color", "label": "Color", "type": "color" }
            ]},
            { "id": "resize", "label": "Change Size", "icon": "Scaling", "action_type": "custom", "custom_handler": "toggle_card_size" },
            { "id": "delete", "label": "Delete", "icon": "Trash2", "color": "#ef4444", "divider_before": true, "action_type": "delete" }
        ]
    }
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000030020'::uuid;

-- Update "Categories" tab with folder creation
UPDATE resources
SET meta_data = meta_data || '{
    "header_action": {
        "label": "New Folder",
        "icon": "FolderPlus",
        "options": [
            {
                "id": "create_folder",
                "label": "Create Folder",
                "icon": "FolderPlus",
                "action_type": "create",
                "create_node_type": "container",
                "create_variant": "row_neon_group",
                "create_schema": [
                    { "key": "title", "label": "Folder Name", "type": "text", "required": true },
                    { "key": "description", "label": "Description", "type": "textarea" },
                    { "key": "icon", "label": "Icon", "type": "icon" },
                    { "key": "color", "label": "Color", "type": "color" }
                ]
            }
        ]
    },
    "child_context_menu": {
        "options": [
            { "id": "open", "label": "Open Folder", "icon": "FolderOpen", "action_type": "navigate" },
            { "id": "rename", "label": "Rename", "icon": "Pencil", "action_type": "edit", "edit_schema": [
                { "key": "title", "label": "Folder Name", "type": "text", "required": true },
                { "key": "description", "label": "Description", "type": "textarea" },
                { "key": "color", "label": "Color", "type": "color" }
            ]},
            { "id": "delete", "label": "Delete Folder", "icon": "Trash2", "color": "#ef4444", "divider_before": true, "action_type": "delete" }
        ]
    }
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000030030'::uuid;

-- ============================================================================
-- FINANCE APP: Add header_action and context menus
-- ============================================================================

-- Update "Transactions" tab with header_action for adding transactions
UPDATE resources
SET meta_data = meta_data || '{
    "header_action": {
        "label": "Add",
        "icon": "Plus",
        "options": [
            {
                "id": "expense",
                "label": "Add Expense",
                "icon": "MinusCircle",
                "color": "#ef4444",
                "action_type": "create",
                "create_node_type": "item",
                "create_variant": "row_transaction_history",
                "create_schema": [
                    { "key": "title", "label": "Merchant", "type": "text", "required": true, "placeholder": "e.g., Starbucks" },
                    { "key": "amount", "label": "Amount", "type": "currency", "required": true },
                    { "key": "category", "label": "Category", "type": "select", "options": [
                        { "value": "Food", "label": "Food", "icon": "UtensilsCrossed" },
                        { "value": "Transport", "label": "Transport", "icon": "Car" },
                        { "value": "Shopping", "label": "Shopping", "icon": "ShoppingBag" },
                        { "value": "Entertainment", "label": "Entertainment", "icon": "Tv" },
                        { "value": "Utilities", "label": "Utilities", "icon": "Zap" },
                        { "value": "Health", "label": "Health", "icon": "Heart" },
                        { "value": "Other", "label": "Other", "icon": "MoreHorizontal" }
                    ]},
                    { "key": "date", "label": "Date", "type": "date" },
                    { "key": "description", "label": "Notes", "type": "textarea" }
                ]
            },
            {
                "id": "income",
                "label": "Add Income",
                "icon": "PlusCircle",
                "color": "#10b981",
                "action_type": "create",
                "create_node_type": "item",
                "create_variant": "row_transaction_history",
                "create_schema": [
                    { "key": "title", "label": "Source", "type": "text", "required": true, "placeholder": "e.g., Paycheck" },
                    { "key": "amount", "label": "Amount", "type": "currency", "required": true, "help_text": "Will be recorded as negative (income)" },
                    { "key": "category", "label": "Category", "type": "select", "options": [
                        { "value": "Income", "label": "Salary/Wages", "icon": "Briefcase" },
                        { "value": "Freelance", "label": "Freelance", "icon": "Laptop" },
                        { "value": "Investment", "label": "Investment", "icon": "TrendingUp" },
                        { "value": "Gift", "label": "Gift", "icon": "Gift" },
                        { "value": "Other", "label": "Other", "icon": "MoreHorizontal" }
                    ]},
                    { "key": "date", "label": "Date", "type": "date" }
                ]
            }
        ]
    },
    "child_context_menu": {
        "options": [
            { "id": "edit", "label": "Edit Transaction", "icon": "Pencil", "action_type": "edit", "edit_schema": [
                { "key": "title", "label": "Merchant", "type": "text", "required": true },
                { "key": "amount", "label": "Amount", "type": "currency" },
                { "key": "category", "label": "Category", "type": "select", "options": [
                    { "value": "Food", "label": "Food" },
                    { "value": "Transport", "label": "Transport" },
                    { "value": "Shopping", "label": "Shopping" },
                    { "value": "Entertainment", "label": "Entertainment" },
                    { "value": "Utilities", "label": "Utilities" },
                    { "value": "Health", "label": "Health" },
                    { "value": "Income", "label": "Income" },
                    { "value": "Other", "label": "Other" }
                ]},
                { "key": "description", "label": "Notes", "type": "textarea" }
            ]},
            { "id": "split", "label": "Split Transaction", "icon": "Divide", "action_type": "custom", "custom_handler": "split_transaction" },
            { "id": "delete", "label": "Delete", "icon": "Trash2", "color": "#ef4444", "divider_before": true, "action_type": "delete" }
        ]
    }
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000010050'::uuid;

-- Update "Budget" tab with header_action for adding budget categories
UPDATE resources
SET meta_data = meta_data || '{
    "header_action": {
        "label": "New Budget",
        "icon": "Plus",
        "options": [
            {
                "id": "create_budget",
                "label": "Create Budget",
                "icon": "Target",
                "action_type": "create",
                "create_node_type": "item",
                "create_variant": "card_progress_simple",
                "create_schema": [
                    { "key": "title", "label": "Budget Name", "type": "text", "required": true, "placeholder": "e.g., Dining Out" },
                    { "key": "description", "label": "Description", "type": "textarea" },
                    { "key": "max", "label": "Monthly Limit", "type": "currency", "required": true },
                    { "key": "value", "label": "Current Spent", "type": "currency", "default_value": 0 },
                    { "key": "color", "label": "Color", "type": "color" }
                ]
            }
        ]
    },
    "child_context_menu": {
        "options": [
            { "id": "edit", "label": "Edit Budget", "icon": "Pencil", "action_type": "edit", "edit_schema": [
                { "key": "title", "label": "Budget Name", "type": "text", "required": true },
                { "key": "max", "label": "Monthly Limit", "type": "currency" },
                { "key": "value", "label": "Current Spent", "type": "currency" },
                { "key": "color", "label": "Color", "type": "color" }
            ]},
            { "id": "reset", "label": "Reset to Zero", "icon": "RotateCcw", "action_type": "custom", "custom_handler": "reset_budget" },
            { "id": "delete", "label": "Delete", "icon": "Trash2", "color": "#ef4444", "divider_before": true, "action_type": "delete" }
        ]
    }
}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000010070'::uuid;

-- Disable header action on Dashboard (no direct creation on dashboard)
UPDATE resources
SET meta_data = meta_data || '{"show_header_action": false}'::jsonb
WHERE id = '00000000-0000-0000-0000-000000010001'::uuid;

COMMIT;
