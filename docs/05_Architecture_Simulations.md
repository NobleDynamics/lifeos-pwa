# Architecture Simulations: "Tracing the Wires"

**Date:** 2025-11-30
**Version:** 1.0.0
**Status:** DRAFT
**Context:** Validating `docs/00_MASTER_ARCHITECTURE.md` against real-world AI Agent workflows.

---

## Use Case 1: The "App Builder" Workflow
**Scenario:** User says: *"Build me a Wardrobe app to track my clothes and plan laundry."*
**Goal:** The AI must define the schema, view configuration, and install the root node.

### Trace Log

#### Step 1: Intent & Schema Design
*   **Agent:** Builder Agent
*   **Action:** Reasoning (Internal)
*   **Logic:** "User wants 'Wardrobe'. Needs 'Clothes' (Items). Properties: Brand, Size, Color, Cleanliness."
*   **Output (Internal Plan):**
    ```json
    {
      "appName": "Wardrobe",
      "fields": {
        "brand": { "type": "text" },
        "size": { "type": "select", "options": ["S", "M", "L", "XL"] },
        "soiled_status": { "type": "select", "options": ["clean", "dirty"] }
      }
    }
    ```

#### Step 2: Root Node Creation (Installation)
*   **Agent:** Builder Agent
*   **Tool:** `create_resource`
*   **Table:** `resources`
*   **SQL Operation:** `INSERT INTO resources ...`
*   **JSON Data (The Payload):**
    ```json
    {
      "type": "folder",
      "title": "Wardrobe",
      "path": "root.wardrobe",
      "meta_data": {
        "context": "user.wardrobe",
        "variant": "view_grid_masonry",
        "__field_defs": {
          "brand": { "label": "Brand", "type": "text" },
          "size": { "label": "Size", "type": "select", "options": ["S", "M", "L", "XL"] },
          "soiled_status": { "label": "Status", "type": "select", "options": ["clean", "dirty"] }
        },
        "__config": {
          "slot_headline": "title",
          "slot_subtext": "brand",
          "slot_badge_1": "soiled_status"
        }
      }
    }
    ```
*   **Outcome:** The "Wardrobe" app is now installed. The `__field_defs` are stored on the Root Node, serving as the "Schema Registry" for this domain.

#### Step 3: Item Creation (User Usage)
*   **Agent:** User (via UI) or Agent (via Chat)
*   **Tool:** `create_resource`
*   **Table:** `resources`
*   **JSON Data:**
    ```json
    {
      "parent_id": "{wardrobe_root_uuid}",
      "type": "item",
      "title": "Blue Denim Jacket",
      "meta_data": {
        "brand": "Levis",
        "size": "M",
        "soiled_status": "clean"
      }
    }
    ```
*   **Validation:** The UI (or Agent) reads `wardrobe_root.meta_data.__field_defs` to render the "Status" dropdown with "clean/dirty" options.

---

## Use Case 2: The "Laundry Planner" Workflow
**Scenario:** User says: *"Plan my laundry for Friday."*
**Goal:** The AI must identify dirty items, create a task, link them, and schedule it.

### Trace Log

#### Step 1: Discovery (Context Loading)
*   **Agent:** Manager Agent
*   **Tool:** `explore_context('user.wardrobe')`
*   **Table:** `resources` (Fetch Root)
*   **Return:**
    ```json
    {
      "id": "{wardrobe_root_uuid}",
      "title": "Wardrobe",
      "__field_defs": {
        "soiled_status": { "type": "select", "options": ["clean", "dirty"] }
      }
    }
    ```
*   **Reasoning:** "I see a `soiled_status` field. The value 'dirty' implies it needs cleaning."

#### Step 2: Query (Finding the Work)
*   **Agent:** Manager Agent
*   **Tool:** `query_nodes`
*   **SQL Operation:**
    ```sql
    SELECT * FROM resources 
    WHERE path <@ 'root.wardrobe' 
    AND meta_data->>'soiled_status' = 'dirty';
    ```
*   **Return:** List of 5 Nodes (e.g., "Gym Shirt", "Muddy Jeans").

#### Step 3: Action (Creating the Task)
*   **Agent:** Manager Agent
*   **Tool:** `create_resource`
*   **Table:** `resources`
*   **JSON Data:**
    ```json
    {
      "type": "task",
      "title": "Do Laundry (5 Items)",
      "is_schedulable": true,
      "scheduled_at": "2025-12-05T09:00:00Z",
      "duration_minutes": 120, 
      "meta_data": {
        "priority": "high",
        "context": "household.chores"
      }
    }
    ```
*   **Note:** `duration_minutes` is critical here for the Agenda to block 2 hours.

#### Step 4: Linking (The "Reference" Graph)
*   **Agent:** Manager Agent
*   **Tool:** `manage_relationship`
*   **Table:** `resource_links`
*   **Loop:** For each of the 5 dirty items:
    *   **Source:** `{task_uuid}`
    *   **Target:** `{item_uuid}`
    *   **Enum:** `REFERENCE` (or potentially `COMPONENT` if we view the load as a container).
    *   **Reasoning:** "This Task *references* these specific items as the subject of the work."

#### Step 5: Verification (Agenda View)
*   **Agent:** System (Agenda Engine)
*   **Query:** `SELECT * FROM resources WHERE is_schedulable = true`
*   **Result:** The "Do Laundry" task appears on Friday at 9 AM.
*   **UI:** The user clicks the task and sees the 5 linked items (via the `REFERENCE` links) to know exactly what to wash.

---

## Validation: The "Logic Layer" Gap

**Question:** *Does the proposed `__field_defs` structure actually give the Manager Agent enough context to infer logic, or do we need a stronger "Logic Layer"?*

**Analysis:**
1.  **Inference is Fragile:** The Agent *inferred* that `soiled_status: dirty` meant "needs laundry" based on LLM common sense. This works for "Laundry", but might fail for "Calibration Status: Uncalibrated" (Does it need calibration? Or is that normal?).
2.  **Missing "State Transitions":** `__field_defs` defines *static* types. It does not define *dynamic* flows (e.g., "When `dirty`, create Task").
3.  **Missing "Triggers":** There is no mechanism to *automatically* suggest this task when 5 items become dirty. The user had to *ask* "Plan my laundry".

**Conclusion:**
`__field_defs` is **Insufficient for Autonomous Proactivity**.
*   It is enough for **Passive Management** (User asks -> Agent figures it out).
*   It is NOT enough for **Active Automation** (System observes -> System acts).

**Recommendation:**
We need a **"Rules"** or **"Policies"** definition in the Metadata, likely in Phase 2.
*   *Example:*
    ```json
    "__policies": [
      {
        "trigger": "count(nodes.where(soiled_status == 'dirty')) > 5",
        "action": "suggest_task('Do Laundry')"
      }
    ]
    ```
