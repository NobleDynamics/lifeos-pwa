# LifeOS: Master Architecture Document (System Bible)

**Version:** 2.0.0  
**Status:** Living Document  
**Last Updated:** December 2025

---

## Table of Contents

1. [Core Philosophy](#1-core-philosophy)
2. [The Data Layer (The Universal Graph)](#2-the-data-layer-the-universal-graph)
3. [The Presentation Layer (The ViewEngine)](#3-the-presentation-layer-the-viewengine)
4. [System Apps (Specifications)](#4-system-apps-specifications)
5. [User Apps & Ecosystem](#5-user-apps--ecosystem)
6. [The AI Layer (The "Brain")](#6-the-ai-layer-the-brain)
7. [Infrastructure & Operations](#7-infrastructure--operations)

---

## 1. Core Philosophy

### 1.1 The "Headless" Operating System

LifeOS is not a standard SaaS app with hardcoded features. It is a **Data-Driven Operating System** architected to decouple three fundamental layers:

| Layer | Metaphor | Responsibility |
|-------|----------|----------------|
| **Data** | The Body | Universal storage via the Resource Graph |
| **Presentation** | The Face | The ViewEngine renders JSON → UI |
| **Logic** | The Brain | AI agents manage, query, and automate |

**Why This Matters:**
- **Extensibility:** New domains (Gardening, Wine Tracking) require zero code changes—just new JSON nodes.
- **AI-First:** The AI doesn't need domain plugins; it discovers schema from the graph itself.
- **Portability:** The same data can power mobile, web, or even voice interfaces.

### 1.2 System vs. User Apps

LifeOS distinguishes between two categories of applications:

| Type | Definition | Examples | Rendering |
|------|------------|----------|-----------|
| **System Apps** | Hardcoded utilities that aggregate data across the entire graph | Dashboard, Agenda, Chat, Settings | Native React panes |
| **User Apps** | Data-driven domains mounted to Context Roots | Household, Finance, Health, Wardrobe | `<ViewEnginePane>` |

**Key Insight:** System Apps are "cross-cutting concerns" (time, communication, overview). User Apps are "vertical domains" (specific data trees).

### 1.3 Design Principles

1. **Headless First:** Data exists independently of how it's displayed.
2. **Convention Over Configuration:** Sensible defaults reduce boilerplate.
3. **Self-Describing:** Metadata tells the AI what fields mean.
4. **Polymorphic:** One table, infinite schemas via JSONB.
5. **Hierarchy via ltree:** O(1) subtree queries without recursive CTEs.

---

## 2. The Data Layer (The Universal Graph)

We rely on a **Self-Describing Graph** rather than domain-specific tables. There is no `recipes` table; there are only Nodes that *look* like recipes.

### 2.1 The Universal Node (`resources` Table)

Every object in the system—Folder, Task, Recipe, File, Stock Item—is a row in the `resources` table.

**Schema:**

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Owner of the resource |
| `household_id` | UUID (nullable) | For shared household resources |
| `parent_id` | UUID (nullable) | Direct parent reference (NULL = root) |
| `path` | ltree | Materialized path for hierarchy queries |
| `type` | ENUM | `folder`, `project`, `task`, `recipe`, `ingredient`, `stock_item`, `workout`, `exercise`, `document`, `event` |
| `title` | VARCHAR(500) | Display name |
| `description` | TEXT | Optional long description |
| `status` | ENUM | `active`, `completed`, `archived` |
| `meta_data` | JSONB | Polymorphic domain-specific fields |
| `is_schedulable` | BOOLEAN | Can appear on the Agenda |
| `scheduled_at` | TIMESTAMP | When it's scheduled |
| `duration_minutes` | INTEGER | Time block duration for Agenda |
| `pointer_table` | TEXT | For Shadow Nodes: `'transactions'`, `'health_logs'` |
| `pointer_id` | UUID | ID in the strict table |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Auto-updated on change |
| `deleted_at` | TIMESTAMP | Soft delete marker |

**ltree Path Format:**
```
root.{uuid_underscored}.{uuid_underscored}...
```
UUIDs have hyphens replaced with underscores (ltree constraint).

**Key ltree Queries:**
```sql
-- Get all descendants
SELECT * FROM resources WHERE path <@ 'root.uuid1_uuid2' AND deleted_at IS NULL;

-- Get ancestors (path to root)
SELECT * FROM resources WHERE path @> 'root.uuid1_uuid2_uuid3' ORDER BY nlevel(path);

-- Get depth
SELECT nlevel(path) - 1 as depth FROM resources WHERE id = 'uuid';
```

### 2.2 Strict Tables & Shadow Nodes

Some data requires relational integrity that JSONB cannot enforce (e.g., financial transactions, time-series health logs). We use **Strict Tables** with a **Shadow Node** pattern.

**The Pattern:**

```
┌─────────────────────┐          ┌─────────────────────┐
│     resources       │          │    transactions     │
├─────────────────────┤          ├─────────────────────┤
│ id: uuid            │◀─────────│ id: uuid            │
│ pointer_table:      │          │ account_id: uuid    │
│   'transactions'    │          │ amount_cents: int   │
│ pointer_id: uuid    │──────────▶│ merchant: text      │
│ meta_data: {...}    │          │ date: date          │
└─────────────────────┘          └─────────────────────┘
```

**When to Use Strict Tables:**
- **Transactions:** Financial ledger requiring referential integrity
- **Health Logs:** Time-series data with date uniqueness constraints
- **Inventory Logs:** Stock change history with audit trail

**Current Strict Tables:**
| Table | Purpose | Shadow Node Type |
|-------|---------|------------------|
| `transactions` | Financial ledger | `transaction` |
| `health_logs` | Daily health metrics | `health_log` |
| `inventory_logs` | Stock changes | `inventory_event` |

### 2.3 The 8 Immutable Relationship Enums

The `resource_links` table connects nodes with **semantic meaning**. We use 8 immutable enums that the AI can reason about:

| Enum | Meaning | Example (Wardrobe) | Example (Recipe) |
|------|---------|-------------------|------------------|
| `HIERARCHY` | Parent/Child (via ltree) | Closet → Shirt | Cookbook → Lasagna |
| `COMPONENT` | Physical composition ("Part of") | Outfit → Shirt | Lasagna → Cheese |
| `DEPENDENCY` | Prerequisite/Blocker ("Must do first") | Wash → Dry | Chop → Cook |
| `TRANSACTIONAL` | Exchange of value | Purchase → Shirt | Purchase → Groceries |
| `SPATIAL` | Physical location ("Is in") | Shirt is_in Hamper | Milk is_in Fridge |
| `TEMPORAL` | Scheduled time | Laundry Day (Event) | Dinner Time (Event) |
| `SOCIAL` | Assignment/Ownership | Shirt assigned_to Dad | Chore assigned_to Kid |
| `REFERENCE` | Loose/informational link | Shirt matches Pants | Recipe see_also Wine |

**Link Schema (`resource_links`):**

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `source_id` | UUID FK | From node |
| `target_id` | UUID FK | To node |
| `link_type` | ENUM | One of the 8 types above |
| `meta_data` | JSONB | Link-specific data (e.g., `{"quantity": 2, "unit": "cups"}`) |

### 2.4 Self-Describing Metadata (`__field_defs`)

To enable AI inference without hallucination, metadata includes **Field Definitions**:

```json
{
  "soiled_status": "dirty",
  "fabric_type": "cotton",
  "__field_defs": {
    "soiled_status": {
      "type": "select",
      "options": ["clean", "dirty", "needs_repair"],
      "description": "Current cleanliness state"
    },
    "fabric_type": {
      "type": "select",
      "options": ["cotton", "silk", "wool", "synthetic"],
      "description": "Material composition"
    }
  }
}
```

**Field Definition Schema:**
```typescript
interface FieldDefinition {
  type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'boolean'
  options?: string[]          // For select/multiselect
  min?: number                // For number
  max?: number                // For number
  description?: string        // Human/AI readable hint
}
```

### 2.5 Context Roots (Virtual Mount Points)

Context Roots are system folders that serve as "mount points" for different application contexts. They enable isolated navigation trees within the unified resource graph.

**Concept:**
- Each User App has a **Context Root** in the database
- Users cannot navigate above their Context Root
- Multiple panes can have isolated views into the same `resources` table

**Namespace Convention:** `{domain}.{feature}`

| Namespace | Display Title | Description |
|-----------|---------------|-------------|
| `household.todos` | "To-Do" | Task management |
| `household.shopping` | "Shopping" | Shopping lists |
| `household.stock` | "Stock" | Inventory tracking |
| `household.recipes` | "Recipes" | Recipe collection |
| `cloud.files` | "Cloud" | File storage |
| `health.workouts` | "Workouts" | Workout routines |
| `finance.budget` | "Budget" | Budget management |

**System Folder Metadata:**
```json
{
  "context": "household.todos",
  "is_system": true,
  "is_system_app": true
}
```

---

## 3. The Presentation Layer (The ViewEngine)

The UI is strictly a **projection** of the Graph. We do not write "Pages"; we write **View Configurations**.

### 3.1 Structural Taxonomy

We use **Structure-over-Intent** naming. Components describe *geometry*, not content.

| Category | Purpose | Naming Convention |
|----------|---------|-------------------|
| **Layouts** | App-level shells with persistent chrome | `layout_*` |
| **Views** | Container components (lists, grids) | `view_*` |
| **Rows** | List item components | `row_*` |
| **Cards** | Grid item components | `card_*` |

### 3.2 The Slot System

To make components reusable, we use a **Config Map** that maps generic slots to domain-specific fields.

**Default Slot Mappings (Convention over Configuration):**

| Slot | Default Source | Description |
|------|----------------|-------------|
| `headline` | `node.title` | Primary text |
| `subtext` | `metadata.description` | Secondary text |
| `accent_color` | `metadata.color` | Theme color |
| `icon_start` | `metadata.icon` | Leading icon |
| `media` | `metadata.imageUrl` | Image URL |
| `status` | `metadata.status` | Status indicator |
| `badge_1`, `badge_2`, `badge_3` | Configurable | Badge content |

**Explicit Config Override:**
```json
{
  "metadata": {
    "__config": {
      "headline": "task_name",
      "badge_1": "priority",
      "badge_2": "due_date"
    },
    "task_name": "Buy Milk",
    "priority": "high",
    "due_date": "2025-12-01"
  }
}
```

### 3.3 Component Catalog

#### Layouts

| Variant | Component | Description |
|---------|-----------|-------------|
| `layout_app_shell` | `LayoutAppShell` | Persistent header + viewport + bottom tab bar |
| `layout_top_tabs` | `LayoutTopTabs` | Segmented control (pills) + active tab content |

**`layout_app_shell` Structure:**
```
┌────────────────────────────────────────────────┐  z-50 (Header)
│  [←] Current Title               [+ New ▼]    │
├────────────────────────────────────────────────┤
│                                                │
│  Viewport Content (changes on navigation)      │
│                                                │
├────────────────────────────────────────────────┤  z-10 (Tab Bar)
│  [Tab 1]   [Tab 2]   [Tab 3]   [Tab 4]         │
└────────────────────────────────────────────────┘
```

#### Views (Containers)

| Variant | Component | Description | Key Slots |
|---------|-----------|-------------|-----------|
| `view_directory` | `ViewDirectory` | Search bar + scrollable list + action button | `search_placeholder`, `show_action_button` |
| `view_list_stack` | `ViewListStack` | Collapsible vertical stack with neon header | `headline`, `subtext`, `accent_color` |
| `view_grid_fixed` | `ViewGridFixed` | Responsive grid container | `headline`, `subtext` |

**`view_directory` Structure:**
```
┌────────────────────────────────────────────────┐
│ [🔍 Search...                    ] [+ New]     │
├────────────────────────────────────────────────┤
│ Child 1                                        │
│ Child 2                                        │
├────────────────────────────────────────────────┤
│ Showing X of Y results                         │
└────────────────────────────────────────────────┘
```

#### Rows (List Items)

| Variant | Component | Description | Key Slots |
|---------|-----------|-------------|-----------|
| `row_detail_check` | `RowDetailCheck` | Checkbox + headline + subtext + badges + avatar | `headline`, `subtext`, `status`, `badge_1`, `badge_2`, `badge_3`, `end_element` |
| `row_neon_group` | `RowNeonGroup` | Neon border + icon + headline + count + chevron | `headline`, `subtext`, `accent_color`, `icon_start`, `count_badge`, `show_chevron` |
| `row_simple` | `RowSimple` | Minimal row with status icon and badges | `headline`, `status`, `badge`, `badge_date` |
| `row_input_stepper` | `RowInputStepper` | Info left + numeric stepper right | `headline`, `subtext`, `value`, `min_threshold`, `max_threshold`, `step`, `unit` |
| `row_input_currency` | `RowInputCurrency` | Checkbox + info + currency input | `headline`, `value`, `currency_symbol`, `status` |

**`row_detail_check` Structure:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [○/●]  |  headline                                   [Avatar]  │
│        |  subtext                                              │
│        |  [badge_1] [badge_2] [badge_3]                        │
└─────────────────────────────────────────────────────────────────┘
```

**`row_neon_group` Structure:**
```
╔════════════════════════════════════════════════════════════════════╗
║ [Icon]  headline                      [count badge] [→] [Avatar]  ║
║         subtext                                                    ║
╚════════════════════════════════════════════════════════════════════╝
  ^ Neon glow border
```

#### Cards (Grid Items)

| Variant | Component | Description | Key Slots |
|---------|-----------|-------------|-----------|
| `card_media_top` | `CardMediaTop` | Image top + content bottom | `headline`, `subtext`, `media`, `accent_color`, `badge_1`, `badge_2`, `badge_3`, `badge_1_icon` |

**`card_media_top` Structure:**
```
┌───────────────────────────────────────┐
│         [media / accent bar]          │
├───────────────────────────────────────┤
│ headline                              │
│ subtext                               │
│ [badge_1] [badge_2] [badge_3]         │
└───────────────────────────────────────┘
```

### 3.4 The Theme Engine

A CSS Variable system that enforces the "Dark Cyberpunk" aesthetic while allowing Accent customization.

#### A. Design Philosophy

The Theme Engine separates **immutable structural styling** from **mutable accent colors**, enabling user personalization without breaking the core aesthetic.

#### B. Immutable Base (Dark Cyberpunk Foundation)

| Variable | Value | Purpose |
|----------|-------|---------|
| `--color-bg` | Deep Black (#0a0a0f) | Primary background |
| `--color-bg-secondary` | Dark Grey (#1a1a2e) | Card backgrounds, elevated surfaces |
| `--color-text` | Off-white (#e5e5e5) | Primary text |
| `--color-text-muted` | Grey (#888888) | Secondary text, hints |
| `--color-border` | Dark border (#2a2a3e) | Default borders |

**Glassmorphism Standard:**
```css
.glass-panel {
  background: rgba(26, 26, 46, 0.8);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### C. Mutable Accents (User-Customizable)

| Variable | Default | Purpose | Usage |
|----------|---------|---------|-------|
| `--color-primary` | Cyan (#00d4ff) | Main neon glow | Borders, active states, Drawer Handle pulse |
| `--color-secondary` | Purple (#a855f7) | Supporting accent | Gradients, hover states, secondary highlights |

**Preset Accent Themes:**

| Theme Name | Primary | Secondary | Description |
|------------|---------|-----------|-------------|
| **Cyber Cyan** (Default) | #00d4ff | #a855f7 | Classic cyberpunk neon |
| **Neon Pink** | #ff0080 | #00d4ff | Hot pink accent |
| **Matrix Green** | #00ff41 | #00d4ff | Terminal aesthetic |
| **Sunset Orange** | #ff6b00 | #ff0080 | Warm neon |

**Settings Location:** `Settings > Appearance > Accent Color`

#### D. Component Rule (Mandatory)

All ViewEngine components **MUST** use semantic utility classes instead of hardcoded colors:

| ❌ Don't | ✅ Do | Purpose |
|----------|-------|---------|
| `border-cyan-500` | `border-primary` | Primary accent border |
| `text-[#00d4ff]` | `text-primary` | Primary accent text |
| `bg-purple-600` | `bg-secondary` | Secondary accent background |
| `shadow-cyan-500/50` | `shadow-primary/50` | Primary glow shadow |

**Neon Glow Pattern:**
```css
/* Standard neon glow for cards/groups */
.neon-glow {
  box-shadow: 
    0 0 10px hsl(var(--primary) / 0.3),
    0 0 20px hsl(var(--primary) / 0.1);
}

/* Pulsing animation for Drawer Handle */
.neon-pulse {
  animation: pulse 2s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 10px hsl(var(--primary) / 0.5); }
  50% { box-shadow: 0 0 20px hsl(var(--primary) / 0.8); }
}
```

#### E. Implementation Notes

**Tailwind Config (`tailwind.config.js`):**
```javascript
theme: {
  extend: {
    colors: {
      primary: 'hsl(var(--primary))',
      secondary: 'hsl(var(--secondary))',
      background: 'hsl(var(--background))',
      foreground: 'hsl(var(--foreground))',
    }
  }
}
```

**Runtime Theme Switching:**
```typescript
// In Settings > Appearance
const setAccentTheme = (theme: AccentTheme) => {
  document.documentElement.style.setProperty('--primary', theme.primary);
  document.documentElement.style.setProperty('--secondary', theme.secondary);
  localStorage.setItem('accent-theme', theme.name);
};
```

**Component Compliance Check:** During code review, any hardcoded color values (`#00d4ff`, `cyan-500`, etc.) in ViewEngine variants should be flagged and replaced with semantic classes.

---

### 3.5 Smart Components (Interactive Rows)

**`row_input_stepper`** - For inventory management:
- Displays headline/subtext with +/- buttons
- Triggers `update_field` behavior on value change
- Uses `min_threshold` for low-stock alerts (red text)
- Optimistic UI with local state for instant feedback

**`row_input_currency`** - For pricing/budgeting:
- Displays checkbox + headline + currency input
- Triggers `update_field` on input blur/enter
- Checkbox triggers `toggle_status` or custom behavior

**Event Handling:**
Both use `onPointerDown` with `stopPropagation()` to prevent parent row handler interference while maintaining input focus.

### 3.6 Persistent Shell Architecture

The ViewEngine uses a "Persistent Shell" pattern where chrome (header, tabs) stays visible while viewport content changes.

**Data Flow:**
```
useAppLauncher() → Merges System Apps + Context Roots
         ↓
App.tsx → Renders <ViewEnginePane context={id} /> for User Apps
         ↓
useContextRoot(context)  →  rootId, rootPath
         ↓
useResourceTree(rootPath)  →  Resource[] (flat)
         ↓
resourcesToNodeTree(resources, rootId)  →  Node (nested tree)
         ↓
<ViewEngine root={nodeTree} />
```

**Navigation Context:**
- `ShellNavigationContext`: `targetNodeId`, `navigateToNode()`, `navigateBack()`
- `ShellActionContext`: Dynamic header action button configuration

**Back Button Handling:**

| Priority | Handler | Action |
|----------|---------|--------|
| 30+ | Modals/Sheets | Close open modal |
| 20 | ViewEnginePane | Navigate up folder hierarchy |
| 10 | Custom handlers | Component-specific |
| 0 | App-level | Drawer → Pane history → Dashboard |

### 3.7 The Behavior System

Nodes can define custom interactions via `metadata.behavior`:

```typescript
interface BehaviorConfig {
  action: 'update_field' | 'toggle_status' | 'move_node' | 'log_event'
  target?: string   // Field to update
  payload?: unknown // Value or data
}
```

**Supported Actions:**

| Action | Description | Payload Example |
|--------|-------------|-----------------|
| `update_field` | Updates a metadata key | `{ target: 'value', payload: 5 }` |
| `toggle_status` | Cycles active → completed → archived | `null` |
| `move_node` | Moves to new parent | `{ parent_id: 'uuid' }` |
| `log_event` | Creates child event node | `{ title: 'Purchased' }` |

### 3.8 Future: Server-Driven UI (SDUI)

We have reserved the `custom_layout` variant for AI-generated dynamic layouts.

**Concept:** The AI writes a recursive JSON "Blueprint" in `meta_data.layout` using atomic primitives (container, text, image, icon, badge, button, spacer, divider, progress, avatar).

**Key Points:**
- No raw HTML—only trusted Atom primitives
- Tailwind-only styling
- Graceful degradation to generic card
- Coexists with standard variants in same list/grid

**Full Specification:** See [`docs/07_Future_Dynamic_Layouts.md`](./07_Future_Dynamic_Layouts.md)

---

## 4. System Apps (Specifications)

System Apps are hardcoded utilities that aggregate data across the entire graph.

### 4.1 Dashboard (Mission Control)

The central HUD for system status, agent transparency, and quick navigation.

#### A. The Weather Module (OpenWeather API)

**Cache-First Strategy:** System fetches 24h forecast periodically to populate the widget (low latency/cost). Tapping triggers a live refresh.

**Agent Awareness:** The Scheduling Agent uses this data layer to avoid scheduling outdoor tasks during rain.

**Data Contract:**
```typescript
interface WeatherData {
  temp: number
  condition: string
  location: string
  icon_code: string
  forecast_24h: {
    time: string
    temp: number
    condition: string
    precipitation_chance: number
  }[]
  cached_at: string
}
```

#### B. The Activity Log (System Pulse)

**Purpose:** Real-time stream of Agent Actions. Acts as the primary **Visual Confirmation** for voice commands (Poly does not speak back).

**The "Silent Voice, Visual Feedback" Loop:**
1. User issues voice command → Voice icon pulses
2. Command sent to LangGraph → New log entry appears (🟢 Green/Active)
3. Agent processes → Log entry updates with status
4. Agent completes → Entry turns 🔵 Cyan (success) or 🔴 Red (failure)
5. User taps entry → Deep link to modified node

**Status Indicators:**

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Active | 🟢 Green | Spinner | Task sent to LangGraph, processing |
| Completed | 🔵 Cyan | Check | Task finished successfully |
| Failed | 🔴 Red | X | Task encountered an error |

**Log Entry Schema:**
```typescript
interface ActivityLogEntry {
  id: string
  timestamp: string
  action: string           // "Processing 'Buy Milk'..."
  status: 'active' | 'completed' | 'failed'
  node_id?: string         // For deep linking
  error_message?: string   // If failed
}
```

**Interaction:** Tapping an entry performs a **Deep Link** to the modified node (opens relevant User App and navigates to the node).

#### C. The Dynamic Widget Area

**Function:** A configurable canvas for User App visuals.

**Configuration:** Users pin specific cards (Charts, Progress Bars) from their User Apps via Appearance Settings.

**Layout:** Utilizes `view_carousel_snap` or `view_dashboard_masonry` to display mixed content types.

**Widget Types:**

| Widget | Source | Example |
|--------|--------|---------|
| Progress Ring | Health App | Daily step count |
| Bar Chart | Finance App | Weekly spending |
| Stat Card | Any App | Custom KPI |
| Quick List | Any App | Pinned tasks/items |

**Widget Pinning Flow:**
1. User opens any User App
2. Long-press on a card/chart
3. Context menu: "Pin to Dashboard"
4. Widget appears in Dynamic Widget Area
5. Drag to reorder, swipe to remove

#### D. Quick Launch

**Location:** Fixed rows above the App Drawer handle.

**Function:** User-pinned shortcuts for high-frequency System or User Apps.

**Configuration:**
```typescript
interface QuickLaunchItem {
  id: string
  app_id: string           // System or User App ID
  icon: string             // Lucide icon name
  label: string            // Short display name
  position: number         // Sort order
}
```

**Limits:**
- Maximum 4 shortcuts per row
- Maximum 2 rows (8 total shortcuts)
- System Apps and User Apps both supported

### 4.2 Agenda (The Time Broker)

The Agenda unifies external obligations (Nylas) with internal goals (User Apps) into a single, conflict-resolved timeline.

#### A. The Three Data Streams

| Stream | Source | Mutability | Example |
|--------|--------|------------|---------|
| **Hard Events** | Nylas Sync (Google/Outlook) | Immutable by Agent | Work meetings, doctor appointments |
| **Soft Events** | User Apps (internal) | Flexible based on constraints | Workouts, Meal prep, Chores |
| **Routine Cycles** | Generators that spawn instances | Template-based | "Morning Routine" → "Brush Teeth" daily |

**Key Insight:** Hard events create immovable blocks. Soft events slide around them. Routine cycles auto-generate instances.

#### B. Elastic Scheduling Logic

To handle real life, we use **Constraint-Based Scheduling** stored in `meta_data`:

| Constraint | Purpose | Example |
|------------|---------|---------|
| `ideal_time` | The anchor preference | `"18:00"` for Dinner |
| `flexibility_window` | Allowed slide range | `±60m` for Dinner, `±2d` for Chores |
| `deadline_type` | Scheduling rigidity | `'hard'`, `'soft'`, `'floating'` |

**Deadline Types:**

| Type | Behavior | Example |
|------|----------|---------|
| `hard` | Fixed time, cannot move | Doctor appointment at 2pm |
| `soft` | Slidable within `flexibility_window` | Workout (±2 hours) |
| `floating` | Anywhere within scope (day/week) | "Do laundry this week" |

**Conflict Resolution:** The Agent resolves conflicts by moving `soft` events within their windows to accommodate `hard` events. If no valid arrangement exists, it escalates to the user.

```json
{
  "is_schedulable": true,
  "scheduled_at": "2025-12-15T18:00:00Z",
  "duration_minutes": 45,
  "ideal_time": "18:00",
  "flexibility_window": "±60m",
  "deadline_type": "soft"
}
```

#### C. Visibility Tiers

To prevent calendar clutter, schedulable nodes use a `visibility_tier`:

| Tier | Name | Description | Default Visibility |
|------|------|-------------|-------------------|
| **1** | Primary | Work, Social, Critical Commitments | Always visible |
| **2** | Secondary | Workouts, Chores, Errands | Toggleable |
| **3** | Background | Hygiene, Travel Time, Prep Time | Hidden by default |

**UI Implementation:**
- Tier toggle in Agenda header
- Tier 3 events render as subtle/faded blocks
- Filter presets: "Focus Mode" (Tier 1 only), "Full Day" (All tiers)

#### D. The Task Pool

**Concept:** A holding area for items with `is_schedulable: true` but `scheduled_at: null`.

| State | `is_schedulable` | `scheduled_at` | Location |
|-------|------------------|----------------|----------|
| Unschedulable | `false` | `null` | Not in Agenda system |
| Pooled | `true` | `null` | Task Pool (unassigned) |
| Scheduled | `true` | `<timestamp>` | Calendar slot |

**Workflow:**
1. User creates task "Wear Outfit #4" with `is_schedulable: true`
2. Task appears in Task Pool (no time assigned)
3. User (or Agent) runs "Schedule Day" action
4. Agent assigns `scheduled_at` based on constraints
5. Task moves from Pool to Calendar slot

**Pool UI:** Kanban-style board or list view with drag-to-calendar functionality.

#### E. Location Awareness

**PWA Implementation:**
- Browser Geolocation API for current position
- Manual location tagging on events

**Native Implementation (Future):**
- Background Geofencing triggers context switches
- Example: Arrive at Gym → Show Workout Routine

**Travel Injection:**

| Step | Action |
|------|--------|
| 1 | Agent detects geo-separated consecutive events |
| 2 | Calls Google Maps API for travel time |
| 3 | Inserts "Travel" block (Tier 3) between events |
| 4 | Adjusts soft events if travel causes conflict |

**Location Metadata:**
```json
{
  "location": {
    "name": "Downtown Gym",
    "address": "123 Main St",
    "coordinates": { "lat": 39.7392, "lng": -104.9903 },
    "geofence_radius_m": 100
  }
}
```

#### F. Intervention Protocols (Exception Handling)

**State Overrides:**

User-triggered modes that bulk-modify the schedule:

| Mode | Trigger | Agent Actions |
|------|---------|---------------|
| Sick Mode | "I'm sick" | Reschedule Tier 2 events, push soft deadlines |
| Focus Mode | "Deep work" | Block new notifications, hide Tier 2/3 |
| Vacation Mode | Date range set | Auto-decline meetings, pause routines |
| Emergency Mode | "Family emergency" | Clear non-critical events, notify contacts |

**Conflict Negotiation:**

When constraints cannot be automatically resolved:

| Condition | Agent Behavior |
|-----------|----------------|
| Routine overdue 3x | Initiate Chat Session: "Skip or Reschedule?" |
| Hard event overlap | Alert user, suggest alternatives |
| Flexibility exhausted | Escalate with options: "Move X or Y?" |
| Deadline breach risk | Proactive warning 24h before |

**Negotiation Flow:**
```
1. Agent detects unresolvable conflict
2. Agent initiates Chat message with context
3. User selects preference (Skip/Reschedule/Override)
4. Agent executes choice and logs decision
5. Agent learns preference for similar future conflicts
```

#### G. Agenda Tabs Summary

| Tab | Description | Data Source |
|-----|-------------|-------------|
| **Schedule** | "Now" stream with real-time timeline | `scheduled_at IS NOT NULL` ordered by time |
| **Calendar** | Month/Week/Day views with time blocking | Same, rendered in calendar grid |
| **Tasks** | Task Pool + master aggregator with smart filters | `is_schedulable = true` |
| **Routines** | Routine templates and cycle management | `type = 'routine'` generators |

### 4.3 The Communication Hub

A unified interface for human-to-human and human-to-AI interaction, emphasizing "Knowledge Persistence" over "Chat History."

#### A. The Chat Engine (Stream + ViewEngine)

**Infrastructure:** GetStream.io for messaging.

**Native Card Rendering:** Poly can reply with **ViewEngine Components** instead of text.
- *Example:* Poly sends a `budget_summary` node → Chat UI renders a `card_stat_hero`.
- *Interaction:* Clicking a card performs a **Context Switch** to the relevant User App (e.g., opening the Finance App), rather than just viewing a static image.

**Key Features:**
- Voice input with waveform visualization
- File/photo ingestion
- AI response streaming
- Hybrid text + card messages

#### B. Poly (The OS Interface)

**Role:** The AI Bridge (LangGraph).

**The "Knowledge Router":** An intelligent output filter that decides how to persist complex information.

| Output Type | Condition | Behavior | Example |
|-------------|-----------|----------|---------|
| **Ephemeral** | Simple, transient answers | Sent as **Text** in chat | "What is the weather?" → "72°F and sunny" |
| **Persistent** | Complex, referenceable answers | Creates a **Document Node** in `user.docs` | "How do I use this feature?" → Note Card link |

**The Persistence Flow:**
```
1. User asks complex question
2. Poly generates detailed response
3. Poly creates Document Node in user.docs app
4. Poly replies with a Note Card linking to that document
5. Chat stays clean; knowledge base grows automatically
```

**Benefits:**
- Keeps chat history clean and scannable
- Builds the user's personal knowledge base automatically
- Complex answers are searchable and editable
- Prevents "conversation archaeology" for finding old answers

#### C. The Email Engine (Nylas + AI Worker)

**Client:** Full Inbox/Compose UI via Nylas API.

| Component | Purpose | Integration |
|-----------|---------|-------------|
| **Inbox View** | Unified email from all providers | Nylas Sync (Google, Outlook, IMAP) |
| **Compose UI** | Rich text editor with attachments | Nylas Send API |
| **Thread View** | Conversation threading | Nylas Thread API |

**The Ingest Worker:** Semantic sorting based on Natural Language rules.

| Rule Example | Action |
|--------------|--------|
| "File bills in Finance > Receipts" | Auto-create Document Node with email content |
| "Flag emails from boss" | Apply priority metadata |
| "Archive newsletters after reading" | Move to archive after open |

**The Active Agent:**

| Capability | Description |
|------------|-------------|
| **Proxy Sending** | User commands Poly → Agent drafts/sends via Nylas |
| **Summarization** | On-demand summarization of threads into Bullet Point Nodes |
| **Follow-up Tracking** | Agent monitors for expected replies, nudges user |
| **Meeting Extraction** | Detects scheduling intent, creates calendar events |

**Example Workflow:**
```
User: "Send John an email asking about the project deadline"
↓
Poly drafts email using context from John's contact card
↓
Shows draft preview in chat for approval
↓
User approves → Nylas sends email
↓
Agent tracks thread for reply
```

#### D. The Contact Graph (Hybrid Identity)

The Contact Graph maintains two tiers of identity:

| Tier | Type | Description | Capabilities |
|------|------|-------------|--------------|
| **Internal** | Collaborators | Linked LifeOS users | App Sharing, Real-time sync, Presence |
| **External** | Contacts | VCard data (name, phone, email) | Native intents, AI context |

**Collaborators (Internal):**
- Linked LifeOS users via friend/connection system
- Enables shared User Apps (e.g., Household members)
- Real-time presence and activity visibility
- Direct LifeOS-to-LifeOS messaging

**External Contacts:**
- Standard VCard data import (Google Contacts, iCloud, etc.)
- Actions trigger native device intents:
  - `tel:` → Phone dialer
  - `sms:` → SMS composer
  - `mailto:` → Email client (or internal Nylas compose)

**Contact Metadata:**
```json
{
  "type": "collaborator" | "external",
  "vcard": {
    "name": "John Smith",
    "email": "john@example.com",
    "phone": "+1-555-123-4567",
    "organization": "Acme Corp",
    "role": "Project Manager"
  },
  "lifeos_user_id": "uuid" | null,
  "relationship": ["friend", "coworker", "family"],
  "ai_context": "John prefers morning meetings. Works on Project X."
}
```

**Contact Actions:**
- Tap phone → Opens `tel:+1-555-123-4567`
- Tap SMS → Opens `sms:+1-555-123-4567`
- Tap email → Opens Nylas compose (internal) or `mailto:` (external)
- Tap message → Opens LifeOS chat (if collaborator)

### 4.4 The Feed (Social & Signal Engine)

A unified content stream powered by GetStream.io, treating User Posts, AI Creations, and RSS News as compatible "Activities."

#### A. The "Unified Stream" Architecture

**Feed Groups:**

| Group | Purpose | Population |
|-------|---------|------------|
| `timeline` | Standard chronological feed | People/topics the user follows |
| `discovery` | Algorithmic "For You" feed | GetStream ML (Personalization) |
| `topic` | Public channels | Users subscribe to topics (e.g., `#Science`) |
| `rss` | External news feeds | RSS Ingest Worker pushes articles |

**Navigation:** Uses `layout_top_tabs` to allow users to switch between "For You", "Following", and Pinned Feeds (e.g., `#Tech`).

**Activity Schema:**
```typescript
interface FeedActivity {
  id: string
  actor: string              // User ID or "system:rss"
  verb: 'post' | 'share' | 'like' | 'comment'
  object: string             // Node ID or URL
  time: string               // ISO 8601
  foreign_id?: string        // For deduplication
  metadata: {
    content_type: 'text' | 'node_card' | 'article'
    title?: string
    body?: string
    media_url?: string
    source_node_id?: string  // For AI-generated or shared content
    rss_source?: string      // For RSS articles
  }
}
```

#### B. The AI Publisher (Poly as Creative Director)

**The "Share" Pipeline:**

| Step | Description |
|------|-------------|
| 1. Input | User long-presses a data node (e.g., "Workout Map") → Selects "Share" |
| 2. Process | LangGraph extracts the visual data, generates an engaging caption |
| 3. Output | Creates a Stream Activity referencing the original Node |

**Share Flow:**
```
User: Long-press "Morning Run" workout
         ↓
Context Menu: "Share to Feed"
         ↓
Poly: Extracts route map, stats (5.2mi, 42min)
         ↓
Poly: Generates caption: "Crushed a sunrise 5K! 🏃‍♂️ Perfect way to start the day."
         ↓
Preview Modal: Shows card preview + caption (editable)
         ↓
User: Approves → Activity pushed to GetStream
         ↓
Followers: See card with map + stats + caption in their timeline
```

**The "Ghostwriter" Workflow:**

| Step | Description |
|------|-------------|
| 1. Input | "Write a post about X" (voice or chat) |
| 2. Process | Poly creates a **Draft Note** in the user's storage (`user.drafts` context) |
| 3. Review | User edits the draft in the Note editor |
| 4. Publish | User clicks "Publish" to push the note to the live stream |

**Ghostwriter Flow:**
```
User: "Write a post about my garden progress"
         ↓
Poly: Queries garden app for recent activity
         ↓
Poly: Creates Draft Note with:
      - Title: "Garden Update: Week 12"
      - Body: Generated content with stats/photos
      - Status: draft
         ↓
Poly: "I've drafted a post about your garden. Review it in Drafts."
         ↓
User: Opens Drafts → Edits → Clicks "Publish"
         ↓
System: Converts Note to Activity → Pushes to GetStream
```

**AI Publisher Tools:**

| Tool | Purpose | Parameters |
|------|---------|------------|
| `generate_share_content(node_id)` | Create shareable caption for a node | `node_id`, `tone` |
| `create_draft_post(content)` | Save draft to user.drafts | `title`, `body`, `attachments` |
| `publish_draft(draft_id)` | Convert draft to live Activity | `draft_id`, `visibility` |

#### C. The RSS Engine

**The Ingest Worker:**

A background service that fetches XML from subscribed URLs and **pushes** them into GetStream as Activities. This allows users to comment on and share News Articles just like social posts.

**Ingest Flow:**
```
1. Cron job triggers every 15 minutes
2. For each user with RSS subscriptions:
   a. Fetch XML from each subscribed URL
   b. Parse articles (title, link, description, pubDate)
   c. Deduplicate against existing Activities (foreign_id)
   d. Create Activity for each new article
   e. Push to user's `rss` feed group
3. User sees articles in their RSS tab
4. User can Like, Comment, or Share articles to their timeline
```

**RSS Activity Structure:**
```typescript
interface RSSActivity extends FeedActivity {
  actor: 'system:rss'
  verb: 'publish'
  metadata: {
    content_type: 'article'
    title: string
    body: string              // Truncated description
    media_url?: string        // Article image
    rss_source: string        // Source name (e.g., "TechCrunch")
    article_url: string       // Original article link
    published_at: string      // Original publish date
  }
}
```

**Directory & Search:**

| Component | Purpose | Implementation |
|-----------|---------|----------------|
| **Database Table** | `feed_sources` stores valid RSS URLs | Schema below |
| **AI Discovery** | LangGraph tool `find_rss_feeds(topic)` | Searches web for RSS feeds |
| **Subscription UI** | Browse/search available feeds | ViewEngine list with subscribe toggle |

**`feed_sources` Table Schema:**
```sql
CREATE TABLE feed_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,           -- 'tech', 'science', 'news', etc.
  favicon_url TEXT,
  last_fetched_at TIMESTAMPTZ,
  fetch_error TEXT,        -- Last error if any
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE user_feed_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feed_source_id UUID REFERENCES feed_sources(id) ON DELETE CASCADE,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feed_source_id)
);
```

**AI Discovery Flow:**
```
User: "Follow news about hydroponics"
         ↓
Poly: Calls find_rss_feeds("hydroponics")
         ↓
Tool: Searches web, finds 3 relevant feeds:
      - HydroponicFarmer.com/feed
      - GardenTech/hydroponics.rss
      - Reddit.com/r/hydroponics.rss
         ↓
Poly: "I found 3 feeds about hydroponics. Subscribe to all?"
         ↓
User: "Yes"
         ↓
Poly: Creates subscriptions → Articles appear in RSS tab
```

#### D. Topic Channels

**Public Topics:**

Users can follow public topic channels (e.g., `#Science`, `#Fitness`, `#Cooking`). Topics aggregate posts from all users who tag their content.

**Topic Schema:**
```typescript
interface TopicChannel {
  id: string               // e.g., "topic:science"
  name: string             // "Science"
  description: string
  follower_count: number
  post_count: number
  trending_score: number   // For discovery ranking
}
```

**Tagging Flow:**
```
User: Creates post with hashtags #Science #SpaceX
         ↓
System: Extracts tags → Associates Activity with topic feeds
         ↓
Anyone following #Science: Sees post in their topic tab
```

**Topic Discovery:**
- Trending topics shown in Discovery tab
- AI can suggest relevant topics based on user's apps
- Search for topics in Feed settings

#### E. Feed UI Structure

**Tab Layout (`layout_top_tabs`):**

| Tab | Feed Group | Description |
|-----|------------|-------------|
| **For You** | `discovery` | ML-powered personalized feed |
| **Following** | `timeline` | Chronological from followed users |
| **[Pinned]** | `topic:X` or `rss` | User-pinned topics/RSS feeds |

**Tab Configuration:**
```typescript
interface FeedTabConfig {
  tabs: {
    id: string
    label: string
    feed_group: string
    pinned?: boolean
  }[]
  max_pinned: 3  // Maximum pinned tabs
}
```

**Activity Card Variants:**

| Content Type | Variant | Description |
|--------------|---------|-------------|
| Text Post | `card_feed_text` | Simple text with author avatar |
| Node Card | `card_feed_node` | Rich card with node preview + metadata |
| Article | `card_feed_article` | Title + image + source favicon |
| Shared | `card_feed_shared` | Reshare wrapper around original |

**Interaction Actions:**

| Action | Icon | Behavior |
|--------|------|----------|
| Like | ❤️ | Toggle like, update count |
| Comment | 💬 | Open comment thread |
| Share | 🔄 | Reshare to own timeline |
| Bookmark | 🔖 | Save to personal collection |
| More | ⋯ | Report, Mute, Block options |

#### F. GetStream Integration

**SDK:** `stream-feed` React SDK

**Feed Setup:**
```typescript
// Initialize client
const client = connect(API_KEY, userToken, APP_ID);

// Subscribe to feeds
const timeline = client.feed('timeline', userId);
const discovery = client.feed('discovery', userId);
const topic = client.feed('topic', 'science');

// Add activity
await timeline.addActivity({
  actor: userId,
  verb: 'post',
  object: `node:${nodeId}`,
  metadata: { content_type: 'node_card', ... }
});

// Follow user
await timeline.follow('user', targetUserId);

// Follow topic
await timeline.follow('topic', 'science');
```

**Realtime Updates:**
```typescript
// Subscribe to realtime
timeline.subscribe((data) => {
  // New activity received
  addToFeed(data.new);
}).then(() => console.log('Subscribed'));
```

### 4.5 Settings (The Configuration Hub)

The centralized control panel for identity, personalization, billing, and data governance.

#### A. The Entity Model (Context Switching)

**Concept:** Replaces "Households." An Entity is the root scope for User Apps and Data.

| Property | Description |
|----------|-------------|
| **Entity** | The primary context container (e.g., "Home", "Work", "Side Business") |
| **Active Entity** | The currently selected scope—all queries and UI reflect this context |
| **Associates** | Generic sub-identities attached to an Entity (Kids, Pets, Assets, Vehicles) |

**Context Switching:**
- Changing the Active Entity triggers a **Global Context Refresh**
- All User Apps, Dashboard widgets, and Agenda items filter to the new Entity
- System Apps (Chat, Settings) remain cross-entity

**Entity Metadata:**
```json
{
  "type": "entity",
  "title": "Home",
  "icon": "Home",
  "members": ["user_id_1", "user_id_2"],
  "associates": [
    { "type": "kid", "name": "Emma", "avatar": "icon:Baby:pink" },
    { "type": "pet", "name": "Max", "avatar": "icon:Dog:amber" },
    { "type": "asset", "name": "Honda Civic", "avatar": "icon:Car:blue" }
  ]
}
```

**Associate Types:**

| Type | Icon | Use Case |
|------|------|----------|
| `kid` | Baby | Dependents without login |
| `pet` | Dog/Cat | Pet profiles |
| `asset` | Car/Home | Major possessions requiring tracking |
| `custom` | User-defined | Extensible sub-identity |

#### B. Appearance & Personalization

**Theme Engine Configuration:**

Allows user customization of the Accent Color while preserving the immutable Dark Cyberpunk foundation.

| Setting | Description | Implementation |
|---------|-------------|----------------|
| **Accent Color** | Selector for Global Accent | Updates `--color-primary` CSS variable |
| **Preset Themes** | Quick-select color schemes | Dropdown with preview swatches |

**Accent Presets:**

| Preset Name | Primary Color | Secondary Color |
|-------------|---------------|-----------------|
| **Cyber Cyan** (Default) | `#00d4ff` | `#a855f7` |
| **Neon Pink** | `#ff0080` | `#00d4ff` |
| **Matrix Green** | `#00ff41` | `#00d4ff` |
| **Sunset Orange** | `#ff6b00` | `#ff0080` |

**Dashboard Configuration:**

| Feature | Description |
|---------|-------------|
| **Quick Launch Editor** | Drag-and-drop interface to pin apps to the bottom rows (max 8 shortcuts) |
| **Widget Canvas** | Interface to select which User App Cards appear in the Dashboard Carousel |
| **Widget Pinning** | Long-press any card in a User App → "Pin to Dashboard" context action |

**Quick Launch Configuration:**
```typescript
interface QuickLaunchConfig {
  items: QuickLaunchItem[]  // Max 8 items (2 rows × 4 columns)
  editable: boolean         // Toggle edit mode for drag-and-drop
}

interface QuickLaunchItem {
  id: string
  app_id: string           // System or User App ID
  icon: string             // Lucide icon name
  label: string            // Short display name
  position: number         // 0-7 (sort order)
}
```

**Widget Canvas Configuration:**
```typescript
interface WidgetCanvasConfig {
  widgets: PinnedWidget[]
  layout: 'carousel' | 'masonry'
}

interface PinnedWidget {
  id: string
  source_app: string       // User App ID
  source_node: string      // Node ID of the widget source
  widget_type: 'chart' | 'progress' | 'stat' | 'list'
  position: number         // Sort order in carousel
}
```

#### C. Account & Identity

| Section | Description |
|---------|-------------|
| **Profile** | Email, Display Name, Avatar (via AvatarPicker) |
| **Password** | Change password (for email/password auth) |
| **Auth Providers** | Linked accounts (Google, Apple, etc.) |
| **Subscription** | Current SaaS tier and upgrade options |

**Profile Schema:**
```json
{
  "display_name": "John Doe",
  "email": "john@example.com",
  "avatar": "https://...", // or "icon:User:cyan"
  "auth_providers": ["google", "email"],
  "subscription_tier": "pro",
  "subscription_expires": "2026-01-15"
}
```

#### D. Billing & Usage Ledger

The Credit System allows users to purchase credits which are debited by API usage.

**Tab 1: Summary View**

Aggregated costs by Category with hierarchical drill-down.

| Column | Description |
|--------|-------------|
| **Category** | Top-level: AI, Storage, Communication |
| **Subcategory** | Expandable: AI → GPT-4, Claude, Replicate |
| **Credits Used** | Total credits consumed |
| **Percentage** | Share of total usage |

**Summary Structure:**
```
▼ AI                          1,250 credits  (62%)
   ├─ GPT-4o                    800 credits  (40%)
   ├─ Claude 3.5                350 credits  (17%)
   └─ Replicate (Images)        100 credits  (5%)
▼ Storage                       500 credits  (25%)
   ├─ Document Storage          300 credits  (15%)
   └─ Media Storage             200 credits  (10%)
▼ Communication                 250 credits  (13%)
   ├─ Email (Nylas)             150 credits  (8%)
   └─ SMS Notifications         100 credits  (5%)
────────────────────────────────────────────────
Total                         2,000 credits  (100%)
```

**Filters:**
- Month/Year selector
- Date range picker
- Category filter

**Tab 2: Detailed Transactions**

A chronological audit log of every billable event.

| Column | Description |
|--------|-------------|
| **Timestamp** | ISO 8601 datetime |
| **Description** | Human-readable event description |
| **Category** | AI / Storage / Communication |
| **Credits** | Amount debited (negative) or credited (positive) |
| **Balance** | Running balance after transaction |

**Transaction Log Example:**

| Timestamp | Description | Category | Credits | Balance |
|-----------|-------------|----------|---------|---------|
| 2025-12-03 10:15:22 | Generated image for "Outfit #4" | AI/Replicate | -15 | 1,985 |
| 2025-12-03 09:45:11 | Chat completion (847 tokens) | AI/GPT-4o | -3 | 2,000 |
| 2025-12-03 08:30:00 | Daily storage calculation | Storage | -5 | 2,003 |
| 2025-12-02 14:22:45 | Sent email via Nylas | Communication | -2 | 2,008 |
| 2025-12-01 00:00:00 | Monthly credit allocation | System | +500 | 2,010 |

**Transaction Schema:**
```typescript
interface BillingTransaction {
  id: string
  timestamp: string          // ISO 8601
  description: string        // Human-readable
  category: 'ai' | 'storage' | 'communication' | 'system'
  subcategory: string        // 'gpt-4o', 'replicate', 'nylas', etc.
  credits: number            // Negative for debit, positive for credit
  balance_after: number      // Running balance
  metadata?: {
    tokens_in?: number       // For LLM calls
    tokens_out?: number
    model?: string
    node_id?: string         // Related resource
  }
}
```

**Credit Purchase:**
- "Buy Credits" button in Summary View header
- Stripe integration for payment processing
- Credit packages: 1,000 / 5,000 / 10,000 credits

#### E. Privacy & Security

| Feature | Description |
|---------|-------------|
| **Access Logs** | Audit trail showing when the AI Agent accessed specific private nodes |
| **Data Export** | Export entire Graph as JSON (GDPR compliance) |
| **Entity Purge** | Delete all data associated with a specific Entity |
| **Account Deletion** | Full account removal with confirmation flow |

**Access Log Schema:**
```typescript
interface AccessLogEntry {
  id: string
  timestamp: string
  agent_action: string       // 'read' | 'write' | 'delete'
  node_id: string            // Resource accessed
  node_title: string         // For display
  context: string            // Why the access occurred
  user_initiated: boolean    // True if user explicitly requested
}
```

**Access Log Example:**

| Timestamp | Action | Node | Context |
|-----------|--------|------|---------|
| 2025-12-03 10:15:22 | Read | "Bank Statement Dec" | User asked "summarize my finances" |
| 2025-12-03 09:30:00 | Write | "Grocery List" | User said "add milk to shopping" |
| 2025-12-02 14:00:00 | Read | "Health Log" | Scheduled daily summary generation |

**Data Governance Controls:**

| Action | Scope | Confirmation |
|--------|-------|--------------|
| **Export Graph** | All data for current Entity | Single click |
| **Purge Entity** | All data for selected Entity | Type entity name to confirm |
| **Delete Account** | Entire user account + all Entities | Email verification + type "DELETE" |

### 4.6 The App Drawer (Navigation Hub)

The App Drawer is the primary navigation surface for switching between Apps. It uses physics-based interactions with precise "Sticky Stop" behavior.

#### A. The Dual-Stage Drawer UI

The Drawer has **two stable positions** with distinct purposes:

| Stage | Height | Trigger | Purpose |
|-------|--------|---------|---------|
| **Closed** | 0% | Default / Swipe down past 5% | Hidden, only Handle visible |
| **Sticky Stop** | 20% | Release between 5%-25% | Notification Triage |
| **Full Open** | 100% | Swipe past 25% | Full App Grid |

**The Handle:**
- Always visible at bottom of screen (z-50)
- Pulsing neon glow matches User's **Accent Color** (`--color-primary`)
- Animation: `neon-pulse` keyframes (see Theme Engine)
- Visual indicator: Horizontal bar (40px wide, 4px tall, rounded)

**The "Sticky Stop" (20%):**

| Property | Value |
|----------|-------|
| **Physics** | Dragging past 5% and releasing snaps the drawer to exactly 20% height |
| **Purpose** | Notification Triage - quick access without full context switch |
| **Content** | Unread notifications, pending agent actions, quick alerts |
| **Actions** | |
| → "Silence" button | Stops the Handle pulse animation |
| → Tap notification | Performs deep link to relevant node/app |
| → Swipe notification | Dismisses (mark as read) |

**The Full Open (100%):**

| Property | Value |
|----------|-------|
| **Physics** | Dragging past 25% snaps to full screen |
| **Purpose** | Complete App Grid for navigation |
| **Content** | System Apps + User Apps in grid layout |
| **Layout** | `view_grid_fixed` with `card_app_icon` variants |

#### B. Physics Implementation

```typescript
interface DrawerPhysics {
  // Snap thresholds (percentage of screen height)
  CLOSE_THRESHOLD: 0.05,    // Below 5% → snap to closed
  STICKY_THRESHOLD: 0.25,   // Between 5-25% → snap to 20%
  FULL_THRESHOLD: 0.25,     // Above 25% → snap to 100%
  
  // Stable positions
  CLOSED_HEIGHT: 0,
  STICKY_HEIGHT: 0.20,      // 20% of screen
  FULL_HEIGHT: 1.0,         // 100% of screen
  
  // Animation
  SPRING_CONFIG: { tension: 300, friction: 30 }
}
```

**Snap Logic:**
```typescript
const getSnapPosition = (releaseHeight: number): number => {
  if (releaseHeight < CLOSE_THRESHOLD) return CLOSED_HEIGHT;
  if (releaseHeight < STICKY_THRESHOLD) return STICKY_HEIGHT;
  return FULL_HEIGHT;
};
```

#### C. Notification Triage (Sticky Stop Content)

**Purpose:** Handle interruptions without losing context in current app.

**Notification Types:**

| Type | Icon | Source | Action |
|------|------|--------|--------|
| Agent Complete | ✓ | Activity Log | Deep link to modified node |
| Agent Error | ✗ | Activity Log | Open Chat with error context |
| Calendar Alert | 📅 | Agenda | Open event detail |
| Message | 💬 | Chat | Open conversation |
| System | ⚙️ | System | Contextual |

**Silence Behavior:**
- Tapping "Silence" (🔕 icon) stops the Handle's pulse animation
- Pulse resumes when new unread notifications arrive
- User preference: "Auto-silence after X seconds" in Settings

#### D. App Grid (Full Open Content)

**Layout:** Responsive grid using `view_grid_fixed`

| Screen Width | Columns |
|--------------|---------|
| < 400px | 4 |
| 400-600px | 5 |
| > 600px | 6 |

**App Card (`card_app_icon`):**
```
┌─────────────┐
│    [Icon]   │  ← 48x48, accent color
│             │
│  App Name   │  ← 12px, truncate
└─────────────┘
```

**Ordering:** System Apps → User Apps → Settings → Sandbox (dev only)

#### E. Gesture Conflicts

| Context | Drawer Gesture | App Gesture | Resolution |
|---------|----------------|-------------|------------|
| At scroll top | Swipe down | Pull to refresh | Drawer takes priority |
| Mid-scroll | Swipe down | Continue scroll | App takes priority |
| Handle area | Tap/Drag | N/A | Drawer exclusive zone |

**Implementation:** Touch target for Handle is 44px tall (accessibility minimum). Gestures starting outside this zone follow app scroll behavior.

---

### 4.7 The Template Library (App Store)

A marketplace and P2P engine for sharing User App configurations.

#### A. The Storefront UI

**Interface:** A pinned System App utilizing `view_grid_masonry` to display available Templates.

**Discovery Features:**

| Feature | Description |
|---------|-------------|
| **Categories** | Health, Finance, Household, Productivity, Creative, etc. |
| **Search** | Full-text search across template titles and descriptions |
| **Featured Lists** | Curated collections ("Staff Picks", "Trending", "New") |

**Economics:** All templates are **Free** and **Open Source**.

**Grid Card (`card_template_preview`):**
```
┌─────────────────────────────────────────┐
│         [Preview Image/Icon]            │
├─────────────────────────────────────────┤
│ Template Name                           │
│ by Creator Name                         │
│ ★ 4.8 (127 installs)                    │
│ [Health] [Tracking]                     │
└─────────────────────────────────────────┘
```

#### B. Universal Documentation (Auto-Scribe)

**Creation-Time Logic:** Documentation is generated *when the app is built*, not when it is shared.

**The Metadata:** Every User App Root Node automatically contains:

| Field | Purpose | Example |
|-------|---------|---------|
| `marketing_description` | Punchy summary for Store card | "Track your wardrobe, plan outfits, and never rewear before washing." |
| `technical_readme` | User manual explaining inputs and smart components | "## Getting Started\n\n1. Add clothing items...\n2. Create outfits..." |

**Auto-Scribe Schema:**
```json
{
  "meta_data": {
    "is_system_app": true,
    "marketing_description": "Track your wardrobe, plan outfits, and never rewear before washing.",
    "technical_readme": "## Wardrobe App\n\n### Features\n- Clothing inventory\n- Outfit planning\n- Laundry tracking\n\n### How to Use\n1. Add items via the + button\n2. Set fabric type and color\n3. Log wear events to track cleanliness",
    "template_category": "lifestyle",
    "template_tags": ["wardrobe", "clothing", "organization"]
  }
}
```

**Benefit:** Every app is "Share-Ready" by default. No additional documentation step required before publishing.

#### C. The "Owner-Only" Publishing Rule

**Problem Statement:** Without restrictions, users could flood the public library with duplicates or spam.

**Solution:** Tiered sharing with ownership verification.

| Action | Who Can Do It | Mechanism |
|--------|---------------|-----------|
| **Public Publishing** | Original Creator only | `user_id === original_creator_id` check |
| **P2P Sharing** | Any user with app | Direct share to Collaborator (Friend) |
| **Viral Chain** | Recipients of P2P shares | Can re-share P2P, cannot publish publicly |

**The Viral Chain Example:**
```
1. User A creates "Meal Planner" app
2. User A publishes to Template Library ✓ (original creator)
3. User B installs from Library
4. User B shares with User C (P2P) ✓
5. User C shares with User D (P2P) ✓
6. User B tries to publish to Library ✗ (not original creator)
7. User C tries to publish to Library ✗ (not original creator)
```

**Ownership Tracking:**
```json
{
  "meta_data": {
    "original_creator_id": "uuid-of-creator",
    "installed_from": "template:uuid" | "p2p:sender_uuid" | null,
    "installed_at": "2025-12-03T10:00:00Z"
  }
}
```

**P2P Share Flow:**
```
User A: Long-press User App → "Share with Friend"
         ↓
Modal: Select from Collaborators list
         ↓
System: Creates share record, sends notification to User B
         ↓
User B: Receives notification → "Install Meal Planner from User A?"
         ↓
User B: Accepts → Template cloned to User B's Entity
```

#### D. Installation & Hydration

**Process:** When a user clicks "Install," the system clones the Template JSON tree.

**Installation Flow:**
```
1. User clicks "Install" on Template card
2. System fetches template JSON (root node + all descendants)
3. Re-ID Strategy: All UUIDs regenerated
4. New Context Root created in user's Entity
5. Paths recalculated with new UUIDs
6. Metadata preserved (except ownership fields updated)
7. App appears in user's App Drawer
8. ReadMe Note pinned to app root
```

**Re-ID Strategy:**

| Original | Regenerated | Purpose |
|----------|-------------|---------|
| `id` | `gen_random_uuid()` | Unique instance |
| `parent_id` | Mapped to new parent UUID | Preserve hierarchy |
| `path` | Recalculated with new UUIDs | ltree integrity |
| `user_id` | Installing user's ID | Ownership transfer |

**UUID Mapping Table (In-Memory During Install):**
```typescript
interface InstallMapping {
  originalId: string
  newId: string
}

// Build mapping first, then apply
const mapping = new Map<string, string>();
templateNodes.forEach(node => {
  mapping.set(node.id, generateUUID());
});

// Clone with remapped references
templateNodes.map(node => ({
  ...node,
  id: mapping.get(node.id),
  parent_id: node.parent_id ? mapping.get(node.parent_id) : null,
  user_id: installingUserId,
  path: recalculatePath(node.path, mapping)
}));
```

**Onboarding ReadMe:**

The auto-generated `technical_readme` Note is pinned to the app root to guide new users.

| Field | Value |
|-------|-------|
| `type` | `document` |
| `title` | "📖 Getting Started" |
| `parent_id` | App root ID |
| `meta_data.content` | Copied from `technical_readme` |
| `meta_data.pinned` | `true` |
| `meta_data.readonly` | `true` (prevent accidental edits) |

**Post-Install State:**
```
New User App (Context Root)
├── 📖 Getting Started (pinned, readonly)
├── [Template Structure...]
│   ├── Folder A
│   │   └── Item 1
│   └── Folder B
│       └── Item 2
└── ...
```

---

### 4.8 Sandbox (Dev Tool)

**Purpose:** ViewEngine testing and variant development.

**Access:** Swipe right past Settings.

**Features:**
- JSON editor with real-time Zod validation
- Preview toggle between edit and render modes
- Error display inline

---

## 5. User Apps & Ecosystem

### 5.1 Definition

User Apps are **data-driven domains** built purely from JSON nodes. They are mounted to Context Roots and rendered via `<ViewEnginePane>`.

**Examples:**
- Household (To-Do, Shopping, Stock, Recipes)
- Health (Nutrition, Exercise, Brain, Hygiene)
- Finance (Budget, Accounts, Analytics)
- Custom: Wardrobe, Gardening, Wine Collection

### 5.2 App Launcher

The `useAppLauncher()` hook merges System Apps with User Apps discovered from Context Roots:

```typescript
// System Apps (hardcoded)
const systemApps = [
  { id: 'dashboard', title: 'Dashboard', icon: 'LayoutDashboard', pane: 'dashboard' },
  { id: 'agenda', title: 'Agenda', icon: 'Calendar', pane: 'agenda' },
  { id: 'chat', title: 'Chat', icon: 'MessageSquare', pane: 'chat' },
  // ...
]

// User Apps (from database)
const userApps = resources
  .filter(r => r.meta_data?.is_system_app === true)
  .map(r => ({
    id: r.id,
    title: r.title,
    icon: r.meta_data.icon || 'Folder',
    pane: 'viewengine',
    context: r.id
  }))

// Final ordering: System → User → Settings → Sandbox
```

### 5.3 App Template Library

**Concept:** An "App Store" for LifeOS where users can:
- Share JSON tree definitions
- Install templates into their graph
- Customize installed templates

**Monetization Potential:**
- Free community templates
- Premium curated templates
- Creator revenue sharing

**Full Specification:** See [§4.7 The Template Library](#47-the-template-library-app-store)

### 5.4 Custom Microsites (Future)

**Concept:** Specialized AI tools embedded in the PWA.

**Example: Shopping Assistant**
- Dedicated interface for product research
- AI-powered comparison and recommendations
- Direct integration with shopping lists

*Spec Pending*

---

## 6. The AI Layer (The "Brain")

The LangGraph Agent acts as the "Ghost in the Shell." It does not rely on hardcoded plugins; it relies on **Graph Discovery**.

### 6.1 LangGraph Orchestrator

**Responsibilities:**
- Schema discovery from Context Roots
- Tool execution and result handling
- Multi-step reasoning and planning
- Error recovery and user clarification

**Core Pattern:**
```
User Intent → Graph Query → Schema Analysis → Tool Selection → Execution → Response
```

### 6.2 AI Toolset

The AI interacts with the system via generic graph tools:

| Tool | Purpose | Parameters |
|------|---------|------------|
| `explore_context(root_id)` | Returns schema/structure of a User App | `root_id: UUID` |
| `query_nodes(filter_logic)` | Finds nodes based on metadata | `type`, `status`, `metadata filters` |
| `manage_relationship(source, target, type)` | Links/unlinks items | `source_id`, `target_id`, `link_type` |
| `crud_node(action, data)` | Create/Read/Update/Delete | `action`, `node_data` |
| `agenda_aggregate(date_range)` | Query schedulable items | `start`, `end`, `filters` |

### 6.3 Schema Discovery

The AI learns how to manage a domain by scanning the Root Node:

```
1. User installs "Wardrobe" app
2. AI calls explore_context(wardrobe_root_id)
3. Finds nodes with `soiled_status` (clean/dirty)
4. Reads __field_defs to understand valid values
5. Inference: "This domain tracks item cleanliness"
```

### 6.4 Memory (Zep)

**Purpose:** Long-term context storage for personalized AI interactions.

**Capabilities:**
- Conversation history
- User preference learning
- Entity extraction and classification
- Temporal context awareness

*Integration Spec Pending*

### 6.5 Inference Stack (Future)

| Service | Purpose |
|---------|---------|
| **Perplexity/Tavily** | Real-time web search |
| **Replicate** | Image generation and vision |
| **Parallel** | Web scraping and data extraction |
| **OpenAI/Anthropic** | Core language model |

*Integration Specs Pending*

### 6.6 Automation (Future)

**Concept:** Cron jobs for self-triggering agents.

**Use Cases:**
- Daily health summary generation
- Weekly budget alerts
- Inventory restock reminders
- Routine execution

*Spec Pending*

---

## 7. Infrastructure & Operations

### 7.1 The Edge Gateway (Cloudflare Workers)
The primary API entry point and AI Inference node.
* **Role:** Authentication (JWT), Routing, and Edge AI.
* **Read-Through Cache:**
    * Checks Upstash Redis for cached View JSON.
    * If miss: Queries Supabase (via Hyperdrive) → Compiles View → Caches → Returns.
* **Edge AI:** Runs `@cf/openai/whisper` locally for ultra-low latency Voice-to-Text transcription.

### 7.2 Input Pipelines (Sensors & Storage)
* **Storage (Cloudflare R2):**
    * **Pattern:** Signed URLs. The Frontend uploads binary data *directly* to R2 (bypassing the API) for performance.
    * **The "Smart Ingest" Loop:**
        1.  **Upload:** Client pushes file to R2.
        2.  **Trigger:** Client (or R2 Event) notifies the Python Backend.
        3.  **Enrichment:** LangGraph analyzes the file (Vision API), extracts metadata (e.g., "This is a Receipt"), and creates a corresponding **Node** in the Graph.
* **The Voice Loop:**
    * **Capture:** Mic Button records audio blob.
    * **Transcribe:** POST to Worker → Whisper Model → Text.
    * **Action:** Text sent to LangGraph for intent execution.

### 7.3 The Backend (Python Service)
* **Stack:** Python (FastAPI) + LangGraph.
* **Role:** The "Brain." Handles long-running reasoning, web scraping (Parallel), and tool execution.
* **Security:** Accessed *only* via the Cloudflare Worker (Private VPC or Secret Key).

### 7.4 Native Wrapper (Capacitor)
* **Strategy:** **Online-First.** The app relies on a connection to the Cloudflare Gateway for intelligence.
* **Container:** Wraps the PWA into native binaries (iOS/Android).
* **Bridging:**
    * **Background Geolocation:** Feeds the Agenda Engine.
    * **Push Notifications:** FCM/APNS via Supabase Edge/Workers.

### 7.5 Billing & Usage
* **Ledger:** Strict Table in Supabase recording every chargeable event (AI Token, Storage GB, Transcribed Minute).

---

## Appendix A: Quick Reference

### Node Types
```typescript
type NodeType = 'space' | 'container' | 'collection' | 'item'
```

### Resource Types
```typescript
type ResourceType = 'folder' | 'project' | 'task' | 'recipe' | 'ingredient' |
                    'stock_item' | 'workout' | 'exercise' | 'document' | 'event'
```

### Status Types
```typescript
type ResourceStatus = 'active' | 'completed' | 'archived'
```

### Link Types (8 Immutable Enums)
```typescript
type LinkType = 'HIERARCHY' | 'COMPONENT' | 'DEPENDENCY' | 'TRANSACTIONAL' |
                'SPATIAL' | 'TEMPORAL' | 'SOCIAL' | 'REFERENCE'
```

### ViewEngine Variants
```typescript
// Layouts
'layout_app_shell' | 'layout_top_tabs'

// Views
'view_directory' | 'view_list_stack' | 'view_grid_fixed'

// Rows
'row_detail_check' | 'row_neon_group' | 'row_simple' |
'row_input_stepper' | 'row_input_currency'

// Cards
'card_media_top'
```

---

## Appendix B: File References

| Document | Purpose |
|----------|---------|
| `docs/01_Frontend_PWA.md` | Frontend architecture details |
| `docs/02_Backend_Schema.md` | Database schema reference |
| `docs/03_ViewEngine_Sandbox.md` | ViewEngine development guide |
| `docs/07_Future_Dynamic_Layouts.md` | SDUI specification |

| SQL Migration | Purpose |
|---------------|---------|
| `08_resource_graph.sql` | Resources table |
| `09_context_roots.sql` | Context root system |
| `10_identity.sql` | Profiles + auth trigger |
| `11_households.sql` | Household members |
| `12_connections.sql` | Social connections |
| `13_seed_viewengine.sql` | ViewEngine seed data |
| `14_ai_readiness.sql` | AI readiness schema updates |

---

## Appendix C: Glossary

| Term | Definition |
|------|------------|
| **Context Root** | A system folder that serves as the mount point for a User App |
| **Shadow Node** | A resource that points to data in a strict table via `pointer_table`/`pointer_id` |
| **Shadow User** | A profile for dependents (kids/pets) without auth credentials |
| **Slot** | A generic property name in a ViewEngine component that maps to metadata fields |
| **Strict Table** | A traditional SQL table with enforced schema (vs. polymorphic JSONB) |
| **User App** | A data-driven application rendered via ViewEnginePane |
| **System App** | A hardcoded utility pane (Dashboard, Agenda, Chat, etc.) |
| **Variant** | A string identifier that maps a Node to a specific React component |

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 2.5.0 | December 2025 | Replaced Infrastructure section (§7): Edge Gateway, Input Pipelines (Sensors/Storage), Python Backend, Native Wrapper (Capacitor), Billing Ledger |
| 2.4.0 | December 2025 | Added Template Library spec (§4.7): Storefront UI, Auto-Scribe documentation, Owner-Only publishing, Installation & Hydration |
| 2.3.0 | December 2025 | Added Feed spec (§4.4): Unified Stream, AI Publisher, RSS Engine, GetStream integration |
| 2.2.0 | December 2025 | Expanded Settings spec (§4.5): Entity Model, Appearance, Billing Ledger, Privacy |
| 2.1.0 | December 2025 | Added Theme Engine (§3.4) and App Drawer Physics (§4.6) |
| 2.0.0 | December 2025 | Complete rewrite as System Bible with 7 major sections |
| 1.0.0 | November 2025 | Initial architecture document |

---

**Document End**

*This is a living document. Update it whenever architectural decisions are made or implementations change.*
