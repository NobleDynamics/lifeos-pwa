-- Development RLS Policy Override
-- Run this AFTER 08_resource_graph.sql to allow test users to access data
-- DELETE this file before production deployment
--
-- Test User IDs:
-- User 1: 11111111-1111-1111-1111-111111111111
-- User 2: 22222222-2222-2222-2222-222222222222

-- =============================================
-- LEGACY TODO TABLES (renamed to legacy_*)
-- =============================================
-- These tables were renamed by 08_resource_graph.sql migration
-- Only create policies if the legacy tables exist

DO $$ 
BEGIN
    -- Legacy todo_categories (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_todo_categories' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON legacy_todo_categories;
        CREATE POLICY "Dev Bypass: Allow Test Users" ON legacy_todo_categories
            FOR ALL 
            USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
            WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));
        RAISE NOTICE 'Created policy for legacy_todo_categories';
    END IF;
    
    -- Legacy todo_lists (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_todo_lists' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON legacy_todo_lists;
        CREATE POLICY "Dev Bypass: Allow Test Users" ON legacy_todo_lists
            FOR ALL 
            USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
            WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));
        RAISE NOTICE 'Created policy for legacy_todo_lists';
    END IF;
    
    -- Legacy todo_items (if exists)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_todo_items' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON legacy_todo_items;
        CREATE POLICY "Dev Bypass: Allow Test Users" ON legacy_todo_items
            FOR ALL 
            USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
            WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));
        RAISE NOTICE 'Created policy for legacy_todo_items';
    END IF;
END $$;

-- =============================================
-- USER PREFERENCES TABLE
-- =============================================
-- Drop production policies first
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON user_preferences;

CREATE POLICY "Dev Bypass: Allow Test Users" ON user_preferences
    FOR ALL 
    USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
    WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));

-- =============================================
-- RESOURCE GRAPH TABLES (NEW)
-- =============================================

-- Drop production policies for new resource tables
DROP POLICY IF EXISTS "Users can view own resources" ON resources;
DROP POLICY IF EXISTS "Users can insert own resources" ON resources;
DROP POLICY IF EXISTS "Users can update own resources" ON resources;
DROP POLICY IF EXISTS "Users can delete own resources" ON resources;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON resources;

DROP POLICY IF EXISTS "Users can view own resource links" ON resource_links;
DROP POLICY IF EXISTS "Users can insert own resource links" ON resource_links;
DROP POLICY IF EXISTS "Users can delete own resource links" ON resource_links;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON resource_links;

DROP POLICY IF EXISTS "Users can view own health logs" ON health_logs;
DROP POLICY IF EXISTS "Users can insert own health logs" ON health_logs;
DROP POLICY IF EXISTS "Users can update own health logs" ON health_logs;
DROP POLICY IF EXISTS "Users can delete own health logs" ON health_logs;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON health_logs;

DROP POLICY IF EXISTS "Household members can view inventory logs" ON inventory_logs;
DROP POLICY IF EXISTS "Household members can insert inventory logs" ON inventory_logs;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON inventory_logs;

-- Create dev bypass policies for resources table
CREATE POLICY "Dev Bypass: Allow Test Users" ON resources
    FOR ALL 
    USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
    WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));

-- Create dev bypass policies for resource_links table
-- Note: Links are accessible if the user owns either the source or target resource
CREATE POLICY "Dev Bypass: Allow Test Users" ON resource_links
    FOR ALL 
    USING (
        source_id IN (SELECT id FROM resources WHERE user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
        OR target_id IN (SELECT id FROM resources WHERE user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
    )
    WITH CHECK (
        source_id IN (SELECT id FROM resources WHERE user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
    );

-- Create dev bypass policies for health_logs table
CREATE POLICY "Dev Bypass: Allow Test Users" ON health_logs
    FOR ALL 
    USING (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid))
    WITH CHECK (user_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid));

-- Create dev bypass policies for inventory_logs table
-- Note: Inventory logs use household_id, so we allow any household for test users
CREATE POLICY "Dev Bypass: Allow Test Users" ON inventory_logs
    FOR ALL 
    USING (true)  -- Allow all for dev testing
    WITH CHECK (true);

-- =============================================
-- IDENTITY TABLES (profiles, household_members, connections)
-- =============================================

-- Drop production policies for profiles
-- Note: Some policies are created in 10_identity.sql, others in 11_households.sql
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view household member profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create shadow profiles" ON profiles;
DROP POLICY IF EXISTS "Users can delete managed shadow profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update shadow profiles" ON profiles;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON profiles;

-- Create dev bypass for profiles
CREATE POLICY "Dev Bypass: Allow Test Users" ON profiles
    FOR ALL 
    USING (
        id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid)
        OR managed_by_household_id IN ('33333333-3333-3333-3333-333333333333'::uuid)
        OR id IN ('44444444-4444-4444-4444-444444444444'::uuid) -- Shadow kid
    )
    WITH CHECK (true);

-- =============================================
-- HOUSEHOLDS TABLE
-- =============================================

-- Drop production policies for households
DROP POLICY IF EXISTS "Members can view household" ON households;
DROP POLICY IF EXISTS "Owners can update household" ON households;
DROP POLICY IF EXISTS "Users can create households" ON households;
DROP POLICY IF EXISTS "Owners can delete household" ON households;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON households;

-- Create dev bypass for households
CREATE POLICY "Dev Bypass: Allow Test Users" ON households
    FOR ALL 
    USING (
        id IN ('33333333-3333-3333-3333-333333333333'::uuid)
        OR owner_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid)
    )
    WITH CHECK (true);

-- =============================================
-- HOUSEHOLD MEMBERS TABLE
-- =============================================

-- Drop production policies for household_members
DROP POLICY IF EXISTS "Members can view household members" ON household_members;
DROP POLICY IF EXISTS "Owners can add members" ON household_members;
DROP POLICY IF EXISTS "Users can update own membership" ON household_members;
DROP POLICY IF EXISTS "Members can leave or owners can remove" ON household_members;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON household_members;

-- Create dev bypass for household_members
CREATE POLICY "Dev Bypass: Allow Test Users" ON household_members
    FOR ALL 
    USING (
        user_id IN (
            '11111111-1111-1111-1111-111111111111'::uuid, 
            '22222222-2222-2222-2222-222222222222'::uuid,
            '44444444-4444-4444-4444-444444444444'::uuid -- Shadow kid
        )
        OR household_id IN ('33333333-3333-3333-3333-333333333333'::uuid)
    )
    WITH CHECK (true);

-- =============================================
-- CONNECTIONS TABLE
-- =============================================

-- Drop production policies for connections
DROP POLICY IF EXISTS "Users can view own connections" ON connections;
DROP POLICY IF EXISTS "Users can send connection requests" ON connections;
DROP POLICY IF EXISTS "Users can update own connections" ON connections;
DROP POLICY IF EXISTS "Users can delete own connections" ON connections;
DROP POLICY IF EXISTS "Dev Bypass: Allow Test Users" ON connections;

-- Create dev bypass for connections
CREATE POLICY "Dev Bypass: Allow Test Users" ON connections
    FOR ALL 
    USING (
        requester_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid)
        OR receiver_id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid)
    )
    WITH CHECK (true);

-- =============================================
-- VERIFY POLICIES
-- =============================================
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('todo_categories', 'todo_lists', 'todo_items', 'user_preferences', 'resources', 'resource_links', 'health_logs', 'inventory_logs', 'legacy_todo_categories', 'legacy_todo_lists', 'legacy_todo_items')
ORDER BY tablename, policyname;
