-- ============================================================================
-- 10_identity.sql
-- Identity & Profiles Schema
-- ============================================================================
-- Purpose: Create the profiles table with shadow user support, auth triggers,
--          and migrate data from the existing user_profile table.
--
-- Key Features:
-- - Shadow Users: Kids/dependents tracked without auth credentials
-- - Auto-Init: Trigger creates profile + default household on signup
-- - Migration: Data from user_profile preserved and table deprecated
--
-- IMPORTANT: Run this migration in a transaction. If anything fails, ROLLBACK.
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: CREATE OR UPDATE PROFILES TABLE
-- ============================================================================

-- First, check if profiles table exists and handle accordingly
DO $$
BEGIN
    -- If profiles table doesn't exist, create it fresh
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        CREATE TABLE profiles (
            -- Primary Key
            -- For real users: matches auth.users.id
            -- For shadow users: auto-generated UUID
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            
            -- Profile Info
            full_name TEXT,
            avatar_url TEXT,
            email TEXT,
            
            -- Shadow User Fields
            -- is_shadow = true means this is a dependent (kid, etc.) without auth credentials
            is_shadow BOOLEAN NOT NULL DEFAULT false,
            
            -- For shadow users: which household "owns" this profile
            -- NULL for real users (they belong to households via household_members)
            managed_by_household_id UUID REFERENCES households(id) ON DELETE CASCADE,
            
            -- Timestamps
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        RAISE NOTICE 'Created profiles table';
    ELSE
        -- Table exists, add missing columns
        -- Add is_shadow column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'is_shadow'
        ) THEN
            ALTER TABLE profiles ADD COLUMN is_shadow BOOLEAN NOT NULL DEFAULT false;
            RAISE NOTICE 'Added is_shadow column to profiles';
        END IF;
        
        -- Add managed_by_household_id column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'managed_by_household_id'
        ) THEN
            ALTER TABLE profiles ADD COLUMN managed_by_household_id UUID REFERENCES households(id) ON DELETE CASCADE;
            RAISE NOTICE 'Added managed_by_household_id column to profiles';
        END IF;
        
        -- Add full_name column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'full_name'
        ) THEN
            ALTER TABLE profiles ADD COLUMN full_name TEXT;
            RAISE NOTICE 'Added full_name column to profiles';
        END IF;
        
        -- Add avatar_url column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'avatar_url'
        ) THEN
            ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
            RAISE NOTICE 'Added avatar_url column to profiles';
        END IF;
        
        -- Add email column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'email'
        ) THEN
            ALTER TABLE profiles ADD COLUMN email TEXT;
            RAISE NOTICE 'Added email column to profiles';
        END IF;
        
        -- Make email column nullable if it's NOT NULL (shadow users don't have email)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'email' AND is_nullable = 'NO'
        ) THEN
            ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;
            RAISE NOTICE 'Made email column nullable for shadow users';
        END IF;
        
        -- Add created_at column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE profiles ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to profiles';
        END IF;
        
        -- Add updated_at column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE profiles ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to profiles';
        END IF;
        
        RAISE NOTICE 'Updated existing profiles table with new columns';
    END IF;
    
    -- Add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'profiles' AND constraint_name = 'shadow_must_have_manager'
    ) THEN
        BEGIN
            ALTER TABLE profiles ADD CONSTRAINT shadow_must_have_manager CHECK (
                (is_shadow = false AND managed_by_household_id IS NULL) OR
                (is_shadow = true AND managed_by_household_id IS NOT NULL)
            );
            RAISE NOTICE 'Added shadow_must_have_manager constraint';
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'Could not add constraint: %', SQLERRM;
        END;
    END IF;
END $$;

-- Create indexes (outside transaction block for better compatibility)
-- Index for querying shadow users by managing household
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'profiles' AND indexname = 'idx_profiles_managed_by'
    ) THEN
        CREATE INDEX idx_profiles_managed_by ON profiles (managed_by_household_id) 
            WHERE is_shadow = true;
        RAISE NOTICE 'Created idx_profiles_managed_by index';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'profiles' AND indexname = 'idx_profiles_email'
    ) THEN
        CREATE INDEX idx_profiles_email ON profiles (email) WHERE email IS NOT NULL;
        RAISE NOTICE 'Created idx_profiles_email index';
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: AUTO-UPDATE TIMESTAMP TRIGGER
-- ============================================================================

-- Trigger function to update timestamp
CREATE OR REPLACE FUNCTION trigger_update_profile_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger to profiles
DROP TRIGGER IF EXISTS trg_profiles_update_timestamp ON profiles;
CREATE TRIGGER trg_profiles_update_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_profile_timestamp();

-- ============================================================================
-- SECTION 3: AUTH TRIGGER - ON USER SIGNUP
-- ============================================================================
-- When a new user signs up via Supabase Auth:
-- 1. Create a profile row
-- 2. Create a "Default Household" for them
-- 3. Add them as owner of that household

-- Create the trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_household_id UUID;
    user_display_name TEXT;
BEGIN
    -- Extract display name from user metadata or email
    user_display_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1),
        'User'
    );
    
    -- 1. Create profile for the new user
    INSERT INTO profiles (id, full_name, email, is_shadow, managed_by_household_id)
    VALUES (
        NEW.id,
        user_display_name,
        NEW.email,
        false,
        NULL
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();
    
    -- 2. Create a default household for the user
    INSERT INTO households (id, name, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        user_display_name || '''s Household',
        NOW(),
        NOW()
    )
    RETURNING id INTO new_household_id;
    
    -- 3. Add user as owner of the household (will be created in 11_households.sql)
    -- This is handled by a separate migration to avoid circular dependencies
    -- The household_members table doesn't exist yet
    -- We'll handle this in the next migration
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the auth trigger (only works if auth schema is accessible)
-- Note: This trigger fires when a user signs up via Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- SECTION 4: MIGRATE DATA FROM user_profile
-- ============================================================================

-- Migrate existing user_profile data to profiles
-- Preserving the user_id as the profile id
DO $$
BEGIN
    -- Check if user_profile table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profile' AND table_schema = 'public') THEN
        -- Migrate data
        INSERT INTO profiles (id, full_name, avatar_url, email, is_shadow, managed_by_household_id, created_at, updated_at)
        SELECT 
            up.user_id,
            COALESCE(up.display_name, 'User'),
            up.avatar_url,
            NULL, -- email not stored in user_profile
            false,
            NULL,
            up.created_at,
            up.updated_at
        FROM user_profile up
        WHERE NOT EXISTS (
            SELECT 1 FROM profiles p WHERE p.id = up.user_id
        );
        
        RAISE NOTICE 'Migrated data from user_profile to profiles';
        
        -- Rename old table for safety (instead of dropping)
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'legacy_user_profile' AND table_schema = 'public') THEN
            ALTER TABLE user_profile RENAME TO legacy_user_profile;
            RAISE NOTICE 'Renamed user_profile to legacy_user_profile';
        ELSE
            RAISE NOTICE 'legacy_user_profile already exists, skipping rename';
        END IF;
    ELSE
        RAISE NOTICE 'user_profile table does not exist, skipping migration';
    END IF;
END $$;

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) - BASIC POLICIES
-- ============================================================================
-- Note: These are basic policies for profiles table.
-- Household-aware policies will be added in 11_households.sql after
-- the household_members table is created.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

-- Users can update their own profile (non-shadow only)
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid() AND is_shadow = false)
    WITH CHECK (id = auth.uid() AND is_shadow = false);

-- Basic insert policy (auth trigger uses SECURITY DEFINER)
-- Full shadow profile policies will be added in 11_households.sql
CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT
    WITH CHECK (id = auth.uid() AND is_shadow = false);

-- Note: Policies for viewing household members and managing shadow users
-- will be added in 11_households.sql after household_members table exists

-- ============================================================================
-- SECTION 6: SEED TEST DATA
-- ============================================================================
-- Create profiles for our test users (dev mode)
-- Note: These match the IDs in src/lib/supabase.ts

DO $$
DECLARE
    test_user_1_id UUID := '11111111-1111-1111-1111-111111111111';
    test_user_2_id UUID := '22222222-2222-2222-2222-222222222222';
BEGIN
    -- Test User 1 (Husband)
    INSERT INTO profiles (id, full_name, email, is_shadow, managed_by_household_id)
    VALUES (
        test_user_1_id,
        'John Smith',
        'user1@lifeos.dev',
        false,
        NULL
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();
    
    -- Test User 2 (Wife)
    INSERT INTO profiles (id, full_name, email, is_shadow, managed_by_household_id)
    VALUES (
        test_user_2_id,
        'Jane Smith',
        'user2@lifeos.dev',
        false,
        NULL
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        updated_at = NOW();
    
    RAISE NOTICE 'Created test user profiles';
END $$;

-- ============================================================================
-- SECTION 7: VERIFY MIGRATION
-- ============================================================================

DO $$
DECLARE
    profile_count INT;
    shadow_count INT;
BEGIN
    SELECT COUNT(*) INTO profile_count FROM profiles WHERE is_shadow = false;
    SELECT COUNT(*) INTO shadow_count FROM profiles WHERE is_shadow = true;
    
    RAISE NOTICE '=== Profile Migration Statistics ===';
    RAISE NOTICE 'Real profiles: %', profile_count;
    RAISE NOTICE 'Shadow profiles: %', shadow_count;
    RAISE NOTICE 'Total profiles: %', profile_count + shadow_count;
END $$;

COMMIT;

-- ============================================================================
-- SECTION 8: EXAMPLE QUERIES (Reference)
-- ============================================================================
/*
-- Get all profiles for a user's households (including shadows)
SELECT p.*
FROM profiles p
WHERE p.is_shadow = false AND p.id = 'user-uuid'
   OR (p.is_shadow = true AND p.managed_by_household_id IN (
       SELECT household_id FROM household_members WHERE user_id = 'user-uuid'
   ));

-- Get all shadow users for a specific household
SELECT * FROM profiles
WHERE is_shadow = true AND managed_by_household_id = 'household-uuid';

-- Create a shadow user (kid)
INSERT INTO profiles (full_name, is_shadow, managed_by_household_id)
VALUES ('Timmy Smith', true, 'household-uuid');
*/
