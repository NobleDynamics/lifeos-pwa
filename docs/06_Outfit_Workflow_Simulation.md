# Outfit Workflow Analysis

**Date:** 2025-11-30
**Context:** Validating "Outfit Composition & Scheduling" against the Master Architecture.

---

## The Challenge
1.  **Composition:** Build an "Outfit" from "Clothes".
2.  **Scheduling:** Wear the Outfit on a specific day (or recurring).
3.  **State Change:** Wearing it makes the clothes "Dirty".

## The Solution: "Definition vs. Instance" Pattern

The architecture supports this, but **only if we distinguish between the Outfit Definition and the Event Instance.**

### 1. Composition (The Definition)
**Structure:**
*   **Outfit Node:** `type: item`, `variant: outfit_card`, `title: "Casual Friday"`
*   **Clothes Nodes:** Shirt, Pants, Socks.
*   **Links:** `Outfit --[COMPONENT]--> Shirt`

**Trace:**
*   **Agent:** Builder Agent
*   **Action:** `manage_relationship(outfit_id, shirt_id, 'COMPONENT')`
*   **Result:** The Outfit is now a "Container" of parts.

### 2. Scheduling (The Instance)
**Problem:** If we set `scheduled_at` on the *Outfit Node*, we can only wear it once.
**Solution:** We create an **Event Node** that references the Outfit.

**Trace:**
*   **Agent:** Manager Agent (Scheduler)
*   **Action:** `create_resource`
*   **Data:**
    ```json
    {
      "type": "event",
      "title": "Wear Casual Friday",
      "is_schedulable": true,
      "scheduled_at": "2025-12-05T09:00:00Z",
      "duration_minutes": 0,
      "meta_data": {
        "context": "wardrobe.calendar"
      }
    }
    ```
*   **Linking:** `manage_relationship(event_id, outfit_id, 'REFERENCE')`

### 3. State Change (The Logic)
**Problem:** How do the clothes get dirty?
**Mechanism:** The "Logic Layer" (Agent) runs a nightly/morning routine.

**Trace:**
*   **Trigger:** Agent wakes up at 8 AM.
*   **Query:** `SELECT * FROM resources WHERE type='event' AND scheduled_at = TODAY`
*   **Result:** Finds "Wear Casual Friday" Event.
*   **Traversal:**
    1.  Follow `REFERENCE` link -> Finds "Casual Friday" Outfit.
    2.  Follow `COMPONENT` links -> Finds Shirt, Pants, Socks.
*   **Action:** `crud_node('update', { id: shirt_id, meta_data: { soiled_status: 'dirty' } })`

---

## Conclusion

**Does the system handle this?**
**YES**, but it requires the **Event Node Pattern**.

**What do we need to add?**
1.  **Schema:** Ensure `type: event` is supported (It is).
2.  **Schema:** Ensure `REFERENCE` link type is supported (Needs Phase 1 Migration).
3.  **Agent Tool:** `get_components(node_id)` helper to recursively fetch parts of an outfit.
