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

4. Schema: Tasks, Agenda & Polymorphism

4.0 To-Do Module (Hierarchical Task Organization) [IMPLEMENTED]
Purpose: Provides a 3-level hierarchy for organizing tasks: Categories → Lists → Items.
Status: ✅ DONE (Tables created, UI implemented in Household Pane)

Table: todo_categories
Purpose: Top-level folders for organizing task lists.
Columns:
id (UUID, PK, default uuid_generate_v4())
user_id (FK to Auth0 User)
household_id (FK to households, Nullable)
name (Text, NOT NULL)
description (Text, Nullable)
color (Text, default '#00EAFF')
is_shared (Boolean, default false)
created_at (Timestamp, default now())
updated_at (Timestamp, default now())
created_by (UUID)
deleted_at (Timestamp, Nullable) - Soft delete

Table: todo_lists
Purpose: Task lists within a category (e.g., "Weekly Groceries", "Home Projects").
Columns:
id (UUID, PK, default uuid_generate_v4())
user_id (FK to Auth0 User)
household_id (FK to households, Nullable)
category_id (FK to todo_categories)
name (Text, NOT NULL)
description (Text, Nullable)
due_date (Timestamp, Nullable)
location_name (Text, Nullable)
location_coordinates (JSONB, Nullable) - {lat, lng}
is_shared (Boolean, default false)
created_at (Timestamp, default now())
updated_at (Timestamp, default now())
created_by (UUID)
deleted_at (Timestamp, Nullable) - Soft delete

Table: todo_items
Purpose: Individual task items within a list.
Columns:
id (UUID, PK, default uuid_generate_v4())
user_id (FK to Auth0 User)
household_id (FK to households, Nullable)
list_id (FK to todo_lists)
name (Text, NOT NULL)
description (Text, Nullable)
status (Enum: 'not_started', 'started', 'in_progress', 'completed')
due_date (Timestamp, Nullable)
location_name (Text, Nullable)
location_coordinates (JSONB, Nullable)
is_shared (Boolean, default false)
started_at (Timestamp, Nullable)
completed_at (Timestamp, Nullable)
completed_by (UUID, Nullable)
created_at (Timestamp, default now())
updated_at (Timestamp, default now())
created_by (UUID)
deleted_at (Timestamp, Nullable) - Soft delete

RLS Policies:
- All tables have RLS enabled
- Users can only access their own rows OR shared household rows

---

4.1 The Unified Task Table
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
