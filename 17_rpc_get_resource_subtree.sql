-- =============================================================================
-- RPC Function: get_resource_subtree
-- 
-- Fetches all resources in a subtree using ltree <@ operator.
-- This is much more efficient than recursive parent_id traversal.
-- =============================================================================

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_resource_subtree(UUID, ltree);

-- Create the RPC function
CREATE OR REPLACE FUNCTION get_resource_subtree(
  p_user_id UUID,
  p_root_path ltree
)
RETURNS SETOF resources
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM resources
  WHERE user_id = p_user_id
    AND path <@ p_root_path
    AND deleted_at IS NULL
  ORDER BY path;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_resource_subtree(UUID, ltree) TO authenticated;

-- Also grant to anon for dev mode
GRANT EXECUTE ON FUNCTION get_resource_subtree(UUID, ltree) TO anon;

-- Comment for documentation
COMMENT ON FUNCTION get_resource_subtree IS 'Fetches all resources in a subtree using ltree descendant operator (<@). Returns all descendants of the given path for the specified user.';
