# Component Manifest - ViewEngine Variant Reference

> **Purpose:** This document serves as the **AI's reference** for knowing which ViewEngine variant to generate for any given use case. Each variant is documented with its structure requirements and metadata configuration.

---

## Quick Reference Table

| Variant | Category | Use Case |
|---------|----------|----------|
| `view_list_stack` | Layout | Vertical list of items |
| `view_directory` | Layout | File/folder browser |
| `view_dashboard_masonry` | Layout | Dashboard with cards in grid |
| `view_dashboard_responsive` | Layout | Auto-responsive dashboard grid |
| `row_simple` | Row | Basic text row |
| `row_detail_check` | Row | Task with checkbox/status |
| `row_neon_group` | Row | Folder/group with accent |
| `row_input_stepper` | Row | Numeric +/- input |
| `row_input_currency` | Row | Currency input field |
| `card_media_top` | Card | Card with image header |
| `card_progress_simple` | Progress | Single progress bar |
| `card_progress_stacked` | Progress | Stacked segments bar |
| `card_progress_multi` | Progress | Multiple progress bars |
| `card_chart_bar` | Chart | Bar chart |
| `card_chart_line` | Chart | Line/area chart |
| `card_chart_pie` | Chart | Pie/donut chart |
| `card_chart_radar` | Chart | Radar/spider chart |

---

## Layout Variants

### `view_list_stack`

**Category:** Layout  
**Description:** Vertical stack container that renders children in a column.  
**When to Use:** Default container for lists of items, tasks, or any vertical sequence.

**Required Children:** Yes (any type)  
**Node Type:** `container`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `gap` | number | 8 | Gap between children in pixels |
| `show_title` | boolean | true | Show container title as header |

**Example:**
```json
{
  "id": "...",
  "type": "container",
  "variant": "view_list_stack",
  "title": "My Tasks",
  "metadata": {},
  "children": [...]
}
```

---

### `view_directory`

**Category:** Layout  
**Description:** Directory-style view with folder/file hierarchy.  
**When to Use:** File browsers, nested folder structures, hierarchical navigation.

**Required Children:** Yes (containers become folders, items become files)  
**Node Type:** `container`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `show_path` | boolean | true | Show breadcrumb path |
| `sortable` | boolean | false | Allow drag-to-reorder |

---

### `view_dashboard_masonry`

**Category:** Layout  
**Description:** Responsive CSS Grid layout for dashboard cards. Uses Tailwind responsive breakpoints for mobile-first design.  
**When to Use:** Dashboards, analytics views, multi-card layouts.

**Required Children:** Yes (typically progress/chart cards)  
**Node Type:** `container`

**Responsive Behavior:**
| Breakpoint | Columns | Class |
|------------|---------|-------|
| Mobile (default) | 1 | `grid-cols-1` |
| Tablet (md: 768px+) | 2 | `md:grid-cols-2` |
| Desktop (lg: 1024px+) | 3 | `lg:grid-cols-3` |

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `title` | string | node.title | Section title |
| `subtitle` | string | - | Optional subtitle |
| `show_title` | boolean | true | Show section header |

**Child Metadata (col_span):**
| Value | Behavior | Description |
|-------|----------|-------------|
| `undefined` / `1` | Single column | Default, one grid cell |
| `2` | Two columns | Spans 2 columns on md+ (1 on mobile) |
| `'full'` | Full width | Spans all columns at every breakpoint (`col-span-full`) |

**Example:**
```json
{
  "id": "...",
  "type": "container",
  "variant": "view_dashboard_masonry",
  "title": "Finance Dashboard",
  "metadata": {},
  "children": [
    {
      "id": "...",
      "type": "item",
      "variant": "card_progress_simple",
      "title": "Budget",
      "metadata": { "value": 750, "max": 1000 }
    },
    {
      "id": "...",
      "type": "item",
      "variant": "card_chart_pie",
      "title": "Spending",
      "metadata": { "col_span": "full", "data": [...] }
    }
  ]
}
```

**Layout Result:**
```
Mobile (< 768px):
┌───────────────────────────────────┐
│ Budget Card                        │
├───────────────────────────────────┤
│ Spending Chart (col_span: full)   │
└───────────────────────────────────┘

Tablet/Desktop (≥ 768px):
┌────────────────┬─────────────────┐
│ Budget Card    │ Other Card      │
├────────────────┴─────────────────┤
│ Spending Chart (col_span: full)  │
└──────────────────────────────────┘
```

---

### `view_dashboard_responsive`

**Category:** Layout  
**Description:** Auto-responsive grid that adjusts columns based on container width.  
**When to Use:** When exact column count should adapt to screen size.

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `min_card_width` | number | 280 | Minimum card width in pixels |
| `gap` | number | 16 | Gap between cards |

---

## Row Variants

### `row_simple`

**Category:** Row  
**Description:** Simple text row with optional subtitle and chevron.  
**When to Use:** Basic list items, simple navigation items.

**Required Children:** No  
**Node Type:** `item`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `subtitle` | string | - | Secondary text below title |
| `icon` | string | - | Lucide icon name |
| `show_chevron` | boolean | true | Show navigation chevron |

---

### `row_detail_check`

**Category:** Row  
**Description:** Task row with checkbox, priority badge, and due date.  
**When to Use:** Todo items, task lists, actionable items with status.

**Required Children:** No  
**Node Type:** `item`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `status` | 'active' \| 'completed' \| 'pending' | 'active' | Task status |
| `priority` | 'low' \| 'medium' \| 'high' | - | Priority level |
| `due_date` | string (ISO) | - | Due date |
| `assignee` | string | - | Assignee name/ID |

**Example:**
```json
{
  "id": "...",
  "type": "item",
  "variant": "row_detail_check",
  "title": "Complete proposal",
  "metadata": {
    "status": "active",
    "priority": "high",
    "due_date": "2024-12-15"
  }
}
```

---

### `row_neon_group`

**Category:** Row  
**Description:** Folder/group row with colored neon accent bar.  
**When to Use:** Folders, categories, groupings with visual distinction.

**Required Children:** Optional (becomes navigable if has children)  
**Node Type:** `container`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `color` | string (hex) | #06b6d4 | Accent color |
| `icon` | string | 'Folder' | Lucide icon name |
| `item_count` | number | auto | Item count (auto-calculated if children exist) |

---

### `row_input_stepper`

**Category:** Row  
**Description:** Row with +/- stepper controls for numeric values.  
**When to Use:** Quantity inputs, counters, numeric adjustments.

**Required Children:** No  
**Node Type:** `item`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | 0 | Current value |
| `min` | number | 0 | Minimum value |
| `max` | number | 100 | Maximum value |
| `step` | number | 1 | Increment step |

---

### `row_input_currency`

**Category:** Row  
**Description:** Row for currency input with formatting.  
**When to Use:** Budget entries, price inputs, financial values.

**Required Children:** No  
**Node Type:** `item`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | 0 | Current value |
| `currency` | string | 'USD' | Currency code |
| `currency_symbol` | string | '$' | Display symbol |

---

## Card Variants

### `card_media_top`

**Category:** Card  
**Description:** Card with image/media area at top, content below.  
**When to Use:** Recipe cards, product cards, content with images.

**Required Children:** No  
**Node Type:** `item` or `collection`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `media` | string (URL) | - | Image URL |
| `accent_color` | string (hex) | #06b6d4 | Fallback accent bar color |
| `description` | string | - | Subtitle/description text |
| `badge_1` | string | - | First badge text |
| `badge_1_icon` | 'clock' | - | Badge icon |
| `badge_2` | string | - | Second badge text |
| `badge_3` | string | - | Third badge text |

---

## Progress Variants

### `card_progress_simple`

**Category:** Progress  
**Description:** Single large progress bar with value/max display.  
**When to Use:** Simple goal tracking, single metric progress.

**Required Children:** Optional (can aggregate from children)  
**Node Type:** `item`

**Data Sources (priority order):**
1. Direct `value`/`max` in metadata
2. Sum of `target_key` from children

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `value` | number | (aggregated) | Current value |
| `max` | number | 100 | Maximum/goal value |
| `target_key` | string | 'amount' | Metadata key to sum from children |
| `color` | string (hex) | #06b6d4 | Progress bar color |
| `format` | 'number' \| 'currency' \| 'percent' | 'number' | Display format |
| `currency_symbol` | string | '$' | Currency symbol |
| `show_label` | boolean | true | Show "X of Y" label |
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Bar height |

**Example:**
```json
{
  "id": "...",
  "type": "item",
  "variant": "card_progress_simple",
  "title": "Monthly Budget",
  "metadata": {
    "value": 2450,
    "max": 3000,
    "format": "currency",
    "color": "#06b6d4"
  }
}
```

---

### `card_progress_stacked`

**Category:** Progress  
**Description:** Single bar with multiple colored segments showing breakdown.  
**When to Use:** Budget breakdowns, category proportions within a total.

**Required Children:** Optional (can aggregate grouped from children)  
**Node Type:** `item`

**Data Sources (priority order):**
1. Direct `segments` array in metadata
2. Aggregated from children grouped by `group_by` key

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `max` | number | (total) | Budget/max value |
| `segments` | array | - | Direct segments `[{label, value, color?}]` |
| `target_key` | string | 'amount' | Key to sum from children |
| `group_by` | string | 'category' | Key to group children by |
| `format` | 'number' \| 'currency' \| 'percent' | 'currency' | Display format |
| `show_legend` | boolean | true | Show color legend |
| `show_total` | boolean | true | Show total value |
| `size` | 'sm' \| 'md' \| 'lg' | 'md' | Bar height |

**Example:**
```json
{
  "id": "...",
  "type": "item",
  "variant": "card_progress_stacked",
  "title": "Spending Breakdown",
  "metadata": {
    "max": 3000,
    "format": "currency",
    "segments": [
      { "label": "Groceries", "value": 800, "color": "#06b6d4" },
      { "label": "Dining", "value": 450, "color": "#ec4899" },
      { "label": "Gas", "value": 200, "color": "#a855f7" }
    ]
  }
}
```

---

### `card_progress_multi`

**Category:** Progress  
**Description:** Multiple individual progress bars stacked vertically.  
**When to Use:** Category budgets with individual limits, multi-goal tracking.

**Required Children:** Optional (can use children as items)  
**Node Type:** `item`

**Data Sources (priority order):**
1. Direct `items` array in metadata
2. Children with `value`/`max` in their metadata
3. Aggregated from children grouped by `group_by`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `items` | array | - | Direct items `[{label, value, max?, color?}]` |
| `target_key` | string | 'amount' | Key for value in children |
| `max_key` | string | 'budget' | Key for max in children |
| `group_by` | string | 'category' | Group key for aggregation |
| `default_max` | number | 100 | Default max if not specified |
| `format` | 'number' \| 'currency' \| 'percent' | 'currency' | Display format |
| `show_values` | boolean | true | Show value labels |
| `compact` | boolean | false | Compact spacing |
| `limit` | number | 10 | Max items to show |

**Example (with direct items):**
```json
{
  "id": "...",
  "type": "item",
  "variant": "card_progress_multi",
  "title": "Budget Categories",
  "metadata": {
    "format": "currency",
    "items": [
      { "label": "Groceries", "value": 320, "max": 400 },
      { "label": "Dining", "value": 180, "max": 200 },
      { "label": "Gas", "value": 90, "max": 100 }
    ]
  }
}
```

---

## Chart Variants

### `card_chart_bar`

**Category:** Chart  
**Description:** Bar chart visualization using Recharts.  
**When to Use:** Comparing discrete values, monthly comparisons, category totals.

**Required Children:** Optional (can aggregate from children)  
**Node Type:** `item`

**Data Sources:**
1. Direct `data` array in metadata
2. Aggregated from children grouped by `group_by`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `data` | array | - | Data array `[{name, value, color?}]` |
| `target_key` | string | 'amount' | Key to sum from children |
| `group_by` | string | 'category' | Group key |
| `height` | number | 200 | Chart height in pixels |
| `color` | string (hex) | #06b6d4 | Single bar color |
| `horizontal` | boolean | false | Horizontal bars |
| `format` | 'number' \| 'currency' \| 'percent' | 'number' | Tooltip format |

**Example:**
```json
{
  "id": "...",
  "type": "item",
  "variant": "card_chart_bar",
  "title": "Monthly Spending",
  "metadata": {
    "format": "currency",
    "data": [
      { "name": "Jan", "value": 2400 },
      { "name": "Feb", "value": 1800 },
      { "name": "Mar", "value": 3200 }
    ]
  }
}
```

---

### `card_chart_line`

**Category:** Chart  
**Description:** Line/area chart for showing trends over time.  
**When to Use:** Time series, trends, continuous data.

**Required Children:** Optional (can use children as data points)  
**Node Type:** `item`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `data` | array | - | Data array `[{name, value, ...}]` |
| `series` | array | - | Multi-series config `[{key, color?, name?}]` |
| `height` | number | 200 | Chart height |
| `color` | string (hex) | #06b6d4 | Line color |
| `show_area` | boolean | true | Fill area under line |
| `curved` | boolean | true | Use curved lines |
| `show_dots` | boolean | false | Show data point dots |
| `show_grid` | boolean | true | Show grid lines |
| `format` | 'number' \| 'currency' \| 'percent' | 'number' | Tooltip format |

**Example (single series):**
```json
{
  "id": "...",
  "type": "item",
  "variant": "card_chart_line",
  "title": "Weight Trend",
  "metadata": {
    "format": "number",
    "data": [
      { "name": "Jan", "value": 185 },
      { "name": "Feb", "value": 182 },
      { "name": "Mar", "value": 178 }
    ]
  }
}
```

**Example (multi-series):**
```json
{
  "metadata": {
    "series": [
      { "key": "income", "name": "Income", "color": "#22c55e" },
      { "key": "expenses", "name": "Expenses", "color": "#ef4444" }
    ],
    "data": [
      { "name": "Jan", "income": 5000, "expenses": 3500 },
      { "name": "Feb", "income": 5200, "expenses": 3800 }
    ]
  }
}
```

---

### `card_chart_pie`

**Category:** Chart  
**Description:** Pie or donut chart for proportions.  
**When to Use:** Category breakdowns, percentage distributions.

**Required Children:** Optional (can aggregate from children)  
**Node Type:** `item`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `data` | array | - | Data array `[{name, value, color?}]` |
| `target_key` | string | 'amount' | Key to sum from children |
| `group_by` | string | 'category' | Group key |
| `height` | number | 200 | Chart height |
| `donut` | boolean | true | Render as donut (with hole) |
| `inner_radius` | number | 60 | Inner radius for donut |
| `outer_radius` | number | 80 | Outer radius |
| `show_legend` | boolean | true | Show color legend |
| `show_center` | boolean | true | Show center label (donut only) |
| `center_label` | string | (total) | Custom center text |
| `format` | 'number' \| 'currency' \| 'percent' | 'currency' | Value format |

**Example:**
```json
{
  "id": "...",
  "type": "item",
  "variant": "card_chart_pie",
  "title": "Expense Categories",
  "metadata": {
    "format": "currency",
    "data": [
      { "name": "Housing", "value": 1500 },
      { "name": "Food", "value": 600 },
      { "name": "Transport", "value": 400 }
    ]
  }
}
```

---

### `card_chart_radar`

**Category:** Chart  
**Description:** Radar/spider chart for multi-dimensional comparison.  
**When to Use:** Skills assessment, multi-attribute comparison, stats.

**Required Children:** Optional (can use children as dimensions)  
**Node Type:** `item`

**Metadata Configuration:**
| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `data` | array | - | Data array `[{name, value, ...}]` |
| `series` | array | - | Multi-series config |
| `height` | number | 250 | Chart height |
| `color` | string (hex) | #06b6d4 | Fill color |
| `fill_opacity` | number | 0.3 | Fill opacity (0-1) |
| `max` | number | auto | Maximum scale value |
| `show_grid` | boolean | true | Show polar grid |
| `show_dots` | boolean | true | Show data points |
| `show_legend` | boolean | true | Show legend (multi-series) |
| `format` | 'number' \| 'percent' | 'number' | Tooltip format |

**Example:**
```json
{
  "id": "...",
  "type": "item",
  "variant": "card_chart_radar",
  "title": "Fitness Stats",
  "metadata": {
    "max": 100,
    "data": [
      { "name": "Strength", "value": 75 },
      { "name": "Cardio", "value": 85 },
      { "name": "Flexibility", "value": 60 },
      { "name": "Balance", "value": 70 }
    ]
  }
}
```

---

## Color Reference (Cyberpunk Theme)

| Name | Hex | Usage |
|------|-----|-------|
| Primary Cyan | `#06b6d4` | Primary accent, first in series |
| Pink | `#ec4899` | Secondary accent |
| Purple | `#a855f7` | Tertiary accent |
| Green | `#22c55e` | Success, positive |
| Yellow | `#eab308` | Warning, attention |
| Orange | `#f97316` | Caution |
| Blue | `#3b82f6` | Info |
| Red | `#ef4444` | Error, over-budget |

---

## Smart Aggregation

All progress and chart variants support **automatic aggregation** from children using the `useChildAggregation` hook.

**How it works:**
1. If direct `data`/`value` is provided in metadata → use it directly
2. Otherwise, iterate through `node.children`
3. Sum values from `metadata[target_key]` (default: 'amount')
4. Optionally group by `metadata[group_by]` (default: 'category')

**Example - Budget with Children:**
```json
{
  "variant": "card_progress_stacked",
  "title": "Monthly Spending",
  "metadata": { 
    "max": 3000,
    "target_key": "amount",
    "group_by": "category"
  },
  "children": [
    { "title": "Groceries 1", "metadata": { "amount": 150, "category": "Groceries" } },
    { "title": "Groceries 2", "metadata": { "amount": 200, "category": "Groceries" } },
    { "title": "Gas", "metadata": { "amount": 80, "category": "Transport" } }
  ]
}
```
→ Automatically aggregates to: Groceries: $350, Transport: $80

---

## AI Usage Guidelines

1. **Choose the right variant** based on the use case (see Quick Reference Table)
2. **Use smart aggregation** when data comes from children (set `target_key` and `group_by`)
3. **Use direct data** when you have explicit arrays to display
4. **Match format to domain**: Use `'currency'` for money, `'percent'` for ratios, `'number'` for counts
5. **Use col_span** in dashboard layouts to control card widths
6. **Apply colors** that match the category or use the default cyberpunk palette
