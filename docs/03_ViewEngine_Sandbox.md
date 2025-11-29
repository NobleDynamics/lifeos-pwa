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

## Built-in Variants Reference

### `list_row`
**Use for:** Task items, simple list entries
**Reads from metadata:** `status`, `priority`, `dueDate`, `color`
**Features:**
- Status icon (Circle → PlayCircle → CheckCircle)
- Priority badge
- Due date display
- Strikethrough on completed

### `grid_card`
**Use for:** Recipes, workouts, documents
**Reads from metadata:** `imageUrl`, `description`, `prepTime`, `cookTime`, `servings`, `duration`, `semanticType`, `color`
**Features:**
- Optional image/thumbnail
- Type-specific icon based on `semanticType`
- Metadata badges

### `container_stack`
**Use for:** Folders, collapsible sections
**Reads from metadata:** `color`, `description`
**Features:**
- Collapsible children
- Cyberpunk neon glow border
- Child count badge
- Recursively renders children

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
- Yellow warning styling
- Still renders children (tree doesn't break)
- Useful for developing new variants

---

## Phase 2 Roadmap (Future)

Once variants are stable in Sandbox:

1. **Connect to Database**
   - Transform `resources` table rows into Node trees
   - Map `resource_type` → `node.type` using `ResourceTypeToNodeType`
   - Store `variant` in `resources.meta_data.variant`

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
