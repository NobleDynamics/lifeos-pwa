-- Cleanup Duplicates V2
-- Run this to remove duplicate apps created by useContextRoot

-- =============================================
-- 1. CLEANUP DUPLICATES
-- =============================================

-- Delete resources that have the context string as the title (e.g. "household.shopping")
-- AND there exists another resource with the same context but a different title (e.g. "Shopping")
-- This prefers the "nicely named" resources.

DELETE FROM resources r1
WHERE title = meta_data->>'context' -- Title matches context string (auto-created)
AND EXISTS (
    SELECT 1 FROM resources r2
    WHERE r2.meta_data->>'context' = r1.meta_data->>'context'
    AND r2.id != r1.id
    AND r2.title != r2.meta_data->>'context' -- Has a custom title
);

-- =============================================
-- 2. ENSURE HOUSEHOLD OWNERSHIP
-- =============================================
-- Ensure the remaining "nice" apps are owned by the household
-- so they are visible to all members (now that RLS is fixed)

UPDATE resources
SET household_id = '33333333-3333-3333-3333-333333333333'
WHERE title IN ('Shopping', 'Stock', 'Recipes', 'To-Do')
AND household_id IS NULL;

-- =============================================
-- 3. VERIFY
-- =============================================
SELECT id, title, household_id, meta_data->>'context' as context 
FROM resources 
WHERE meta_data->>'context' IS NOT NULL;
