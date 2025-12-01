# AI Integration Gap Analysis

**Date:** 2025-11-30
**Version:** 1.0.0
**Status:** DRAFT
**Reference:** `docs/00_MASTER_ARCHITECTURE.md`

---

## 1. Architecture Scorecard

| Area | Status | Score | Critical Gaps |
| :--- | :--- | :--- | :--- |
| **1. Hybrid Data** | 🔴 **RED** | 20% | No "Pointer System" to link Nodes to Strict Tables (Transactions, Health). |
| **2. Self-Describing** | 🟡 **YELLOW** | 50% | `__field_defs` concept exists in Arch but missing in Seed Data & Schema enforcement. |
| **3. Agenda Protocol** | 🟡 **YELLOW** | 70% | `is_schedulable` exists, but missing standard `duration` for time blocking. |
| **4. Inference** | 🔴 **RED** | 0% | `resource_links` Enums do not match Master Architecture (Old vs. New Ontology). |

---

## 2. Detailed Gap Analysis

### 2.1 The "Hybrid Data" Gap (Shadow Nodes)
**Requirement:** The ViewEngine needs to render data from strict SQL tables (e.g., `transactions`, `health_logs`) while maintaining the Node abstraction.
*   **Current State:** `resources` table is purely self-contained. `health_logs` points *to* resources, but resources cannot point *to* strict tables.
*   **Missing Schema:**
    *   Need `pointer_table` (ENUM or TEXT) and `pointer_id` (UUID) on the `resources` table.
    *   Need `is_shadow` (BOOLEAN) flag to indicate this node is a projection.

### 2.2 The "Self-Describing" Gap (Metadata Definitions)
**Requirement:** AI needs to know that `soiled_status` accepts `['clean', 'dirty']` to avoid hallucinating values like `filthy`.
*   **Current State:** `node.ts` has `FieldDefinition` interface, but `resources` table and seed data do not use it. `meta_data` is currently a lawless JSON blob.
*   **Missing Schema:**
    *   Standardize `meta_data->>'__field_defs'` as the reserved key for schema definitions.
    *   Update `13_seed_viewengine.sql` to include these definitions for the AI to learn from.

### 2.3 The "Agenda Protocol" Gap (Time Engine)
**Requirement:** The Agenda App needs to block time on the calendar.
*   **Current State:** `is_schedulable` and `scheduled_at` exist.
*   **Missing Schema:**
    *   Missing `duration_minutes` (INT) on `resources` table (or standard metadata key). Without duration, the AI cannot "block" time, only mark a start time.
    *   Need Index on `is_schedulable` for performant Agenda aggregation.

### 2.4 The "Inference" Gap (Relationship Ontology)
**Requirement:** AI uses 8 Immutable Enums to infer logic (e.g., `COMPONENT` implies "Parts of").
*   **Current State:** Codebase uses legacy enums: `ingredient_of`, `related_to`, `blocks`, etc.
*   **Missing Schema:**
    *   **CRITICAL:** `resource_links.link_type` enum must be migrated to the Master list:
        *   `HIERARCHY`, `COMPONENT`, `DEPENDENCY`, `TRANSACTIONAL`, `SPATIAL`, `TEMPORAL`, `SOCIAL`, `REFERENCE`.

---

## 3. Refactoring Plan (Prioritized)

### Phase 1: Schema Alignment (The Foundation)
1.  **[SQL]** Alter `resource_links` type to use the 8 Master Enums.
2.  **[SQL]** Add `pointer_table`, `pointer_id`, and `duration_minutes` to `resources`.
3.  **[TS]** Update `node.ts` to match new Enums and add `pointer` fields.

### Phase 2: Data Enrichment (The Brain)
4.  **[SQL]** Update `13_seed_viewengine.sql` to include `__field_defs` in metadata.
5.  **[SQL]** Create a "Shadow Node" example in seed data (e.g., a Transaction node pointing to a mock transaction).

### Phase 3: AI Integration (The Agent)
6.  **[AI]** Build `explore_context` tool that reads `__field_defs`.
7.  **[AI]** Build `agenda_aggregate` tool that queries `is_schedulable + duration`.

---

## 4. Required Schema Changes (Copy-Paste Ready)

```sql
-- 1. Fix Relationships
ALTER TYPE link_type RENAME TO link_type_old;
CREATE TYPE link_type AS ENUM (
    'HIERARCHY', 'COMPONENT', 'DEPENDENCY', 
    'TRANSACTIONAL', 'SPATIAL', 'TEMPORAL', 
    'SOCIAL', 'REFERENCE'
);
ALTER TABLE resource_links 
    ALTER COLUMN link_type TYPE link_type 
    USING link_type::text::link_type; -- Will fail without mapping logic, need migration script

-- 2. Add Pointer System & Duration
ALTER TABLE resources 
    ADD COLUMN pointer_table TEXT, -- e.g., 'transactions', 'health_logs'
    ADD COLUMN pointer_id UUID,
    ADD COLUMN duration_minutes INTEGER DEFAULT 0;

-- 3. Index for Agenda
CREATE INDEX idx_resources_schedulable ON resources(is_schedulable) WHERE is_schedulable = true;
```
