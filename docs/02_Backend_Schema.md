Technical Specification: LifeOS Backend Core
Role: Backend Architecture Stack: Supabase (PostgreSQL), Redis (Upstash), Auth0 Status: Final Specification (Post-Gap Analysis)
Goals
Unified Data Truth: Supabase acts as the relational backbone for all LifeOS domains.
Short-Term Memory: Redis handles high-velocity state (Agent "Thinking" status), caching (Weather/Dashboards), and job queues.
Polymorphic Design: Events, Tasks, and Logs are designed to interact flexibly across different "Panes" (e.g., a "Recipe" can be a "Calendar Event").

1. System Configuration & Caching
1.1 System Config (Secrets & Global Vars)
Table: system_config
Purpose: Stores API keys and global settings that are not user-specific (or system-wide defaults).
Columns:
key (PK, String): e.g., weather_provider, default_lat, default_long.
value (String): e.g., openweathermap, 51.5074, -0.1278.
is_secret (Boolean): If true, value is encrypted at rest.
service_api_key (Encrypted Text): Specifically for the OpenWeatherMap or LLM provider keys.
1.2 Redis Cache Structure (Upstash)
Weather Cache:
Key: weather:{lat}:{long}
TTL: 15 minutes
Value: JSON object { temp, condition, location_name, icon_code }.
Dashboard Snapshots:
Key: user:{id}:snapshot:dashboard
TTL: Persists until invalidated by a data mutation.
Value: Compliant DashboardSnapshot JSON (as defined in Frontend Spec).

2. Schema: Health & Biology
2.1 Dependents (Shadow Profiles)
Table: dependents
Columns:
id (UUID, PK)
user_id (FK to Auth0 User)
name (Text)
birth_date (Date)
profile_photo_r2_key (Text)
Purpose: Allows logging meals/activities for children without full accounts.
2.2 Daily Health Logs (Quantified Self)
Table: daily_health_logs
Purpose: Consolidated history for all scalar health metrics to enable trending over time.
Columns:
id (UUID, PK)
user_id (FK)
date (Date)
metric_type (Enum): 'sleep_hours', 'sleep_score', 'water_ml', 'steps', 'active_calories', 'resting_heart_rate', 'unique_contacts_interacted'.
value (Numeric): The raw value.
source (Text): e.g., "manual", "apple_health", "ouraring".
2.3 Nutrition (Meals)
Table: meals
Columns:
id (UUID, PK)
user_id (FK)
dependent_id (FK, Nullable)
name (Text)
calories (Int)
macros_json (JSONB): { protein, carbs, fat }
micronutrients_json (JSONB): Stores Iron, Vit C, etc.
eaten_at (Timestamp)
2.4 Workouts & Muscle Map
Table: workouts
Columns:
id (UUID, PK)
type (Enum: cardio, strength, mobility)
smart_tags (Array: ["HIIT", "Biking"])
muscle_split_json (JSONB): e.g., {"quads": 0.8, "glutes": 0.2}.
Table: completed_workouts
Columns:
id (UUID, PK)
user_id (FK)
workout_id (FK)
duration_minutes (Int)
volume_load (Int): Calculated as Sets * Reps * Weight.
completed_at (Timestamp)
2.5 Brain Logs (Cognitive & Sentiment)
Table: brain_logs
Columns:
id (UUID, PK)
user_id (FK)
category (Enum: learning, social, game)
metric_name (Enum): 'reaction_time_ms', 'memory_grid_score', 'pomodoro_minutes', 'messages_sent', 'mood_score'.
value (Numeric)
sentiment_score (Float: -1.0 to 1.0)
created_at (Timestamp)

3. Schema: Household & Inventory
3.1 Household Structure
Table: households
Columns: id, name, created_at.
Table: household_members
Columns: household_id, user_id, role (admin/member).
3.2 Vendors (Normalization)
Table: vendors
Purpose: Master list of stores to prevent "Costco" vs "costco" duplication.
Columns:
id (UUID, PK)
name (Text): e.g., "Costco", "Safeway".
logo_url (Text, Nullable).
default_category (Text): e.g., "Grocery", "Hardware".
3.3 Inventory & Shopping
Table: pantry_items
Columns:
id (UUID, PK)
household_id (FK)
name (Text)
qty_in_stock (Numeric)
qty_min (Numeric)
expiry_date (Date, Nullable)
storage_location (Enum: pantry, fridge, freezer)
Table: shopping_items
Columns:
id (UUID, PK)
household_id (FK)
pantry_item_id (FK, Nullable)
vendor_id (FK to vendors table)
name (Text): Fallback if no pantry item linked.
is_purchased (Boolean)
need_by_date (Date)
3.4 Recipes
Table: recipes
Columns:
id (UUID, PK)
owner_id (FK)
name (Text)
instructions_text (Text)
prep_time_minutes (Int)
cook_time_minutes (Int)
image_r2_key (Text)
ingredients_json (JSONB): [{ item: "Milk", qty: 1, unit: "cup" }]

4. Schema: Universal Resource Graph

4.0 Resource Graph Architecture [IMPLEMENTED]
Purpose: Universal hierarchical data structure that replaces the rigid todo_categories/lists/items with an infinitely nestable, polymorphic graph.
Status: ✅ DONE (Migration: `08_resource_graph.sql`)

**Key Features:**
- **Infinite Nesting:** Any resource can contain any other resource
- **Polymorphic Types:** folder, project, task, recipe, workout, document, etc.
- **Lateral Linking:** Resources can be linked without hierarchy (e.g., ingredients in a recipe)
- **ltree Paths:** PostgreSQL ltree extension enables efficient subtree queries

**Migration Notes:**
- Old tables renamed to `legacy_todo_categories`, `legacy_todo_lists`, `legacy_todo_items`
- Data migrated to `resources` table preserving IDs and relationships
- Frontend uses `useLegacyTodoAdapter()` hook for backward compatibility

---

### 4.0.1 Master Resources Table [IMPLEMENTED]

Table: resources
Purpose: Single table for ALL hierarchical data - folders, projects, tasks, recipes, workouts, etc.
Migration SQL: `08_resource_graph.sql`

Columns:
- id (UUID, PK, default uuid_generate_v4())
- user_id (UUID, NOT NULL) - Owner of the resource
- household_id (UUID FK, Nullable) - For shared household resources
- parent_id (UUID Self-FK, Nullable) - NULL = root level
- path (ltree, NOT NULL) - Materialized path for efficient hierarchy queries
  - Format: `root.{uuid_underscored}.{uuid_underscored}...`
  - Example: `root.a1b2c3d4_e5f6_7890_abcd_ef1234567890`
- type (Enum resource_type): 'folder', 'project', 'task', 'recipe', 'ingredient', 'stock_item', 'workout', 'exercise', 'document', 'event'
- title (VARCHAR 500, NOT NULL)
- description (TEXT, Nullable)
- status (Enum resource_status): 'active', 'completed', 'archived'
- meta_data (JSONB, default '{}') - Polymorphic fields based on type:
  - Folder: `{"color": "#00EAFF", "icon": "folder"}`
  - Recipe: `{"prep_time": 30, "cook_time": 45, "servings": 4}`
  - Task: `{"priority": "high", "legacy_status": "in_progress"}`
  - Workout: `{"muscle_groups": ["chest"], "difficulty": "intermediate"}`
- is_schedulable (Boolean, default false)
- scheduled_at (Timestamp, Nullable)
- created_at (Timestamp, default now())
- updated_at (Timestamp, default now()) - Auto-updated via trigger
- deleted_at (Timestamp, Nullable) - Soft delete
- created_by (UUID, Nullable)

Indexes:
- GIST index on `path` for ltree queries (CRITICAL for performance)
- B-tree on `parent_id`, `user_id`, `type`, `status`, `scheduled_at`

Key ltree Queries:
```sql
-- Get all children of a resource (direct only)
SELECT * FROM resources WHERE parent_id = 'uuid' AND deleted_at IS NULL;

-- Get entire subtree (all descendants)
SELECT * FROM resources WHERE path <@ 'root.uuid1_uuid2' AND deleted_at IS NULL;

-- Get ancestors (path to root)
SELECT * FROM resources WHERE path @> 'root.uuid1_uuid2_uuid3' ORDER BY nlevel(path);

-- Get depth of a resource
SELECT nlevel(path) - 1 as depth FROM resources WHERE id = 'uuid';
```

---

### 4.0.2 Resource Links Table (Lateral Relationships) [IMPLEMENTED]

Table: resource_links
Purpose: Non-hierarchical relationships between resources (e.g., recipe ingredients, task dependencies).

Columns:
- id (UUID, PK, default uuid_generate_v4())
- source_id (UUID FK to resources, NOT NULL)
- target_id (UUID FK to resources, NOT NULL)
- link_type (Enum link_type): 'ingredient_of', 'related_to', 'blocks', 'dependency_of', 'duplicate_of', 'child_of', 'references'
- meta_data (JSONB, default '{}') - Link-specific data:
  - ingredient_of: `{"quantity": 2, "unit": "cups"}`
  - blocks: `{"reason": "Waiting for approval"}`
- created_at (Timestamp, default now())

Constraints:
- UNIQUE(source_id, target_id, link_type) - Prevent duplicate links
- CHECK(source_id != target_id) - Prevent self-links

---

### 4.0.3 Log Tables (Strict Temporal Data) [IMPLEMENTED]

Table: health_logs
Purpose: Time-series data for health metrics linked to resources.
Columns:
- id (UUID, PK)
- resource_id (UUID FK, Nullable) - Optional link to a resource
- user_id (UUID, NOT NULL)
- date (DATE, NOT NULL)
- value (NUMERIC, NOT NULL)
- metric_unit (VARCHAR 50) - 'kg', 'lbs', 'hours', 'ml'
- notes (TEXT, Nullable)
- created_at (Timestamp)
Constraint: UNIQUE(resource_id, user_id, date)

Table: inventory_logs
Purpose: Stock change history for inventory resources.
Columns:
- id (UUID, PK)
- resource_id (UUID FK, Nullable)
- household_id (UUID FK)
- date (DATE, default CURRENT_DATE)
- qty_change (NUMERIC) - Positive = add, Negative = remove
- reason (VARCHAR 100) - 'purchase', 'consumed', 'expired', 'adjustment'
- meta_data (JSONB)
- created_at (Timestamp)

---

### 4.0.4 Legacy Tables [DEPRECATED - DATA PRESERVED]

The following tables have been renamed and preserved for rollback safety:
- `legacy_todo_categories` (was `todo_categories`)
- `legacy_todo_lists` (was `todo_lists`)
- `legacy_todo_items` (was `todo_items`)

**Do NOT use these tables for new features.** They exist only for emergency rollback.

---

### 4.0.5 Frontend Hook Reference

**New Hooks (src/hooks/useResourceData.ts):**
- `useResources(parentId)` - Get direct children of a resource
- `useResourceTree(rootPath)` - Get entire subtree using ltree
- `useResource(id)` - Get single resource
- `useResourcesByType(type)` - Get all resources of a type
- `useCreateResource()` - Create new resource
- `useUpdateResource()` - Update resource
- `useDeleteResource()` - Soft delete
- `useMoveResource()` - Move to new parent
- `useLinkResources()` / `useUnlinkResources()` - Manage lateral links

**Legacy Adapter (for existing UI):**
- `useLegacyTodoAdapter()` - Maps resources to old TodoCategory/TodoList/TodoItem types
- `useLegacyLists(categoryId)` - Get lists for a category
- `useLegacyItems(listId)` - Get items for a list

---

### 4.0.6 RLS Policies

All resource tables have RLS enabled with the following policies:
- Users can view/edit their own resources
- Users can view shared household resources
- Links are accessible if user owns source or target resource

Dev bypass policies are in `04_dev_rls_bypass.sql` for test users.

---

4.1 The Unified Task Table [FUTURE - Use resources table instead]
Table: tasks
Purpose: Single source of truth for all "To-Dos", whether personal, household chores, or Agent sub-steps.
Columns:
id (UUID, PK)
user_id (FK): The creator or assignee.
household_id (FK, Nullable): If present, visible to the whole house.
scope (Enum): 'personal', 'household'.
parent_task_id (FK, Nullable): Self-reference for sub-tasks/checklists.
title (Text)
description (Text, Nullable)
status (Enum):
'pending' (Backlog/To-Do)
'scheduled' (Has a specific time slot)
'running' (Agent is actively working on it)
'needing-input' (Agent blocked, waiting for user)
'completed' (Done)
'failed' (Agent could not complete)
category (Enum): 'chore', 'errand', 'project', 'work', 'health'.
priority (Enum): 'low', 'medium', 'high', 'critical'.
due_date (Timestamp, Nullable)
location_geo (Point, Nullable)
location_name (Text, Nullable)
4.2 Polymorphic Events (Calendar)
Table: calendar_events
Columns:
id (UUID, PK)
user_id (FK)
title (Text)
start_time (Timestamp)
end_time (Timestamp)
is_blocking (Boolean)
status (Enum): 'scheduled', 'completed', 'skipped'.
linked_resource_type (Enum): 'recipe', 'workout', 'chore', 'transaction', 'none'.
linked_resource_id (UUID, Nullable): Polymorphic ID.
Logic: When status moves to completed, a trigger/worker processes the linked resource (e.g., deducts inventory for a recipe).
4.3 Routines (The Engine)
Table: routines
Columns:
id (UUID, PK)
user_id (FK)
name (Text)
cron_expression (Text)
activities_json (JSONB): Template to generate rows in the tasks table.

5. Schema: Cloud & Content
5.1 File System
Table: files
Columns:
id (UUID, PK)
folder_path (Text): e.g., "/Photos/Chat/Alice"
file_name (Text)
r2_key (Text)
mime_type (Text)
ai_tags (Array of Text): ["dog", "beach"]
ai_description (Text)
embedding (Vector): 1536d vector for semantic search.
5.2 Documents (Knowledge Base)
Table: documents
Columns:
id (UUID, PK)
user_id (FK)
title (Text)
content_text (Markdown)
tags (Array of Text): Manual user-facing tags (e.g., ["Reference", "Receipts"]).
is_ai_generated (Boolean)
key_entities (Array): AI-extracted entities.
search_vector (tsvector): Postgres Full-Text Search.
5.3 Ingestion Pipelines
Table: inbound_emails
Purpose: Temporary holding area for raw emails (invoices, alerts) before Agent processing.
Columns:
id (UUID, PK)
sender (Text)
subject (Text)
body_text (Text)
raw_payload (JSONB): Full headers/metadata.
is_processed (Boolean): False upon arrival.

6. Schema: Finance & Logic
6.1 Accounts
Table: accounts
Columns:
id (UUID, PK)
user_id (FK)
name (Text)
institution (Text)
balance_cents (Int): Current live balance.
currency (Text): Default 'USD'.
6.2 Account History (Net Worth)
Table: account_balance_history
Purpose: Nightly snapshot of account balances to visualize Net Worth over time.
Columns:
id (UUID, PK)
account_id (FK)
date (Date)
balance_cents (Int)
6.3 Transactions (The Ledger)
Table: transactions
Columns:
id (UUID, PK)
account_id (FK)
date (Date)
merchant_name (Text)
amount_cents (Int): Negative = Spend, Positive = Income.
receipt_file_id (FK to files table, Nullable)
source_email_id (FK to inbound_emails table, Nullable)
6.4 Splits (Budgeting)
Table: transaction_splits
Columns:
transaction_id (FK)
category_id (FK to budget_categories)
amount_cents (Int)

7. Schema: Social, Settings, & Tokens
7.1 Contacts (CRM)
Table: contacts
Columns:
id (UUID, PK)
user_id (FK)
name (Text)
matrix_id (Text)
mastodon_handle (Text)
details_json (JSONB)
7.2 User Settings & Secrets
Table: user_settings
Columns:
user_id (FK, PK)
accent_color_hex (Text)
current_token_balance (Int): Cached total of the Token Ledger.
matrix_access_token (Encrypted Text): For Hydrogen Client auth.
matrix_device_id (Encrypted Text)
matrix_homeserver_url (Text)
agent_preferences_json (JSONB): {"ask_floss": false}.
7.3 Token Ledger (Billing)
Table: token_ledger
Columns:
id (UUID, PK)
user_id (FK)
amount (Int): +/- change.
category (Enum: llm_chat, image_gen, storage, purchase).
description (Text)
created_at (Timestamp)
Trigger: On Insert, update user_settings.current_token_balance.
