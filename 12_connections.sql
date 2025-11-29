-- ============================================================================
-- 12_connections.sql
-- Social Connections Schema
-- ============================================================================
-- Purpose: Create the connections table for friend/follower relationships,
--          preparing for future GetStream integration.
--
-- Key Features:
-- - Friend Request System: pending, accepted, declined, blocked statuses
-- - Bidirectional Lookup: Indexed for both directions
-- - Future GetStream Sync: Structure compatible with GetStream's follow model
--
-- IMPORTANT: Run AFTER 11_households.sql
-- ============================================================================

BEGIN;

-- ============================================================================
-- SECTION 1: CONNECTION STATUS ENUM
-- ============================================================================

DO $$ BEGIN
    CREATE TYPE connection_status AS ENUM (
        'pending',    -- Request sent, awaiting response
        'accepted',   -- Both users are connected
        'declined',   -- Receiver declined the request
        'blocked'     -- Receiver blocked the requester
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 2: CONNECTIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS connections (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- The user who initiated the connection request
    requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- The user who received the connection request
    receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    
    -- Current status of the connection
    status connection_status NOT NULL DEFAULT 'pending',
    
    -- Optional message sent with the request
    message TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- When the connection was accepted (if applicable)
    accepted_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT no_self_connection CHECK (requester_id != receiver_id),
    CONSTRAINT unique_connection UNIQUE (requester_id, receiver_id)
);

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

-- Index for looking up connections by requester
CREATE INDEX IF NOT EXISTS idx_connections_requester ON connections (requester_id);

-- Index for looking up connections by receiver
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON connections (receiver_id);

-- Index for finding pending requests (for notifications)
CREATE INDEX IF NOT EXISTS idx_connections_pending ON connections (receiver_id, status) 
    WHERE status = 'pending';

-- Index for finding accepted connections (friends list)
CREATE INDEX IF NOT EXISTS idx_connections_accepted ON connections (status) 
    WHERE status = 'accepted';

-- Composite index for checking if two users are connected
CREATE INDEX IF NOT EXISTS idx_connections_pair ON connections (requester_id, receiver_id, status);

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- Trigger function to update timestamp
CREATE OR REPLACE FUNCTION trigger_update_connection_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    
    -- Auto-set accepted_at when status changes to accepted
    IF NEW.status = 'accepted' AND OLD.status != 'accepted' THEN
        NEW.accepted_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp trigger
DROP TRIGGER IF EXISTS trg_connections_update_timestamp ON connections;
CREATE TRIGGER trg_connections_update_timestamp
    BEFORE UPDATE ON connections
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_connection_timestamp();

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Users can view connections they are part of
CREATE POLICY "Users can view own connections"
    ON connections FOR SELECT
    USING (
        requester_id = auth.uid() OR receiver_id = auth.uid()
    );

-- Users can create connection requests (as requester)
CREATE POLICY "Users can send connection requests"
    ON connections FOR INSERT
    WITH CHECK (
        requester_id = auth.uid()
    );

-- Requesters can cancel pending requests, receivers can update status
CREATE POLICY "Users can update own connections"
    ON connections FOR UPDATE
    USING (
        -- Requester can only update pending requests (to cancel)
        (requester_id = auth.uid() AND status = 'pending')
        OR
        -- Receiver can update any request they received (accept/decline/block)
        (receiver_id = auth.uid())
    )
    WITH CHECK (
        (requester_id = auth.uid() AND status = 'pending')
        OR
        (receiver_id = auth.uid())
    );

-- Requesters can delete pending requests, either party can delete accepted
CREATE POLICY "Users can delete own connections"
    ON connections FOR DELETE
    USING (
        -- Requester can delete pending requests
        (requester_id = auth.uid() AND status = 'pending')
        OR
        -- Either party can delete accepted connections (unfriend)
        (status = 'accepted' AND (requester_id = auth.uid() OR receiver_id = auth.uid()))
    );

-- ============================================================================
-- SECTION 6: HELPER FUNCTIONS
-- ============================================================================

-- Function to check if two users are connected (friends)
CREATE OR REPLACE FUNCTION are_connected(user_a UUID, user_b UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM connections 
        WHERE status = 'accepted'
        AND (
            (requester_id = user_a AND receiver_id = user_b)
            OR
            (requester_id = user_b AND receiver_id = user_a)
        )
    );
$$ LANGUAGE sql STABLE;

-- Function to get connection status between two users
CREATE OR REPLACE FUNCTION get_connection_status(user_a UUID, user_b UUID)
RETURNS TABLE (
    connection_id UUID,
    status connection_status,
    direction TEXT,  -- 'outgoing' (user_a sent to user_b) or 'incoming' (user_b sent to user_a)
    created_at TIMESTAMPTZ
) AS $$
    SELECT 
        c.id,
        c.status,
        CASE 
            WHEN c.requester_id = user_a THEN 'outgoing'
            ELSE 'incoming'
        END as direction,
        c.created_at
    FROM connections c
    WHERE 
        (c.requester_id = user_a AND c.receiver_id = user_b)
        OR
        (c.requester_id = user_b AND c.receiver_id = user_a)
    LIMIT 1;
$$ LANGUAGE sql STABLE;

-- Function to get all friends (accepted connections)
CREATE OR REPLACE FUNCTION get_friends(p_user_id UUID)
RETURNS TABLE (
    friend_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    email TEXT,
    connected_since TIMESTAMPTZ
) AS $$
    SELECT 
        CASE 
            WHEN c.requester_id = p_user_id THEN c.receiver_id
            ELSE c.requester_id
        END as friend_id,
        p.full_name,
        p.avatar_url,
        p.email,
        c.accepted_at as connected_since
    FROM connections c
    JOIN profiles p ON p.id = CASE 
        WHEN c.requester_id = p_user_id THEN c.receiver_id
        ELSE c.requester_id
    END
    WHERE c.status = 'accepted'
    AND (c.requester_id = p_user_id OR c.receiver_id = p_user_id)
    ORDER BY c.accepted_at DESC;
$$ LANGUAGE sql STABLE;

-- Function to get pending incoming requests
CREATE OR REPLACE FUNCTION get_pending_requests(p_user_id UUID)
RETURNS TABLE (
    connection_id UUID,
    requester_id UUID,
    full_name TEXT,
    avatar_url TEXT,
    message TEXT,
    requested_at TIMESTAMPTZ
) AS $$
    SELECT 
        c.id,
        c.requester_id,
        p.full_name,
        p.avatar_url,
        c.message,
        c.created_at as requested_at
    FROM connections c
    JOIN profiles p ON p.id = c.requester_id
    WHERE c.receiver_id = p_user_id
    AND c.status = 'pending'
    ORDER BY c.created_at DESC;
$$ LANGUAGE sql STABLE;

-- Function to send a connection request
CREATE OR REPLACE FUNCTION send_connection_request(
    p_from_user_id UUID,
    p_to_user_id UUID,
    p_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    existing_status connection_status;
    new_connection_id UUID;
BEGIN
    -- Check for self-connection
    IF p_from_user_id = p_to_user_id THEN
        RAISE EXCEPTION 'Cannot connect with yourself';
    END IF;
    
    -- Check for existing connection (either direction)
    SELECT status INTO existing_status
    FROM connections
    WHERE 
        (requester_id = p_from_user_id AND receiver_id = p_to_user_id)
        OR
        (requester_id = p_to_user_id AND receiver_id = p_from_user_id);
    
    IF existing_status IS NOT NULL THEN
        IF existing_status = 'accepted' THEN
            RAISE EXCEPTION 'Already connected with this user';
        ELSIF existing_status = 'pending' THEN
            RAISE EXCEPTION 'Connection request already pending';
        ELSIF existing_status = 'blocked' THEN
            RAISE EXCEPTION 'Cannot connect with this user';
        ELSIF existing_status = 'declined' THEN
            -- Allow re-requesting after decline
            UPDATE connections 
            SET status = 'pending', 
                requester_id = p_from_user_id,
                receiver_id = p_to_user_id,
                message = p_message,
                updated_at = NOW()
            WHERE 
                (requester_id = p_from_user_id AND receiver_id = p_to_user_id)
                OR
                (requester_id = p_to_user_id AND receiver_id = p_from_user_id)
            RETURNING id INTO new_connection_id;
            RETURN new_connection_id;
        END IF;
    END IF;
    
    -- Create new connection request
    INSERT INTO connections (requester_id, receiver_id, message, status)
    VALUES (p_from_user_id, p_to_user_id, p_message, 'pending')
    RETURNING id INTO new_connection_id;
    
    RETURN new_connection_id;
END;
$$ LANGUAGE plpgsql;

-- Function to respond to a connection request
CREATE OR REPLACE FUNCTION respond_to_connection_request(
    p_connection_id UUID,
    p_user_id UUID,  -- The receiver responding
    p_accept BOOLEAN
)
RETURNS BOOLEAN AS $$
DECLARE
    conn RECORD;
BEGIN
    -- Get the connection
    SELECT * INTO conn FROM connections WHERE id = p_connection_id;
    
    IF conn IS NULL THEN
        RAISE EXCEPTION 'Connection request not found';
    END IF;
    
    -- Verify the user is the receiver
    IF conn.receiver_id != p_user_id THEN
        RAISE EXCEPTION 'Only the receiver can respond to this request';
    END IF;
    
    -- Verify it's pending
    IF conn.status != 'pending' THEN
        RAISE EXCEPTION 'This request has already been processed';
    END IF;
    
    -- Update status
    UPDATE connections 
    SET status = CASE WHEN p_accept THEN 'accepted' ELSE 'declined' END
    WHERE id = p_connection_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 7: GETSTREAM SYNC PREPARATION
-- ============================================================================
-- Note: This section provides helper functions for future GetStream integration.
-- When GetStream is integrated, call these functions to sync follower relationships.

-- Function to get connection changes since a timestamp (for sync)
CREATE OR REPLACE FUNCTION get_connection_changes_since(p_since TIMESTAMPTZ)
RETURNS TABLE (
    connection_id UUID,
    requester_id UUID,
    receiver_id UUID,
    status connection_status,
    updated_at TIMESTAMPTZ,
    is_new_connection BOOLEAN
) AS $$
    SELECT 
        id,
        requester_id,
        receiver_id,
        status,
        updated_at,
        (created_at = updated_at) as is_new_connection
    FROM connections
    WHERE updated_at > p_since
    ORDER BY updated_at ASC;
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- SECTION 8: SEED TEST DATA
-- ============================================================================
-- Create test connections between test users

DO $$
DECLARE
    test_user_1_id UUID := '11111111-1111-1111-1111-111111111111';
    test_user_2_id UUID := '22222222-2222-2222-2222-222222222222';
    test_connection_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
    -- Create an accepted connection between test users (they're married!)
    INSERT INTO connections (
        id,
        requester_id, 
        receiver_id, 
        status, 
        message,
        accepted_at,
        created_at, 
        updated_at
    )
    VALUES (
        test_connection_id,
        test_user_1_id,
        test_user_2_id,
        'accepted',
        'Hey honey! 💕',
        NOW(),
        NOW() - INTERVAL '1 year',  -- Connected for a while
        NOW()
    )
    ON CONFLICT (requester_id, receiver_id) DO UPDATE SET
        status = EXCLUDED.status,
        accepted_at = EXCLUDED.accepted_at,
        updated_at = NOW();
    
    RAISE NOTICE 'Created test connection between John and Jane Smith';
END $$;

-- ============================================================================
-- SECTION 9: VERIFY MIGRATION
-- ============================================================================

DO $$
DECLARE
    connection_count INT;
    pending_count INT;
    accepted_count INT;
BEGIN
    SELECT COUNT(*) INTO connection_count FROM connections;
    SELECT COUNT(*) INTO pending_count FROM connections WHERE status = 'pending';
    SELECT COUNT(*) INTO accepted_count FROM connections WHERE status = 'accepted';
    
    RAISE NOTICE '=== Connections Migration Statistics ===';
    RAISE NOTICE 'Total connections: %', connection_count;
    RAISE NOTICE 'Pending requests: %', pending_count;
    RAISE NOTICE 'Accepted connections: %', accepted_count;
END $$;

COMMIT;

-- ============================================================================
-- SECTION 10: EXAMPLE QUERIES (Reference)
-- ============================================================================
/*
-- Send a connection request
SELECT send_connection_request('user-a-uuid', 'user-b-uuid', 'Hey, let''s connect!');

-- Accept a connection request
SELECT respond_to_connection_request('connection-uuid', 'receiver-uuid', true);

-- Decline a connection request
SELECT respond_to_connection_request('connection-uuid', 'receiver-uuid', false);

-- Check if two users are friends
SELECT are_connected('user-a-uuid', 'user-b-uuid');

-- Get all friends
SELECT * FROM get_friends('user-uuid');

-- Get pending incoming requests
SELECT * FROM get_pending_requests('user-uuid');

-- Get connection status between two users
SELECT * FROM get_connection_status('user-a-uuid', 'user-b-uuid');
*/
