# ViewEngine Development Guide

## Overview

The ViewEngine is a **data-driven rendering system** that transforms JSON Node trees into React UI. This document explains the architecture and how to develop new variants using the Sandbox testing pane.

---

## Quick Start: Sandbox Testing Workflow

### Accessing the Sandbox
1. Open the app
2. Go to **Settings** pane
3. Tap **"Pane Order"** → **"Reset to Default"**
4. Swipe right past Settings → **Sandbox** appears

### Three Modes
| Mode | Purpose |
|------|---------|
| **Edit** | JSON textarea with real-time Zod validation |
| **Preview** | Live ViewEngine render of current JSON |
| **Gallery** | Browse all registered variants with mock data |

### Development Cycle
```
1. Check Gallery mode for existing variants
2. If building new: Edit JSON in Editor mode
3. Click "Preview" to see ViewEngine render it
4. Identify needed variant features
5. Create/modify variant component in src/engine/components/variants/
6. Test in Sandbox → Repeat
7. Once stable, integrate into main app
```

### Gallery Mode (Dec 2024)
The Gallery displays all 17+ registered variants with live mock data previews, organized by category:
- **Layout**: Dashboard, Directory, List Stack
- **Row**: Simple, Detailed, Neon Group, Input variants
- **Card**: Media, Progress, Charts

---

## ⚠️ Viewport Buffer Architecture

**The App Shell automatically handles bottom padding** so content scrolls above the floating tab bar and drawer handle.

### How It Works
`layout_app_shell.tsx` includes a **spacer div** after all viewport content:

```tsx
{/* Viewport (Content) - SCROLLABLE area */}
<div className="flex-1 min-h-0 overflow-y-auto">
    <ViewEngine root={viewportContent} className="w-full" />
    
    {/* Bottom buffer spacer - dynamic height based on tabs */}
    <div className={cn(
        "flex-shrink-0",
        hasBottomTabs ? "h-[140px]" : "h-[60px]"
    )} aria-hidden="true" />
</div>
```

### Buffer Heights
| Scenario | Height | Components |
|----------|--------|------------|
| With bottom tabs | 140px | Tab bar (~50px) + Drawer handle (60px) + buffer |
| Without bottom tabs | 60px | Drawer handle only |

### View Variant Guidelines
View variants should **NOT** add their own scroll handling:

```tsx
// ✅ CORRECT - let shell handle scrolling
<div className="flex flex-col">
  <div className="px-3 pt-2 space-y-2">
    {children}
  </div>
</div>

// ❌ WRONG - nested scroll creates issues
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto pb-[140px]">
    {children}
  </div>
</div>
```

**Rule:** Views should flow naturally. The shell's viewport handles scrolling and buffer.

---

## Architecture

### File Structure
```
src/engine/
├── index.ts                    # Public API + initializeEngine()
├── registry.ts                 # Variant → Component mapping
├── types/
│   └── node.ts                 # Node interface + Zod schemas
├── context/
│   └── NodeContext.tsx         # React context for tree traversal
├── hooks/
│   └── useChildAggregation.ts  # Smart data aggregation from children
└── components/
    ├── ViewEngine.tsx          # Main recursive renderer
    ├── DebugNode.tsx           # Fallback for unknown variants
    ├── hooks/
    │   └── useRenderChildren.tsx
    └── variants/               # ⭐ ADD NEW VARIANTS HERE
        ├── layouts/            # App shells, dashboards
        ├── views/              # Directories, lists, grids
        ├── rows/               # List item variants
        └── cards/              # Grid cards, charts, progress
```

### Data Flow
```
JSON → parseNodeJson() → Node Tree → ViewEngine → registry.resolveVariant() → React Component
                          ↓
                    NodeContext (depth, parentId, rootId)
                          ↓
                    Variant Component reads node.metadata
```

### Persistent Shell Architecture
```
ViewEnginePane
    ↓
Always renders: fullNodeTree (Context Root = App Shell)
    ↓
ShellNavigationProvider { targetNodeId, onNavigate }
    ↓
ShellActionProvider (inside layout_app_shell)
    ↓
layout_app_shell
    ├── Header (dynamic title + action button from ShellActionContext)
    ├── Viewport → renders targetNodeId OR active tab
    └── Tab Bar (always visible, highlights containing tab)
```

**Key Principle:** The App Shell never gets swapped out. Only the viewport content changes based on navigation. This ensures:
- Bottom tabs are always visible (sticky with `h-[100dvh]` and `z-10`)
- Header chrome stays persistent
- Browser back button works correctly (Passive Listening pattern)
- Input interactions don't lose state

### Navigation State Management (Passive Listening)

The navigation system uses URL hash state with a "Passive Listening" strategy to prevent race conditions:

**Forward Navigation (clicking folder):**
```
User clicks folder → pushNodeToHistory(nodeId) → URL hash updates → React state updates
```

**Back Navigation (pressing back button):**
```
Back pressed → popstate fires → Global useBackButton calls handlers → 
ViewEnginePane handler reads URL, updates React state → Returns true
```

**Critical Rules:**
- **Forward:** Use `history.pushState()` (creates new history entry)
- **Back:** React to `popstate` only - do NOT call `pushState/replaceState/back()`
- **Root Trap:** If at root, handler returns `true` to consume the event (prevents Android app exit). User must use drawer/swipe to leave.

This prevents the "Rapid Rewind" bug where competing popstate handlers cause navigation cascades.

---

## Node Schema

Every node must match this Zod-validated structure:

```typescript
interface Node {
  id: string           // UUID format
  type: NodeType       // 'space' | 'container' | 'collection' | 'item'
  variant: string      // Drives rendering: 'list_row', 'grid_card', etc.
  title: string
  metadata: Record<string, unknown>  // Polymorphic data
  children?: Node[]

  relationships?: NodeRelationship[]
  pointer_table?: string
  pointer_id?: string
  duration_minutes?: number
}
```

### Type Meanings
| Type | Meaning | Typical Variants |
|------|---------|------------------|
| `space` | Top-level workspace (rarely rendered) | `space_header` |
| `container` | Folders, sections, groups | `container_stack`, `container_grid` |
| `collection` | Lists, galleries | `collection_list`, `collection_kanban` |
| `item` | Leaf nodes (tasks, recipes, etc.) | `list_row`, `grid_card`, `detail_view` |

### Metadata Conventions
Different domains use different metadata keys:

**Tasks:**
```json
{
  "status": "active" | "in_progress" | "completed",
  "priority": "low" | "medium" | "high" | "critical",
  "dueDate": "2025-12-01",
  "assigneeId": "uuid"
}
```

**Recipes:**
```json
{
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "imageUrl": "https://...",
  "description": "...",
  "semanticType": "recipe"
}
```

**Containers:**
```json
{
  "color": "#06b6d4",
  "icon": "folder",
  "description": "Optional description"
}
```

---

## Creating a New Variant

### Step 1: Create Component File
```typescript
// src/engine/components/variants/MyVariant.tsx

import type { VariantComponentProps } from '../../registry'
import { useNode, useNodeMeta, useChildCount } from '../../context/NodeContext'
import { renderChildren } from '../ViewEngine'

export function MyVariant({ node }: VariantComponentProps) {
  const { depth, rootId } = useNode()
  const childCount = useChildCount()
  
  // Extract metadata with type safety
  const color = useNodeMeta<string>('color', '#06b6d4')
  const status = useNodeMeta<string>('status')
  
  // Render children if this is a container
  const hasChildren = node.children && node.children.length > 0
  
  return (
    <div data-variant="my_variant" data-node-id={node.id}>
      <h3>{node.title}</h3>
      {hasChildren && renderChildren(node, depth, rootId)}
    </div>
  )
}
```

### Step 2: Register in registry.ts
```typescript
// In initializeEngine() or at module level:
registerVariant('my_variant', MyVariant)
```

### Step 3: Export from index.ts
```typescript
export { MyVariant } from './components/variants/MyVariant'
```

### Step 4: Test in Sandbox
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "type": "item",
  "variant": "my_variant",
  "title": "Test My Variant",
  "metadata": { "color": "#ff6b6b" }
}
```

---

## Available Context Hooks

Use these inside variant components:

| Hook | Returns | Purpose |
|------|---------|---------|
| `useNode()` | `{ node, depth, rootId, rootNode, parentId, findNodeById }` | Full node context |
| `useNodeMeta<T>(key, default?)` | `T` | Type-safe metadata access |
| `useIsRoot()` | `boolean` | Check if current node is tree root |
| `useHasChildren()` | `boolean` | Check if node has children |
| `useChildCount()` | `number` | Count of direct children |
| `useRenderChildren()` | `() => ReactNode` | Render children helper |
| `useShellNavigation()` | `{ targetNodeId, navigateToNode, navigateBack, canNavigateBack }` | Shell navigation |
| `useShellAction()` | `{ actionConfig, setActionConfig, clearActionConfig }` | Dynamic header actions |
| `useEngineActions()` | `{ onOpenNote, onOpenCreateForm, ... }` | Action callbacks (modals, navigation) |
| `useChildAggregation()` | `{ total, items, max, min, isEmpty }` | Aggregate from own children |
| `useSlotBasedAggregation()` | `{ total, items, ... }` | Aggregate from source_id sibling (for charts) |
| `useSlot<T>()` | `T \| undefined` | Slot-based metadata access |

---

## Component Catalog (Structural Taxonomy)

The ViewEngine uses a **Structural/Compositional Taxonomy** where components are named by their layout structure, not by domain. This enables "headless" rendering where the same component can display tasks, recipes, or any other data type.

### The Slot System

Components use **slots** to access data without coupling to specific field names. The `useSlot` hook provides an indirection layer:

```typescript
// In component:
const headline = useSlot<string>('headline')  // Gets title via default mapping
const badge = useSlot<string>('badge', undefined, { type: 'date' })  // Auto-formats dates

// In JSON (explicit config):
{
  "metadata": {
    "__config": {
      "headline": "name",
      "badge": "due_date"
    },
    "name": "My Item",
    "due_date": "2025-12-01"
  }
}

// In JSON (convention - no __config needed):
{
  "metadata": {
    "description": "This maps to 'subtext' slot automatically"
  }
}
```

**Default Slot Mappings (Convention over Configuration):**
| Slot | Default Metadata Key |
|------|---------------------|
| `headline` | `node.title` |
| `subtext` | `description` |
| `accent_color` | `color` |
| `icon_start` | `icon` |
| `media` | `imageUrl` |

---

## Layouts (App Shells)

### `layout_app_shell`
**Structure:** Persistent Header + Viewport + Floating Bottom Tab Bar
**Use for:** Top-level App Containers (e.g., "Household", "Health")

**Persistent Shell Architecture:** This component implements the "persistent shell" pattern. The shell chrome (header, tabs) is always visible while the viewport content changes based on navigation.

```
┌────────────────────────────────────────────────┐  z-50 (Header)
│  [←] Current Title               [+ New ▼]    │  ← Back button when deep
├────────────────────────────────────────────────┤
│                                                │
│  Viewport Content                              │  ← Changes based on targetNodeId
│  (Active Tab OR drilled-in folder)             │
│  pb-[140px] for scroll clearance               │
│                                                │
│                                                │
│  ╔════════════════════════════════════════╗    │  ← Floating (absolute)
│  ║ [Tab 1]  [Tab 2]  [Tab 3]  [Tab 4]    ║    │  ← Glassmorphism
│  ╚════════════════════════════════════════╝    │  ← bottom-[90px]
│                                                │
│        (Drawer Handle Area - Transparent)      │
└────────────────────────────────────────────────┘
```

**CSS Architecture:**
- **Header:** `z-50` ensures dropdown menus float above all viewport content including `layout_top_tabs`.
- **Viewport:** `pb-[140px]` padding ensures content can scroll past the floating tab bar.
- **Tab Bar (Floating):** Uses absolute positioning with `bottom-[90px]` to float above the global drawer handle.
  - `mx-3 rounded-xl` - Pill shape with inset margins
  - `backdrop-blur-xl bg-dark-900/80` - Glassmorphism effect
  - `border border-white/10` - Subtle glass edge
  - `shadow-lg shadow-black/20` - Depth shadow
- **Drawer Handle Area:** Fully transparent and interactive below the floating tab bar.

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `title` | string | App Title (shown in header when at root) |
| `default_tab_id` | string | UUID of child to show first (optional) |

**Behavior:**
- **Persistent Chrome:** Header and tab bar stay visible during deep navigation.
- **Smart Title:** Shows app title at root, folder title when drilled in.
- **Back Button:** Appears automatically when user navigates into subfolders.
- **Tab Highlighting:** Correct tab stays highlighted even when deep in a subtree.
- **Search:** Handled per-directory via `view_directory` (not in shell header).
- **Dynamic Action Button:** Header "+ New" button controlled by child views via `ShellActionContext`.

**Dynamic Header Actions:**
Child views (like `view_directory`) can control the header's action button:

```tsx
// In view_directory.tsx
const { setActionConfig, clearActionConfig } = useShellAction()

useEffect(() => {
  setActionConfig({
    label: 'New',
    options: [
      { label: 'Folder', type: 'folder', icon: 'Folder' },
      { label: 'Task', type: 'task', icon: 'CheckSquare' }
    ],
    parentId: node.id
  })
  return () => clearActionConfig()
}, [node.id])
```

**Custom Create Options:**
Views can specify custom options via `node.metadata.create_options`:
```json
{
  "metadata": {
    "create_options": [
      { "label": "Add Item", "type": "task", "icon": "ShoppingCart" },
      { "label": "Add Category", "type": "folder", "icon": "Folder" }
    ]
  }
}
```

**Navigation Context:**
Uses `ShellNavigationContext` to receive `targetNodeId` from `ViewEnginePane`. When the user taps a folder:
1. `ViewEnginePane` updates `targetNodeId` and pushes URL state
2. Shell finds the target node in its tree
3. Viewport renders that node (with `view_directory` variant override)
4. Tab bar highlights the tab that contains the target

**Example:**
```json
{
  "variant": "layout_app_shell",
  "title": "Household",
  "metadata": {
    "default_tab_id": "00000000-0000-0000-0000-000000000103"
  },
  "children": [
    { "title": "Shopping", "metadata": { "icon": "ShoppingCart" }, ... },
    { "title": "Stock", "metadata": { "icon": "Package" }, ... },
    { "title": "To-Do", "metadata": { "icon": "CheckSquare" }, ... }
  ]
}
```

---

### `layout_top_tabs`
**Structure:** Segmented Control (Pills) + Active Tab Content
**Use for:** Secondary navigation within an App Shell (e.g., "Shopping" -> "Lists" | "Items")

```
┌────────────────────────────────────────────────┐
│  ┌─────────────────────────────────────────┐   │
│  │ [Tab 1] [Tab 2] [Tab 3] [More ▼]       │   │  ← Pill Toggle (inset)
│  └─────────────────────────────────────────┘   │
├────────────────────────────────────────────────┤
│                                                │
│  Active Tab Content                            │
│                                                │
└────────────────────────────────────────────────┘
```

**CSS Architecture:**
- **Container:** `bg-dark-800/50 p-1 rounded-lg mb-4` - Inset pill container
- **Active Tab:** `bg-[var(--color-primary)] text-white shadow-sm rounded-md` - Cyan pill
- **Inactive Tab:** `text-dark-400 hover:text-white` - Subtle text
- **Overflow (>3 tabs):** Renders "More ▼" dropdown with remaining tabs

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `default_tab_id` | string | UUID of child to show first (optional) |

**Behavior:**
- **Segmented Control:** Renders children as horizontal pills with max 3 visible.
- **Overflow Dropdown:** If more than 3 children, shows "More ▼" trigger with dropdown menu.
- **Theme-Aware:** Active state uses `var(--color-primary)` CSS variable.
- **Nested:** Designed to sit inside `layout_app_shell` or other containers.

**Example:**
```json
{
  "variant": "layout_top_tabs",
  "title": "Shopping",
  "children": [
    { "title": "Lists", "variant": "view_list_stack", ... },
    { "title": "Items", "variant": "view_directory", ... },
    { "title": "History", "variant": "view_list_stack", ... },
    { "title": "Settings", "variant": "view_directory", ... }
  ]
}
```

---

## Views (Containers)

### `view_list_stack`
**Structure:** Collapsible vertical stack with neon header
**Use for:** Folders, sections, any nested container

```
┌────────────────────────────────────────────────┐
│ [▼] [Icon]  headline              [count]      │
│             subtext                            │
├────────────────────────────────────────────────┤
│   │ Child 1                                    │
│   │ Child 2                                    │
└────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Header title (default: node.title) |
| `subtext` | string | Description below title |
| `accent_color` | string | Neon border/glow color (default: #06b6d4) |

**Example:**
```json
{
  "variant": "view_list_stack",
  "title": "Projects",
  "metadata": { "color": "#8b5cf6", "description": "Active projects" }
}
```

---

### `view_directory`
**Structure:** Search bar header + scrollable list + action button
**Use for:** Top-level directories, searchable lists

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

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Directory title (optional) |
| `search_placeholder` | string | Search input placeholder text |
| `show_action_button` | boolean | Show "+ New" in shell header (default: true) |
| `action_label` | string | Label for action button (default: "New") |

**Note:** The action button has been moved from the directory to the App Shell header. It is controlled via `ShellActionContext` for consistent positioning.

---

### `view_grid_fixed`
**Structure:** 6-Column Responsive Grid Container
**Use for:** Pantries, wardrobes, galleries, any card-based layout

The grid uses a **6-column base system** on mobile that scales to 12 columns on desktop. This enables flexible layouts where cards can span different widths.

```
┌───────┬───────┬───────┬───────┬───────┬───────┐  ← 6 columns on mobile
│ col 1 │ col 2 │ col 3 │ col 4 │ col 5 │ col 6 │
├───────┴───────┼───────┴───────┼───────┴───────┤
│  col_span: 2  │  col_span: 2  │  col_span: 2  │  ← 3 cards per row (default)
├───────────────┴───────────────┼───────────────┤
│       col_span: 4             │  col_span: 2  │  ← Mixed widths
├───────────────────────────────┴───────────────┤
│              col_span: 6 (full width)          │  ← Full width
└────────────────────────────────────────────────┘
```

**Column Span Reference:**
| col_span | Mobile (6-col) | Desktop (12-col) | Use Case |
|----------|----------------|------------------|----------|
| `2` | 3 per row | 4 per row | Thumbnails, small cards (DEFAULT) |
| `3` | 2 per row | 3 per row | Compact cards (`*_compact` variants) |
| `4` | ~1.5 per row | 3 per row | Medium cards |
| `6` | Full width | Half width | Wide cards, charts |

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Optional section title |
| `subtext` | string | Optional description |
| `gap` | number | Gap in Tailwind units (2, 3, 4, 6) default: 4 |
| `show_header` | boolean | Show headline/subtext (default: true) |

**Child Metadata:**
| Key | Type | Description |
|-----|------|-------------|
| `col_span` | number | Column span (2, 3, 4, 5, or 6) - default: 2 |

**Example - Mixed Width Grid:**
```json
{
  "variant": "view_grid_fixed",
  "children": [
    { "variant": "card_media_thumbnail_compact", "metadata": { "col_span": 3 } },
    { "variant": "card_media_thumbnail_compact", "metadata": { "col_span": 3 } },
    { "variant": "card_chart_bar", "metadata": { "col_span": 6 } }
  ]
}
```

---

## Rows (List Items)

### `row_detail_check`
**Structure:** Checkbox | Headline + Subtext + Badges | Avatar
**Use for:** Tasks, detailed list items

```
┌─────────────────────────────────────────────────────────────────┐
│ [○/●]  |  headline                                   [Avatar]  │
│        |  subtext                                              │
│        |  [badge_1] [badge_2] [badge_3]                        │
└─────────────────────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `subtext` | string | Secondary text |
| `status` | string | Status for icon: 'active', 'in_progress', 'completed' |
| `badge_1` | string | First badge (e.g., status text) |
| `badge_2` | string | Second badge (auto-formatted if type: 'date') |
| `badge_3` | string | Third badge (e.g., location) |
| `end_element` | object/string | Avatar config for right side |

**Example:**
```json
{
  "variant": "row_detail_check",
  "title": "Buy groceries",
  "metadata": {
    "status": "active",
    "description": "Get milk from Costco",
    "badge_1": "Active",
    "badge_2": "2025-12-01",
    "badge_3": "Costco",
    "end_element": "icon:User:#ff6b6b"
  }
}
```

---

### `row_neon_group`
**Structure:** Neon border | Icon + Headline | Count + Chevron + Avatar
**Use for:** Folder navigation, groups with cyberpunk styling

```
┌════════════════════════════════════════════════════════════════════╗
║ [Icon]  headline                      [count badge] [→] [Avatar]  ║
║         subtext                                                    ║
╚════════════════════════════════════════════════════════════════════╝
  ^ Neon glow border using accent_color
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `subtext` | string | Secondary text |
| `accent_color` | string | Neon border/glow color (default: #06b6d4) |
| `icon_start` | string | Lucide icon name (default: 'Folder') - e.g., 'ShoppingCart', 'Dumbbell' |
| `count_badge` | string/number | Badge text (default: child count) |
| `end_element` | object/string | Avatar config |
| `show_chevron` | boolean | Show navigation chevron (default: true) |

**Dynamic Icons:**
The `icon_start` slot accepts any Lucide icon name. The icon is rendered dynamically with the `accent_color` applied. If the icon name is not found, it falls back to the `Folder` icon.

**Example:**
```json
{
  "variant": "row_neon_group",
  "title": "Groceries",
  "metadata": {
    "color": "#06b6d4",
    "icon": "ShoppingCart",
    "description": "Weekly shopping list",
    "end_element": "icon:ShoppingCart:#06b6d4"
  },
  "children": [...]
}
```

---

### `row_simple`
**Structure:** Minimal row with status icon, headline, and badges
**Use for:** Simple list items without extra detail

```
┌────────────────────────────────────────────────────────────────┐
│ [○/●]  headline                         [badge] [badge_date]  │
└────────────────────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `status` | string | Status for icon: 'active', 'in_progress', 'completed' |
| `badge` | string | Priority/category badge |
| `badge_date` | string | Date badge (auto-formatted) |
| `accent_color` | string | Icon color override |

**Example:**
```json
{
  "variant": "row_simple",
  "title": "Quick task",
  "metadata": { "status": "active" }
}
```

---

### `row_input_stepper`
**Structure:** Info left | Stepper control right
**Use for:** Inventory counts, servings, ratings

```
┌────────────────────────────────────────────────────────────────┐
│ Headline                      [ - ] [ 5 ] [ + ]               │
│ Subtext                                                        │
└────────────────────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text |
| `subtext` | string | Secondary text |
| `value` | number | Current numeric value |
| `min_threshold` | number | Value below which to show alert (red) |
| `max_threshold` | number | Max allowed value |
| `step` | number | Increment step (default: 1) |
| `unit` | string | Unit label (e.g., "kg", "pcs") |

**Behavior:**
- Buttons trigger `update_field` on the `value` slot.
- **Optimistic UI:** Uses local state for instant feedback, then persists to DB.
- **Event Handling:** Uses `onPointerDown` with `preventDefault()` and `stopPropagation()` to prevent parent row handler interference.
- **Text Colors:** Uses `text-white` for value display and `hover:text-white` for button icons (not `text-dark-100` which is nearly black in the inverted color scheme).

---

### `row_input_currency`
**Structure:** Checkbox | Info | Currency Input
**Use for:** Prices, costs, budgeting

```
┌────────────────────────────────────────────────────────────────┐
│ [○] Headline                                     [ $ 10.00 ]  │
└────────────────────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text |
| `value` | number | Price value |
| `currency_symbol` | string | Symbol to show (default: "$") |
| `status` | string | Controls checkbox state |

**Behavior:**
- Input triggers `update_field` on `value` (on Blur/Enter).
- Checkbox triggers `toggle_status` OR custom `metadata.behavior`.
- **Event Handling:** Uses `onPointerDown` with `stopPropagation()` to prevent parent row handler interference while allowing focus.
- **Text Colors:** Uses `text-white` for input text and `text-dark-500` for currency symbol (not `text-dark-100`/`text-dark-400` which are nearly black in the inverted color scheme).

---

### `row_transaction_history`
**Structure:** Category Icon | Title + Date | Amount (Read-Only)
**Use for:** Transaction history, expense logs, read-only financial records

```
┌────────────────────────────────────────────────────────────────┐
│ [🍔]  Whole Foods                                 -$125.50    │
│       Dec 1, 2024                                              │
└────────────────────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Merchant/description (default: node.title) |
| `amount` | number | Transaction amount (negative for expenses) |
| `category` | string | Category name for icon selection |
| `date` | string | Transaction date (auto-formatted) |

**Category Icons (Built-in):**
| Category | Icon | Color |
|----------|------|-------|
| Food | UtensilsCrossed | #10b981 |
| Dining | Coffee | #f59e0b |
| Coffee | Coffee | #a16207 |
| Transport | Car | #06b6d4 |
| Utilities | Zap | #eab308 |
| Entertainment | Tv | #a855f7 |
| Shopping | ShoppingBag | #ec4899 |
| Health | Heart | #ef4444 |
| Income | TrendingUp | #22c55e |
| (default) | Receipt | #6b7280 |

**Behavior:**
- **Read-Only:** No inputs or checkboxes. Purely display.
- **Color-Coded:** Amounts shown in red (expense) or green (income).
- **Date Formatting:** Automatically formats ISO dates to human-readable.

**Example:**
```json
{
  "variant": "row_transaction_history",
  "title": "Whole Foods",
  "metadata": {
    "amount": 125.50,
    "category": "Food",
    "date": "2024-12-01"
  }
}
```

---

### `row_media_left`
**Structure:** Image thumbnail on left, content on right
**Use for:** Contact lists, media items with descriptions

```
┌────────────────────────────────────────────────────────────────┐
│ [○ or ▢]  Title                                           [→] │
│  image    Description                                         │
└────────────────────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `subtext` | string | Secondary description text |
| `media` | string | Image URL |
| `media_shape` | 'round' \| 'square' | Image shape (default: 'round') |
| `media_size` | number | Image size in pixels (default: 48) |
| `border_color` | string | Optional colored border |
| `neon_glow` | boolean | Enable neon glow effect (default: false) |
| `target_id` | string | Navigate to this node on click |

**Example:**
```json
{
  "variant": "row_media_left",
  "title": "John Smith",
  "metadata": {
    "media": "https://example.com/avatar.jpg",
    "media_shape": "round",
    "description": "Product Manager"
  }
}
```

---

### `row_simple_description`
**Structure:** Simple row with title and multiline description
**Use for:** Notes, descriptions, content without icons

```
┌─[border_color]───────────────────────────────────────────────────┐
│ Title                                                        [→] │
│ Description text here...                                         │
└──────────────────────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `subtext` | string | Secondary text / description |
| `border_color` | string | Optional colored border |
| `neon_glow` | boolean | Enable neon glow effect (default: false) |
| `target_id` | string | Navigate to this node on click |

**Example:**
```json
{
  "variant": "row_simple_description",
  "title": "Meeting Notes",
  "metadata": {
    "description": "Discussed Q4 roadmap and resource allocation...",
    "border_color": "#8b5cf6"
  }
}
```

---

## Dashboards (Dec 2024)

### `view_dashboard_masonry`
**Structure:** CSS Grid with configurable column spans
**Use for:** Finance dashboards, analytics views, multi-card layouts

```
┌────────────┬────────────┬────────────────────────┐
│  Card 1    │  Card 2    │  Card 3 (span: 2)     │
│  (span 1)  │  (span 1)  │                        │
├────────────┴────────────┴────────────────────────┤
│  Card 4 (span: full)                             │
└──────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `title` | string | Section title |
| `subtitle` | string | Optional subtitle |
| `columns` | number | Number of columns (default: 3) |
| `gap` | number | Gap in pixels (default: 16) |

**Child Metadata:**
| Key | Type | Description |
|-----|------|-------------|
| `col_span` | number \| 'full' | Column span (1, 2, or 'full') |

---

## Progress Cards (Dec 2024)

### `card_progress_simple`
**Structure:** Single progress bar with value/max
**Use for:** Simple budget tracking, goal progress

```
┌─────────────────────────────────────────────────┐
│  Title                              75%         │
│  ████████████████░░░░░░░░░░░░░░░░░░░░░         │
│  $750 of $1,000                                 │
└─────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `value` | number | Current value (or aggregated from children) |
| `max` | number | Maximum/goal value (default: 100) |
| `format` | 'number' \| 'currency' \| 'percent' | Display format |
| `color` | string | Bar color (default: #06b6d4) |
| `target_key` | string | Metadata key to sum from children (default: 'amount') |

---

### `card_progress_stacked`
**Structure:** One bar with multiple colored segments
**Use for:** Budget breakdowns, category proportions

```
┌─────────────────────────────────────────────────┐
│  Monthly Budget                    $2,450       │
│  ████████████▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░         │
│  ● Groceries  ● Dining  ● Gas                   │
└─────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `max` | number | Budget/max value |
| `segments` | array | Direct segments `[{label, value, color}]` |
| `target_key` | string | Key to aggregate from children |
| `group_by` | string | Key to group children by (default: 'category') |

---

### `card_progress_multi`
**Structure:** Multiple individual progress bars stacked vertically
**Use for:** Category budgets with individual limits

```
┌─────────────────────────────────────────────────┐
│  Groceries          $300 / $400                 │
│  ████████████████████░░░░░░░░                  │
│  Dining Out         $150 / $200                 │
│  ████████████████░░░░░░░░░░░░░                 │
└─────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `items` | array | Direct items `[{label, value, max, color}]` |
| `format` | 'number' \| 'currency' \| 'percent' | Display format |
| `compact` | boolean | Compact spacing (default: false) |

---

## Chart Cards (Dec 2024)

All chart cards use **Recharts** and support:
- Direct `data` array in metadata
- Automatic aggregation from children via `useChildAggregation`

### `card_chart_bar`
**Use for:** Monthly comparisons, category totals

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `data` | array | `[{name, value, color?}]` |
| `height` | number | Chart height (default: 200) |
| `horizontal` | boolean | Horizontal bars (default: false) |

---

### `card_chart_line`
**Use for:** Trends over time, time series

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `data` | array | `[{name, value, ...otherSeries}]` |
| `series` | array | Multi-series config `[{key, color, name}]` |
| `show_area` | boolean | Fill area under line (default: true) |
| `curved` | boolean | Curved lines (default: true) |

---

### `card_chart_pie`
**Use for:** Category breakdowns, proportions

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `data` | array | `[{name, value, color?}]` |
| `donut` | boolean | Render as donut (default: true) |
| `show_center` | boolean | Show center label (default: true) |

---

### `card_chart_radar`
**Use for:** Multi-dimensional comparison, skills/stats

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `data` | array | `[{name, value}]` |
| `max` | number | Maximum scale value |
| `fill_opacity` | number | Fill opacity 0-1 (default: 0.3) |

---

## Cards (Grid Items)

### `card_folder`
**Structure:** Grid-style folder card with icon, title, and count
**Use for:** Folder navigation in grids (like `row_neon_group` but for grid layouts)

```
┌═════════════════════════╗
║        [Icon]           ║
║        Title            ║
║      [3 items]          ║
╚═════════════════════════╝
  ^ Optional neon glow border
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `icon_start` | string | Lucide icon name (default: 'Folder') |
| `accent_color` | string | Icon color and neon glow (default: #06b6d4) |
| `border_color` | string | Optional border color (overrides accent_color) |
| `neon_glow` | boolean | Enable neon glow effect (default: false) |
| `count_badge` | string/number | Badge text (default: child count) |
| `show_count` | boolean | Show item count (default: true) |
| `target_id` | string | Navigate to this node on click |

**Example:**
```json
{
  "variant": "card_folder",
  "title": "Photos",
  "metadata": {
    "icon": "Camera",
    "color": "#ec4899",
    "neon_glow": true,
    "col_span": 2
  },
  "children": [...]
}
```

---

### `card_media_top`
**Structure:** Image Top + Content Bottom
**Use for:** Recipes, gallery items, rich content

```
┌───────────────────────────────────────┐
│         [slot_media]                  │  ← Image if provided
│                                       │
├───────────────────────────────────────┤
│ headline                              │
│ subtext                               │
│ [badge_1] [badge_2] [badge_3]         │
└───────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `subtext` | string | Secondary text |
| `media` | string | Image URL for top section |
| `accent_color` | string | Top bar color when no media (default: #06b6d4) |
| `badge_1` | string/number | First badge (e.g., "35m") |
| `badge_2` | string/number | Second badge (e.g., "4 servings") |
| `badge_3` | string/number | Third badge |
| `badge_1_icon` | string | Icon for badge_1 ('clock', etc.) |

**Example:**
```json
{
  "variant": "card_media_top",
  "title": "Spaghetti Carbonara",
  "metadata": {
    "imageUrl": "https://example.com/pasta.jpg",
    "description": "Classic Italian pasta",
    "badge_1": "35m",
    "badge_1_icon": "clock",
    "badge_2": "4 servings"
  }
}
```

---

## Compact Card Variants (Dec 2024)

These variants are designed for the **6-column grid system** with `col_span: 3` (2 cards per row).

### `card_media_top_compact`
**Structure:** Smaller card with 4:3 aspect ratio image
**Use for:** Side-by-side gallery items, compact recipe cards

Same slots as `card_media_top` but with:
- 4:3 aspect ratio image (instead of 16:9)
- Smaller text sizes
- Reduced padding
- `rounded-lg` instead of `rounded-xl`

**Example:**
```json
{
  "variant": "card_media_top_compact",
  "title": "Quick Recipe",
  "metadata": {
    "imageUrl": "https://example.com/food.jpg",
    "col_span": 3
  }
}
```

---

### `card_media_thumbnail_compact`
**Structure:** Compact square thumbnail
**Use for:** Profile pics, album covers, icons in grid

Same slots as `card_media_thumbnail` but with:
- Smaller overall size
- Reduced padding
- Designed for `col_span: 3`

**Example:**
```json
{
  "variant": "card_media_thumbnail_compact",
  "title": "Album Cover",
  "metadata": {
    "url": "https://example.com/album.jpg",
    "col_span": 3
  }
}
```

---

### `card_media_cover_compact`
**Structure:** Compact poster-style with 3:4 aspect ratio
**Use for:** Movie posters, book covers, portrait images

Same slots as `card_media_cover` but with:
- 3:4 aspect ratio (portrait, instead of 16:9 landscape)
- Smaller text overlay
- Designed for `col_span: 3`

**Example:**
```json
{
  "variant": "card_media_cover_compact",
  "title": "The Matrix",
  "metadata": {
    "url": "https://example.com/poster.jpg",
    "description": "1999 Sci-Fi",
    "col_span": 3
  }
}
```

---

## Note Components (Dec 2024)

### Overview
The Note component system provides markdown note display and editing with:
- **Card variants** for grid layouts with plain text previews
- **Row variant** for list views
- **Fullscreen modal** for viewing/editing with markdown rendering
- **Version history** with autosave

### Dependencies
```bash
npm install @uiw/react-md-editor
```

### Shared Components

#### `NoteViewerModal`
**Location:** `src/engine/components/shared/NoteViewerModal.tsx`

A fullscreen lightbox for viewing and editing markdown notes.

**Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [←] Note Title                          [History] [Edit/✓] │  ← Header
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  VIEW MODE: Rendered Markdown                               │
│  ───────────────────────────────                            │
│  EDIT MODE: @uiw/react-md-editor                            │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ Last saved: 2 minutes ago                    [Saving...]    │  ← Footer
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- View mode with rendered markdown (MDEditor.Markdown)
- Edit mode with full MDEditor toolbar
- Autosave with 2-second debounce
- Version history panel (last 10 versions)
- Restore previous versions
- Escape key to close

**Props:**
```typescript
interface NoteViewerModalProps {
  isOpen: boolean
  onClose: () => void
  node: Node
  onSave?: (content: string, history: VersionEntry[]) => void
  initialMode?: 'view' | 'edit'
}
```

---

### `row_note`
**Structure:** Note icon | Title | Version count + Timestamp
**Use for:** Notes in list views, simple note listings

```
┌────────────────────────────────────────────────────────────┐
│ 📄  Note Title                              [2] Updated 2h │
└────────────────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `content` | string | Markdown content (for version history) |
| `updated_at` | string | ISO timestamp of last edit |
| `accent_color` | string | Left border indicator (default: #8b5cf6) |
| `history` | array | Version history `[{content, savedAt}]` |

**Behavior:**
- **Click:** Opens fullscreen NoteViewerModal for viewing/editing (via `actions.onOpenNote(node)`)
- **Long-press/Right-click:** Opens version history context menu with restore options

**Context Menu:**
Long-press or right-click opens version history menu with restore options.

**Example:**
```json
{
  "variant": "row_note",
  "title": "Project Ideas",
  "metadata": {
    "content": "# Ideas\n\n- Build a note app\n- Create a tracker",
    "updated_at": "2024-12-04T15:30:00Z",
    "accent_color": "#8b5cf6",
    "history": [
      { "content": "Initial draft...", "savedAt": "2024-12-04T14:00:00Z" }
    ]
  }
}
```

---

### `card_note`
**Structure:** Compact card with title and plain text preview
**Use for:** Note grids, dashboard note widgets (col_span: 3)

```
┌─────────────────────┐
│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀│ ← Accent bar
│ 📝 Note Title       │
│ Plain text preview  │
│ truncated to fit... │
│ ──────────────────  │
│ Updated 2h ago [2]  │
└─────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `content` | string | Markdown content (stripped for preview) |
| `updated_at` | string | ISO timestamp |
| `accent_color` | string | Top bar + glow color (default: #8b5cf6) |
| `neon_glow` | boolean | Enable neon glow effect (default: false) |
| `history` | array | Version history for context menu |

**Behavior:**
- **Click:** Opens fullscreen NoteViewerModal for viewing/editing (via `actions.onOpenNote(node)`)
- **Long-press/Right-click:** Opens version history context menu

**Markdown Stripping:**
Content is automatically converted to plain text for preview:
- Headers, bold, italic formatting removed
- Links show text only
- Code blocks removed
- Whitespace normalized

**Context Menu:**
Long-press or right-click shows version history with timestamps and previews.

**Example:**
```json
{
  "variant": "card_note",
  "title": "Meeting Notes",
  "metadata": {
    "col_span": 3,
    "content": "# Q4 Planning\n\n## Attendees\n- Sarah\n- Mike",
    "updated_at": "2024-12-04T17:30:00Z",
    "accent_color": "#8b5cf6",
    "history": [
      { "content": "Initial draft...", "savedAt": "2024-12-04T16:00:00Z" }
    ]
  }
}
```

---

## Kanban Board (Dec 2024)

### `view_board_columns`
**Structure:** Horizontal snap-scroll board with multiple columns
**Use for:** Project management, task boards, workflow visualization

```
┌─────────────────────────────────────────────────────────────────────┐
│  [←] Project Board                                      [+ Add ▼]  │
├─────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐   ┌──────────────┐   ┌──────────────┐             │
│ │ To Do        │   │ In Progress  │   │ Done         │   ← Snap   │
│ │▀▀▀▀▀▀▀▀▀▀▀▀▀▀│   │▀▀▀▀▀▀▀▀▀▀▀▀▀▀│   │▀▀▀▀▀▀▀▀▀▀▀▀▀▀│   scroll    │
│ │ ┌──────────┐ │   │              │   │              │             │
│ │ │ Card 1   │ │   │              │   │              │             │
│ │ └──────────┘ │   │              │   │              │             │
│ │ ┌──────────┐ │   │              │   │              │             │
│ │ │ Card 2   │ │   │              │   │              │             │
│ │ └──────────┘ │   │              │   │              │             │
│ └──────────────┘   └──────────────┘   └──────────────┘             │
├─────────────────────────────────────────────────────────────────────┤
│                         [●] [○] [○]                                 │ ← Indicators
└─────────────────────────────────────────────────────────────────────┘
```

**Architecture:**
- Mobile-first: Columns are 85% viewport width with snap scrolling
- Desktop: Fixed-width columns (300-320px)
- Touch trap prevents parent scroll interference
- Dot indicators show current column position

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Board title (optional header) |
| `presentation_mode` | string | Set to 'immersive' for fullscreen overlay |

**Child Node Requirements:**
Each child represents a **column** and should use `view_list_stack` variant:
- `column_color` - Colored bottom border (hex color)
- Children of columns are the actual cards

**Column Context Menu:**
Cards inside columns automatically get access to "Move to..." context menu action that shows `MoveToColumnSheet` - a column picker bottom sheet.

**Example:**
```json
{
  "id": "board-1",
  "type": "container",
  "variant": "view_board_columns",
  "title": "Project Board",
  "metadata": { "presentation_mode": "immersive" },
  "children": [
    {
      "id": "col-todo",
      "type": "container",
      "variant": "view_list_stack",
      "title": "To Do",
      "metadata": { "column_color": "#ef4444" },
      "children": [
        { "id": "card-1", "variant": "card_kanban_details", "title": "Design landing", ... }
      ]
    },
    {
      "id": "col-progress",
      "type": "container",
      "variant": "view_list_stack",
      "title": "In Progress",
      "metadata": { "column_color": "#fbbf24" },
      "children": []
    }
  ]
}
```

---

### `card_kanban_details`
**Structure:** Text-based Kanban card with priority, dates, and tags
**Use for:** Task cards within Kanban columns

```
┌─────────────────────────────────────┐
│ ▌ headline                          │  ← Left border = priority_color
│   subtext (truncated 2 lines)       │
│                                     │
│   [📅 due_date] [👤 assignee]       │  ← Bottom row
│   [tag1] [tag2] [tag3]              │
└─────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Card title (default: node.title) |
| `subtext` | string | Description text (optional) |
| `due_date` | string | ISO date for due date badge (optional) |
| `assignee` | string | Avatar initials or name (optional) |
| `priority_color` | string | Hex color for left border (optional) |
| `tags` | string[] | Array of tag strings (optional, max 3 shown) |

**Behavior:**
- **Long press** → Opens context menu with "Move to..." option
- **Click** → Could navigate to detail (via target_id)
- **Due Date Formatting** → "Today", "Tomorrow", or "Dec 1"
- **Overdue Detection** → Red text if past due

**Example:**
```json
{
  "variant": "card_kanban_details",
  "title": "Design landing page",
  "metadata": {
    "subtext": "Create mockups in Figma",
    "due_date": "2025-01-15",
    "priority_color": "#ef4444",
    "assignee": "JD",
    "tags": ["design", "urgent", "q1"]
  }
}
```

---

### `card_kanban_image`
**Structure:** Kanban card with cover image + text details
**Use for:** Visual task cards, creative project items

```
┌─────────────────────────────────────┐
│    [image/media area]               │  ← Configurable height
│                                     │
├─────────────────────────────────────┤
│ ▌ headline                          │  ← Left border = priority_color
│   subtext (truncated 2 lines)       │
│                                     │
│   [📅 due_date] [👤 assignee]       │
│   [tag1] [tag2] [tag3]              │
└─────────────────────────────────────┘
```

**Slots:**
Same as `card_kanban_details` plus:
| Slot | Type | Description |
|------|------|-------------|
| `media` | string | Cover image URL (optional) |
| `media_height` | string | CSS class for height (default: 'h-24') |

**Example:**
```json
{
  "variant": "card_kanban_image",
  "title": "Homepage Hero Banner",
  "metadata": {
    "media": "https://example.com/hero-mockup.jpg",
    "media_height": "h-32",
    "subtext": "Need to finalize color scheme",
    "due_date": "2025-01-20"
  }
}
```

---

### `card_note_large`
**Structure:** Full-width card with extended preview
**Use for:** Featured notes, documentation cards (col_span: 6)

```
┌────────────────────────────────────────────────────────┐
│▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀│ ← Accent bar
│ [📝] Note Title                                        │
│      Last edited 2h ago                                │
│                                                        │
│ Plain text preview with more lines visible for the     │
│ larger card format. This allows users to see more      │
│ content at a glance without opening the full editor... │
│ ────────────────────────────────────────────────────── │
│ 245 characters                           3 versions    │
└────────────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Primary text (default: node.title) |
| `content` | string | Markdown content (5-line preview) |
| `updated_at` | string | ISO timestamp (shown in header) |
| `accent_color` | string | Bar + icon background (default: #8b5cf6) |
| `neon_glow` | boolean | Enable neon glow effect (default: false) |
| `history` | array | Version history |

**Example:**
```json
{
  "variant": "card_note_large",
  "title": "Project Documentation",
  "metadata": {
    "col_span": 6,
    "content": "# Project Documentation\n\n## Overview\n\nThis document...",
    "updated_at": "2024-12-04T18:00:00Z",
    "accent_color": "#06b6d4",
    "neon_glow": true,
    "history": [
      { "content": "Initial draft...", "savedAt": "2024-12-04T17:00:00Z" }
    ]
  }
}
```

---

### Note Data Structure
```json
{
  "id": "uuid",
  "type": "item",
  "variant": "card_note",
  "title": "My Note Title",
  "metadata": {
    "content": "# Heading\n\nMarkdown content here...",
    "updated_at": "2024-12-04T19:00:00Z",
    "history": [
      { "content": "Previous version...", "savedAt": "2024-12-04T18:55:00Z" },
      { "content": "Earlier version...", "savedAt": "2024-12-04T18:30:00Z" }
    ]
  }
}
```

### Note Interaction Flow
1. **Click note** → Native `onClick` handler fires → calls `actions.onOpenNote(node)`
2. **ViewEnginePane** receives callback → sets `selectedNoteNode` state
3. **NoteViewerModal** renders with the selected note
4. **User edits** → autosave triggers → `handleSaveNote` updates database via `useUpdateResource`
5. **Close modal** → `setSelectedNoteNode(null)` clears state

**Click Handling Pattern:**
Note components use the same **proven pattern** as `row_neon_group`:
- Native `onClick` handler for tap/click actions
- Legacy `useLongPress` signature for context menu (long-press / right-click) only
- Explicit event handlers: `onMouseDown`, `onMouseUp`, `onTouchStart`, `onTouchEnd`

```tsx
// Correct pattern (matching row_neon_group)
const handleClick = () => {
  if (actions) actions.onOpenNote(node)
}

const handleContextMenu = (e) => {
  e.preventDefault()
  e.stopPropagation()
  setMenuPosition({ x: e.clientX, y: e.clientY })
}

const longPressHandlers = useLongPress(handleContextMenu, { threshold: 500 })

<div
  onClick={handleClick}
  onContextMenu={handleContextMenu}
  onMouseDown={(e) => longPressHandlers.onMouseDown(e, node)}
  onMouseUp={longPressHandlers.onMouseUp}
  onMouseLeave={longPressHandlers.onMouseLeave}
  onTouchStart={(e) => longPressHandlers.onTouchStart(e, node)}
  onTouchEnd={longPressHandlers.onTouchEnd}
>
```

### Version History System
- **Autosave:** Saves 2 seconds after typing stops
- **History Limit:** Keeps last 10 versions
- **Restore:** Click any version in context menu to restore
- **Timestamps:** Relative time display ("2m ago", "1h ago")

### Supporting Hook: `useLongPress`
**Location:** `src/hooks/useLongPress.ts`

Provides long-press (touch) and right-click (mouse) detection for context menus.

**Two Signatures:**

**1. Legacy Signature (RECOMMENDED for interactive components):**
```typescript
// For components that need native onClick + context menu
const longPressHandlers = useLongPress(
  (e) => setMenuPosition({ x: e.clientX, y: e.clientY }),
  { threshold: 500 }
)

// Use with explicit handlers
<div
  onClick={handleClick}  // ← Native onClick for tap/click!
  onContextMenu={handleContextMenu}
  onMouseDown={(e) => longPressHandlers.onMouseDown(e, node)}
  onMouseUp={longPressHandlers.onMouseUp}
  onMouseLeave={longPressHandlers.onMouseLeave}
  onTouchStart={(e) => longPressHandlers.onTouchStart(e, node)}
  onTouchEnd={longPressHandlers.onTouchEnd}
>
```

**2. New Signature (for simpler use cases):**
```typescript
const handlers = useLongPress({
  onLongPress: (e) => { /* context menu */ },
  onClick: () => { /* regular click - triggered via onMouseUp/onTouchEnd */ },
  delay: 500,
  disabled: false
})

return <div {...handlers}>Content</div>
```

> **Note:** The legacy signature with native `onClick` is more reliable across browsers and devices. Use it for important interactive components like note cards and folder rows.

---

## Legacy Aliases (Backwards Compatibility)

These old variant names still work but map to the new structural components:

| Legacy Name | Maps To |
|-------------|---------|
| `container_stack` | `view_list_stack` |
| `resource_directory` | `view_directory` |
| `task_row_detailed` | `row_detail_check` |
| `folder_row_neon` | `row_neon_group` |
| `list_row` | `row_simple` |
| `grid_card` | `card_media_top` |

**Note:** When using legacy names, the components still use the new slot system. For backwards compatibility, slots fall back to reading common metadata keys directly (e.g., `status`, `description`, `color`).

---

## Styling Guidelines

Follow the Cyberpunk aesthetic:

```css
/* Colors */
--primary: #06b6d4       /* Cyan accent */
--dark-50: #0a0a0f       /* Darkest background */
--dark-100: #111118      /* Card background */
--dark-200: #1a1a24      /* Borders, hover states */

/* Neon Glow Effect */
box-shadow: 0 0 12px {color}22, inset 0 0 8px {color}11;
border-color: {color}66;

/* Glassmorphism */
background: rgba(17, 17, 24, 0.8);
backdrop-filter: blur(12px);
```

---

## Self-Healing Fallback

If a variant is not found in the registry, `DebugNode` renders automatically:
- Shows node ID, type, variant, and metadata
- Helps identify missing or misspelled variants

---

## The Behavior System (Interaction Protocol)

The ViewEngine supports a generic "Behavior Protocol" that allows nodes to define what happens when they are interacted with. This decouples the UI from the logic.

### Triggering Behaviors
Variants call `actions.onTriggerBehavior(node, config)` where `config` is:

```typescript
interface BehaviorConfig {
  action: 'update_field' | 'toggle_status' | 'move_node' | 'log_event'
  target?: string  // Field to update
  payload?: any    // Value to set or data to use
}
```

### Supported Actions

| Action | Description | Payload Example |
|--------|-------------|-----------------|
| `update_field` | Updates a specific metadata key | `{ target: 'value', payload: 5 }` |
| `toggle_status` | Cycles status (active → completed → archived) | `null` |
| `move_node` | Moves node to a new parent | `{ parent_id: 'uuid' }` |
| `log_event` | Creates a child node of type 'event' | `{ title: 'Purchased', description: '...' }` |

### Defining Behaviors in JSON
You can define custom behaviors in `node.metadata.behavior`:

```json
{
  "variant": "row_input_currency",
  "metadata": {
    "behavior": {
      "action": "log_event",
      "payload": { "title": "Price Updated" }
    }
  }
}
```

---

## Phase 2 Roadmap (Future)

1. **Implement Drag-and-Drop**
   - Use `dnd-kit`
   - Update `parent_id` on drop

2. **Replace Hardcoded Pages**
   - `HierarchyPane` → `<ViewEngine root={nodeTree} />`
   - `RecipePage` → `<ViewEngine root={recipeNode} />`

3. **Add Interaction Handlers**
   - Node selection → `onSelect(nodeId)`
   - Status toggle → `onStatusChange(nodeId, newStatus)`
   - Drag-and-drop reordering

---

## Example JSON for Testing

### Simple Task List
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "type": "container",
  "variant": "container_stack",
  "title": "My Tasks",
  "metadata": { "color": "#06b6d4" },
  "children": [
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "type": "item",
      "variant": "list_row",
      "title": "Buy groceries",
      "metadata": { "status": "active", "priority": "high" }
    },
    {
      "id": "00000000-0000-0000-0000-000000000003",
      "type": "item",
      "variant": "list_row",
      "title": "Walk the dog",
      "metadata": { "status": "completed" }
    }
  ]
}
```

### Recipe Card
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "type": "collection",
  "variant": "grid_card",
  "title": "Spaghetti Carbonara",
  "metadata": {
    "semanticType": "recipe",
    "prepTime": 15,
    "cookTime": 20,
    "servings": 4,
    "description": "Classic Italian pasta dish",
    "color": "#10b981"
  }
}
```

### Nested Folders
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "type": "container",
  "variant": "container_stack",
  "title": "Projects",
  "metadata": { "color": "#8b5cf6" },
  "children": [
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "type": "container",
      "variant": "container_stack",
      "title": "Work",
      "metadata": { "color": "#f59e0b" },
      "children": [
        {
          "id": "00000000-0000-0000-0000-000000000003",
          "type": "item",
          "variant": "list_row",
          "title": "Q4 Report",
          "metadata": { "status": "in_progress" }
        }
      ]
    }
  ]
}
```

### LifeOS Cyberpunk Todo Directory
```json
{
  "id": "00000000-0000-0000-0000-000000000001",
  "type": "container",
  "variant": "resource_directory",
  "title": "Todo",
  "metadata": { "placeholder": "Search tasks..." },
  "children": [
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "type": "container",
      "variant": "folder_row_neon",
      "title": "Groceries",
      "metadata": {
        "color": "#06b6d4",
        "description": "Weekly shopping list",
        "assignee": "icon:ShoppingCart:#06b6d4"
      },
      "children": [
        {
          "id": "00000000-0000-0000-0000-000000000010",
          "type": "item",
          "variant": "task_row_detailed",
          "title": "Buy milk",
          "metadata": {
            "status": "active",
            "description": "Get 2% from Costco",
            "location": "Costco"
          }
        }
      ]
    },
    {
      "id": "00000000-0000-0000-0000-000000000003",
      "type": "container",
      "variant": "folder_row_neon",
      "title": "Home Repairs",
      "metadata": {
        "color": "#f59e0b",
        "description": "Things to fix around the house",
        "assignee": "icon:Wrench:#f59e0b"
      },
      "children": []
    },
    {
      "id": "00000000-0000-0000-0000-000000000004",
      "type": "item",
      "variant": "task_row_detailed",
      "title": "Walk the dog",
      "metadata": {
        "status": "completed",
        "description": "30 minute walk in the park",
        "due_date": "2025-11-29",
        "location": "Central Park",
        "assignee": "icon:Dog:#10b981"
      }
    },
    {
      "id": "00000000-0000-0000-0000-000000000005",
      "type": "item",
      "variant": "task_row_detailed",
      "title": "Schedule dentist appointment",
      "metadata": {
        "status": "not_started",
        "description": "Annual checkup overdue",
        "due_date": "2025-12-15",
        "assignee": { "name": "John", "avatar": "icon:User:#ff6b6b" }
      }
    },
    {
      "id": "00000000-0000-0000-0000-000000000006",
      "type": "item",
      "variant": "task_row_detailed",
      "title": "Review quarterly report",
      "metadata": {
        "status": "in_progress",
        "description": "Q4 financials need review before Friday",
        "due_date": "2025-12-01"
      }
    }
  ]
}
```
