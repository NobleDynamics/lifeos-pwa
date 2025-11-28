import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/supabase'
import { Resource } from '@/types/database'

// Type assertion helper for tables not in auto-generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ============================================================================
// QUERY KEYS
// ============================================================================

export const contextRootKeys = {
  all: ['context-roots'] as const,
  byContext: (context: string, userId: string) => 
    [...contextRootKeys.all, context, userId] as const,
}

// ============================================================================
// TYPES
// ============================================================================

export interface ContextRootResult {
  /** UUID of the context root folder */
  rootId: string | null
  /** ltree path of the context root (e.g., "root.uuid_underscored") */
  rootPath: string | null
  /** Loading state */
  isLoading: boolean
  /** Error message if lookup/creation failed */
  error: string | null
  /** Whether the context root was just created (vs. already existed) */
  wasCreated: boolean
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a new context root folder for a user
 */
async function createContextRoot(
  userId: string,
  context: string
): Promise<Resource> {
  const insertData = {
    user_id: userId,
    household_id: null,
    parent_id: null,
    path: 'root', // Will be recalculated by trigger
    type: 'folder',
    title: context, // Use context as title (e.g., "household.todos")
    description: `System root for ${context}`,
    status: 'active',
    meta_data: {
      context: context,
      is_system: true,
    },
    is_schedulable: false,
    created_by: userId,
  }

  const { data, error } = await db
    .from('resources')
    .insert(insertData)
    .select()
    .single()

  if (error) throw error
  if (!data) throw new Error('No data returned from insert')
  
  return data as Resource
}

// ============================================================================
// MAIN HOOK
// ============================================================================

/**
 * Hook to get or lazily create a context root folder
 * 
 * Context roots are special system folders that serve as "mount points" for
 * different application contexts (e.g., household.todos, cloud.files).
 * 
 * @param context - The context namespace (e.g., "household.todos", "cloud.files")
 * @returns ContextRootResult with rootId, rootPath, loading state, and error
 * 
 * @example
 * ```tsx
 * const { rootId, isLoading, error } = useContextRoot('household.todos')
 * 
 * if (isLoading) return <Spinner />
 * if (error) return <Error message={error} />
 * 
 * // rootId is now guaranteed to exist
 * return <HierarchyPane parentId={rootId} />
 * ```
 */
export function useContextRoot(context: string): ContextRootResult {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Query for existing context root
  const {
    data: contextRoot,
    isLoading: isQueryLoading,
    error: queryError,
    refetch,
  } = useQuery<Resource | null, Error>({
    queryKey: contextRootKeys.byContext(context, user?.id || 'anonymous'),
    queryFn: async (): Promise<Resource | null> => {
      if (!user) return null

      // Find resource where meta_data->>'context' = context AND user_id = user.id
      // This ensures user scoping - each user gets their own context root
      const { data, error } = await db
        .from('resources')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .filter('meta_data->>context', 'eq', context)
        .maybeSingle()

      if (error) throw error
      return data as Resource | null
    },
    enabled: !!user && !!context,
    staleTime: Infinity, // Context roots rarely change
    gcTime: Infinity,    // Keep in cache forever (was cacheTime in v4)
  })

  // Mutation for creating context root if it doesn't exist
  const createMutation = useMutation<Resource, Error, void>({
    mutationFn: async (): Promise<Resource> => {
      if (!user) throw new Error('No user')
      return createContextRoot(user.id, context)
    },
    onSuccess: (data) => {
      // Update the cache with the newly created context root
      queryClient.setQueryData(
        contextRootKeys.byContext(context, user?.id || 'anonymous'),
        data
      )
    },
  })

  // Lazy initialization: Create context root if it doesn't exist
  // This is idempotent - multiple calls won't create duplicates
  const shouldCreate = 
    !isQueryLoading && 
    !queryError && 
    contextRoot === null && 
    user && 
    !createMutation.isPending &&
    !createMutation.isSuccess

  if (shouldCreate) {
    // Trigger creation (this will update the query cache on success)
    createMutation.mutate()
  }

  // Determine loading state
  const isLoading = isQueryLoading || createMutation.isPending

  // Determine error state
  const error = queryError?.message || createMutation.error?.message || null

  // Determine the root data (from query or mutation result)
  const root = contextRoot || createMutation.data

  return {
    rootId: root?.id ?? null,
    rootPath: root?.path ?? null,
    isLoading,
    error,
    wasCreated: createMutation.isSuccess,
  }
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook to check if a resource is a context root (system folder)
 */
export function useIsContextRoot(resourceId: string | null): boolean {
  const { user } = useAuth()

  const { data } = useQuery<boolean, Error>({
    queryKey: ['is-context-root', resourceId],
    queryFn: async (): Promise<boolean> => {
      if (!user || !resourceId) return false

      const { data, error } = await db
        .from('resources')
        .select('meta_data')
        .eq('id', resourceId)
        .eq('user_id', user.id)
        .single()

      if (error) return false
      
      const meta = data?.meta_data as Record<string, unknown>
      return meta?.is_system === true && typeof meta?.context === 'string'
    },
    enabled: !!user && !!resourceId,
    staleTime: Infinity,
  })

  return data ?? false
}

/**
 * Hook to get all context roots for the current user
 * Useful for debugging or admin views
 */
export function useAllContextRoots() {
  const { user } = useAuth()

  return useQuery<Resource[], Error>({
    queryKey: [...contextRootKeys.all, 'all', user?.id || 'anonymous'],
    queryFn: async (): Promise<Resource[]> => {
      if (!user) return []

      const { data, error } = await db
        .from('resources')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .filter('meta_data->>is_system', 'eq', 'true')
        .order('title', { ascending: true })

      if (error) throw error
      return (data || []) as Resource[]
    },
    enabled: !!user,
  })
}
