-- Force Cleanup Duplicates
-- Aggressively removes duplicate context roots, keeping the oldest one.

BEGIN;

-- 1. Identify duplicates based on context string
-- We partition by context and user_id (since context roots are per user/household)
-- We keep the oldest one (rn=1)
WITH duplicates AS (
    SELECT id,
           meta_data->>'context' as context,
           created_at,
           ROW_NUMBER() OVER (
               PARTITION BY meta_data->>'context', user_id 
               ORDER BY created_at ASC
           ) as rn
    FROM resources
    WHERE meta_data->>'context' IS NOT NULL
    AND deleted_at IS NULL
)
-- 2. Delete the duplicates (rn > 1)
DELETE FROM resources
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);

-- 3. Ensure Cloud Files has correct title if needed
UPDATE resources
SET title = 'Cloud Files'
WHERE meta_data->>'context' = 'cloud.files'
AND title = 'cloud.files';

-- 4. Verify results
SELECT id, title, meta_data->>'context' as context, created_at
FROM resources
WHERE meta_data->>'context' IS NOT NULL
ORDER BY meta_data->>'context';

COMMIT;
