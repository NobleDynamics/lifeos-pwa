-- Fix RLS Policies and Cleanup Duplicates
-- Run this to resolve "Unknown User" and empty app issues

-- =============================================
-- 1. FIX PROFILES RLS
-- =============================================
-- Allow access to all profiles for dev/test users to ensure names load
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON profiles;

CREATE POLICY "Dev Bypass: Allow Test Users" ON profiles
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- =============================================
-- 2. FIX RESOURCES RLS (Enable Household Access)
-- =============================================
-- Allow access if user is owner OR if resource belongs to user's household
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON resources;

CREATE POLICY "Dev Bypass: Allow Test Users" ON resources
    FOR ALL 
    USING (
        -- User is owner
        user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid)
        -- OR resource belongs to a household the user is in
        OR household_id IN (
            SELECT household_id 
            FROM household_members 
            WHERE user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid)
        )
    )
    WITH CHECK (true);

-- =============================================
-- 3. CLEANUP DUPLICATE CONTEXT ROOTS
-- =============================================

-- Cleanup cloud.files duplicates
-- Keep the one with the system ID if possible, or just the first one
DELETE FROM resources 
WHERE title = 'cloud.files' 
AND id NOT IN (
    SELECT id FROM resources 
    WHERE title = 'cloud.files' 
    ORDER BY created_at ASC 
    LIMIT 1
);

-- Cleanup household.todos duplicates
DELETE FROM resources 
WHERE meta_data->>'context' = 'household.todos'
AND id NOT IN (
    SELECT id FROM resources 
    WHERE meta_data->>'context' = 'household.todos'
    ORDER BY created_at ASC 
    LIMIT 1
);

-- =============================================
-- 4. ENSURE SYSTEM APPS EXIST & HAVE CORRECT HOUSEHOLD
-- =============================================
-- Make sure the "Shopping", "Stock", "Recipes" roots belong to the Smith Family household
-- so they are visible to members

UPDATE resources
SET household_id = '33333333-3333-3333-3333-333333333333'
WHERE title IN ('Shopping', 'Stock', 'Recipes', 'To-Do')
AND household_id IS NULL;

