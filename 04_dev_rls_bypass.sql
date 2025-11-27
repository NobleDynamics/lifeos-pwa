-- Development RLS Policy Override
-- Run this AFTER 02_todo_schema.sql to allow test users to access data
-- DELETE this file before production deployment and re-run 02_todo_schema.sql
--
-- Test User IDs:
-- User 1: 11111111-1111-1111-1111-111111111111
-- User 2: 22222222-2222-2222-2222-222222222222

-- =============================================
-- DROP ORIGINAL PRODUCTION POLICIES
-- =============================================
-- These policy names must match EXACTLY what's in 02_todo_schema.sql

-- todo_categories
DROP POLICY IF EXISTS "Users can view their own categories" ON todo_categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON todo_categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON todo_categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON todo_categories;

-- todo_lists
DROP POLICY IF EXISTS "Users can view their own lists" ON todo_lists;
DROP POLICY IF EXISTS "Users can insert their own lists" ON todo_lists;
DROP POLICY IF EXISTS "Users can update their own lists" ON todo_lists;
DROP POLICY IF EXISTS "Users can delete their own lists" ON todo_lists;

-- todo_items
DROP POLICY IF EXISTS "Users can view their own items" ON todo_items;
DROP POLICY IF EXISTS "Users can insert their own items" ON todo_items;
DROP POLICY IF EXISTS "Users can update their own items" ON todo_items;
DROP POLICY IF EXISTS "Users can delete their own items" ON todo_items;

-- user_preferences
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;

-- Also drop any previously created dev policies (in case re-running)
DROP POLICY IF EXISTS "Dev: Users can view categories" ON todo_categories;
DROP POLICY IF EXISTS "Dev: Users can insert categories" ON todo_categories;
DROP POLICY IF EXISTS "Dev: Users can update categories" ON todo_categories;
DROP POLICY IF EXISTS "Dev: Users can delete categories" ON todo_categories;
DROP POLICY IF EXISTS "Dev: Users can view lists" ON todo_lists;
DROP POLICY IF EXISTS "Dev: Users can insert lists" ON todo_lists;
DROP POLICY IF EXISTS "Dev: Users can update lists" ON todo_lists;
DROP POLICY IF EXISTS "Dev: Users can delete lists" ON todo_lists;
DROP POLICY IF EXISTS "Dev: Users can view items" ON todo_items;
DROP POLICY IF EXISTS "Dev: Users can insert items" ON todo_items;
DROP POLICY IF EXISTS "Dev: Users can update items" ON todo_items;
DROP POLICY IF EXISTS "Dev: Users can delete items" ON todo_items;
DROP POLICY IF EXISTS "Dev: Users can view preferences" ON user_preferences;
DROP POLICY IF EXISTS "Dev: Users can insert preferences" ON user_preferences;
DROP POLICY IF EXISTS "Dev: Users can update preferences" ON user_preferences;
DROP POLICY IF EXISTS "Dev: Users can delete preferences" ON user_preferences;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON todo_categories;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON todo_lists;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON todo_items;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON user_preferences;

-- =============================================
-- CREATE DEV BYPASS POLICIES (FOR ALL)
-- =============================================
-- Using FOR ALL covers SELECT, INSERT, UPDATE, DELETE in one policy
-- Allows access when row's user_id matches our test user IDs

CREATE POLICY "Dev Bypass: Allow Test Users" ON todo_categories
    FOR ALL 
    USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
    WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));

CREATE POLICY "Dev Bypass: Allow Test Users" ON todo_lists
    FOR ALL 
    USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
    WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));

CREATE POLICY "Dev Bypass: Allow Test Users" ON todo_items
    FOR ALL 
    USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
    WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));

CREATE POLICY "Dev Bypass: Allow Test Users" ON user_preferences
    FOR ALL 
    USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
    WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));

-- =============================================
-- VERIFY POLICIES
-- =============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('todo_categories', 'todo_lists', 'todo_items', 'user_preferences')
ORDER BY tablename, policyname;
