import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { 
  TodoCategory, 
  TodoList, 
  TodoItem, 
  TodoStatus,
  TodoFilters
} from '@/types/database'
import { useAuth } from '@/lib/supabase'

// ============================================================================
// QUERY KEYS
// ============================================================================
export const todoKeys = {
  all: ['todos'] as const,
  categories: () => [...todoKeys.all, 'categories'] as const,
  lists: (categoryId: string | null) => [...todoKeys.all, 'lists', categoryId] as const,
  items: (listId: string | null) => [...todoKeys.all, 'items', listId] as const,
  // For counting - we need lists by category and items by list
  allLists: () => [...todoKeys.all, 'allLists'] as const,
  allItems: () => [...todoKeys.all, 'allItems'] as const,
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Fetch all categories for the current user
 */
export function useCategories() {
  const { user } = useAuth()
  
  return useQuery<TodoCategory[], Error>({
    queryKey: todoKeys.categories(),
    queryFn: async (): Promise<TodoCategory[]> => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('todo_categories')
        .select('*')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []) as TodoCategory[]
    },
    enabled: !!user,
  })
}

/**
 * Fetch lists for a specific category
 */
export function useLists(categoryId: string | null) {
  const { user } = useAuth()
  
  return useQuery<TodoList[], Error>({
    queryKey: todoKeys.lists(categoryId),
    queryFn: async (): Promise<TodoList[]> => {
      if (!user || !categoryId) return []
      
      const { data, error } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('category_id', categoryId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (error) throw error
      return (data || []) as TodoList[]
    },
    enabled: !!user && !!categoryId,
  })
}

/**
 * Fetch items for a specific list
 */
export function useItems(listId: string | null) {
  const { user } = useAuth()
  
  return useQuery<TodoItem[], Error>({
    queryKey: todoKeys.items(listId),
    queryFn: async (): Promise<TodoItem[]> => {
      if (!user || !listId) return []
      
      const { data, error } = await supabase
        .from('todo_items')
        .select('*')
        .eq('list_id', listId)
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data || []) as TodoItem[]
    },
    enabled: !!user && !!listId,
  })
}

// Type for list count data
interface ListCountData {
  id: string
  category_id: string
}

/**
 * Fetch ALL lists for the user (for counting purposes)
 */
export function useAllLists() {
  const { user } = useAuth()
  
  return useQuery<ListCountData[], Error>({
    queryKey: todoKeys.allLists(),
    queryFn: async (): Promise<ListCountData[]> => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('todo_lists')
        .select('id, category_id')
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (error) throw error
      return (data || []) as ListCountData[]
    },
    enabled: !!user,
  })
}

// Type for item count data
interface ItemCountData {
  id: string
  list_id: string
  status: TodoStatus
}

/**
 * Fetch ALL items for the user (for counting purposes)
 */
export function useAllItems() {
  const { user } = useAuth()
  
  return useQuery<ItemCountData[], Error>({
    queryKey: todoKeys.allItems(),
    queryFn: async (): Promise<ItemCountData[]> => {
      if (!user) return []
      
      const { data, error } = await supabase
        .from('todo_items')
        .select('id, list_id, status')
        .eq('user_id', user.id)
        .is('deleted_at', null)

      if (error) throw error
      return (data || []) as ItemCountData[]
    },
    enabled: !!user,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Create a new category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<TodoCategory, Error, Partial<TodoCategory>>({
    mutationFn: async (category: Partial<TodoCategory>): Promise<TodoCategory> => {
      if (!user) throw new Error('No user')
      
      const insertData = {
        name: category.name,
        description: category.description || null,
        color: category.color || '#00EAFF',
        is_shared: category.is_shared || false,
        user_id: user.id,
        created_by: user.id
      }
      
      const { data, error } = await supabase
        .from('todo_categories')
        .insert(insertData as any)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as TodoCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.categories() })
    },
  })
}

/**
 * Update a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<TodoCategory, Error, { id: string; updates: Partial<TodoCategory> }>({
    mutationFn: async ({ id, updates }): Promise<TodoCategory> => {
      if (!user) throw new Error('No user')
      
      const { data, error } = await (supabase as any)
        .from('todo_categories')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as TodoCategory
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.categories() })
    },
  })
}

/**
 * Delete a category (soft delete)
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<boolean, Error, string>({
    mutationFn: async (id: string): Promise<boolean> => {
      if (!user) throw new Error('No user')
      
      const { error } = await (supabase as any)
        .from('todo_categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.categories() })
      queryClient.invalidateQueries({ queryKey: todoKeys.allLists() })
    },
  })
}

/**
 * Create a new list
 */
export function useCreateList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<TodoList, Error, Partial<TodoList>>({
    mutationFn: async (list: Partial<TodoList>): Promise<TodoList> => {
      if (!user) throw new Error('No user')
      
      const insertData = {
        name: list.name,
        description: list.description || null,
        category_id: list.category_id,
        due_date: list.due_date || null,
        location_name: list.location_name || null,
        is_shared: list.is_shared || false,
        user_id: user.id,
        created_by: user.id
      }
      
      const { data, error } = await supabase
        .from('todo_lists')
        .insert(insertData as any)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as TodoList
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists(data.category_id) })
      queryClient.invalidateQueries({ queryKey: todoKeys.allLists() })
    },
  })
}

/**
 * Update a list
 */
export function useUpdateList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<TodoList, Error, { id: string; updates: Partial<TodoList> }>({
    mutationFn: async ({ id, updates }): Promise<TodoList> => {
      if (!user) throw new Error('No user')
      
      const { data, error } = await (supabase as any)
        .from('todo_lists')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as TodoList
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists(data.category_id) })
      queryClient.invalidateQueries({ queryKey: todoKeys.allLists() })
    },
  })
}

/**
 * Delete a list (soft delete)
 */
export function useDeleteList() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<{ id: string; categoryId: string }, Error, { id: string; categoryId: string }>({
    mutationFn: async ({ id, categoryId }): Promise<{ id: string; categoryId: string }> => {
      if (!user) throw new Error('No user')
      
      const { error } = await (supabase as any)
        .from('todo_lists')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return { id, categoryId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.lists(data.categoryId) })
      queryClient.invalidateQueries({ queryKey: todoKeys.allLists() })
      queryClient.invalidateQueries({ queryKey: todoKeys.allItems() })
    },
  })
}

/**
 * Create a new item
 */
export function useCreateItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<TodoItem, Error, Partial<TodoItem>>({
    mutationFn: async (item: Partial<TodoItem>): Promise<TodoItem> => {
      if (!user) throw new Error('No user')
      
      const insertData = {
        name: item.name,
        description: item.description || null,
        list_id: item.list_id,
        status: item.status || 'not_started',
        due_date: item.due_date || null,
        location_name: item.location_name || null,
        is_shared: item.is_shared || false,
        user_id: user.id,
        created_by: user.id
      }
      
      const { data, error } = await supabase
        .from('todo_items')
        .insert(insertData as any)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as TodoItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.items(data.list_id) })
      queryClient.invalidateQueries({ queryKey: todoKeys.allItems() })
    },
  })
}

/**
 * Update an item
 */
export function useUpdateItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<TodoItem, Error, { id: string; updates: Partial<TodoItem> }>({
    mutationFn: async ({ id, updates }): Promise<TodoItem> => {
      if (!user) throw new Error('No user')
      
      const { data, error } = await (supabase as any)
        .from('todo_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as TodoItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.items(data.list_id) })
      queryClient.invalidateQueries({ queryKey: todoKeys.allItems() })
    },
  })
}

/**
 * Delete an item (soft delete)
 */
export function useDeleteItem() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<{ id: string; listId: string }, Error, { id: string; listId: string }>({
    mutationFn: async ({ id, listId }): Promise<{ id: string; listId: string }> => {
      if (!user) throw new Error('No user')
      
      const { error } = await (supabase as any)
        .from('todo_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return { id, listId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: todoKeys.items(data.listId) })
      queryClient.invalidateQueries({ queryKey: todoKeys.allItems() })
    },
  })
}

/**
 * Cycle item status (not_started -> in_progress -> completed)
 * Note: 'started' status is skipped as it has no icon
 * Uses optimistic updates to prevent items from jumping around
 */
// Type for optimistic update context
interface CycleStatusContext {
  previousItems: TodoItem[] | undefined
  listId: string
}

export function useCycleItemStatus() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  
  return useMutation<TodoItem, Error, { item: TodoItem }, CycleStatusContext>({
    mutationFn: async ({ item }): Promise<TodoItem> => {
      if (!user) throw new Error('No user')
      
      // Only cycle through: not_started -> in_progress -> completed -> not_started
      const statusOrder: TodoStatus[] = ['not_started', 'in_progress', 'completed']
      
      // Handle legacy 'started' status by treating it as 'not_started'
      const currentStatus = item.status === 'started' ? 'not_started' : item.status
      const currentIndex = statusOrder.indexOf(currentStatus)
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

      const updates: Partial<TodoItem> = {
        status: nextStatus,
        started_at: nextStatus === 'in_progress' ? new Date().toISOString() : item.started_at,
        completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
        completed_by: nextStatus === 'completed' ? user.id : null
      }

      const { data, error } = await (supabase as any)
        .from('todo_items')
        .update(updates)
        .eq('id', item.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      if (!data) throw new Error('No data returned')
      return data as TodoItem
    },
    // Optimistic update: update cache directly to prevent items from jumping
    onMutate: async ({ item }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.items(item.list_id) })
      
      // Snapshot the previous value
      const previousItems = queryClient.getQueryData<TodoItem[]>(todoKeys.items(item.list_id))
      
      // Calculate next status
      const statusOrder: TodoStatus[] = ['not_started', 'in_progress', 'completed']
      const currentStatus = item.status === 'started' ? 'not_started' : item.status
      const currentIndex = statusOrder.indexOf(currentStatus)
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]
      
      // Optimistically update to the new value
      if (previousItems) {
        queryClient.setQueryData<TodoItem[]>(todoKeys.items(item.list_id), 
          previousItems.map(i => 
            i.id === item.id 
              ? { ...i, status: nextStatus, updated_at: new Date().toISOString() }
              : i
          )
        )
      }
      
      return { previousItems, listId: item.list_id }
    },
    onError: (err, { item }, context) => {
      // If the mutation fails, roll back to the previous value
      if (context?.previousItems) {
        queryClient.setQueryData(todoKeys.items(context.listId), context.previousItems)
      }
    },
    onSettled: (data) => {
      // Only invalidate allItems for count updates, not the items list (to preserve order)
      if (data) {
        queryClient.invalidateQueries({ queryKey: todoKeys.allItems() })
      }
    },
  })
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Filter and sort items based on filters
 */
export function filterAndSortItems(items: TodoItem[], filters: TodoFilters): TodoItem[] {
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

  // Date range filter
  if (filters.dateRange !== 'all') {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (filters.dateRange) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        break
      case 'custom':
        if (filters.startDate && filters.endDate) {
          startDate = new Date(filters.startDate)
          endDate = new Date(filters.endDate)
        } else {
          return filtered
        }
        break
      default:
        return filtered
    }

    filtered = filtered.filter(item => {
      if (!item.created_at) return false
      const itemDate = new Date(item.created_at)
      return itemDate >= startDate && itemDate <= endDate
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

// ============================================================================
// BACKWARD COMPATIBILITY HOOK (Legacy API)
// ============================================================================

/**
 * Legacy hook for backward compatibility with existing components
 * @deprecated Use individual hooks (useCategories, useLists, useItems, etc.) instead
 */
export function useTodoData() {
  const queryClient = useQueryClient()
  
  // Queries
  const categoriesQuery = useCategories()
  const allListsQuery = useAllLists()
  const allItemsQuery = useAllItems()
  
  // Mutations
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()
  const createListMutation = useCreateList()
  const updateListMutation = useUpdateList()
  const deleteListMutation = useDeleteList()
  const createItemMutation = useCreateItem()
  const updateItemMutation = useUpdateItem()
  const deleteItemMutation = useDeleteItem()
  const cycleStatusMutation = useCycleItemStatus()

  // Get list count for a category
  const getListCount = (categoryId: string): number => {
    const lists = allListsQuery.data || []
    return lists.filter(list => list.category_id === categoryId).length
  }

  // Get item count for a list
  const getItemCount = (listId: string): number => {
    const items = allItemsQuery.data || []
    return items.filter(item => item.list_id === listId).length
  }

  // Get completed item count for a list
  const getCompletedItemCount = (listId: string): number => {
    const items = allItemsQuery.data || []
    return items.filter(item => item.list_id === listId && item.status === 'completed').length
  }

  // Legacy API wrappers
  const createCategory = async (category: Partial<TodoCategory>) => {
    try {
      return await createCategoryMutation.mutateAsync(category)
    } catch (err) {
      console.error('Error creating category:', err)
      return null
    }
  }

  const updateCategory = async (id: string, updates: Partial<TodoCategory>) => {
    try {
      return await updateCategoryMutation.mutateAsync({ id, updates })
    } catch (err) {
      console.error('Error updating category:', err)
      return null
    }
  }

  const deleteCategory = async (id: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(id)
      return true
    } catch (err) {
      console.error('Error deleting category:', err)
      return false
    }
  }

  const createList = async (list: Partial<TodoList>) => {
    try {
      return await createListMutation.mutateAsync(list)
    } catch (err) {
      console.error('Error creating list:', err)
      return null
    }
  }

  const updateList = async (id: string, updates: Partial<TodoList>) => {
    try {
      return await updateListMutation.mutateAsync({ id, updates })
    } catch (err) {
      console.error('Error updating list:', err)
      return null
    }
  }

  const deleteList = async (id: string, categoryId: string) => {
    try {
      await deleteListMutation.mutateAsync({ id, categoryId })
      return true
    } catch (err) {
      console.error('Error deleting list:', err)
      return false
    }
  }

  const createItem = async (item: Partial<TodoItem>) => {
    try {
      return await createItemMutation.mutateAsync(item)
    } catch (err) {
      console.error('Error creating item:', err)
      return null
    }
  }

  const updateItem = async (id: string, updates: Partial<TodoItem>) => {
    try {
      return await updateItemMutation.mutateAsync({ id, updates })
    } catch (err) {
      console.error('Error updating item:', err)
      return null
    }
  }

  const deleteItem = async (id: string, listId: string) => {
    try {
      await deleteItemMutation.mutateAsync({ id, listId })
      return true
    } catch (err) {
      console.error('Error deleting item:', err)
      return false
    }
  }

  const cycleItemStatus = async (item: TodoItem) => {
    try {
      return await cycleStatusMutation.mutateAsync({ item })
    } catch (err) {
      console.error('Error cycling item status:', err)
      return null
    }
  }

  // Legacy fetchLists/fetchItems are no-ops since TanStack Query handles this
  const fetchLists = async (_categoryId: string) => {
    // No-op: TanStack Query automatically fetches when useLists is called with categoryId
  }

  const fetchItems = async (_listId: string) => {
    // No-op: TanStack Query automatically fetches when useItems is called with listId
  }

  const refreshCategories = async () => {
    await queryClient.invalidateQueries({ queryKey: todoKeys.categories() })
  }

  return {
    // Data
    categories: categoriesQuery.data || [],
    lists: [] as TodoList[], // Will be handled by individual useLists hook
    items: [] as TodoItem[], // Will be handled by individual useItems hook
    loading: categoriesQuery.isLoading,
    error: categoriesQuery.error?.message || null,
    
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
  }
}
