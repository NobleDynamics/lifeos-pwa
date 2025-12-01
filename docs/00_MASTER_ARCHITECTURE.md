# LifeOS: Master Architecture & Ontology

**Version:** 1.0.0
**Status:** Living Document

---

## 1. Executive Summary: The "Headless" Operating System

LifeOS is not a standard SaaS app with hardcoded features. It is a **Data-Driven Operating System**.
It is architected to decouple **Data** (The Graph) from **Presentation** (The ViewEngine) from **Logic** (The AI).

* **The Body (Backend):** A universal, polymorphic storage system (`resources` table).
* **The Face (Frontend):** A recursive renderer (`ViewEngine`) that interprets JSON nodes into UI.
* **The Brain (AI):** A LangGraph agent that manages the Graph structure, creates tools, and answers user queries.

---

## 2. The Data Layer: The Universal Graph

We rely on a **Self-Describing Graph** rather than domain-specific tables. There is no `recipes` table; there are only Nodes that *look* like recipes.

### 2.1 The Universal Node (`resources`)
Every object in the system (Folder, Task, Recipe, File, Stock Item) is a row in the `resources` table.

* **Hierarchy:** We use Postgres `ltree` in the `path` column to enable infinite nesting and O(1) subtree queries.
    * *Example:* `root.household.kitchen.pantry.shelf_1`
* **Polymorphism:** We use `jsonb` in the `meta_data` column to store domain-specific fields.
    * *Recipe:* `{ "prep_time": 15, "ingredients": [...] }`
    * *Stock:* `{ "qty": 5, "expiry": "2025-12-01" }`
* **Identity:** `id` (UUID) + `user_id` (Owner) + `household_id` (Scope).

### 2.2 The Relationships (`resource_links`)
To allow the AI to infer meaning, we use **8 Immutable Relationship Enums** instead of custom link types.

| Enum | Meaning | Wardrobe Example | Recipe Example |
| :--- | :--- | :--- | :--- |
| **HIERARCHY** | Parent/Child (via ltree) | Closet > Shirt | Cookbook > Lasagna |
| **COMPONENT** | Physical composition | Outfit > Shirt | Lasagna > Cheese |
| **DEPENDENCY** | Prerequisite/Blocker | Wash > Dry | Chop > Cook |
| **TRANSACTIONAL** | Exchange of value | Purchase > Shirt | Purchase > Groceries |
| **SPATIAL** | Physical Location | Shirt is_in Hamper | Milk is_in Fridge |
| **TEMPORAL** | Scheduled time | Laundry Day (Event) | Dinner Time (Event) |
| **SOCIAL** | Assignment/Ownership | Shirt assigned_to Dad | Chore assigned_to Kid |
| **REFERENCE** | Loose link | Shirt matches Pants | Recipe see_also Wine |

---

## 3. The Presentation Layer: The ViewEngine

The UI is strictly a projection of the Graph. We do not write "Pages"; we write **View Configurations**.

### 3.1 The Taxonomy
We use **Structure-over-Intent** naming. We describe *geometry*, not content.

* **Views (Containers):** The layout engine.
    * `view_list_stack` (Standard vertical list)
    * `view_directory` (Search bar + List)
    * `view_grid_masonry` (Pinterest style)
* **Rows (List Items):**
    * `row_detail_check` (Checkbox + Text + Badges)
    * `row_neon_group` (Cyberpunk Folder)
    * `row_input_stepper` (Qty +/- for Inventory)
* **Cards (Grid Items):**
    * `card_media_top` (Image + Text)
    * `card_stat_hero` (Big Metrics)

### 3.2 The Slot System
To make components reusable, we use a **Config Map**.
* **Data:** `{ "task_name": "Buy Milk", "deadline": "2025-01-01" }`
* **Config:** `{ "__config": { "slot_headline": "task_name", "slot_badge": "deadline" } }`

---

## 4. The Application Layer: System vs. User Apps

### 4.1 System Apps (Hardcoded Utilities)
Core engines that aggregate data from across the graph.
1.  **Agenda (The Time Engine):** Aggregates ALL nodes where `is_schedulable = true`. It is the central calendar for Laundry, Meetings, and Watering Plants.
2.  **Chat (The Interface):** The conversational UI for the AI.
3.  **Dashboard (The HUD):** High-level summary of active contexts.
4.  **Social Feed (The Network):** Activity stream from connections (GetStream).
5.  **Settings (The Config):** Identity, Household, and App Management.

### 4.2 User Apps (Data-Driven Domains)
Everything else is a "User App"—a specific View Configuration mounted to a Context Root.
* **Examples:** Household, Health, Finance, Wardrobe, Gardening.
* **Installation:** A User App is installed by inserting a Root Node (e.g., `user.gardening`) into the DB. The App Shell dynamically renders it in the navigation.

---

## 5. The AI Layer: Inference & Ontology

The LangGraph Agent acts as the "Ghost in the Shell." It does not rely on hardcoded plugins; it relies on **Graph Discovery**.

### 5.1 Schema Discovery
The AI learns how to manage a domain by scanning the Root Node.
* *Input:* User installs "Wardrobe" app.
* *AI Scan:* Finds nodes with `soiled_status` (clean/dirty).
* *Inference:* "This domain tracks item cleanliness."

### 5.2 Self-Describing Metadata
To prevent hallucination, `meta_data` includes Field Definitions.
* **Value:** `"soiled_status": "dirty"`
* **Definition:** `"__field_def": { "soiled_status": { "type": "select", "options": ["clean", "dirty"] } }`

### 5.3 The AI Toolset
The AI interacts with the system via generic graph tools:
1.  **`explore_context(root_id)`**: Returns the schema/structure of a specific User App.
2.  **`query_nodes(filter_logic)`**: Finds nodes based on metadata (e.g., "Find all dirty clothes").
3.  **`manage_relationship(source, target, type)`**: Links items (e.g., Create Outfit).
4.  **`crud_node(action, data)`**: Standard Create/Update/Delete.