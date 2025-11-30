-- 08_final_cleanup.sql
-- Aggressively remove duplicate context roots, ignoring user_id.
-- We keep the OLDEST record for each context type.

BEGIN;

-- 1. Delete duplicates
DELETE FROM resources
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               meta_data->>'context' as context,
               created_at,
               ROW_NUMBER() OVER (
                   PARTITION BY meta_data->>'context' 
                   ORDER BY created_at ASC
               ) as rn
        FROM resources
        WHERE meta_data->>'context' IS NOT NULL
        AND deleted_at IS NULL
    ) t
    WHERE rn > 1
);

-- 2. Verify results (should show only 1 row per context)
SELECT id, title, meta_data->>'context' as context, created_at
FROM resources
WHERE meta_data->>'context' IS NOT NULL
ORDER BY meta_data->>'context';

COMMIT;
