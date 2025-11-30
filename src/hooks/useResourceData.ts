import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { 
  Resource, 
  ResourceInsert, 
  ResourceUpdate,
  ResourceLink,
  ResourceLinkInsert,
  ResourceType,
  ResourceStatus,
  LinkType,
  ResourceTreeNode,
  // Legacy types for adapter
  TodoCategory,
  TodoList,
  TodoItem,
  TodoStatus,
  TodoFilters
} from '@/types/database'
import { useAuth } from '@/lib/supabase'

// Type assertion helper for tables not in auto-generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any

// ============================================================================
// QUERY KEYS
// ============================================================================
export const resourceKeys = {
  all: ['resources'] as const,
  // Direct children of a parent (null = root level)
  children: (parentId: string | null) => [...resourceKeys.all, 'children', parentId] as const,
  // Entire subtree using ltree
  tree: (rootPath: string) => [...resourceKeys.all, 'tree', rootPath] as const,
  // Single resource by ID
  single: (id: string) => [...resourceKeys.all, 'single', id] as const,
  // Resources by type
  byType: (type: ResourceType) => [...resourceKeys.all, 'byType', type] as const,
  // All root-level resources
  roots: () => [...resourceKeys.all, 'roots'] as const,
  // Links for a resource
  links: (resourceId: string) => [...resourceKeys.all, 'links', resourceId] as const,
  // All resources (for counts)
  allResources: () => [...resourceKeys.all, 'allResources'] as const,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert UUID to ltree-safe label (replace hyphens with underscores)
 */
export function uuidToLtreeLabel(uuid: string): string {
  return uuid.replace(/-/g, '_')
}

/**
 * Calculate depth from ltree path
 * Path format: root.uuid1.uuid2.uuid3 -> depth = 2 (excluding root)
 */
export function getDepthFromPath(path: string): number {
  const segments = path.split('.')
  return Math.max(0, segments.length - 1) // -1 for 'root'
}

/**
 * Build a tree structure from flat resource array
 */
export function buildResourceTree(resources: Resource[]): ResourceTreeNode[] {
  const map = new Map<string, ResourceTreeNode>()
  const roots: ResourceTreeNode[] = []

  // First pass: create all nodes
  for (const resource of resources) {
    map.set(resource.id, { ...resource, children: [] })
  }

  // Second pass: link children to parents
  for (const resource of resources) {
    const node = map.get(resource.id)!
    if (resource.parent_id && map.has(resource.parent_id)) {
      map.get(resource.parent_id)!.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch direct children of a resource
 * @param parentId - Parent resource ID, or null for root-level resources
 */
export function useResources(parentId: string | null) {
  const { user } = useAuth()

  return useQuery<Resource[], Error>({
    queryKey: resourceKeys.children(parentId),
    queryFn: async (): Promise<Resource[]> => {
      if (!user) return []

      let query = db
        .from('resources')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('title', { ascending: true })

      if (parentId === null) {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', parentId)
      }

      const { data, error } = await query

      if (error) throw error
      return (data || []) as Resource[]
    },
    enabled: !!user,
  })
}

/**
 * Fetch root-level resources (folders/categories)
 */
export function useRootResources() {
  return useResources(null)
}

/**
 * Fetch a single resource by ID
 */
export function useResource(id: string | null) {
  const { user } = useAuth()

  return useQuery<Resource | null, Error>({
    queryKey: resourceKeys.single(id || 'null'),
    queryFn: async (): Promise<Resource | null> => {
      if (!user || !id) return null

      const { data, error } = await db
        .from('resources')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }
      return data as Resource
    },
    enabled: !!user && !!id,
  })
}

/**
 * Fetch entire subtree of a resource using ltree <@ operator
 * This fetches all descendants regardless of depth
 * 
 * @param rootPath - The ltree path of the root resource (e.g., 'root.uuid1_uuid2')
 */
export function useResourceTree(rootPath: string | null) {
  const { user } = useAuth()

  return useQuery<Resource[], Error>({
    queryKey: resourceKeys.tree(rootPath || 'null'),
    queryFn: async (): Promise<Resource[]> => {
      if (!user || !rootPath) return []

      // Use raw SQL for ltree operator
      // path <@ 'root.abc' means "path is descendant of root.abc"
      const { data, error } = await db
        .rpc('get_resource_subtree', { 
          p_user_id: user.id, 
          p_root_path: rootPath 
        })

      if (error) {
        // Fallback: If RPC doesn't exist, try direct query
        // Note: This won't work with ltree operators via REST API
        console.warn('RPC get_resource_subtree not found, falling back to parent_id traversal')
        
        // Recursive fetch using parent_id (less efficient)
        const allResources: Resource[] = []
        const fetchChildren = async (parentId: string | null): Promise<void> => {
          const { data: children, error: childError } = await db
            .from('resources')
            .select('*')
            .eq('user_id', user.id)
            .eq('parent_id', parentId)
            .is('deleted_at', null)

          if (childError) throw childError
          if (children) {
            allResources.push(...(children as Resource[]))
            for (const child of children) {
              await fetchChildren(child.id)
            }
          }
        }

        // Extract root ID from path (last segment)
        const pathSegments = rootPath.split('.')
        const rootIdUnderscored = pathSegments[pathSegments.length - 1]
        const rootId = rootIdUnderscored.replace(/_/g, '-')
        
        // Fetch the root resource first
        const { data: rootResource } = await db
          .from('resources')
          .select('*')
          .eq('id', rootId)
          .single()

        if (rootResource) {
          allResources.push(rootResource as Resource)
          await fetchChildren(rootId)
        }

        return allResources
      }

      return (data || []) as Resource[]
    },
    enabled: !!user && !!rootPath,
  })
}

/**
 * Fetch resources by type
 */
export function useResourcesByType(type: ResourceType) {
  const { user } = useAuth()

  return useQuery<Resource[], Error>({
    queryKey: resourceKeys.byType(type),
    queryFn: async (): Promise<Resource[]> => {
      if (!user) return []

      const { data, error } = await db
        .from('resources')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', type)
        .is('deleted_at', null)
        .order('title', { ascending: true })

      if (error) throw error
      return (data || []) as Resource[]
    },
    enabled: !!user,
  })
}

/**
 * Fetch all resources (for counting purposes)
 */
export function useAllResources() {
  const { user } = useAuth()

  return useQuery<Resource[], Error>({
    queryKey: resourceKeys.allResources(),
    queryFn: async (): Promise<Resource[]> => {
      if (!user) return []

      const { data, error } = await db
        .from('resources')
        .select('id, parent_id, type, status, path')
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (error) throw error
      return (data || []) as Resource[]
    },
    enabled: !!user,
  })
}

/**
 * Fetch links for a resource (both as source and target)
 */
export function useResourceLinks(resourceId: string | null) {
  const { user } = useAuth()

  return useQuery<ResourceLink[], Error>({
    queryKey: resourceKeys.links(resourceId || 'null'),
    queryFn: async (): Promise<ResourceLink[]> => {
      if (!user || !resourceId) return []

      const { data, error } = await db
        .from('resource_links')
        .select('*')
        .or(`source_id.eq.${resourceId},target_id.eq.${resourceId}`)

      if (error) throw error
      return (data || []) as ResourceLink[]
    },
    enabled: !!user && !!resourceId,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new resource
 */
export function useCreateResource() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<Resource, Error, ResourceInsert>({
    mutationFn: async (resource: ResourceInsert): Promise<Resource> => {
      if (!user) throw new Error('No user')

      const insertData = {
        user_id: user.id,
        household_id: resource.household_id || null,
        parent_id: resource.parent_id || null,
        // path is auto-calculated by trigger if not provided
        path: resource.path || 'root', // Placeholder, trigger will fix
        type: resource.type,
        title: resource.title,
        description: resource.description || null,
        status: resource.status || 'active',
        meta_data: resource.meta_data || {},
        is_schedulable: resource.is_schedulable || false,
        scheduled_at: resource.scheduled_at || null,
        created_by: user.id,
      }

      const { data, error } = await db
        .from('resources')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as Resource
    },
    onSuccess: (data) => {
      // Invalidate ALL resource queries to ensure tree views refresh
      // This is necessary because we don't have access to rootPath in mutations
      queryClient.invalidateQueries({ queryKey: resourceKeys.all })
    },
  })
}

/**
 * Update a resource
 */
export function useUpdateResource() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<Resource, Error, { id: string; updates: ResourceUpdate }>({
    mutationFn: async ({ id, updates }): Promise<Resource> => {
      if (!user) throw new Error('No user')

      const { data, error } = await db
        .from('resources')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as Resource
    },
    onSuccess: () => {
      // Invalidate ALL resource queries to ensure tree views refresh
      queryClient.invalidateQueries({ queryKey: resourceKeys.all })
    },
  })
}

/**
 * Delete a resource (soft delete)
 */
export function useDeleteResource() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<{ id: string; parentId: string | null }, Error, { id: string; parentId: string | null }>({
    mutationFn: async ({ id, parentId }): Promise<{ id: string; parentId: string | null }> => {
      if (!user) throw new Error('No user')

      const { error } = await db
        .from('resources')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return { id, parentId }
    },
    onSuccess: () => {
      // Invalidate ALL resource queries to ensure tree views refresh
      queryClient.invalidateQueries({ queryKey: resourceKeys.all })
    },
  })
}

/**
 * Move a resource to a new parent
 * Note: This requires recalculating paths for all descendants
 */
export function useMoveResource() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<Resource, Error, { id: string; newParentId: string | null; oldParentId: string | null }>({
    mutationFn: async ({ id, newParentId }): Promise<Resource> => {
      if (!user) throw new Error('No user')

      // First, update the parent_id
      // The path will need to be recalculated - this should ideally be done server-side
      // For now, we'll just update parent_id and let the app recalculate paths as needed
      const { data, error } = await db
        .from('resources')
        .update({ parent_id: newParentId })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')

      // TODO: Recalculate paths for this resource and all descendants
      // This is complex and should be a server-side function
      // For now, paths may become stale after moves

      return data as Resource
    },
    onSuccess: () => {
      // Invalidate ALL resource queries to ensure tree views refresh
      queryClient.invalidateQueries({ queryKey: resourceKeys.all })
    },
  })
}

/**
 * Cycle resource status (active -> completed -> archived -> active)
 */
export function useCycleResourceStatus() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<Resource, Error, { resource: Resource }, { previousResource: Resource | undefined }>({
    mutationFn: async ({ resource }): Promise<Resource> => {
      if (!user) throw new Error('No user')

      const statusOrder: ResourceStatus[] = ['active', 'completed', 'archived']
      const currentIndex = statusOrder.indexOf(resource.status)
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

      const { data, error } = await db
        .from('resources')
        .update({ status: nextStatus })
        .eq('id', resource.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as Resource
    },
    // Optimistic update
    onMutate: async ({ resource }) => {
      await queryClient.cancelQueries({ queryKey: resourceKeys.children(resource.parent_id) })
      
      const previousResources = queryClient.getQueryData<Resource[]>(
        resourceKeys.children(resource.parent_id)
      )
      
      const statusOrder: ResourceStatus[] = ['active', 'completed', 'archived']
      const currentIndex = statusOrder.indexOf(resource.status)
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

      if (previousResources) {
        queryClient.setQueryData<Resource[]>(
          resourceKeys.children(resource.parent_id),
          previousResources.map(r => 
            r.id === resource.id 
              ? { ...r, status: nextStatus, updated_at: new Date().toISOString() }
              : r
          )
        )
      }

      return { previousResource: previousResources?.find(r => r.id === resource.id) }
    },
    onError: (err, { resource }, context) => {
      if (context?.previousResource) {
        const previousResources = queryClient.getQueryData<Resource[]>(
          resourceKeys.children(resource.parent_id)
        )
        if (previousResources) {
          queryClient.setQueryData<Resource[]>(
            resourceKeys.children(resource.parent_id),
            previousResources.map(r => 
              r.id === resource.id ? context.previousResource! : r
            )
          )
        }
      }
    },
    onSettled: () => {
      // Invalidate ALL resource queries to ensure tree views refresh
      queryClient.invalidateQueries({ queryKey: resourceKeys.all })
    },
  })
}

/**
 * Create a link between two resources
 */
export function useLinkResources() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<ResourceLink, Error, ResourceLinkInsert>({
    mutationFn: async (link: ResourceLinkInsert): Promise<ResourceLink> => {
      if (!user) throw new Error('No user')

      const { data, error } = await db
        .from('resource_links')
        .insert({
          source_id: link.source_id,
          target_id: link.target_id,
          link_type: link.link_type,
          meta_data: link.meta_data || {},
        })
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as ResourceLink
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.links(data.source_id) })
      queryClient.invalidateQueries({ queryKey: resourceKeys.links(data.target_id) })
    },
  })
}

/**
 * Remove a link between resources
 */
export function useUnlinkResources() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  return useMutation<{ sourceId: string; targetId: string }, Error, { linkId: string; sourceId: string; targetId: string }>({
    mutationFn: async ({ linkId, sourceId, targetId }): Promise<{ sourceId: string; targetId: string }> => {
      if (!user) throw new Error('No user')

      const { error } = await db
        .from('resource_links')
        .delete()
        .eq('id', linkId)

      if (error) throw error
      return { sourceId, targetId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: resourceKeys.links(data.sourceId) })
      queryClient.invalidateQueries({ queryKey: resourceKeys.links(data.targetId) })
    },
  })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get child count for a resource
 */
export function getChildCount(resources: Resource[], parentId: string): number {
  return resources.filter(r => r.parent_id === parentId).length
}

/**
 * Get completed child count for a resource (type='task' with status='completed')
 */
export function getCompletedChildCount(resources: Resource[], parentId: string): number {
  return resources.filter(
    r => r.parent_id === parentId && r.status === 'completed'
  ).length
}

// ============================================================================
// LEGACY TODO ADAPTER
// ============================================================================
// This adapter maps the new Resource structure back to the old Todo types
// Allows existing UI components to continue working during migration

/**
 * Convert a Resource (type='folder') to TodoCategory
 */
function resourceToCategory(resource: Resource): TodoCategory {
  const meta = resource.meta_data as Record<string, unknown>
  return {
    id: resource.id,
    user_id: resource.user_id,
    household_id: resource.household_id,
    name: resource.title,
    description: resource.description,
    color: (meta.color as string) || '#00EAFF',
    is_shared: (meta.is_shared as boolean) || false,
    created_at: resource.created_at,
    updated_at: resource.updated_at,
    created_by: resource.created_by || resource.user_id,
    deleted_at: resource.deleted_at,
  }
}

/**
 * Convert a Resource (type='project') to TodoList
 */
function resourceToList(resource: Resource): TodoList {
  const meta = resource.meta_data as Record<string, unknown>
  return {
    id: resource.id,
    user_id: resource.user_id,
    household_id: resource.household_id,
    category_id: resource.parent_id || '', // Parent is the category
    name: resource.title,
    description: resource.description,
    due_date: resource.scheduled_at,
    location_name: (meta.location_name as string) || null,
    location_coordinates: (meta.location_coordinates as { lat: number; lng: number }) || null,
    is_shared: (meta.is_shared as boolean) || false,
    created_at: resource.created_at,
    updated_at: resource.updated_at,
    created_by: resource.created_by || resource.user_id,
    deleted_at: resource.deleted_at,
  }
}

/**
 * Convert a Resource (type='task') to TodoItem
 */
function resourceToItem(resource: Resource): TodoItem {
  const meta = resource.meta_data as Record<string, unknown>
  
  // Map resource status to legacy todo status
  let legacyStatus: TodoStatus = 'not_started'
  if (resource.status === 'completed') {
    legacyStatus = 'completed'
  } else if (meta.legacy_status) {
    legacyStatus = meta.legacy_status as TodoStatus
  } else if (resource.status === 'active') {
    legacyStatus = (meta.started_at ? 'in_progress' : 'not_started')
  }

  return {
    id: resource.id,
    user_id: resource.user_id,
    household_id: resource.household_id,
    list_id: resource.parent_id || '', // Parent is the list
    name: resource.title,
    description: resource.description,
    status: legacyStatus,
    due_date: resource.scheduled_at,
    location_name: (meta.location_name as string) || null,
    location_coordinates: (meta.location_coordinates as { lat: number; lng: number }) || null,
    use_parent_location: false,
    is_shared: (meta.is_shared as boolean) || false,
    created_at: resource.created_at,
    updated_at: resource.updated_at,
    started_at: (meta.started_at as string) || null,
    completed_at: (meta.completed_at as string) || null,
    created_by: resource.created_by || resource.user_id,
    completed_by: (meta.completed_by as string) || null,
    deleted_at: resource.deleted_at,
  }
}

/**
 * Legacy adapter hook that provides the same API as useTodoData
 * Maps new Resource structure to old Todo types for backward compatibility
 */
export function useLegacyTodoAdapter() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Fetch all resources for mapping
  const foldersQuery = useResourcesByType('folder')
  const projectsQuery = useResourcesByType('project')
  const tasksQuery = useResourcesByType('task')
  const allResourcesQuery = useAllResources()

  // Mutations
  const createResourceMutation = useCreateResource()
  const updateResourceMutation = useUpdateResource()
  const deleteResourceMutation = useDeleteResource()
  const cycleStatusMutation = useCycleResourceStatus()

  // Convert resources to legacy types
  const categories: TodoCategory[] = (foldersQuery.data || []).map(resourceToCategory)
  const allLists: TodoList[] = (projectsQuery.data || []).map(resourceToList)
  const allItems: TodoItem[] = (tasksQuery.data || []).map(resourceToItem)

  // Get list count for a category
  const getListCount = (categoryId: string): number => {
    return allLists.filter(list => list.category_id === categoryId).length
  }

  // Get item count for a list
  const getItemCount = (listId: string): number => {
    return allItems.filter(item => item.list_id === listId).length
  }

  // Get completed item count for a list
  const getCompletedItemCount = (listId: string): number => {
    return allItems.filter(
      item => item.list_id === listId && item.status === 'completed'
    ).length
  }

  // Legacy mutations that map to new resource mutations
  const createCategory = async (category: Partial<TodoCategory>) => {
    try {
      const result = await createResourceMutation.mutateAsync({
        user_id: user?.id || '',
        type: 'folder',
        title: category.name || '',
        description: category.description || null,
        meta_data: {
          color: category.color || '#00EAFF',
          is_shared: category.is_shared || false,
        },
      })
      return resourceToCategory(result)
    } catch (err) {
      console.error('Error creating category:', err)
      return null
    }
  }

  const updateCategory = async (id: string, updates: Partial<TodoCategory>) => {
    try {
      const current = foldersQuery.data?.find(r => r.id === id)
      const currentMeta = (current?.meta_data || {}) as Record<string, unknown>
      
      const result = await updateResourceMutation.mutateAsync({
        id,
        updates: {
          title: updates.name,
          description: updates.description,
          meta_data: {
            ...currentMeta,
            color: updates.color ?? currentMeta.color,
            is_shared: updates.is_shared ?? currentMeta.is_shared,
          },
        },
      })
      return resourceToCategory(result)
    } catch (err) {
      console.error('Error updating category:', err)
      return null
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await deleteResourceMutation.mutateAsync({ id, parentId: null })
      return true
    } catch (err) {
      console.error('Error deleting category:', err)
      return false
    }
  }

  const createList = async (list: Partial<TodoList>) => {
    try {
      const result = await createResourceMutation.mutateAsync({
        user_id: user?.id || '',
        type: 'project',
        title: list.name || '',
        description: list.description || null,
        parent_id: list.category_id || null,
        scheduled_at: list.due_date || null,
        is_schedulable: !!list.due_date,
        meta_data: {
          is_shared: list.is_shared || false,
          location_name: list.location_name || null,
          location_coordinates: list.location_coordinates || null,
        },
      })
      return resourceToList(result)
    } catch (err) {
      console.error('Error creating list:', err)
      return null
    }
  }

  const updateList = async (id: string, updates: Partial<TodoList>) => {
    try {
      const current = projectsQuery.data?.find(r => r.id === id)
      const currentMeta = (current?.meta_data || {}) as Record<string, unknown>
      
      const result = await updateResourceMutation.mutateAsync({
        id,
        updates: {
          title: updates.name,
          description: updates.description,
          scheduled_at: updates.due_date,
          is_schedulable: !!updates.due_date || current?.is_schedulable,
          meta_data: {
            ...currentMeta,
            is_shared: updates.is_shared ?? currentMeta.is_shared,
            location_name: updates.location_name ?? currentMeta.location_name,
            location_coordinates: updates.location_coordinates ?? currentMeta.location_coordinates,
          },
        },
      })
      return resourceToList(result)
    } catch (err) {
      console.error('Error updating list:', err)
      return null
    }
  }

  const deleteList = async (id: string, categoryId: string) => {
    try {
      await deleteResourceMutation.mutateAsync({ id, parentId: categoryId })
      return true
    } catch (err) {
      console.error('Error deleting list:', err)
      return false
    }
  }

  const createItem = async (item: Partial<TodoItem>) => {
    try {
      const result = await createResourceMutation.mutateAsync({
        user_id: user?.id || '',
        type: 'task',
        title: item.name || '',
        description: item.description || null,
        parent_id: item.list_id || null,
        status: item.status === 'completed' ? 'completed' : 'active',
        scheduled_at: item.due_date || null,
        is_schedulable: !!item.due_date,
        meta_data: {
          is_shared: item.is_shared || false,
          location_name: item.location_name || null,
          location_coordinates: item.location_coordinates || null,
          legacy_status: item.status || 'not_started',
        },
      })
      return resourceToItem(result)
    } catch (err) {
      console.error('Error creating item:', err)
      return null
    }
  }

  const updateItem = async (id: string, updates: Partial<TodoItem>) => {
    try {
      const current = tasksQuery.data?.find(r => r.id === id)
      const currentMeta = (current?.meta_data || {}) as Record<string, unknown>
      
      // Determine new status
      let newStatus: ResourceStatus = 'active'
      if (updates.status === 'completed') {
        newStatus = 'completed'
      }

      const result = await updateResourceMutation.mutateAsync({
        id,
        updates: {
          title: updates.name,
          description: updates.description,
          status: newStatus,
          scheduled_at: updates.due_date,
          is_schedulable: !!updates.due_date || current?.is_schedulable,
          meta_data: {
            ...currentMeta,
            is_shared: updates.is_shared ?? currentMeta.is_shared,
            location_name: updates.location_name ?? currentMeta.location_name,
            location_coordinates: updates.location_coordinates ?? currentMeta.location_coordinates,
            legacy_status: updates.status ?? currentMeta.legacy_status,
            started_at: updates.started_at ?? currentMeta.started_at,
            completed_at: updates.completed_at ?? currentMeta.completed_at,
            completed_by: updates.completed_by ?? currentMeta.completed_by,
          },
        },
      })
      return resourceToItem(result)
    } catch (err) {
      console.error('Error updating item:', err)
      return null
    }
  }

  const deleteItem = async (id: string, listId: string) => {
    try {
      await deleteResourceMutation.mutateAsync({ id, parentId: listId })
      return true
    } catch (err) {
      console.error('Error deleting item:', err)
      return false
    }
  }

  const cycleItemStatus = async (item: TodoItem) => {
    try {
      // Find the resource version of this item
      const resource = tasksQuery.data?.find(r => r.id === item.id)
      if (!resource) {
        console.error('Resource not found for item:', item.id)
        return null
      }

      // For legacy compatibility, cycle through: not_started -> in_progress -> completed
      const statusOrder: TodoStatus[] = ['not_started', 'in_progress', 'completed']
      const currentLegacyStatus = item.status === 'started' ? 'not_started' : item.status
      const currentIndex = statusOrder.indexOf(currentLegacyStatus)
      const nextLegacyStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

      // Map to resource status
      const newResourceStatus: ResourceStatus = nextLegacyStatus === 'completed' ? 'completed' : 'active'
      
      const currentMeta = (resource.meta_data || {}) as Record<string, unknown>
      
      const result = await updateResourceMutation.mutateAsync({
        id: item.id,
        updates: {
          status: newResourceStatus,
          meta_data: {
            ...currentMeta,
            legacy_status: nextLegacyStatus,
            started_at: nextLegacyStatus === 'in_progress' ? new Date().toISOString() : currentMeta.started_at,
            completed_at: nextLegacyStatus === 'completed' ? new Date().toISOString() : null,
            completed_by: nextLegacyStatus === 'completed' ? user?.id : null,
          },
        },
      })
      return resourceToItem(result)
    } catch (err) {
      console.error('Error cycling item status:', err)
      return null
    }
  }

  // Legacy fetch functions (now no-ops since TanStack Query handles this)
  const fetchLists = async (_categoryId: string) => {
    // No-op: TanStack Query automatically fetches
  }

  const fetchItems = async (_listId: string) => {
    // No-op: TanStack Query automatically fetches
  }

  const refreshCategories = async () => {
    await queryClient.invalidateQueries({ queryKey: resourceKeys.byType('folder') })
  }

  // Filter utility for legacy compatibility
  const filterAndSortItems = (items: TodoItem[], filters: TodoFilters): TodoItem[] => {
    let filtered = [...items]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === filters.statusFilter)
    }

    // Due soon filter
    if (filters.dueSoonFilter && filters.dueSoonFilter !== 'all') {
      const now = new Date()
      filtered = filtered.filter(item => {
        if (!item.due_date) return false
        
        const dueDate = new Date(item.due_date)
        const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        switch (filters.dueSoonFilter) {
          case '1day': return diffDays <= 1 && diffDays >= 0
          case '1week': return diffDays <= 7 && diffDays >= 0
          case '1month': return diffDays <= 30 && diffDays >= 0
          default: return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (filters.sortBy) {
        case 'name':
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case 'created_at':
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case 'updated_at':
          aValue = new Date(a.updated_at).getTime()
          bValue = new Date(b.updated_at).getTime()
          break
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0
          if (!a.due_date) return 1
          if (!b.due_date) return -1
          aValue = new Date(a.due_date).getTime()
          bValue = new Date(b.due_date).getTime()
          break
        case 'status':
          const statusOrder = ['not_started', 'started', 'in_progress', 'completed']
          aValue = statusOrder.indexOf(a.status)
          bValue = statusOrder.indexOf(b.status)
          break
        default:
          return 0
      }

      if (filters.sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }

  return {
    // Data
    categories,
    lists: [] as TodoList[], // Will be handled by individual hooks
    items: [] as TodoItem[], // Will be handled by individual hooks
    loading: foldersQuery.isLoading || projectsQuery.isLoading || tasksQuery.isLoading,
    error: foldersQuery.error?.message || projectsQuery.error?.message || tasksQuery.error?.message || null,
    
    // Count functions
    getListCount,
    getItemCount,
    getCompletedItemCount,
    
    // Legacy mutations
    createCategory,
    updateCategory,
    deleteCategory,
    createList,
    updateList,
    deleteList,
    createItem,
    updateItem,
    deleteItem,
    cycleItemStatus,
    
    // Legacy fetch functions (now no-ops)
    fetchCategories: refreshCategories,
    fetchLists,
    fetchItems,
    refreshCategories,
    
    // Filter utility
    filterAndSortItems,
    
    // Access to underlying resource queries for direct use
    _resources: {
      folders: foldersQuery.data || [],
      projects: projectsQuery.data || [],
      tasks: tasksQuery.data || [],
    },
  }
}

// ============================================================================
// HOOKS FOR LEGACY UI COMPONENTS
// ============================================================================

/**
 * Hook to get lists for a specific category (maps to useResources)
 */
export function useLegacyLists(categoryId: string | null) {
  const resourcesQuery = useResources(categoryId)
  
  const lists: TodoList[] = (resourcesQuery.data || [])
    .filter(r => r.type === 'project')
    .map(resourceToList)

  return {
    data: lists,
    isLoading: resourcesQuery.isLoading,
    error: resourcesQuery.error,
  }
}

/**
 * Hook to get items for a specific list (maps to useResources)
 */
export function useLegacyItems(listId: string | null) {
  const resourcesQuery = useResources(listId)
  
  const items: TodoItem[] = (resourcesQuery.data || [])
    .filter(r => r.type === 'task')
    .map(resourceToItem)

  return {
    data: items,
    isLoading: resourcesQuery.isLoading,
    error: resourcesQuery.error,
  }
}
