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

### Development Cycle
```
1. Edit JSON in Sandbox textarea
2. Click "Preview" to see ViewEngine render it
3. Identify needed variant features
4. Create/modify variant component in src/engine/components/variants/
5. Test in Sandbox → Repeat
6. Once stable, integrate into main app
```

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
└── components/
    ├── ViewEngine.tsx          # Main recursive renderer
    ├── DebugNode.tsx           # Fallback for unknown variants
    ├── hooks/
    │   └── useRenderChildren.tsx
    └── variants/               # ⭐ ADD NEW VARIANTS HERE
        ├── ListRow.tsx         # list_row variant
        ├── GridCard.tsx        # grid_card variant
        └── ContainerStack.tsx  # container_stack variant
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
ShellNavigationProvider { targetNodeId }
    ↓
layout_app_shell
    ├── Header (shows current title, back button when deep)
    ├── Viewport → renders targetNodeId OR active tab
    └── Tab Bar (always visible, highlights containing tab)
```

**Key Principle:** The App Shell never gets swapped out. Only the viewport content changes based on navigation. This ensures:
- Bottom tabs are always visible
- Header chrome stays persistent
- Browser back button works correctly
- Input interactions don't lose state

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
| `useNode()` | `{ node, depth, rootId, parentId }` | Full node context |
| `useNodeMeta<T>(key, default?)` | `T` | Type-safe metadata access |
| `useIsRoot()` | `boolean` | Check if current node is tree root |
| `useHasChildren()` | `boolean` | Check if node has children |
| `useChildCount()` | `number` | Count of direct children |
| `useRenderChildren()` | `() => ReactNode` | Render children helper |

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
**Structure:** Persistent Header + Viewport + Bottom Tab Bar
**Use for:** Top-level App Containers (e.g., "Household", "Health")

**Persistent Shell Architecture:** This component implements the "persistent shell" pattern. The shell chrome (header, tabs) is always visible while the viewport content changes based on navigation.

```
┌────────────────────────────────────────────────┐
│  [←] Current Title                             │  ← Back button when deep
├────────────────────────────────────────────────┤
│                                                │
│  Viewport Content                              │  ← Changes based on targetNodeId
│  (Active Tab OR drilled-in folder)             │
│                                                │
├────────────────────────────────────────────────┤
│  [Tab 1]   [Tab 2]   [Tab 3]   [Tab 4]         │  ← Always visible
└────────────────────────────────────────────────┘
```

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
│  [ Pill 1 ] [ Pill 2 ] [ Pill 3 ]              │
├────────────────────────────────────────────────┤
│                                                │
│  Active Tab Content                            │
│                                                │
└────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `default_tab_id` | string | UUID of child to show first (optional) |

**Behavior:**
- **Segmented Control:** Renders children as a horizontal scrollable list of pills.
- **Nested:** Designed to sit inside `layout_app_shell` or other containers.

**Example:**
```json
{
  "variant": "layout_top_tabs",
  "title": "Shopping",
  "children": [
    { "title": "Lists", "variant": "view_list_stack", ... },
    { "title": "Items", "variant": "view_directory", ... }
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
**Use for:** Pantries, wardrobes, galleries

```
┌────────────────────────────────────────────────┐
│ [ Card 1 ]  [ Card 2 ]                         │
│ [ Card 3 ]  [ Card 4 ]                         │
└────────────────────────────────────────────────┘
```

**Slots:**
| Slot | Type | Description |
|------|------|-------------|
| `headline` | string | Optional section title |
| `subtext` | string | Optional description |

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

---

## Cards (Grid Items)

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
