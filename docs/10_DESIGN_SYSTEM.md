# LifeOS Design System

> **Purpose:** Single source of truth for all visual styling decisions. Reference this document before implementing any UI component to ensure consistency across the application.

---

## 1. Color Palette

### Primary (Cyan Accent)
| Token | Hex | Usage |
|-------|-----|-------|
| `primary-DEFAULT` | `#06b6d4` | Primary accent color, active states |
| `primary-50` | `#ecfeff` | Lightest tint |
| `primary-100` | `#cffafe` | Light backgrounds |
| `primary-200` | `#a5f3fc` | Hover states (light mode) |
| `primary-300` | `#67e8f9` | Borders, dividers |
| `primary-400` | `#22d3ee` | Icons, secondary accents |
| `primary-500` | `#06b6d4` | **Main primary** |
| `primary-600` | `#0891b2` | Darker primary |
| `primary-700` | `#0e7490` | Button hover |
| `primary-800` | `#155e75` | Dark accents |
| `primary-900` | `#164e63` | Very dark primary |
| `primary-950` | `#083344` | Darkest primary |

### Dark (Background Colors)
| Token | Hex | Usage |
|-------|-----|-------|
| `dark-DEFAULT` | `#0a0a0f` | Main app background |
| `dark-50` | `#18181b` | Elevated surfaces (drawer) |
| `dark-100` | `#1f1f23` | Cards, tab bars |
| `dark-200` | `#27272a` | Hover backgrounds |
| `dark-300` | `#3f3f46` | Borders, dividers |
| `dark-400` | `#52525b` | Inactive icons |
| `dark-500` | `#71717a` | Secondary text, labels |
| `dark-600` | `#a1a1aa` | Muted text |
| `dark-700` | `#d4d4d8` | Light text |
| `dark-800` | `#e4e4e7` | Near-white |
| `dark-900` | `#f4f4f5` | White equivalent |

### Accent Colors (Status Indicators)
| Token | Hex | Usage |
|-------|-----|-------|
| `accent-cyan` | `#06b6d4` | Primary accent (same as primary) |
| `accent-pink` | `#ec4899` | Attention, alerts |
| `accent-purple` | `#a855f7` | Special features |
| `accent-green` | `#22c55e` | Success, running, completed |
| `accent-yellow` | `#eab308` | Warning, needs attention |
| `accent-red` | `#ef4444` | Error, failed, danger |
| `accent-blue` | `#3b82f6` | Info, completed |
| `accent-orange` | `#f97316` | Pending, in-progress |

---

## 2. Typography

### Font Families
```css
font-sans: 'Inter', system-ui, sans-serif
font-mono: 'JetBrains Mono', monospace
```

### Font Sizes
| Size | Class | Usage |
|------|-------|-------|
| 10px | `text-[10px]` | Tab labels (bottom nav) |
| 12px | `text-xs` | Labels, badges, timestamps |
| 14px | `text-sm` | Body text, descriptions |
| 16px | `text-base` | Default, form inputs |
| 18px | `text-lg` | Section headers |
| 20px | `text-xl` | Pane titles |
| 24px | `text-2xl` | Hero numbers |

### Font Weights
| Weight | Class | Usage |
|--------|-------|-------|
| 400 | `font-normal` | Body text |
| 500 | `font-medium` | Labels, tab text |
| 600 | `font-semibold` | Section titles |
| 700 | `font-bold` | Page titles |

---

## 3. Component Patterns

### 3.1 Bottom Tab Navigation Bar

> **CANONICAL PATTERN** - All bottom navigation MUST follow this exact structure.

```tsx
// Outer container - accounts for drawer handle spacing
<div 
  className="flex-shrink-0 px-3 pb-2"
  style={{ paddingBottom: `${DRAWER_HANDLE_HEIGHT + 8}px` }}
>
  {/* Tab bar pill container */}
  <div className="flex p-1 bg-dark-100/80 backdrop-blur rounded-xl">
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={cn(
          // Base styles (always applied)
          "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg",
          "text-xs font-medium transition-all duration-200",
          // Conditional styles
          isActive 
            ? "bg-primary/20 text-primary shadow-sm"
            : "text-dark-500 hover:text-white hover:bg-dark-200/50"
        )}
      >
        <TabIcon size={16} />
        {/* Label hidden on inactive tabs (mobile), always shown when active */}
        <span className={isActive ? "" : "hidden sm:inline"}>
          {tab.label}
        </span>
      </button>
    ))}
  </div>
</div>
```

**Key Properties:**
| Property | Value | Reason |
|----------|-------|--------|
| Container bg | `bg-dark-100/80` | Subtle glass effect, not too dark |
| Container blur | `backdrop-blur` | Standard blur (not xl) |
| Container shape | `rounded-xl` | Pill-like corners |
| Container padding | `p-1` | Tight inner padding |
| Button gap | `gap-1.5` | Space between icon and label |
| Button padding | `py-2.5` | Vertical touch target |
| Icon size | `16` | Compact, doesn't dominate |
| Label size | `text-xs` | Small but readable |
| Active bg | `bg-primary/20` | Subtle cyan tint |
| Active text | `text-primary` | Full cyan color |
| Active shadow | `shadow-sm` | Slight elevation |
| Inactive text | `text-dark-500` | Gray, de-emphasized |
| Hover (inactive) | `hover:text-white hover:bg-dark-200/50` | Feedback |

### 3.2 Top Tab Navigation (Segmented Control)

> **CANONICAL PATTERN** - All top/sub-navigation MUST follow this exact structure.

```tsx
// Container wrapper
<div className="px-4 py-3 bg-dark-950 z-10">
  {/* Tab bar pill container */}
  <div className="flex gap-1 p-1 bg-dark-100 rounded-xl">
    {tabs.map(tab => {
      const IconComponent = tab.icon // Optional: 12px icons
      return (
        <button
          key={tab.id}
          className={cn(
            // Base styles - horizontal layout with icon + label
            "flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg",
            "text-xs font-medium transition-all",
            // Conditional styles
            isActive
              ? "bg-primary/20 text-primary"
              : "text-dark-500 hover:text-white"
          )}
        >
          {IconComponent && <IconComponent size={12} />}
          <span>{tab.label}</span>
        </button>
      )
    })}
  </div>
</div>
```

**Key Properties:**
| Property | Value | Reason |
|----------|-------|--------|
| Container bg | `bg-dark-100` | Solid dark, not transparent |
| Container shape | `rounded-xl` | Pill-like corners |
| Container gap | `gap-1` | Space between buttons |
| Container padding | `p-1` | Tight inner padding |
| Button layout | `flex items-center justify-center gap-1` | Horizontal icon + label |
| Button padding | `py-2 px-2` | Compact touch target |
| Button corners | `rounded-lg` | Slightly smaller than container |
| Icon size | `12` | Small, compact icons |
| Text size | `text-xs` | Small but readable |
| Active bg | `bg-primary/20` | Subtle cyan tint (NOT solid) |
| Active text | `text-primary` | Cyan text (NOT white) |
| Inactive text | `text-dark-500` | Gray, de-emphasized |
| Hover (inactive) | `hover:text-white` | Simple color change |

**Top Tabs vs Bottom Tabs Comparison:**
| Aspect | Top Tabs | Bottom Tabs |
|--------|----------|-------------|
| Icon size | `12px` | `16px` |
| Container bg | `bg-dark-100` (solid) | `bg-dark-100/80` (translucent) |
| Blur | None | `backdrop-blur` |
| Label visibility | Always shown | Hidden on inactive (mobile) |
| Purpose | Sub-navigation within a view | App-level navigation |

### 3.3 Header with Breadcrumbs

> **CANONICAL PATTERN** - All app headers MUST follow this exact structure.

```tsx
{/* Header Section - Matches legacy ViewShell styling */}
<div className="px-4 pt-4 pb-2 safe-top flex-shrink-0 z-50">
  {/* Breadcrumbs - Above title, shown when deep in hierarchy */}
  {showBreadcrumbs && (
    <nav className="flex items-center space-x-1 text-sm overflow-x-auto scrollbar-hide py-1 mb-2">
      {/* Home/Root button */}
      <button
        onClick={() => navigateToLevel(0)}
        className="flex items-center space-x-1 px-2 py-1 rounded-md text-dark-400 hover:text-white hover:bg-dark-200/50 transition-colors whitespace-nowrap flex-shrink-0"
      >
        <Home className="w-3.5 h-3.5" />
        <span>{appTitle}</span>
      </button>

      {/* Path items - all except the last one (current) */}
      {breadcrumbItems.slice(0, -1).map(item => (
        <>
          <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
          <button
            onClick={() => navigateToLevel(item.pathIndex)}
            className="px-2 py-1 rounded-md transition-colors whitespace-nowrap max-w-[150px] truncate text-dark-400 hover:text-white hover:bg-dark-200/50"
          >
            {item.title}
          </button>
        </>
      ))}

      {/* Current item (last) - not clickable, cyan color */}
      {breadcrumbItems.length > 0 && (
        <>
          <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
          <span className="px-2 py-1 rounded-md whitespace-nowrap max-w-[150px] truncate text-primary font-medium cursor-default">
            {currentTitle}
          </span>
        </>
      )}
    </nav>
  )}

  {/* Title Row */}
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2 min-w-0 flex-1">
      {/* Back Button (when deep) */}
      {canNavigateBack && (
        <button className="p-1 -ml-1 rounded-lg hover:bg-dark-200 transition-colors">
          <ChevronLeft size={24} className="text-dark-400" />
        </button>
      )}

      {/* App Icon */}
      <AppIcon size={24} className="text-primary flex-shrink-0" />

      {/* Title - Dynamic: shows current folder when deep, app title when at root */}
      <h1 className="text-xl font-bold truncate">{displayTitle}</h1>
    </div>

    {/* Header Actions (right side) */}
    {headerActions}
  </div>
</div>
```

**Key Properties:**
| Property | Value | Reason |
|----------|-------|--------|
| Header padding | `px-4 pt-4 pb-2 safe-top` | Safe area aware |
| Header bg | None (transparent) | Matches legacy ViewShell |
| Header border | None | Removed - legacy had none |
| Breadcrumb text | `text-sm` | Smaller than title |
| Breadcrumb scroll | `overflow-x-auto scrollbar-hide` | Horizontal scrolling |
| Breadcrumb separator | `<ChevronRight className="w-4 h-4 text-dark-500">` | Right chevron |
| Path item hover | `hover:text-white hover:bg-dark-200/50` | Visual feedback |
| Current item color | `text-primary font-medium` | Cyan highlight |
| Back icon size | `24` | Larger for touch |
| Back icon color | `text-dark-400` | Muted, not primary |
| Title size | `text-xl font-bold` | Large, prominent |
| App icon size | `24` | Matches back button |
| App icon color | `text-primary` | Cyan accent |

**When to Show Breadcrumbs:**
- Show when `targetPath.length > 2` (deeper than Tab level)
- Example: `🏠 My Home > Shopping > Grocery List`
- First item (Home) with icon navigates to root
- Middle items are clickable to navigate to that level
- Last item (current) is highlighted in cyan, not clickable

### 3.4 Glass Cards (Glassmorphism)

```css
.glass-card {
  @apply bg-dark-100/60 backdrop-blur-xl border border-white/10 rounded-2xl;
}
```

**Tailwind Usage:**
```tsx
<div className="bg-dark-100/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
  {/* Card content */}
</div>
```

### 3.3 Cyber Border (Neon Glow Effect)

For folders and highlighted containers:
```tsx
<div className="glass-card border-l-4 border-l-primary">
  {/* Folder content */}
</div>
```

### 3.4 Glow Effects (Shadows)

| Class | Effect | Usage |
|-------|--------|-------|
| `shadow-glow` | `0 0 20px rgba(6, 182, 212, 0.3)` | Primary glow |
| `shadow-glow-sm` | `0 0 10px rgba(6, 182, 212, 0.2)` | Subtle glow |
| `shadow-glow-lg` | `0 0 40px rgba(6, 182, 212, 0.4)` | Strong glow |
| `shadow-inner-glow` | `inset 0 0 20px rgba(6, 182, 212, 0.1)` | Inner glow |

### 3.5 Drawer Handle (Cyan Glow)

```typescript
// For icons with dark fill and cyan glow behind
const cyanGlowStyle = {
  color: '#0a0a0f',  // Dark icon
  filter: 'drop-shadow(0 0 4px #00eaff) drop-shadow(0 0 8px #00eaff) drop-shadow(0 0 12px #00eaff)',
}

// For the handle bar itself
const cyanGlowBarStyle = {
  backgroundColor: '#00eaff',
  boxShadow: '0 0 4px #00eaff, 0 0 8px #00eaff, 0 0 12px #00eaff, 0 0 18px rgba(0, 234, 255, 0.7)',
}
```

---

## 4. Spacing Conventions

### Global Constants
| Constant | Value | Location | Usage |
|----------|-------|----------|-------|
| `DRAWER_HANDLE_HEIGHT` | `60px` | `Layout.tsx` | Bottom spacing for all panes |

### Safe Areas
```css
.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left { padding-left: env(safe-area-inset-left); }
.safe-right { padding-right: env(safe-area-inset-right); }
```

### Common Patterns
| Pattern | Classes | Usage |
|---------|---------|-------|
| Page header | `px-4 pt-4 pb-2 safe-top` | Pane headers |
| Card padding | `p-3` or `p-4` | Card content |
| List item | `px-4 py-3` | List rows |
| Bottom clearance | `pb-[${DRAWER_HANDLE_HEIGHT + 8}px]` | Above drawer |

---

## 5. Interactive States

### Buttons

**Primary Button (CTA):**
```tsx
<button className={cn(
  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
  "text-sm font-medium text-white",
  "bg-gradient-to-r from-cyan-600 to-cyan-500",
  "hover:from-cyan-500 hover:to-cyan-400",
  "active:scale-95 transition-all duration-150",
  "shadow-lg shadow-cyan-500/20"
)}>
  <Plus size={16} />
  Add New
</button>
```

**Ghost Button:**
```tsx
<button className="p-2 rounded-full hover:bg-dark-200 transition-colors">
  <Icon size={20} />
</button>
```

**Tab Button (Inactive):**
```tsx
<button className="text-dark-500 hover:text-white hover:bg-dark-200/50 transition-all duration-200">
  {label}
</button>
```

### Toggle/Switch
```tsx
<div className={`w-10 h-5 rounded-full p-0.5 ${enabled ? 'bg-primary' : 'bg-dark-400'}`}>
  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : ''}`} />
</div>
```

### Checkbox (Circle to Check)
| State | Icon | Color |
|-------|------|-------|
| Active | `Circle` | `text-dark-400` |
| In Progress | `PlayCircle` | `text-primary` |
| Completed | `CheckCircle` | `text-accent-green` |

---

## 6. Status Indicators

### Traffic Light System
| Status | Color | Icon/Animation |
|--------|-------|----------------|
| Running | `accent-green` | Pulse animation |
| Completed | `accent-blue` | Solid |
| Needing Input | `accent-yellow` | Solid |
| Failed | `accent-red` | Solid |

```tsx
// Status dot
<div className={cn(
  "w-2 h-2 rounded-full",
  status === 'running' && "bg-accent-green animate-pulse",
  status === 'completed' && "bg-accent-blue",
  status === 'needing-input' && "bg-accent-yellow",
  status === 'failed' && "bg-accent-red"
)} />
```

### Stock Indicators
| State | Color | Meaning |
|-------|-------|---------|
| Out of Stock | `accent-red` | `qty_in_stock = 0` |
| Low Stock | `accent-yellow` | `qty_in_stock < qty_min` |
| Expiring Soon | Clock icon | `expiry_date` approaching |

---

## 7. Animation & Transitions

### Standard Durations
| Duration | Class | Usage |
|----------|-------|-------|
| 150ms | `duration-150` | Button press |
| 200ms | `duration-200` | Tab switches, hovers |
| 300ms | `duration-300` | Drawer, modals |

### Common Animations
```css
/* From tailwind.config.js */
pulse-glow: 2s ease-in-out infinite
slide-up: 0.3s ease-out
slide-down: 0.3s ease-out
fade-in: 0.2s ease-out
```

### Touch Feedback
```tsx
<button className="active:scale-95 transition-transform">
  {/* Content */}
</button>
```

---

## 8. Z-Index Layers

| Layer | Z-Index | Content |
|-------|---------|---------|
| Base content | `z-0` | Pane content |
| Bottom tabs | `z-20` | Tab navigation |
| App drawer backdrop | `z-40` | Drawer overlay |
| App drawer | `z-50` | Drawer itself |
| Dropdowns | `z-50` | Action menus |
| Modals | `z-[60]` | Popups, sheets |

---

## 9. CSS Variables (Shadcn Compatibility)

From `index.css`:
```css
:root {
  --primary: 186 100% 42%;           /* Cyan HSL */
  --primary-foreground: 0 0% 100%;   /* White */
  --background: 240 33% 4%;          /* Dark background */
  --foreground: 0 0% 100%;           /* White text */
  --card: 240 20% 8%;                /* Card background */
  --card-foreground: 0 0% 100%;      /* Card text */
  --muted: 240 10% 15%;              /* Muted background */
  --muted-foreground: 240 5% 65%;    /* Muted text */
  --border: 240 10% 20%;             /* Border color */
  --ring: 186 100% 42%;              /* Focus ring */
  --radius: 0.75rem;                 /* Border radius */
}
```

---

## 10. Quick Reference: Common Class Combos

### Card with Hover
```tsx
className="glass-card p-4 hover:shadow-glow-sm transition-shadow"
```

### List Item Row
```tsx
className="flex items-center gap-3 px-4 py-3 hover:bg-dark-200/50 transition-colors"
```

### Header Title
```tsx
className="text-lg font-bold tracking-tight text-white"
```

### Muted Label
```tsx
className="text-xs text-dark-500 uppercase tracking-wider"
```

### Badge/Tag
```tsx
className="text-xs px-2 py-0.5 bg-dark-200 rounded"
```

### Primary Link/Action Text
```tsx
className="text-sm text-primary hover:text-primary-400 transition-colors"
```

---

## 11. Do's and Don'ts

### ✅ DO
- Use `bg-dark-100/80` for tab bars (not `bg-dark-900/80`)
- Use `size={16}` for icons in bottom tabs
- Use `gap-1.5` for icon-label spacing in tabs
- Hide labels on inactive tabs on mobile: `hidden sm:inline`
- Add `backdrop-blur` to floating elements
- Use `shadow-sm` on active tab buttons
- Import `DRAWER_HANDLE_HEIGHT` for bottom spacing

### ❌ DON'T
- Don't use vertical `flex-col` for bottom tab items (use horizontal)
- Don't use `text-[10px]` for tab labels (use `text-xs`)
- Don't use `size={20}` for icons in compact tabs (use 16)
- Don't use `border border-white/10` on tab bars (it's built into glass style)
- Don't hardcode `60px` for drawer height (use the constant)
- Don't forget active state backgrounds (`bg-primary/20`)
