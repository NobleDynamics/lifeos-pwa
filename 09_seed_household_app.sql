-- 09_seed_household_app.sql
-- Ensures the Household app exists as a dynamic Context Root

INSERT INTO resources (id, type, title, meta_data)
VALUES (
  '00000000-0000-0000-0000-000000000001', -- Fixed ID for Household App
  'folder', -- Changed from 'space' to 'folder' to match DB enum
  'Household',
  '{
    "variant": "layout_app_shell",
    "context": "household.todos",
    "is_system_app": false,
    "icon": "icon:Home:#a855f7",
    "action_label": "Add Item",
    "search_enabled": true,
    "default_tab_id": "00000000-0000-0000-0000-000000000002"
  }'
)
ON CONFLICT (id) DO UPDATE SET
  meta_data = EXCLUDED.meta_data,
  type = EXCLUDED.type;

-- Ensure a child exists for the default tab (To-Do)
INSERT INTO resources (id, type, title, meta_data, parent_id)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'folder', -- Changed from 'container' (if it was that) to 'folder' just in case, though 'container' isn't a DB type either.
  'To-Do',
  '{
    "variant": "view_directory",
    "icon": "CheckSquare",
    "placeholder": "Search tasks...",
    "create_options": [
      { "label": "Folder", "type": "folder" },
      { "label": "Task", "type": "task" }
    ]
  }',
  '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (id) DO UPDATE SET
  meta_data = EXCLUDED.meta_data,
  type = EXCLUDED.type;
