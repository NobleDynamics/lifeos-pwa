# Future Feature: Server-Driven UI (SDUI) / AI-Driven Dynamic Layouts

**Version:** 1.0.0  
**Status:** Specification Only (Not Implemented)  
**Reserved Variant:** `custom_layout`  
**Last Updated:** December 2025

---

## 1. Executive Summary

While the ViewEngine currently relies on **Standard Variants** (e.g., `row_detail_check`, `card_media_top`) for consistency and performance, we are reserving architectural capacity for **Server-Driven UI (SDUI)**.

This capability will allow the LangGraph AI to **invent completely new layouts on the fly** by writing a recursive JSON "Blueprint" in `meta_data.layout`, instead of selecting a pre-built React component.

### 1.1 Why This Matters
| Benefit | Description |
|---------|-------------|
| **AI Creativity** | The AI can design domain-specific UIs without developer intervention |
| **Zero Deployment** | New layouts appear instantly—no code push required |
| **User Customization** | Power users can tweak layouts via JSON |
| **Hybrid Coexistence** | Standard variants and custom layouts live side-by-side |

### 1.2 Design Principles
1. **Safety First:** No raw HTML injection—only trusted Atom primitives
2. **Metadata-Driven:** Layout props map to existing `meta_data` fields
3. **Tailwind-Only Styling:** No arbitrary CSS—only Tailwind classes
4. **Graceful Degradation:** Invalid layouts fall back to a generic card

---

## 2. The Trigger: `custom_layout` Variant

When the ViewEngine encounters `node.variant === 'custom_layout'`, it delegates rendering to the **SDUI Interpreter** instead of looking up a registered component.

```typescript
// In ViewEngine.tsx (future implementation)
if (node.variant === 'custom_layout' && node.metadata?.layout) {
  return <CustomLayoutRenderer layout={node.metadata.layout} data={node.metadata} />;
}
```

---

## 3. The Blueprint Schema

### 3.1 Core Types

```typescript
/**
 * Atom Types - The building blocks of dynamic layouts
 * Each maps to a hardcoded, secure React implementation
 */
type AtomType = 
  | 'container'   // Flexbox/Grid wrapper
  | 'text'        // Typography element
  | 'image'       // Media element
  | 'icon'        // Lucide icon
  | 'badge'       // Pill/tag element
  | 'button'      // Interactive element
  | 'spacer'      // Flexible gap
  | 'divider'     // Horizontal rule
  | 'progress'    // Progress bar
  | 'avatar';     // User/item avatar

/**
 * The recursive layout structure
 */
interface LayoutAtom {
  /** The primitive type to render */
  type: AtomType;
  
  /** Tailwind CSS classes (sanitized) */
  style?: string;
  
  /** Props that map metadata fields to atom properties */
  props?: Record<string, string | number | boolean>;
  
  /** Nested children (for containers) */
  children?: LayoutAtom[];
  
  /** Conditional rendering expression */
  showIf?: string;  // e.g., "status === 'active'"
}

/**
 * The root layout object stored in meta_data
 */
interface CustomLayout {
  /** Version for future migrations */
  version: 1;
  
  /** The root atom (typically a container) */
  root: LayoutAtom;
  
  /** Optional: Atom-level event handlers */
  actions?: Record<string, LayoutAction>;
}

interface LayoutAction {
  type: 'navigate' | 'mutate' | 'emit';
  payload: Record<string, unknown>;
}
```

### 3.2 Property Mapping

Atom `props` use **dot notation** to reference metadata fields:

| Props Key | Meaning | Example |
|-----------|---------|---------|
| `content` | Text content | `"content": "title"` → renders `meta_data.title` |
| `src` | Image source | `"src": "image_url"` → renders `meta_data.image_url` |
| `icon` | Lucide icon name | `"icon": "status_icon"` → renders icon from `meta_data.status_icon` |
| `value` | Numeric value | `"value": "progress"` → renders `meta_data.progress` |
| `$literal` | Static value | `"content": "$literal:Hello"` → renders "Hello" literally |

---

## 4. Atom Registry (Implementation Reference)

When we build the interpreter, each Atom maps to a secure React implementation:

| Atom | React Implementation | Props Handled |
|------|---------------------|---------------|
| `container` | `<div className={style}>{children}</div>` | `children` |
| `text` | `<span className={style}>{data[props.content]}</span>` | `content` |
| `image` | `<img className={style} src={data[props.src]} loading="lazy" />` | `src`, `alt` |
| `icon` | `<LucideIcon name={data[props.icon] \|\| props.icon} />` | `icon`, `size` |
| `badge` | `<Badge className={style}>{data[props.content]}</Badge>` | `content`, `variant` |
| `button` | `<Button className={style} onClick={...}>{...}</Button>` | `content`, `action` |
| `spacer` | `<div className={style} />` | `size` |
| `divider` | `<hr className={style} />` | — |
| `progress` | `<Progress value={data[props.value]} className={style} />` | `value`, `max` |
| `avatar` | `<Avatar src={data[props.src]} fallback={...} />` | `src`, `fallback` |

---

## 5. Example Payloads

### 5.1 Wine Tracker Card (AI-Generated)

**Scenario:** User asks AI to "design a wine card with the vintage year prominently displayed."

```json
{
  "id": "wine-123",
  "variant": "custom_layout",
  "title": "Cabernet Sauvignon",
  "meta_data": {
    "image_url": "https://images.example.com/wine.jpg",
    "vintage": "2018",
    "region": "Napa Valley",
    "rating": 4.5,
    "layout": {
      "version": 1,
      "root": {
        "type": "container",
        "style": "relative w-full h-48 rounded-xl overflow-hidden group",
        "children": [
          {
            "type": "image",
            "style": "w-full h-full object-cover transition-transform group-hover:scale-105",
            "props": { "src": "image_url" }
          },
          {
            "type": "container",
            "style": "absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
          },
          {
            "type": "text",
            "style": "absolute top-3 right-3 text-5xl font-black text-white/90 drop-shadow-lg",
            "props": { "content": "vintage" }
          },
          {
            "type": "container",
            "style": "absolute bottom-3 left-3 right-3",
            "children": [
              {
                "type": "text",
                "style": "text-lg font-semibold text-white",
                "props": { "content": "title" }
              },
              {
                "type": "text",
                "style": "text-sm text-white/70",
                "props": { "content": "region" }
              }
            ]
          }
        ]
      }
    }
  }
}
```

### 5.2 Fitness Tracker Row (AI-Generated)

**Scenario:** User asks AI to "show my workout with calories and duration in a row."

```json
{
  "id": "workout-456",
  "variant": "custom_layout",
  "title": "Morning Run",
  "meta_data": {
    "calories": 342,
    "duration_min": 28,
    "status": "completed",
    "icon_name": "activity",
    "layout": {
      "version": 1,
      "root": {
        "type": "container",
        "style": "flex items-center gap-4 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30",
        "children": [
          {
            "type": "icon",
            "style": "w-10 h-10 text-cyan-400",
            "props": { "icon": "icon_name" }
          },
          {
            "type": "container",
            "style": "flex-1",
            "children": [
              {
                "type": "text",
                "style": "font-medium text-foreground",
                "props": { "content": "title" }
              },
              {
                "type": "text",
                "style": "text-sm text-muted-foreground",
                "props": { "content": "$literal:Completed" }
              }
            ]
          },
          {
            "type": "container",
            "style": "flex gap-3 items-center",
            "children": [
              {
                "type": "badge",
                "style": "bg-orange-500/20 text-orange-400",
                "props": { "content": "calories", "suffix": " cal" }
              },
              {
                "type": "badge",
                "style": "bg-blue-500/20 text-blue-400",
                "props": { "content": "duration_min", "suffix": " min" }
              }
            ]
          }
        ]
      }
    }
  }
}
```

### 5.3 Inventory Stock Card with Progress

```json
{
  "id": "stock-789",
  "variant": "custom_layout",
  "title": "Oat Milk",
  "meta_data": {
    "qty_current": 2,
    "qty_max": 6,
    "stock_percent": 33,
    "expiry": "2025-01-15",
    "layout": {
      "version": 1,
      "root": {
        "type": "container",
        "style": "p-4 rounded-lg bg-card border space-y-3",
        "children": [
          {
            "type": "container",
            "style": "flex justify-between items-start",
            "children": [
              {
                "type": "text",
                "style": "font-semibold text-foreground",
                "props": { "content": "title" }
              },
              {
                "type": "badge",
                "style": "bg-yellow-500/20 text-yellow-400",
                "props": { "content": "expiry", "prefix": "Exp: " }
              }
            ]
          },
          {
            "type": "progress",
            "style": "h-2",
            "props": { "value": "stock_percent", "max": 100 }
          },
          {
            "type": "text",
            "style": "text-sm text-muted-foreground",
            "props": { "content": "$template:{qty_current} of {qty_max} in stock" }
          }
        ]
      }
    }
  }
}
```

---

## 6. Security Constraints

### 6.1 Prohibited Patterns

| Risk | Mitigation |
|------|------------|
| **XSS Injection** | No raw HTML—only JSON Atoms mapping to hardcoded React |
| **Layout Breaking** | Block dangerous Tailwind classes (`fixed`, `absolute` on root, extreme `z-index`) |
| **Script Injection** | No `onClick` handlers with arbitrary code—only named actions |
| **Resource Abuse** | Rate-limit image URLs, validate against allowlist domains |

### 6.2 Tailwind Class Allowlist (Optional)

If stricter security is needed, we can implement a sanitizer:

```typescript
const BLOCKED_CLASSES = [
  /^fixed$/,
  /^absolute$/,      // Only allow in nested containers
  /^z-\[?\d{3,}/,    // Block z-index > 99
  /^(w|h)-screen$/,  // Block viewport-filling
];

function sanitizeStyle(style: string): string {
  return style
    .split(' ')
    .filter(cls => !BLOCKED_CLASSES.some(re => re.test(cls)))
    .join(' ');
}
```

---

## 7. AI Prompt Engineering Guide

When prompting LangGraph to generate layouts, include these instructions:

### 7.1 System Prompt Addition

```markdown
## Dynamic Layout Generation

When the user requests a custom card/row design, you may generate a `custom_layout` variant.

**Rules:**
1. Always set `variant: "custom_layout"` and include `meta_data.layout`
2. The layout must have `version: 1` and a `root` atom
3. Use only these atom types: container, text, image, icon, badge, button, spacer, divider, progress, avatar
4. Map data using `props` (e.g., `{ "content": "title" }` reads from `meta_data.title`)
5. Use Tailwind CSS classes for styling—no arbitrary CSS
6. Keep layouts shallow (max 4 levels of nesting)
7. Prefer `$literal:` prefix for static text
8. Test your JSON structure mentally before outputting
```

### 7.2 Example User Prompt → AI Response

**User:** "Create a card for my book collection that shows the cover, title, author, and my reading progress."

**AI (generates):**
```json
{
  "variant": "custom_layout",
  "meta_data": {
    "cover_url": "",
    "title": "",
    "author": "",
    "pages_read": 0,
    "pages_total": 0,
    "progress_percent": 0,
    "layout": {
      "version": 1,
      "root": {
        "type": "container",
        "style": "flex gap-4 p-3 bg-card rounded-lg border",
        "children": [
          {
            "type": "image",
            "style": "w-16 h-24 rounded object-cover flex-shrink-0",
            "props": { "src": "cover_url" }
          },
          {
            "type": "container",
            "style": "flex-1 flex flex-col justify-between",
            "children": [
              {
                "type": "text",
                "style": "font-medium text-foreground line-clamp-1",
                "props": { "content": "title" }
              },
              {
                "type": "text",
                "style": "text-sm text-muted-foreground",
                "props": { "content": "author" }
              },
              {
                "type": "progress",
                "style": "h-1.5 mt-2",
                "props": { "value": "progress_percent" }
              }
            ]
          }
        ]
      }
    }
  }
}
```

---

## 8. Implementation Roadmap

### Phase 1: Schema Reservation (Current)
- [x] Document the SDUI specification
- [x] Reserve `custom_layout` variant name
- [x] Ensure `meta_data` JSONB can store layout objects

### Phase 2: Basic Interpreter
- [ ] Create `CustomLayoutRenderer.tsx` component
- [ ] Implement core atoms: `container`, `text`, `image`, `icon`, `badge`
- [ ] Add to ViewEngine variant resolution

### Phase 3: Advanced Features
- [ ] Implement `showIf` conditional rendering
- [ ] Add `actions` for button interactions
- [ ] Template string interpolation (`$template:`)
- [ ] Tailwind class sanitization

### Phase 4: AI Integration
- [ ] Add layout generation to LangGraph toolset
- [ ] Create prompt templates for common patterns
- [ ] Build layout validation tool

---

## 9. Compatibility Notes

### 9.1 Data Model Compatibility
The current `resources.meta_data` JSONB column **already supports** this feature:
- No schema changes required
- Layout JSON is just another metadata field
- Existing queries remain unaffected

### 9.2 ViewEngine Compatibility
Standard variants and custom layouts coexist:
```tsx
// A list can mix both:
[
  { variant: 'row_detail_check', ... },    // Standard
  { variant: 'custom_layout', ... },        // AI-generated
  { variant: 'row_simple', ... },           // Standard
]
```

### 9.3 Migration Path
If we later decide custom layouts are too complex:
1. Query all `variant = 'custom_layout'` nodes
2. Analyze common patterns
3. Convert to new standard variants
4. Batch-update variant names

---

## 10. Appendix: Full TypeScript Types

```typescript
// src/engine/types/sdui.ts (Future)

export type AtomType =
  | 'container'
  | 'text'
  | 'image'
  | 'icon'
  | 'badge'
  | 'button'
  | 'spacer'
  | 'divider'
  | 'progress'
  | 'avatar';

export interface LayoutAtom {
  type: AtomType;
  style?: string;
  props?: Record<string, string | number | boolean>;
  children?: LayoutAtom[];
  showIf?: string;
}

export interface LayoutAction {
  type: 'navigate' | 'mutate' | 'emit';
  payload: Record<string, unknown>;
}

export interface CustomLayout {
  version: 1;
  root: LayoutAtom;
  actions?: Record<string, LayoutAction>;
}

export interface CustomLayoutNode {
  id: string;
  variant: 'custom_layout';
  title: string;
  meta_data: {
    layout: CustomLayout;
    [key: string]: unknown;
  };
}

// Type guard
export function isCustomLayoutNode(node: unknown): node is CustomLayoutNode {
  return (
    typeof node === 'object' &&
    node !== null &&
    'variant' in node &&
    (node as any).variant === 'custom_layout' &&
    'meta_data' in node &&
    typeof (node as any).meta_data?.layout === 'object'
  );
}
```

---

**Document End**

*This specification ensures our data model remains forward-compatible with AI-driven layout generation. No implementation is required until Phase 2.*
