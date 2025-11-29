-- ============================================================================
-- 11_households.sql
-- Household Members & Multi-Tenancy Schema
-- ============================================================================
-- Purpose: Create household_members junction table for multi-household support,
--          implement strict RLS policies, and update the auth trigger.
--
-- Key Features:
-- - Multi-Household: Users can belong to multiple households
-- - Role System: owner, member, dependent
-- - Primary Flag: Tracks active household context
-- - Shadow Access: Shadow profiles visible to household members
--
-- IMPORTANT: Run AFTER 10_identity.sql
-- ============================================================================

-- NOTE: ALTER TYPE ADD VALUE cannot run inside a transaction block
-- So we handle the enum FIRST before BEGIN

-- ============================================================================
-- SECTION 0: FIX/CREATE HOUSEHOLD_ROLE ENUM (Must be outside transaction)
-- ============================================================================

-- First, handle the enum outside of any transaction
-- Check if we need to drop and recreate the enum
DO $$ 
DECLARE
    enum_exists BOOLEAN;
    has_owner_value BOOLEAN;
BEGIN
    -- Check if enum exists
    SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'household_role') INTO enum_exists;
    
    IF enum_exists THEN
        -- Check if 'owner' value exists in the enum
        SELECT EXISTS(
            SELECT 1 FROM pg_enum e 
            JOIN pg_type t ON t.oid = e.enumtypid 
            WHERE t.typname = 'household_role' AND e.enumlabel = 'owner'
        ) INTO has_owner_value;
        
        IF NOT has_owner_value THEN
            RAISE NOTICE 'household_role enum exists but lacks owner/dependent values - will need to recreate';
            
            -- We need to handle the column type conversion
            -- If table exists and has role column, convert to TEXT temporarily
            IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'household_members' AND column_name = 'role') THEN
                -- Convert 'admin' to 'owner' if present
                EXECUTE 'ALTER TABLE household_members ALTER COLUMN role TYPE TEXT';
                EXECUTE 'UPDATE household_members SET role = ''owner'' WHERE role = ''admin''';
                RAISE NOTICE 'Converted household_members.role to TEXT and admin->owner';
            END IF;
            
            -- Drop the old enum
            DROP TYPE household_role;
            RAISE NOTICE 'Dropped old household_role enum';
        END IF;
    END IF;
END $$;

-- Now create the enum with correct values (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE household_role AS ENUM ('owner', 'member', 'dependent');
    RAISE NOTICE 'Created household_role enum';
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'household_role enum already exists with correct values';
END $$;

-- If we converted the column to TEXT, convert it back to enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'household_members' 
        AND column_name = 'role' 
        AND data_type = 'text'
    ) THEN
        EXECUTE 'ALTER TABLE household_members ALTER COLUMN role TYPE household_role USING role::household_role';
        RAISE NOTICE 'Converted household_members.role back to household_role enum';
    END IF;
END $$;

-- Now start the main transaction
BEGIN;

-- ============================================================================
-- SECTION 1: ENHANCE HOUSEHOLDS TABLE
-- ============================================================================

-- Add columns if they don't exist
DO $$
BEGIN
    -- Add owner_id for quick access to primary owner
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'households' AND column_name = 'owner_id'
    ) THEN
        ALTER TABLE households ADD COLUMN owner_id UUID REFERENCES profiles(id);
        RAISE NOTICE 'Added owner_id column to households';
    END IF;
    
    -- Add description column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'households' AND column_name = 'description'
    ) THEN
        ALTER TABLE households ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to households';
    END IF;
    
    -- Add avatar/icon URL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'households' AND column_name = 'avatar_url'
    ) THEN
        ALTER TABLE households ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to households';
    END IF;
    
    -- Add updated_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'households' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE households ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to households';
    END IF;
    
    -- Add created_at column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'households' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE households ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to households';
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: CREATE HOUSEHOLD MEMBERS TABLE
-- ============================================================================

-- Household member role enum - handle existing enum with different values
DO $$ 
DECLARE
    enum_exists BOOLEAN;
    has_owner_value BOOLEAN;
BEGIN
    -- Check if enum exists
    SELECT EXISTS(SELECT 1 FROM pg_type WHERE typname = 'household_role') INTO enum_exists;
    
    IF enum_exists THEN
        -- Check if 'owner' value exists in the enum
        SELECT EXISTS(
            SELECT 1 FROM pg_enum e 
            JOIN pg_type t ON t.oid = e.enumtypid 
            WHERE t.typname = 'household_role' AND e.enumlabel = 'owner'
        ) INTO has_owner_value;
        
        IF NOT has_owner_value THEN
            -- Need to add 'owner' and 'dependent' values to existing enum
            -- First check what values exist
            BEGIN
                ALTER TYPE household_role ADD VALUE IF NOT EXISTS 'owner' BEFORE 'member';
            EXCEPTION WHEN others THEN
                RAISE NOTICE 'Could not add owner to enum: %', SQLERRM;
            END;
            
            BEGIN
                ALTER TYPE household_role ADD VALUE IF NOT EXISTS 'dependent';
            EXCEPTION WHEN others THEN
                RAISE NOTICE 'Could not add dependent to enum: %', SQLERRM;
            END;
            
            RAISE NOTICE 'Updated household_role enum with new values';
        END IF;
    ELSE
        -- Create the enum fresh
        CREATE TYPE household_role AS ENUM ('owner', 'member', 'dependent');
        RAISE NOTICE 'Created household_role enum';
    END IF;
END $$;

-- Junction table for users ↔ households (many-to-many)
-- Handle both new table creation and updating existing table
DO $$
DECLARE
    fk_to_drop TEXT;
BEGIN
    -- If table doesn't exist, create it fresh
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'household_members' AND table_schema = 'public') THEN
        CREATE TABLE household_members (
            -- Primary Key
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            
            -- Foreign Keys
            household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            
            -- Role: owner can manage household, member can participate, dependent is read-only
            role household_role NOT NULL DEFAULT 'member',
            
            -- Primary Household Flag
            -- When true, this is the user's currently active household context
            -- Used for "context switching" between households
            is_primary BOOLEAN NOT NULL DEFAULT false,
            
            -- Invitation/Join tracking
            invited_by UUID REFERENCES profiles(id),
            joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            
            -- Timestamps
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            
            -- Constraints
            CONSTRAINT unique_household_member UNIQUE (household_id, user_id)
        );
        RAISE NOTICE 'Created household_members table';
    ELSE
        -- Check if user_id FK points to wrong table (auth.users instead of profiles)
        -- If so, drop and recreate it
        SELECT constraint_name INTO fk_to_drop
        FROM information_schema.referential_constraints rc
        JOIN information_schema.key_column_usage kcu ON kcu.constraint_name = rc.constraint_name
        WHERE kcu.table_name = 'household_members' 
          AND kcu.column_name = 'user_id'
          AND rc.unique_constraint_schema = 'auth';  -- FK points to auth schema
        
        IF fk_to_drop IS NOT NULL THEN
            EXECUTE 'ALTER TABLE household_members DROP CONSTRAINT ' || fk_to_drop;
            ALTER TABLE household_members 
                ADD CONSTRAINT household_members_user_id_fkey 
                FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
            RAISE NOTICE 'Changed user_id FK from auth.users to profiles';
        END IF;
        -- Table exists, add missing columns
        
        -- Add is_primary column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'household_members' AND column_name = 'is_primary'
        ) THEN
            ALTER TABLE household_members ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT false;
            RAISE NOTICE 'Added is_primary column to household_members';
        END IF;
        
        -- Add invited_by column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'household_members' AND column_name = 'invited_by'
        ) THEN
            ALTER TABLE household_members ADD COLUMN invited_by UUID REFERENCES profiles(id);
            RAISE NOTICE 'Added invited_by column to household_members';
        END IF;
        
        -- Add joined_at column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'household_members' AND column_name = 'joined_at'
        ) THEN
            ALTER TABLE household_members ADD COLUMN joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE 'Added joined_at column to household_members';
        END IF;
        
        -- Add created_at column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'household_members' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE household_members ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE 'Added created_at column to household_members';
        END IF;
        
        -- Add updated_at column if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'household_members' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE household_members ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
            RAISE NOTICE 'Added updated_at column to household_members';
        END IF;
        
        -- Check if role column needs to be converted to enum type
        -- (It might be TEXT if created by older schema)
        RAISE NOTICE 'Updated existing household_members table with new columns';
    END IF;
END $$;

-- Indexes for common queries (inside DO block for safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'household_members' AND indexname = 'idx_household_members_user') THEN
        CREATE INDEX idx_household_members_user ON household_members (user_id);
        RAISE NOTICE 'Created idx_household_members_user index';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'household_members' AND indexname = 'idx_household_members_household') THEN
        CREATE INDEX idx_household_members_household ON household_members (household_id);
        RAISE NOTICE 'Created idx_household_members_household index';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'household_members' AND indexname = 'idx_household_members_primary') THEN
        CREATE INDEX idx_household_members_primary ON household_members (user_id, is_primary) WHERE is_primary = true;
        RAISE NOTICE 'Created idx_household_members_primary index';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'household_members' AND indexname = 'idx_household_members_role') THEN
        CREATE INDEX idx_household_members_role ON household_members (household_id, role);
        RAISE NOTICE 'Created idx_household_members_role index';
    END IF;
END $$;

-- ============================================================================
-- SECTION 3: TRIGGERS
-- ============================================================================

-- Trigger function to ensure only one primary household per user
CREATE OR REPLACE FUNCTION ensure_single_primary_household()
RETURNS TRIGGER AS $$
BEGIN
    -- If setting is_primary to true, unset all other primaries for this user
    IF NEW.is_primary = true THEN
        UPDATE household_members 
        SET is_primary = false, updated_at = NOW()
        WHERE user_id = NEW.user_id 
          AND id != NEW.id 
          AND is_primary = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply single-primary trigger
DROP TRIGGER IF EXISTS trg_ensure_single_primary ON household_members;
CREATE TRIGGER trg_ensure_single_primary
    BEFORE INSERT OR UPDATE ON household_members
    FOR EACH ROW
    EXECUTE FUNCTION ensure_single_primary_household();

-- Trigger function to update timestamp
CREATE OR REPLACE FUNCTION trigger_update_household_member_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger
DROP TRIGGER IF EXISTS trg_household_members_update_timestamp ON household_members;
CREATE TRIGGER trg_household_members_update_timestamp
    BEFORE UPDATE ON household_members
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_household_member_timestamp();

-- ============================================================================
-- SECTION 4: UPDATE AUTH TRIGGER
-- ============================================================================
-- Update the handle_new_user function to also create household_members entry

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
    INSERT INTO households (id, name, owner_id, description, created_at, updated_at)
    VALUES (
        uuid_generate_v4(),
        user_display_name || '''s Household',
        NEW.id,
        'Your personal household',
        NOW(),
        NOW()
    )
    RETURNING id INTO new_household_id;
    
    -- 3. Add user as owner of the household with is_primary = true
    INSERT INTO household_members (
        household_id, 
        user_id, 
        role, 
        is_primary, 
        joined_at
    )
    VALUES (
        new_household_id,
        NEW.id,
        'owner',
        true,
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on household_members
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

-- Enable RLS on households (if not already)
ALTER TABLE households ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------
-- HOUSEHOLDS TABLE POLICIES
-- -----------------------------------------

-- Users can view households they are members of
CREATE POLICY "Members can view household"
    ON households FOR SELECT
    USING (
        id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    );

-- Only owners can update household details
CREATE POLICY "Owners can update household"
    ON households FOR UPDATE
    USING (
        id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
    )
    WITH CHECK (
        id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
    );

-- Users can create new households
CREATE POLICY "Users can create households"
    ON households FOR INSERT
    WITH CHECK (
        owner_id = auth.uid()
    );

-- Only owners can delete households
CREATE POLICY "Owners can delete household"
    ON households FOR DELETE
    USING (
        id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid() AND role = 'owner')
    );

-- -----------------------------------------
-- HOUSEHOLD_MEMBERS TABLE POLICIES
-- -----------------------------------------

-- Users can view members of households they belong to
CREATE POLICY "Members can view household members"
    ON household_members FOR SELECT
    USING (
        household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
    );

-- Owners can add new members
CREATE POLICY "Owners can add members"
    ON household_members FOR INSERT
    WITH CHECK (
        -- User adding themselves to a household they own
        (user_id = auth.uid())
        OR
        -- Owner adding someone else
        (household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        ))
    );

-- Users can update their own membership (e.g., is_primary)
-- Owners can update any membership in their household
CREATE POLICY "Users can update own membership"
    ON household_members FOR UPDATE
    USING (
        user_id = auth.uid()
        OR
        household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    )
    WITH CHECK (
        user_id = auth.uid()
        OR
        household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Users can leave households (delete their own membership)
-- Owners can remove members
CREATE POLICY "Members can leave or owners can remove"
    ON household_members FOR DELETE
    USING (
        user_id = auth.uid()
        OR
        household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- ============================================================================
-- SECTION 6: ENHANCED PROFILES RLS POLICIES
-- ============================================================================
-- Now that household_members exists, add the missing policies for profiles

-- Users can view profiles of members in their households (including shadows)
DROP POLICY IF EXISTS "Users can view household member profiles" ON profiles;
CREATE POLICY "Users can view household member profiles"
    ON profiles FOR SELECT
    USING (
        -- Own profile
        id = auth.uid()
        OR
        -- Other members in my households
        id IN (
            SELECT hm2.user_id FROM household_members hm1
            JOIN household_members hm2 ON hm2.household_id = hm1.household_id
            WHERE hm1.user_id = auth.uid()
        )
        OR
        -- Shadow users managed by a household I belong to
        (is_shadow = true AND managed_by_household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        ))
    );

-- Users can create shadow profiles for households they own
DROP POLICY IF EXISTS "Users can create shadow profiles" ON profiles;
CREATE POLICY "Users can create shadow profiles"
    ON profiles FOR INSERT
    WITH CHECK (
        -- Creating own profile (via auth trigger)
        (id = auth.uid() AND is_shadow = false)
        OR
        -- Creating shadow user for a household they own
        (is_shadow = true AND managed_by_household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        ))
    );

-- Users can delete shadow profiles they manage
DROP POLICY IF EXISTS "Users can delete managed shadow profiles" ON profiles;
CREATE POLICY "Users can delete managed shadow profiles"
    ON profiles FOR DELETE
    USING (
        is_shadow = true AND managed_by_household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        )
    );

-- Users can update shadow profiles they manage
DROP POLICY IF EXISTS "Users can update shadow profiles" ON profiles;
CREATE POLICY "Users can update shadow profiles"
    ON profiles FOR UPDATE
    USING (
        -- Own profile
        (id = auth.uid() AND is_shadow = false)
        OR
        -- Shadow users in households they own
        (is_shadow = true AND managed_by_household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        ))
    )
    WITH CHECK (
        (id = auth.uid() AND is_shadow = false)
        OR
        (is_shadow = true AND managed_by_household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role = 'owner'
        ))
    );

-- ============================================================================
-- SECTION 6B: UPDATE RESOURCES RLS FOR HOUSEHOLD ACCESS
-- ============================================================================
-- Add policy to allow household members to access shared resources

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Household members can view shared resources" ON resources;

-- Users can view resources shared with their households
CREATE POLICY "Household members can view shared resources"
    ON resources FOR SELECT
    USING (
        -- Own resources
        user_id = auth.uid()
        OR
        -- Resources shared with a household the user belongs to
        (household_id IS NOT NULL AND household_id IN (
            SELECT household_id FROM household_members WHERE user_id = auth.uid()
        ))
    );

-- Drop and recreate update policy to include household access
DROP POLICY IF EXISTS "Household members can update shared resources" ON resources;

CREATE POLICY "Household members can update shared resources"
    ON resources FOR UPDATE
    USING (
        user_id = auth.uid()
        OR
        (household_id IS NOT NULL AND household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'member')
        ))
    )
    WITH CHECK (
        user_id = auth.uid()
        OR
        (household_id IS NOT NULL AND household_id IN (
            SELECT household_id FROM household_members 
            WHERE user_id = auth.uid() AND role IN ('owner', 'member')
        ))
    );

-- ============================================================================
-- SECTION 7: SEED TEST DATA
-- ============================================================================
-- Create test household with members and shadow user

DO $$
DECLARE
    test_user_1_id UUID := '11111111-1111-1111-1111-111111111111';
    test_user_2_id UUID := '22222222-2222-2222-2222-222222222222';
    shared_household_id UUID := '33333333-3333-3333-3333-333333333333';
    shadow_kid_id UUID := '44444444-4444-4444-4444-444444444444';
BEGIN
    -- Create the shared household (The Smiths)
    INSERT INTO households (id, name, owner_id, description, created_at, updated_at)
    VALUES (
        shared_household_id,
        'The Smith Family',
        test_user_1_id,
        'Our family household for shared tasks and activities',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        owner_id = EXCLUDED.owner_id,
        description = EXCLUDED.description,
        updated_at = NOW();
    
    -- Add Test User 1 (John - Husband) as owner
    INSERT INTO household_members (household_id, user_id, role, is_primary, joined_at)
    VALUES (
        shared_household_id,
        test_user_1_id,
        'owner',
        true,
        NOW()
    )
    ON CONFLICT (household_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_primary = EXCLUDED.is_primary,
        updated_at = NOW();
    
    -- Add Test User 2 (Jane - Wife) as member
    INSERT INTO household_members (household_id, user_id, role, is_primary, joined_at)
    VALUES (
        shared_household_id,
        test_user_2_id,
        'member',
        true, -- Primary for this user too
        NOW()
    )
    ON CONFLICT (household_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        is_primary = EXCLUDED.is_primary,
        updated_at = NOW();
    
    -- Create Shadow User (Kid 1 - Timmy)
    INSERT INTO profiles (id, full_name, email, is_shadow, managed_by_household_id, created_at, updated_at)
    VALUES (
        shadow_kid_id,
        'Timmy Smith',
        NULL, -- Shadow users don't have email
        true,
        shared_household_id,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        is_shadow = EXCLUDED.is_shadow,
        managed_by_household_id = EXCLUDED.managed_by_household_id,
        updated_at = NOW();
    
    -- Add shadow user as dependent member
    INSERT INTO household_members (household_id, user_id, role, is_primary, joined_at)
    VALUES (
        shared_household_id,
        shadow_kid_id,
        'dependent',
        false, -- Dependents don't have primary context
        NOW()
    )
    ON CONFLICT (household_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        updated_at = NOW();
    
    RAISE NOTICE 'Created test household "The Smith Family" with:';
    RAISE NOTICE '  - John Smith (Owner)';
    RAISE NOTICE '  - Jane Smith (Member)';
    RAISE NOTICE '  - Timmy Smith (Shadow/Dependent)';
END $$;

-- ============================================================================
-- SECTION 8: HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's primary household ID
CREATE OR REPLACE FUNCTION get_primary_household_id(p_user_id UUID)
RETURNS UUID AS $$
    SELECT household_id 
    FROM household_members 
    WHERE user_id = p_user_id AND is_primary = true
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to switch primary household
CREATE OR REPLACE FUNCTION switch_primary_household(
    p_user_id UUID,
    p_new_household_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    is_member BOOLEAN;
BEGIN
    -- Check if user is a member of the target household
    SELECT EXISTS(
        SELECT 1 FROM household_members 
        WHERE user_id = p_user_id AND household_id = p_new_household_id
    ) INTO is_member;
    
    IF NOT is_member THEN
        RAISE EXCEPTION 'User is not a member of household %', p_new_household_id;
    END IF;
    
    -- Unset all existing primaries
    UPDATE household_members 
    SET is_primary = false, updated_at = NOW()
    WHERE user_id = p_user_id AND is_primary = true;
    
    -- Set new primary
    UPDATE household_members 
    SET is_primary = true, updated_at = NOW()
    WHERE user_id = p_user_id AND household_id = p_new_household_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to get all household members (including shadows)
CREATE OR REPLACE FUNCTION get_household_members_with_profiles(p_household_id UUID)
RETURNS TABLE (
    member_id UUID,
    profile_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    is_shadow BOOLEAN,
    role household_role,
    is_primary BOOLEAN,
    joined_at TIMESTAMPTZ
) AS $$
    SELECT 
        hm.id as member_id,
        p.id as profile_id,
        p.full_name,
        p.avatar_url,
        p.email,
        p.is_shadow,
        hm.role,
        hm.is_primary,
        hm.joined_at
    FROM household_members hm
    JOIN profiles p ON p.id = hm.user_id
    WHERE hm.household_id = p_household_id
    ORDER BY 
        CASE hm.role 
            WHEN 'owner' THEN 1 
            WHEN 'member' THEN 2 
            WHEN 'dependent' THEN 3 
        END,
        p.full_name;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- SECTION 9: VERIFY MIGRATION
-- ============================================================================

DO $$
DECLARE
    household_count INT;
    member_count INT;
    shadow_count INT;
BEGIN
    SELECT COUNT(*) INTO household_count FROM households;
    SELECT COUNT(*) INTO member_count FROM household_members;
    SELECT COUNT(*) INTO shadow_count FROM profiles WHERE is_shadow = true;
    
    RAISE NOTICE '=== Household Migration Statistics ===';
    RAISE NOTICE 'Households: %', household_count;
    RAISE NOTICE 'Household members: %', member_count;
    RAISE NOTICE 'Shadow profiles: %', shadow_count;
END $$;

COMMIT;

-- ============================================================================
-- SECTION 10: EXAMPLE QUERIES (Reference)
-- ============================================================================
/*
-- Get all households for a user
SELECT h.*
FROM households h
JOIN household_members hm ON hm.household_id = h.id
WHERE hm.user_id = 'user-uuid';

-- Get user's primary household
SELECT h.*
FROM households h
JOIN household_members hm ON hm.household_id = h.id
WHERE hm.user_id = 'user-uuid' AND hm.is_primary = true;

-- Get all members of a household (including shadows)
SELECT * FROM get_household_members_with_profiles('household-uuid');

-- Switch primary household
SELECT switch_primary_household('user-uuid', 'new-household-uuid');

-- Get all profiles visible to a user (own + household members + shadows)
SELECT DISTINCT p.*
FROM profiles p
LEFT JOIN household_members hm ON hm.user_id = p.id
WHERE 
    p.id = 'user-uuid'  -- Own profile
    OR hm.household_id IN (  -- Other household members
        SELECT household_id FROM household_members WHERE user_id = 'user-uuid'
    )
    OR (p.is_shadow = true AND p.managed_by_household_id IN (  -- Shadow users
        SELECT household_id FROM household_members WHERE user_id = 'user-uuid'
    ));
*/
