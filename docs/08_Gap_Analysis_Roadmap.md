# LifeOS Gap Analysis & Development Roadmap

**Version:** 1.0.0  
**Generated:** December 2025  
**Purpose:** Compare Master Architecture (`docs/00_MASTER_ARCHITECTURE.md`) against Current Implementation

---

## Executive Summary

This document identifies every feature defined in the Master Architecture that does **NOT yet exist** in the codebase. The gaps are organized into a prioritized roadmap for development.

### Overall Status

| Layer | Ideal Components | Implemented | Gap % |
|-------|------------------|-------------|-------|
| **Data Layer** | Universal Graph + Strict Tables + Links | Resources + Identity | ~40% |
| **Presentation Layer** | ViewEngine + Theme Engine + App Drawer | ViewEngine Core | ~60% |
| **System Apps** | 8 Full Apps | 8 Shells (Mostly Mock) | ~20% |
| **AI Layer** | LangGraph + Zep + Tools | None | 0% |
| **Infrastructure** | Supabase + Redis + R2 + Nylas + GetStream | Supabase Only | ~20% |

---

## Table of Contents

1. [Critical Infrastructure Gaps](#1-critical-infrastructure-gaps)
2. [Missing System Apps](#2-missing-system-apps)
3. [Missing UI Features](#3-missing-ui-features)
4. [Missing AI Layer](#4-missing-ai-layer)
5. [Missing Integrations](#5-missing-integrations)
6. [Prioritized Development Phases](#6-prioritized-development-phases)

---

## 1. Critical Infrastructure Gaps

### 1.1 Terminology: "Household" → "Entity"

**Master Architecture Says:**
> "Replaces 'Households.' An Entity is the root scope for User Apps and Data."

**Current State:**
- Code still uses `household_id`, `useHouseholds()`, `HouseholdPane`
- Database has `households` and `household_members` tables
- UI shows "Household" in Settings

**Gap:**
- [ ] Rename `households` → `entities` in database schema
- [ ] Rename `household_id` → `entity_id` across all tables
- [ ] Update all hooks: `useHouseholds()` → `useEntities()`
- [ ] Update UI labels: "Household" → "Entity"
- [ ] Add `associates` field to entities (Kids, Pets, Assets, Vehicles)

**Priority:** 🟡 Medium (Breaking change, can wait)

---

### 1.2 Self-Describing Metadata (`__field_defs`)

**Master Architecture Says:**
```json
{
  "soiled_status": "dirty",
  "__field_defs": {
    "soiled_status": {
      "type": "select",
      "options": ["clean", "dirty", "needs_repair"],
      "description": "Current cleanliness state"
    }
  }
}
```

**Current State:**
- `meta_data` column exists but has no `__field_defs` convention
- AI has no way to understand field meanings

**Gap:**
- [ ] Define `FieldDefinition` TypeScript interface
- [ ] Add `__field_defs` validation to resource creation
- [ ] Create migration guide for existing resources
- [ ] Update ViewEngine to read `__field_defs` for form generation

**Priority:** 🔴 Critical (Required for AI Layer)

---

### 1.3 The 8 Immutable Relationship Enums

**Master Architecture Says:**
| Enum | Meaning |
|------|---------|
| `HIERARCHY` | Parent/Child |
| `COMPONENT` | Physical composition |
| `DEPENDENCY` | Prerequisite/Blocker |
| `TRANSACTIONAL` | Exchange of value |
| `SPATIAL` | Physical location |
| `TEMPORAL` | Scheduled time |
| `SOCIAL` | Assignment/Ownership |
| `REFERENCE` | Loose/informational |

**Current State:**
- `resource_links` table exists with `link_type` enum
- Enum values match spec ✅
- **No code uses these relationships**

**Gap:**
- [ ] Create `useLinkResources()` hook
- [ ] Create `useUnlinkResources()` hook  
- [ ] Create `useResourceLinks(resourceId)` query
- [ ] Add link visualization in ViewEngine variants
- [ ] Implement COMPONENT links for recipes → ingredients
- [ ] Implement SPATIAL links for inventory → locations

**Priority:** 🟡 Medium (Enables advanced features)

---

### 1.4 Shadow Nodes (Hybrid Data Pattern)

**Master Architecture Says:**
> Shadow Nodes use `pointer_table` and `pointer_id` to reference strict tables.

**Current State:**
- Columns exist in `resources` table ✅
- No strict tables exist (`transactions`, `health_logs`, `inventory_logs`)
- No code uses pointer pattern

**Gap:**
- [ ] Create `transactions` strict table
- [ ] Create `health_logs` strict table  
- [ ] Create `inventory_logs` strict table
- [ ] Create Shadow Node creation utility
- [ ] Create Shadow Node resolver hook

**Priority:** 🟡 Medium (Required for Finance & Health)

---

### 1.5 The Slot System (`useSlot` Hook)

**Master Architecture Says:**
```typescript
const headline = useSlot<string>('headline')  // Gets title via default mapping
const badge = useSlot<string>('badge', undefined, { type: 'date' })  // Auto-formats
```

**Current State:**
- `useSlot` hook exists in `src/engine/hooks/useSlot.ts` ✅
- Hook is documented in ViewEngine Sandbox ✅
- Most variants use `useNodeMeta()` directly instead of slots

**Gap:**
- [ ] Audit all variants to use `useSlot` consistently
- [ ] Implement `__config` override reading
- [ ] Add date formatting option
- [ ] Add currency formatting option

**Priority:** 🟢 Low (Refinement)

---

### 1.6 Agenda Fields on Resources

**Master Architecture Says:**
| Field | Purpose |
|-------|---------|
| `is_schedulable` | Can appear on Agenda |
| `scheduled_at` | When scheduled |
| `duration_minutes` | Time block duration |
| `ideal_time` | Anchor preference |
| `flexibility_window` | Allowed slide range |
| `deadline_type` | `hard`, `soft`, `floating` |
| `visibility_tier` | 1, 2, or 3 |

**Current State:**
- `is_schedulable`, `scheduled_at`, `duration_minutes` columns exist ✅
- `ideal_time`, `flexibility_window`, `deadline_type`, `visibility_tier` are missing
- No Agenda UI reads these fields

**Gap:**
- [ ] Add `ideal_time` column (TIME)
- [ ] Add `flexibility_window` column (INTERVAL or TEXT)
- [ ] Add `deadline_type` column (ENUM)
- [ ] Add `visibility_tier` column (INT)
- [ ] Create `useSchedulableResources(dateRange)` hook

**Priority:** 🔴 Critical (Required for Agenda)

---

## 2. Missing System Apps

### 2.1 Dashboard (Mission Control)

**Master Architecture Specifies:**
- Weather Module (OpenWeather API, Redis cache)
- Activity Log (Real-time agent status stream)
- Dynamic Widget Area (Pinnable cards from User Apps)
- Quick Launch (4-8 shortcuts above drawer)

**Current State:**
- ✅ Weather display (mock data)
- ✅ Health metrics card (mock data)
- ✅ Agent activity log (mock data)
- ❌ Real weather API integration
- ❌ Real activity log (no LangGraph)
- ❌ Dynamic Widget Area
- ❌ Quick Launch shortcuts

**Gaps:**
| Feature | Status | Effort |
|---------|--------|--------|
| OpenWeather API integration | ❌ Not started | 2h |
| Redis cache for weather | ❌ Not started | 1h |
| Activity Log database schema | ❌ Not started | 2h |
| Activity Log realtime subscription | ❌ Not started | 3h |
| Widget pinning system | ❌ Not started | 8h |
| Widget Canvas UI | ❌ Not started | 4h |
| Quick Launch config storage | ❌ Not started | 2h |
| Quick Launch UI | ❌ Not started | 3h |

**Priority:** 🔴 Critical (User-facing, high value)

---

### 2.2 Agenda (The Time Broker)

**Master Architecture Specifies:**
- Schedule Tab ("Now" stream with real-time timeline)
- Calendar Tab (Month/Week/Day views)
- Tasks Tab (Task Pool + master aggregator)
- Routines Tab (Routine templates)
- Elastic Scheduling Logic
- Nylas Integration (External calendars)
- Location Awareness
- Intervention Protocols (Sick Mode, Focus Mode)

**Current State:**
- ✅ Basic tab structure exists
- ✅ Schedule tab with mock timeline
- ✅ Calendar tab with mock month view
- ✅ Tasks tab with mock list
- ✅ Routines tab with mock list
- ❌ All data is mock
- ❌ No Supabase queries
- ❌ No Nylas integration
- ❌ No elastic scheduling
- ❌ No location awareness
- ❌ No intervention protocols

**Gaps:**
| Feature | Status | Effort |
|---------|--------|--------|
| `calendar_events` table | ❌ Not started | 2h |
| `routines` table | ❌ Not started | 2h |
| Schedule Tab - real data | ❌ Not started | 4h |
| Calendar Tab - Supabase | ❌ Not started | 6h |
| Tasks Tab - aggregation query | ❌ Not started | 4h |
| Routines Tab - CRUD | ❌ Not started | 4h |
| Nylas calendar sync | ❌ Not started | 12h |
| Elastic scheduling engine | ❌ Not started | 20h |
| Task Pool UI | ❌ Not started | 6h |
| Location awareness | ❌ Not started | 8h |
| Intervention protocols | ❌ Not started | 6h |

**Priority:** 🔴 Critical (Core productivity feature)

---

### 2.3 Communication Hub (Chat + Email + Contacts)

**Master Architecture Specifies:**
- Chat Engine (GetStream.io)
- Poly AI Interface (Voice + Text)
- Native Card Rendering in chat
- Email Engine (Nylas)
- Contact Graph (Internal + External)

**Current State:**
- ✅ ChatPane shell exists
- ❌ Placeholder only - "Connect your Matrix account"
- ❌ No GetStream integration
- ❌ No Poly/LangGraph integration
- ❌ No email functionality
- ❌ No contact management

**Gaps:**
| Feature | Status | Effort |
|---------|--------|--------|
| GetStream SDK setup | ❌ Not started | 4h |
| Chat message component | ❌ Not started | 4h |
| ViewEngine card in chat | ❌ Not started | 6h |
| Voice input waveform | ❌ Not started | 4h |
| Nylas email setup | ❌ Not started | 8h |
| Inbox view | ❌ Not started | 6h |
| Compose UI | ❌ Not started | 4h |
| Contact Graph schema | ❌ Not started | 3h |
| Contact CRUD UI | ❌ Not started | 4h |

**Priority:** 🟡 Medium (Depends on AI Layer)

---

### 2.4 Feed (Social & Signal Engine)

**Master Architecture Specifies:**
- Unified Stream (GetStream.io)
- AI Publisher (Poly as Creative Director)
- RSS Engine (Background ingest worker)
- Topic Channels

**Current State:**
- ✅ FeedPane shell exists
- ✅ Mock posts display
- ❌ No GetStream integration
- ❌ No RSS functionality
- ❌ No AI Publisher

**Gaps:**
| Feature | Status | Effort |
|---------|--------|--------|
| GetStream feed setup | ❌ Not started | 4h |
| Feed activity cards | ❌ Not started | 6h |
| `feed_sources` table | ❌ Not started | 2h |
| `user_feed_subscriptions` table | ❌ Not started | 2h |
| RSS ingest worker | ❌ Not started | 8h |
| Share to Feed flow | ❌ Not started | 6h |
| AI caption generation | ❌ Not started | 4h |
| Topic channels | ❌ Not started | 6h |

**Priority:** 🟢 Low (Nice-to-have)

---

### 2.5 Settings (Configuration Hub)

**Master Architecture Specifies:**
- Entity Model (Context switching)
- Appearance (Accent color picker)
- Quick Launch Editor
- Widget Canvas Editor
- Billing & Usage Ledger
- Privacy & Security (Access logs, export, purge)

**Current State:**
- ✅ Account section with avatar editing
- ✅ Household section (should be Entity)
- ✅ Pane Order editor
- ❌ Appearance settings (accent color)
- ❌ Quick Launch editor
- ❌ Widget Canvas editor
- ❌ Billing/Usage ledger
- ❌ Privacy controls

**Gaps:**
| Feature | Status | Effort |
|---------|--------|--------|
| Accent color picker | ❌ Not started | 3h |
| Theme presets | ❌ Not started | 2h |
| Quick Launch editor | ❌ Not started | 4h |
| Widget Canvas editor | ❌ Not started | 6h |
| `token_ledger` table | Exists (unused) | 1h |
| Billing summary view | ❌ Not started | 4h |
| Transaction history view | ❌ Not started | 3h |
| Access logs table | ❌ Not started | 2h |
| Access logs UI | ❌ Not started | 3h |
| Data export | ❌ Not started | 4h |
| Entity purge | ❌ Not started | 3h |

**Priority:** 🟡 Medium

---

### 2.6 Template Library (App Store)

**Master Architecture Specifies:**
- Storefront UI
- Auto-Scribe Documentation
- Owner-Only Publishing Rule
- Installation & Hydration

**Current State:**
- ❌ Not implemented at all

**Gaps:**
| Feature | Status | Effort |
|---------|--------|--------|
| `app_templates` table | ❌ Not started | 3h |
| Storefront UI | ❌ Not started | 8h |
| Template card variant | ❌ Not started | 3h |
| Installation flow | ❌ Not started | 8h |
| UUID remapping logic | ❌ Not started | 4h |
| P2P sharing flow | ❌ Not started | 6h |

**Priority:** 🟢 Low (Phase 3)

---

### 2.7 App Drawer Physics

**Master Architecture Specifies:**
- Dual-Stage Drawer (Closed → Sticky Stop 20% → Full 100%)
- Handle with neon pulse animation
- Notification Triage at Sticky Stop
- Physics-based snap behavior

**Current State:**
- ✅ Basic drawer exists
- ✅ Handle visible
- ❌ No Sticky Stop behavior
- ❌ No physics-based snapping
- ❌ No notification triage
- ❌ No neon pulse animation

**Gaps:**
| Feature | Status | Effort |
|---------|--------|--------|
| Physics snap logic | ❌ Not started | 4h |
| Sticky Stop (20%) state | ❌ Not started | 3h |
| Notification Triage UI | ❌ Not started | 6h |
| Neon pulse animation | ❌ Not started | 1h |
| Silence button | ❌ Not started | 1h |

**Priority:** 🟡 Medium (UX improvement)

---

## 3. Missing UI Features

### 3.1 Theme Engine CSS Variables

**Master Architecture Specifies:**
```css
--color-primary: #00d4ff    /* Mutable accent */
--color-secondary: #a855f7  /* Mutable accent */
--color-bg: #0a0a0f         /* Immutable */
--color-bg-secondary: #1a1a2e
```

**Current State:**
- Tailwind uses `--primary` variable ✅
- Many components use hardcoded colors (`text-cyan-500`, `border-primary`, etc.)
- No accent color switching

**Gaps:**
- [ ] Audit all components for hardcoded colors
- [ ] Replace hardcoded colors with CSS variables
- [ ] Implement runtime theme switching
- [ ] Add accent presets (Cyber Cyan, Neon Pink, Matrix Green, Sunset Orange)
- [ ] Store selected theme in `user_settings`

**Priority:** 🟡 Medium

---

### 3.2 ViewEngine Variants Still Needed

**Master Architecture Lists:**

| Category | Variant | Status |
|----------|---------|--------|
| **Layouts** | `layout_app_shell` | ✅ Done |
| | `layout_top_tabs` | ✅ Done |
| **Views** | `view_directory` | ✅ Done |
| | `view_list_stack` | ✅ Done |
| | `view_grid_fixed` | ✅ Done |
| | `view_carousel_snap` | ❌ Not started |
| | `view_dashboard_masonry` | ❌ Not started |
| **Rows** | `row_detail_check` | ✅ Done |
| | `row_neon_group` | ✅ Done |
| | `row_simple` | ✅ Done |
| | `row_input_stepper` | ✅ Done |
| | `row_input_currency` | ✅ Done |
| **Cards** | `card_media_top` | ✅ Done |
| | `card_stat_hero` | ❌ Not started |
| | `card_app_icon` | ❌ Not started |
| | `card_feed_text` | ❌ Not started |
| | `card_feed_node` | ❌ Not started |
| | `card_feed_article` | ❌ Not started |
| | `card_template_preview` | ❌ Not started |
| **Special** | `custom_layout` (SDUI) | ❌ Not started |

**Priority:** 🟡 Medium (As needed)

---

### 3.3 Behavior System Implementation

**Master Architecture Specifies:**
| Action | Description |
|--------|-------------|
| `update_field` | Updates metadata key |
| `toggle_status` | Cycles status |
| `move_node` | Moves to new parent |
| `log_event` | Creates child event |

**Current State:**
- Behavior types defined ✅
- `row_input_stepper` uses `update_field` ✅
- `row_input_currency` uses `update_field` ✅
- ❌ No actual persistence (changes are local only)
- ❌ `toggle_status` not implemented
- ❌ `move_node` not implemented
- ❌ `log_event` not implemented

**Gaps:**
- [ ] Create `useTriggerBehavior()` hook with Supabase mutations
- [ ] Implement `toggle_status` action
- [ ] Implement `move_node` action
- [ ] Implement `log_event` action
- [ ] Add optimistic updates

**Priority:** 🔴 Critical (Required for functional UI)

---

## 4. Missing AI Layer

### 4.1 LangGraph Orchestrator

**Master Architecture Specifies:**
- Schema discovery from Context Roots
- Tool execution and result handling
- Multi-step reasoning
- Error recovery

**Current State:**
- ❌ Not started at all

**Gaps:**
| Component | Status | Effort |
|-----------|--------|--------|
| LangGraph Python setup | ❌ Not started | 8h |
| Supabase Edge Functions | ❌ Not started | 4h |
| Chat completion endpoint | ❌ Not started | 6h |
| Tool definitions | ❌ Not started | 8h |
| Streaming response | ❌ Not started | 4h |

**Priority:** 🔴 Critical (Enables all AI features)

---

### 4.2 AI Toolset

**Master Architecture Specifies:**
| Tool | Purpose |
|------|---------|
| `explore_context(root_id)` | Returns schema of a User App |
| `query_nodes(filter_logic)` | Finds nodes by metadata |
| `manage_relationship(source, target, type)` | Links/unlinks items |
| `crud_node(action, data)` | Create/Read/Update/Delete |
| `agenda_aggregate(date_range)` | Query schedulable items |

**Current State:**
- ❌ No tools implemented

**Gaps:**
- [ ] Define tool schemas (JSON Schema)
- [ ] Implement `explore_context` RPC
- [ ] Implement `query_nodes` RPC
- [ ] Implement `manage_relationship` RPC
- [ ] Implement `crud_node` RPC
- [ ] Implement `agenda_aggregate` RPC
- [ ] Create tool executor middleware

**Priority:** 🔴 Critical

---

### 4.3 Zep Memory Integration

**Master Architecture Specifies:**
- Conversation history
- User preference learning
- Entity extraction
- Temporal context

**Current State:**
- ❌ Not started

**Priority:** 🟡 Medium (After LangGraph)

---

## 5. Missing Integrations

### 5.1 External Service Integrations

| Service | Purpose | Status | Priority |
|---------|---------|--------|----------|
| **OpenWeather API** | Weather data | ❌ Not started | 🟡 Medium |
| **Redis (Upstash)** | Cache + job queue | ❌ Not started | 🟡 Medium |
| **Cloudflare R2** | Object storage | ❌ Not started | 🟡 Medium |
| **Nylas** | Email + Calendar | ❌ Not started | 🔴 Critical |
| **GetStream** | Chat + Feed | ❌ Not started | 🟡 Medium |
| **Stripe** | Payments | ❌ Not started | 🟢 Low |
| **Perplexity/Tavily** | Web search | ❌ Not started | 🟢 Low |
| **Replicate** | Image generation | ❌ Not started | 🟢 Low |

---

## 6. Prioritized Development Phases (Frontend-First Approach)

> **Philosophy:** This is a data-driven UI where the frontend defines the data contracts. Mock data serves as executable specifications that LangGraph must satisfy. The frontend is the source of truth.

### Phase 1: Frontend UI/UX Completion (4-6 weeks)
**Goal:** Pixel-perfect, fully interactive dashboards with mock data as the contract.

Since mock data defines the AI's output contract, we build complete UI flows first. Every mock array becomes a TypeScript interface that LangGraph must satisfy.

| Task | Effort | Priority | Notes |
|------|--------|----------|-------|
| **Dashboard Completion** | | | |
| - Dynamic Widget Area | 8h | 🔴 Critical | Define widget contract |
| - Quick Launch shortcuts | 4h | 🟡 Medium | Define shortcut schema |
| - Activity Log UI (mock pulse) | 4h | 🔴 Critical | Define ActivityLogEntry interface |
| - Weather widget polish | 2h | 🟢 Low | Contract already defined |
| **Agenda Completion** | | | |
| - Schedule Tab full UI | 6h | 🔴 Critical | Timeline with Now line |
| - Calendar Tab (Month/Week/Day) | 12h | 🔴 Critical | Drag-drop support |
| - Tasks Tab (Task Pool) | 8h | 🔴 Critical | Kanban/list views |
| - Routines Tab | 6h | 🟡 Medium | Cron editor UI |
| **Chat UI Shell** | | | |
| - Voice input with waveform | 6h | 🔴 Critical | Mic button capture |
| - Message list with cards | 4h | 🔴 Critical | ViewEngine cards in chat |
| - Input area (text + attachments) | 3h | 🟡 Medium | File picker |
| **Settings Completion** | | | |
| - Accent color picker | 3h | 🟡 Medium | Theme presets |
| - Quick Launch editor | 4h | 🟡 Medium | Drag-drop |
| - Billing UI (mock data) | 4h | 🟡 Medium | Summary + transactions |
| - Privacy controls UI | 3h | 🟢 Low | Access logs display |
| **App Drawer Physics** | | | |
| - Sticky Stop behavior (20%) | 4h | 🟡 Medium | Spring physics |
| - Notification Triage UI | 6h | 🟡 Medium | Quick actions |
| - Neon pulse animation | 1h | 🟢 Low | CSS keyframes |
| **Missing ViewEngine Variants** | | | |
| - `view_carousel_snap` | 4h | 🟡 Medium | For widget area |
| - `view_dashboard_masonry` | 6h | 🟡 Medium | For dashboard |
| - `card_stat_hero` | 3h | 🟡 Medium | For KPI display |
| - `card_app_icon` | 2h | 🔴 Critical | For app drawer |
| - Feed card variants | 6h | 🟢 Low | `card_feed_*` |
| **Theme Engine Audit** | | | |
| - Audit hardcoded colors | 4h | 🔴 Critical | Replace with variables |
| - Implement runtime switching | 4h | 🟡 Medium | localStorage persistence |

**Phase 1 Total:** ~110 hours (~3 weeks full-time)

**Key Output:** TypeScript interfaces and `__field_defs` for every data shape the AI must produce.

---

### Phase 2: Edge Gateway (Cloudflare Worker + Redis) (2-3 weeks)
**Goal:** Production infrastructure without AI yet.

| Task | Effort | Priority | Notes |
|------|--------|----------|-------|
| **Cloudflare Worker Scaffold** | | | |
| - Basic routing + CORS | 4h | 🔴 Critical | Entry point |
| - JWT authentication | 8h | 🔴 Critical | Replace test users |
| - Error handling + logging | 4h | 🔴 Critical | Observability |
| **Redis Integration (Upstash)** | | | |
| - Connection setup | 2h | 🔴 Critical | KV store |
| - Cache utilities | 4h | 🔴 Critical | Get/Set/Invalidate |
| - Read-through pattern | 4h | 🔴 Critical | View JSON caching |
| **API Endpoints** | | | |
| - `/api/views/:contextId` | 6h | 🔴 Critical | Cached view assembly |
| - `/api/weather` | 3h | 🟡 Medium | OpenWeather + Redis cache |
| - `/api/transcribe` | 8h | 🔴 Critical | Whisper at edge |
| **Auth Migration** | | | |
| - Supabase Auth integration | 6h | 🔴 Critical | Real JWT flow |
| - Profile creation trigger | 2h | 🔴 Critical | Already exists, verify |
| - Remove dev test user bypass | 2h | 🟡 Medium | Cleanup |

**Phase 2 Total:** ~53 hours (~1.5 weeks full-time)

**Key Output:** Secure, cached edge gateway ready for AI backend.

---

### Phase 3: LangGraph Python Backend (4-6 weeks)
**Goal:** The AI reads frontend contracts and produces conformant data.

| Task | Effort | Priority | Notes |
|------|--------|----------|-------|
| **FastAPI Scaffold** | | | |
| - Project setup + routing | 4h | 🔴 Critical | Poetry, uvicorn |
| - Worker authentication | 4h | 🔴 Critical | Secret key validation |
| - Error handling | 4h | 🔴 Critical | Structured errors |
| **LangGraph Core** | | | |
| - Graph setup + state | 8h | 🔴 Critical | ReAct pattern |
| - Tool executor node | 6h | 🔴 Critical | Tool dispatch |
| - Response streamer | 6h | 🔴 Critical | SSE to frontend |
| **AI Toolset Implementation** | | | |
| - `explore_context(root_id)` | 6h | 🔴 Critical | Schema discovery |
| - `query_nodes(filter)` | 6h | 🔴 Critical | Search + filter |
| - `crud_node(action, data)` | 8h | 🔴 Critical | Create/Update/Delete |
| - `manage_relationship(...)` | 6h | 🟡 Medium | Link management |
| - `agenda_aggregate(range)` | 6h | 🟡 Medium | Schedulable items |
| **Real-Time Features** | | | |
| - Activity Log streaming | 8h | 🔴 Critical | Replace mock pulse |
| - Supabase realtime subscription | 4h | 🟡 Medium | Live updates |
| **Poly Chat Integration** | | | |
| - Intent parsing | 8h | 🔴 Critical | User message → tool |
| - Response generation | 6h | 🔴 Critical | Tool result → reply |
| - Card responses | 6h | 🟡 Medium | ViewEngine in chat |
| **Schema Discovery** | | | |
| - `__field_defs` parser | 4h | 🔴 Critical | Understand domains |
| - Domain inference | 6h | 🟡 Medium | "This app tracks X" |

**Phase 3 Total:** ~106 hours (~2.5 weeks full-time)

**Key Output:** AI that can create, query, and manage data matching frontend contracts.

---

### Phase 4: External Integrations (3-4 weeks)
**Goal:** Communication and social features.

| Task | Effort | Priority | Notes |
|------|--------|----------|-------|
| **GetStream Chat** | | | |
| - SDK setup + auth | 4h | 🔴 Critical | User tokens |
| - Message component | 6h | 🔴 Critical | Replace placeholder |
| - Realtime subscription | 4h | 🔴 Critical | Live messages |
| - ViewEngine cards in chat | 6h | 🟡 Medium | Rich responses |
| **Nylas Calendar** | | | |
| - OAuth flow | 6h | 🔴 Critical | Google/Outlook |
| - Event sync | 8h | 🔴 Critical | Pull external events |
| - Calendar display | 6h | 🔴 Critical | Unified timeline |
| **GetStream Feed** | | | |
| - Feed SDK setup | 4h | 🟢 Low | If time permits |
| - Activity cards | 6h | 🟢 Low | Feed display |
| - RSS ingest worker | 8h | 🟢 Low | Background job |
| **Cloudflare R2** | | | |
| - Signed URL generation | 4h | 🟡 Medium | Direct upload |
| - File metadata tracking | 4h | 🟡 Medium | Resources table |
| - Image processing | 6h | 🟢 Low | Thumbnails |

**Phase 4 Total:** ~72 hours (~2 weeks full-time)

**Key Output:** Chat, calendar sync, and file storage working.

---

### Phase 5: Production Polish (2-3 weeks)
**Goal:** Ship-ready application.

| Task | Effort | Priority | Notes |
|------|--------|----------|-------|
| **Billing System** | | | |
| - `token_ledger` table activation | 2h | 🟡 Medium | Already exists |
| - Usage tracking in Worker | 6h | 🟡 Medium | LLM tokens, storage |
| - Billing UI real data | 4h | 🟡 Medium | Connect to ledger |
| - Stripe integration | 8h | 🟡 Medium | Credit purchase |
| **Template Library** | | | |
| - `app_templates` table | 3h | 🟢 Low | Schema |
| - Storefront UI | 8h | 🟢 Low | Grid display |
| - Installation flow | 8h | 🟢 Low | UUID remapping |
| **Native Wrapper** | | | |
| - Capacitor setup | 4h | 🟡 Medium | iOS/Android |
| - Push notifications | 8h | 🟡 Medium | FCM/APNS |
| - Background geolocation | 6h | 🟢 Low | Location awareness |
| **Final Polish** | | | |
| - Error boundaries | 4h | 🔴 Critical | Graceful failures |
| - Loading states | 4h | 🔴 Critical | Skeleton screens |
| - Empty states | 3h | 🔴 Critical | First-run experience |
| - PWA manifest check | 2h | 🔴 Critical | Installable |

**Phase 5 Total:** ~70 hours (~2 weeks full-time)

**Key Output:** Production-ready application.

---

## Total Timeline Summary

| Phase | Duration | Cumulative | Focus |
|-------|----------|------------|-------|
| **Phase 1** | 3-4 weeks | 4 weeks | Frontend contracts |
| **Phase 2** | 1.5-2 weeks | 6 weeks | Edge infrastructure |
| **Phase 3** | 2.5-4 weeks | 10 weeks | AI brain |
| **Phase 4** | 2-3 weeks | 13 weeks | Integrations |
| **Phase 5** | 2 weeks | 15 weeks | Production polish |

**Total: ~15 weeks (~4 months)** with a single full-time developer.

---

## Sprint Planning Guide

### Sprint 1-2 (Weeks 1-2): Dashboard + Agenda UI
- Dashboard widget area
- Agenda all 4 tabs
- Theme Engine audit

### Sprint 3 (Week 3): Chat + Settings UI
- Chat shell with voice input
- Settings accent picker + billing UI
- App Drawer physics

### Sprint 4 (Week 4): ViewEngine Variants + Polish
- Missing variants
- Empty states
- Contract documentation

### Sprint 5-6 (Weeks 5-6): Edge Gateway
- Cloudflare Worker
- Redis caching
- Auth migration

### Sprint 7-10 (Weeks 7-10): LangGraph
- FastAPI scaffold
- AI Toolset
- Poly integration

### Sprint 11-13 (Weeks 11-13): Integrations
- GetStream Chat
- Nylas Calendar
- R2 Storage

### Sprint 14-15 (Weeks 14-15): Production
- Billing
- Native wrapper
- Final polish

---

## Quick Reference: What Works vs What's Mock

### ✅ Fully Functional
- Resources table (CRUD)
- Context Roots (User Apps)
- ViewEngine rendering
- Navigation (drilling in/out)
- Identity (profiles, households)
- Shadow users (dependents)
- Basic forms (create/edit resources)

### 🟡 Shell Only (Mock Data)
- Dashboard (weather, activity log, health)
- Agenda (all tabs)
- Chat (placeholder)
- Feed (mock posts)
- Health Pane
- Finance Pane
- Cloud Pane

### ❌ Not Started
- AI Layer (LangGraph, Zep)
- External integrations (Nylas, GetStream, R2)
- Billing system
- Template Library
- Real-time features

---

**Document End**

*Use this roadmap to prioritize development. Update checkboxes as features are completed.*
