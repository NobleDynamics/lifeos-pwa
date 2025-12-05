Technical Specification: LifeOS Frontend PWA
Role: Lead Frontend Architect
Project Vision: LifeOS is a personal "Operating System" (OS) running in the browser, specifically a Progressive Web App (PWA). It is designed to mimic a mobile OS interface (Android-style) with core features including swipeable homescreen panes, a global pull-up app drawer, and a sandboxed widget capability.
Aesthetic:
Theme: Cyberpunk/Sci-Fi interface.
Mode: Dark Mode only.
Accents: Glowing accents (Default: Cyan #06b6d4).
Style: Glassmorphism effects applied to cards and containers.

## Unified Node Engine (src/engine/)

The ViewEngine is a data-driven rendering system that renders recursive Node trees based on `variant` strings. Phase 1 implementation for "Headless OS" architecture.

### Core Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `ViewEngine` | Recursive renderer that consumes a Node tree | `engine/components/ViewEngine.tsx` |
| `NodeProvider` | Context provider for node data at each level | `engine/context/NodeContext.tsx` |
| `registry.ts` | Maps variant strings to React components | `engine/registry.ts` |
| `DebugNode` | Self-healing fallback for unknown variants | `engine/components/DebugNode.tsx` |

### Built-in Variants

| Variant | Component | Use Case |
|---------|-----------|----------|
| **Layouts** | | |
| `layout_app_shell` | `LayoutAppShell` | App container with header, breadcrumbs, tabs |
| `layout_top_tabs` | `LayoutTopTabs` | Segmented control sub-navigation |
| `view_directory` | `ViewDirectory` | Searchable list with action button |
| `view_list_stack` | `ViewListStack` | Collapsible folders with neon glow |
| `view_grid_fixed` | `ViewGridFixed` | Responsive grid container |
| `view_dashboard_masonry` | `ViewDashboardMasonry` | Dashboard grid with column spans |
| `view_dashboard_responsive` | `ViewDashboardResponsive` | Auto-responsive dashboard grid |
| **Rows** | | |
| `row_detail_check` | `RowDetailCheck` | Task/item rows with status icons |
| `row_neon_group` | `RowNeonGroup` | Folder rows with neon border |
| `row_simple` | `RowSimple` | Basic text row |
| `row_input_stepper` | `RowInputStepper` | Numeric stepper with thresholds |
| `row_input_currency` | `RowInputCurrency` | Currency input with checkbox |
| **Cards** | | |
| `card_media_top` | `CardMediaTop` | Cards with thumbnail and metadata |
| **Progress Cards** | | |
| `card_progress_simple` | `CardProgressSimple` | Single progress bar with value/max |
| `card_progress_stacked` | `CardProgressStacked` | Stacked colored segments bar |
| `card_progress_multi` | `CardProgressMulti` | Multiple individual progress bars |
| **Chart Cards** | | |
| `card_chart_bar` | `CardChartBar` | Bar chart (Recharts) |
| `card_chart_line` | `CardChartLine` | Line/area chart (Recharts) |
| `card_chart_pie` | `CardChartPie` | Pie/donut chart (Recharts) |
| `card_chart_radar` | `CardChartRadar` | Radar/spider chart (Recharts) |

### Node Schema (Zod Validated)

```typescript
interface Node {
  id: string           // UUID
  type: NodeType       // 'space' | 'container' | 'collection' | 'item'
  variant: string      // Drives rendering: 'list_row', 'grid_card', etc.
  title: string
  metadata: Record<string, unknown>
  children?: Node[]
  relationships?: NodeRelationship[]
}
```

### Context Hooks

| Hook | Purpose |
|------|---------|
| `useNode()` | Access current node, depth, parentId, rootId |
| `useNodeMeta<T>(key)` | Type-safe metadata access |
| `useIsRoot()` | Check if current node is tree root |
| `useHasChildren()` | Check if node has children |
| `useChildCount()` | Get number of direct children |
| `useRenderChildren()` | Render children from within variants |
| `useShellNavigation()` | Navigation context: targetNodeId, navigateToNode, navigateBack, targetPath |
| `useShellAction()` | Dynamic header actions: setActionConfig, clearActionConfig |
| `findPathToNode()` | Utility: Find path from root to a target node |
| `useChildAggregation()` | Smart aggregation from child nodes (sum/count/avg) |
| `useSlot()` | Slot-based data access from metadata |

### Sandbox Pane (Dev Tool)

Access: Swipe right from Settings

| Feature | Description |
|---------|-------------|
| JSON Editor | Textarea with real-time Zod validation |
| Preview Mode | See the rendered ViewEngine output |
| Gallery Mode | Browse all registered variants with mock data |
| Error Display | Shows validation errors inline |

**Gallery Mode:** Added Dec 2024. Displays all 17+ registered variants with live mock data previews, organized by category (Layout, Row, Card, Progress, Chart).

---

## Component Library (src/components/shared/)

These reusable components enforce DRY principles across the app:

| Component | Purpose | Props |
|-----------|---------|-------|
| `FormSheet` | Bottom sheet modal for all add/edit forms | `title`, `onClose`, `children`, `maxHeight?`, `isOpen?` |
| `ViewShell` | Wrapper for all pane layouts with header/footer | `title`, `icon?`, `breadcrumbs?`, `headerActions?`, `footer?`, `onBack?` |
| `TabBar` | Standard tab bar for ViewShell footer | `tabs`, `activeTab`, `onTabChange` |
| `CategoryPane` | ViewShell variant with built-in tab management | `title`, `icon`, `tabs`, `tabKey`, `children` |
| `Avatar` | Renders user avatars with icon or image support | `src?`, `name?`, `size?`, `className?` |
| `AvatarPicker` | Interactive picker for icon + color avatars | `value`, `onChange`, `name?`, `label?` |

### Avatar System (Icon + Color Format)

The Avatar system supports both traditional image URLs and a custom "Icon + Color" string format for Cyberpunk-style avatars.

**Format:** `icon:[IconName]:[HexColor]`
**Example:** `icon:Dog:#00EAFF`

**Supported Icons:**
- Persona icons: `User`, `Baby`, `Dog`, `Cat`, `Bot`, `Ghost`, `Alien`, `Smile`, `Gamepad2`

**Avatar Component Logic:**
1. If `src` starts with `icon:`, parse and render the Lucide icon with background color
2. If `src` is a URL, render the image
3. If `src` is null, render initials from `name`

**Usage Rule:** All new forms MUST use `<FormSheet>`. All new panes MUST use `<ViewShell>` or `<CategoryPane>`.

---

## Universal Resource Graph Components (src/components/)

The new hierarchical resource system replaces the legacy 3-tier Todo structure:

| Component | Purpose | Props |
|-----------|---------|-------|
| `HierarchyPane` | Main container for resource hierarchy navigation | `accentColor?` |
| `ResourceListView` | Unified list renderer for folders and tasks | `accentColor?` |
| `ResourceBreadcrumbs` | Clickable breadcrumb trail from ltree path | `accentColor?` |
| `ResourceForm` | Universal creator/editor for folders and tasks | `accentColor?` |

### State Management (src/store/useResourceStore.ts)

| Hook | Purpose |
|------|---------|
| `useResourceNavigation()` | Navigation: `currentParentId`, `pathStack`, `navigateInto()`, `navigateBack()`, `navigateToBreadcrumb()` |
| `useResourceSearch()` | Search: `searchQuery`, `setSearchQuery()` |
| `useResourceForm()` | Form state: `showForm`, `editingResource`, `openCreateForm()`, `openEditForm()`, `closeForm()` |
| `useResourceContextMenu()` | Context menu: `contextMenu`, `showContextMenu()`, `hideContextMenu()` |

### Visual Distinction

- **FolderRow**: Cyberpunk neon glow border, folder icon, chevron `>` for navigation
- **TaskRow**: Standard dark card, checkbox icon (Circle/PlayCircle/CheckCircle), status labels

### Task Assignment Feature

Tasks can be assigned to household members (including shadow users like kids/pets).

**ResourceForm Updates:**
- "Assign To" dropdown appears when `resourceType === 'task'`
- Uses `useHouseholdProfiles()` to fetch assignable members
- Renders Avatar component for each option
- Saves `assignee_id` to `meta_data.assignee_id`

**ResourceListView Updates:**
- TaskRow displays assignee Avatar bubble when `assignee_id` is present
- Avatar shows the Cyberpunk icon avatar or profile image

### Legacy Components (src/components/todo/legacy/)

The following components are **DEPRECATED** and preserved only for reference:
- `TodoPane.tsx`, `TodoCategoryList.tsx`, `TodoListsView.tsx`, `TodoItemsView.tsx`
- `CategoryForm.tsx`, `TaskListForm.tsx`, `TaskItemForm.tsx`
- `TodoBreadcrumbs.tsx`, `TodoContextMenu.tsx`, `TodoSearchFilter.tsx`, `TodoDetailSheet.tsx`, `TodoAnalytics.tsx`

**Do NOT use legacy components for new features.** Use `HierarchyPane` and Resource Graph hooks instead.

---

## Identity & Household Management (src/hooks/useIdentity.ts)

### Identity Hooks

| Hook | Purpose |
|------|---------|
| `useCurrentProfile()` | Get current user's profile |
| `useUpdateProfile()` | Mutation to update profile (name, avatar) |
| `useHouseholds()` | List all households user belongs to |
| `usePrimaryHousehold()` | Get active household ID from localStorage |
| `useSwitchHousehold()` | Mutation to change active household |
| `useHouseholdMembers(householdId)` | Get members with roles (includes shadow users) |
| `useHouseholdProfiles(householdId)` | Get just profiles for dropdown selectors |
| `useCreateShadowUser()` | Create a dependent (kid/pet) shadow profile |
| `useDeleteShadowUser()` | Delete a shadow profile |

### SettingsPane (src/panes/SettingsPane.tsx)

A settings management pane using `<ViewShell>`:

**Sections:**
1. **"Me" Section**
   - Shows current user profile with Avatar
   - Edit button opens `<FormSheet>` with `<AvatarPicker>`
   - Uses `useUpdateProfile()` mutation

2. **"Household" Section**
   - Dropdown to switch active household (`useSwitchHousehold`)
   - Shows household name and member count

3. **"Members" Section**
   - Lists real users with role badges (Owner/Member)
   - Read-only for now

4. **"Dependents" Section**
   - Lists shadow users (kids/pets) with Avatars
   - "Add Dependent" button opens `<FormSheet>`:
     - Name input
     - `<AvatarPicker>` for icon selection
     - Uses `useCreateShadowUser()` mutation

### Shadow Users

Shadow users are `profiles` entries with `is_shadow = true`. They:
- Don't have auth accounts (no email/password)
- Are managed by real household members
- Can be assigned tasks
- Use icon avatars (e.g., `icon:Dog:#FF6B6B` for pets)

---

1. Technical Stack & Architecture
Category
Component/Tool
Purpose
Hosting
Cloudflare Pages
Static asset hosting for global performance and PWA service worker delivery.
Core
React 18+ (Vite)
Modern component-based UI framework. Vite ensures fast development and optimized production builds.
Language
TypeScript (Strict)
Enforces type safety across the application for maintainability and fewer runtime bugs.
Animation
framer-motion
CRITICAL: Handles all advanced UI animations, specifically swipe physics for the Swipe Deck, gesture recognition for the App Drawer, and seamless layout transitions.
Styling
Tailwind CSS + clsx
Utility-first CSS framework for rapid, consistent styling. clsx for conditional class joining.
Theming
CSS Variables
Implements global theming by using CSS Variables (e.g., --primary: 220 100% 50%) for the accent color.
Components
Shadcn/UI (Modified)
Modified for "Mobile-First": increased default padding/margins to ensure large, reliable touch targets.
State (UI)
Zustand
Lightweight state management for local UI concerns (Pane order, Drawer state, Theme).
State (Async)
TanStack Query
Manages server state (Dashboard Snapshots, Infinite Scroll), caching, and Optimistic Updates.
Icons
Lucide React
Consistent icon library. Dock icons must be wrapped in a hexagon-shaped component.


2. Navigation Architecture (The "OS" Concept)
The application implements three primary, global navigation structures:
A. The Swipe Deck (Main View)
Concept: The core content area is a horizontal carousel of full-screen views, referred to as "Panes."
Interaction: Users navigate by swiping left or right. Utilizes framer-motion for physics-based swiping.
Architecture:
- **System Apps:** Hardcoded core modules (Health, Agenda, Chat, Dashboard, Feed, Cloud, Finance, Settings, Sandbox).
- **User Apps:** Dynamic `ViewEnginePane` instances driven by "Context Roots" in the database (e.g., "My Home").
- **Ordering:** System Apps -> User Apps (before Settings) -> Settings -> Sandbox.

**Migration Note (Dec 2024):** The "Household" app has been migrated from a hardcoded System App to a database-driven User App ("My Home"). This is now rendered via `ViewEnginePane` using Context Roots.

B. The Dock (Quick Launch)
Concept: A fixed bar at the bottom, present across all Panes.
Contents: 4-5 "Quick Launch" application icons.
Design: Icons must be Hexagon-shaped wrappers for Lucide icons.

C. The App Drawer (Global Access)
Concept: A global sheet/modal that provides access to all installed apps/widgets.
Interaction: Vertical swipe gesture from the bottom of any Pane.
Contents: A scrollable grid layout showing all System and User Apps.

D. Back Button Handling (State-First, History-Shimmed)

The back button uses a **State-First, History-Shimmed** architecture that solves async race conditions and history exhaustion problems.

**Architecture Principles:**
1. **Zustand = Single Source of Truth**: All navigation state lives in global store with synchronous updates
2. **Single Sentinel History Entry**: Uses `replaceState` not `pushState`; `popstate` is just a trigger
3. **Handler Chain Reads Store**: Handlers call Zustand actions that return boolean synchronously
4. **Capacitor-Ready**: Abstracted `handleBackPress()` for future native wrapping

| Priority | Handler | Location | Action |
|----------|---------|----------|--------|
| 30+ | Modals/Sheets | Various | Close open modal/sheet |
| 20 | `ViewEnginePane` | Pane | `backFromNode(paneId)` - Pop node stack |
| 15 | `layout_app_shell` | Shell | `backFromTab(paneId)` - Switch to default tab |
| 0 | App-level | `Layout.tsx` | `backFromPane()` - Close drawer → Dashboard → Trap |

**State-First Navigation Flow:**
```
State: { activeNodeByPane: { "user.my_home": "grocery-list-id" } }
Back Press → handleBackPress() called
  → Priority 20: backFromNode("user.my_home") 
  → Pops stack, returns true → Done
  
State: { activeNodeByPane: { "user.my_home": "shopping-tab-id" } }
Back Press → handleBackPress() called
  → Priority 20: backFromNode → returns false (at tab root)
  → Priority 15: backFromTab → switches to default, returns true → Done
  
Back Press at Default Tab Root:
  → Priority 20: returns false
  → Priority 15: returns false (already at default)
  → Priority 0: backFromPane → goes to Dashboard, returns true
  
Back Press at Dashboard:
  → All return true (traps to prevent app exit)
```

**Implementation Details:**

**1. ViewEnginePane Handler (Priority 20):**
- Syncs React state (`targetNodeId`) with URL hash after browser handles `popstate`
- Forward navigation pushes history via `pushNodeToHistory(nodeId)`
- Back button reads URL hash and updates React state to match
```tsx
const handleHistoryBack = useCallback(() => {
  const urlNodeId = getNodeIdFromUrl()
  if (urlNodeId !== targetNodeId) {
    setTargetNodeId(urlNodeId)
    return true // We synced with URL
  }
  return false // Nothing to sync, delegate down
}, [targetNodeId])
```

**2. Shell Handler (Priority 15):**
- Only handles tab-level navigation when URL history is exhausted
- If at non-default tab root → navigate to default tab
- If at default tab root → return `false` (delegate to app-level)

**3. App-level Handler (Priority 0):**
- If drawer open → close drawer → return `true`
- If not at Dashboard → navigate to Dashboard → return `true`
- If at Dashboard → return `true` (trap - prevents app exit)

**Example Navigation Trace:**
```
User at: My Home > Shopping Tab
Click "Grocery List" → URL: #node=grocery-list-id
Click "Milk" item → URL: #node=milk-id

Press Back → URL reverts to #node=grocery-list-id
  → ViewEnginePane syncs: targetNodeId = grocery-list-id ✓

Press Back → URL reverts to #node=<empty>
  → ViewEnginePane syncs: targetNodeId = null ✓
  → Shell detects tab root, activates Shopping tab

Press Back → URL has no more history
  → ViewEnginePane: nothing to sync (returns false)
  → Shell: at non-default tab, switch to default tab ✓

Press Back → 
  → ViewEnginePane: nothing to sync (returns false)
  → Shell: at default tab (returns false)
  → App-level: navigate to Dashboard ✓

Press Back at Dashboard → Trapped (nothing happens)
```

3. The Dashboard Pane (Home HUD)
The Dashboard is the central, high-density "Heads Up Display" (HUD).
Layout Requirement
On mobile portrait, the Main Stage MUST implement a Split-Row Layout (two components side-by-side) and MUST NOT revert to a vertical stack.
Component Breakdown
1. Header
Left: Local Weather (Temp + Icon). Source: Redis Cache weather:{lat}:{long}.
Right: Digital Clock.
2. Main Stage (The Split Row)
Left Card (Health Metrics):
Width: 55%
Visual: Bar Chart or Rings.
Interaction: "Tap to Cycle" metrics (Steps -> Calories -> Water -> Sleep).
Data Source: daily_health_logs table (aggregations for today).
Hint: A small, low-opacity text label ("Tap to switch") must be visible.
Right Card (Agent Log):
Width: 45%
Visual: Vertical scrollable list of recent AI task activities.
Status Indicators (Traffic Light System):
🟢 Green (Pulse): running (Agent is thinking/working).
🔵 Blue: completed.
🟡 Yellow: needing-input (User interaction required).
🔴 Red: failed.
3. Floating Inputs (High Z-Index)
Primary: "Voice Waveform" button for primary system interaction.
Secondary: "File Upload" button (Paperclip) for document/photo ingestion.

4. Category Panes
All Category Panes follow a strictly modular layout: Hero Banner -> Tab Bar -> Content Body.
4.1 View: Health Pane
Tabs: Nutrition, Exercise, Brain, Hygiene.
A. Tab: Nutrition ("Family Feed")
Top Controls: Profile Selector (Me/Dependents) + Date Filter (Day/Week/Month).
Visuals:
Macro Pie: Protein/Carbs/Fats (Source: meals.macros_json).
Hydration: Progress bar. Source: daily_health_logs where metric=water_ml.
Calorie Bar: Stacked (Base Metabolic + Active Burn).
Interactions:
"Show Note": Triggers AI analysis of the current view (loads with skeleton state).
Dependent Tagging: Ingestion supports tagging meals.dependent_id.
B. Tab: Exercise ("Body Map")
Visuals:
The Muscle Map: 2D SVG body. Opacity maps to volume (Sets * Weight) from completed_workouts.
Fallback: Uses a hardcoded exercise_to_muscle JSON map.
Sub-Views:
Routine Builder: List of saved workouts.
Detail: Shows "Estimated Burn" and instructions.
Interactions:
Add Workout: Triggers Poly (Chat) to negotiate details.
C. Tab: Brain ("Quantified Self")
Visuals:
Social Volume: Chart of "Messages Sent" vs "People Talked To". Source: brain_logs & daily_health_logs.
Learning: Counter for "Topics Explored" (Source: Zep Memory classifications).
Embedded Games: Native React Components (Results save to brain_logs).
Memory: Grid flip game.
Reaction: "Tap when green" speed test.
Focus: Pomodoro timer with "Distraction Logging".
Sleep: Rendered from daily_health_logs (metric=sleep_hours).
D. Tab: Hygiene (Habits)
Visuals:
Task List: Filters the unified tasks table for category='health' or category='chore' specific to hygiene.
Stock Indicator: Dot (Green/Red) linked to pantry_items.
Interactions: Modal to set Frequency (Cron) in routines and Linked Inventory Item.

- **Folders**: Cyberpunk neon glow border, folder icon with custom color, chevron `>` indicator
- **Tasks**: Standard dark card, checkbox (Circle → PlayCircle → CheckCircle), due date highlighting

Interactions:
- Click Folder → Navigate deeper (updates `currentParentId`)
- Click Task → Cycle status (active → completed → archived)
- Long Press → Context menu (Edit/Delete)
- "New" Dropdown → Create Folder OR Create Task
- Back Button → Navigate up hierarchy via ltree path
C. Tab: Shopping List (Smart Procurement)
Sub-Views:
Active Lists: Grouped by Vendor.
Item Search: Search bar to find items in the database to add.
Visuals:
Vendor Split: Fetches Vendor Logo and Name from the relational vendors table.
Smart Suggestions: Agent suggests stores based on shopping_items linked to specific vendor_id.
Interactions:
Upload Receipt: Camera action -> Triggers inbound_emails or direct transactions processing -> Updates Stock.
The Nudge: Toast: "Stock updated! Check my counts?"
D. Tab: Stock (Inventory)
Structure: Folder View (Pantry, Fridge, Freezer) -> Item List.
Visuals:
🔴 Red: Out of Stock (qty_in_stock = 0).
🟡 Yellow: Low Stock (qty_in_stock < qty_min).
🕒 Clock: Expiring soon (expiry_date).
Interactions: Voice Update (Mic button).
E. Tab: Recipes (Meal Engine)
View: Card Grid with "Cook Time" badges (Source: recipes.cook_time_minutes).
Filters: Meal Type, Cuisine, Dietary, Ingredients (Has/Has Not).
Detail View:
Ingredients: Clickable list (Tap adds to shopping_items).
Instructions: Step-by-step text.
Action: "Add to Meal Plan" -> Creates a calendar_event with linked_resource_type='recipe'.

4.3 View: Agenda Pane
Tabs: Schedule, Calendar, Tasks, Routines.
A. Tab: Schedule ("Now" Stream)
Visual: Vertical timeline of calendar_events.
Components:
Now Line: Horizontal indicator moving in real-time.
Polymorphic Icons: Fork (Recipe), Dumbbell (Workout), Checkmark (Task). Logic: Checks linked_resource_type.
Interactions:
Swipe Right: Sets status='completed'.
Tap: Opens the linked resource detail view.
B. Tab: Calendar
Views: Month / Week / Day.
Visual Layers:
Blocking: is_blocking = true (Solid color).
Non-Blocking: Transparent/Hashed.
Interactions:
Drag & Drop: Reschedule events instantly.
Import: "Add Calendar" button (.ics).
C. Tab: Tasks (Master Aggregator)
Logic: Aggregates all records from the tasks table.
Filters:
Folders: Mapped to task.category (Chore, Errand, Project).
Smart Lists: "Due Today", "Near Me" (Geofence).
Scheduling: "Smart Schedule" button triggers Agent to move a Task into calendar_events.
D. Tab: Routines
Visual: List of routines.
Detail View:
Trigger: Cron Editor.
Action Chain: Ordered list of tasks.
Conflict Policy: Toggle for "Skip if busy" vs "Force Notify".

4.4 View: Cloud Pane
Tabs: Photos, Files, Docs.
A. Tab: Photos (Gallery)
Visuals:
Breadcrumb: derived from folder_path strings.
Smart Search: Filters by files.ai_tags.
Ingestion: Uploads to R2, creates files record. Feedback shows "Scanning..." until AI processing completes.
Interactions:
Tap: Opens Lightbox.
Long Press: Select mode (Delete, Move, Share).
B. Tab: Docs (Knowledge Base)
List View:
Tags: Manual user tags from documents.tags (Array).
Summary: AI-generated summary_short.
Editor View:
Read Mode: Rendered Markdown.
Edit Mode: Clean text editor with basic formatting toolbar.
Deep Linking: lifeos://docs/:id.
C. Tab: Files
Visuals: Standard File List.
Viewers: CSV (Papaparse), PDF (Native).

4.5 View: Finance Pane
Tabs: Budget, Accounts, Analytics.
A. Tab: Budget
Visuals:
Category Cards: Stacked Progress Bars (transaction_splits vs budget_categories).
Overall Bar: Sticky footer showing Total Monthly Spend vs Income.
B. Tab: Accounts (The Ledger)
Master View:
Net Worth: Summary card visualizing the trend line from the account_balance_history table.
Detail View:
Visuals: Toggle between Pie/Bar/Line charts.
Transactions: List with multi-colored segment bars for split categories.
Ingestion:
Email Integration: Display the system email address (which pipes to inbound_emails table).
C. Tab: Analytics
Visuals: Chart Builder (Group By Vendor/Category).
Interactions:
"Generate Summary": LangGraph analysis.
"Save View": Button to persist current filters as a named preset.

5. Widget System
Container: WidgetContainer component.
Security: <iframe> with sandbox="allow-scripts" strictly enforced.

6. Social & Settings Panes
4.6 View: Chat
Hydrogen Embed: Web Component wrapper.
Auth: Uses user_settings.matrix_access_token for seamless login.
4.7 View: Feed
Backend: Mastodon API.
Agent: "Generate Post" flow.
4.8 View: Settings
1. App Customization:
Pane Manager: Toggles to Hide/Show entire modules.
Drawer Editor: Drag-and-drop grid to reorder App Drawer icons.
2. Agent Preferences:
Nag Control: Toggles for proactive behaviors (stored in user_settings.agent_preferences_json).
3. Billing:
Header: Current Balance (Source: user_settings.current_token_balance).
Ledger: Table view of token_ledger.

7. Data Integration: Dashboard Snapshot Contract
The single-source-of-truth TypeScript interface for the primary Dashboard data payload (stored in Redis):
TypeScript
interface DashboardSnapshot {
  weather: {
    temp: number;
    condition: string; // e.g., "Cloudy"
    location: string;
    icon_code: string;
  };
  health_metrics: {
    steps: {
      current: number;
      goal: number;
      history: number[]; // Last 7 days from daily_health_logs
    };
    calories: {
      current: number;
      goal: number;
    };
    water: {
      current: number; // Sum of water_ml from daily_health_logs (today)
      goal: number;
    };
    sleep: {
      hours: number; // From daily_health_logs (last night)
      score: number;
    };
  };
  active_tasks: {
    id: string;
    title: string;
    // Must match Backend 'tasks.status' Enum subset
    status: 'running' | 'completed' | 'needing-input' | 'failed';
    timestamp: string;
  }[];
}
