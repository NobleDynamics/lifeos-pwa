import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  TodoCategory, 
  TodoList, 
  TodoItem, 
  TodoAnalyticsData, 
  CategoryPieData, 
  TodoFilters,
  TodoStatus 
} from '@/types/database'
import { useAuth } from '@/lib/supabase'

export function useTodoData() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<TodoCategory[]>([])
  const [lists, setLists] = useState<TodoList[]>([])
  const [items, setItems] = useState<TodoItem[]>([])
  const [analytics, setAnalytics] = useState<TodoAnalyticsData[]>([])
  const [pieData, setPieData] = useState<CategoryPieData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch all categories
  const fetchCategories = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('todo_categories')
        .select('*')
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError('Failed to fetch categories')
    }
  }, [user])

  // Fetch lists for a category
  const fetchLists = useCallback(async (categoryId: string) => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('category_id', categoryId)
        .is('deleted_at', null)
        .order('name', { ascending: true })

      if (error) throw error
      setLists(data || [])
    } catch (err) {
      console.error('Error fetching lists:', err)
      setError('Failed to fetch lists')
    }
  }, [user])

  // Fetch items for a list
  const fetchItems = useCallback(async (listId: string) => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('todo_items')
        .select('*')
        .eq('list_id', listId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('Error fetching items:', err)
      setError('Failed to fetch items')
    }
  }, [user])

  // Fetch analytics data
  const fetchAnalytics = useCallback(async (startDate: string, endDate: string) => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .rpc('get_todo_analytics', {
          p_user_id: user.id,
          p_start_date: startDate,
          p_end_date: endDate
        })

      if (error) throw error
      setAnalytics(data || [])
    } catch (err) {
      console.error('Error fetching analytics:', err)
      setError('Failed to fetch analytics')
    }
  }, [user])

  // Fetch pie chart data
  const fetchPieData = useCallback(async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .rpc('get_category_pie_data', {
          p_user_id: user.id
        })

      if (error) throw error
      setPieData(data || [])
    } catch (err) {
      console.error('Error fetching pie data:', err)
      setError('Failed to fetch pie data')
    }
  }, [user])

  // Create category
  const createCategory = async (category: Partial<TodoCategory>) => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase
        .from('todo_categories')
        .insert({
          ...category,
          user_id: user.id,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setCategories(prev => [...prev, data])
      }
      return data
    } catch (err) {
      console.error('Error creating category:', err)
      setError('Failed to create category')
      return null
    }
  }

  // Create list
  const createList = async (list: Partial<TodoList>) => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase
        .from('todo_lists')
        .insert({
          ...list,
          user_id: user.id,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setLists(prev => [...prev, data])
      }
      return data
    } catch (err) {
      console.error('Error creating list:', err)
      setError('Failed to create list')
      return null
    }
  }

  // Create item
  const createItem = async (item: Partial<TodoItem>) => {
    if (!user) return null
    
    try {
      const { data, error } = await supabase
        .from('todo_items')
        .insert({
          ...item,
          user_id: user.id,
          created_by: user.id
        })
        .select()
        .single()

      if (error) throw error
      if (data) {
        setItems(prev => [...prev, data])
      }
      return data
    } catch (err) {
      console.error('Error creating item:', err)
      setError('Failed to create item')
      return null
    }
  }

  // Update category
  const updateCategory = async (id: string, updates: Partial<TodoCategory>) => {
    try {
      const { data, error } = await supabase
        .from('todo_categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setCategories(prev => prev.map(cat => cat.id === id ? data : cat))
      }
      return data
    } catch (err) {
      console.error('Error updating category:', err)
      setError('Failed to update category')
      return null
    }
  }

  // Update list
  const updateList = async (id: string, updates: Partial<TodoList>) => {
    try {
      const { data, error } = await supabase
        .from('todo_lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setLists(prev => prev.map(list => list.id === id ? data : list))
      }
      return data
    } catch (err) {
      console.error('Error updating list:', err)
      setError('Failed to update list')
      return null
    }
  }

  // Update item
  const updateItem = async (id: string, updates: Partial<TodoItem>) => {
    try {
      const { data, error } = await supabase
        .from('todo_items')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      if (data) {
        setItems(prev => prev.map(item => item.id === id ? data : item))
      }
      return data
    } catch (err) {
      console.error('Error updating item:', err)
      setError('Failed to update item')
      return null
    }
  }

  // Delete category (soft delete)
  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todo_categories')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setCategories(prev => prev.filter(cat => cat.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting category:', err)
      setError('Failed to delete category')
      return false
    }
  }

  // Delete list (soft delete)
  const deleteList = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todo_lists')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setLists(prev => prev.filter(list => list.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting list:', err)
      setError('Failed to delete list')
      return false
    }
  }

  // Delete item (soft delete)
  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('todo_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      setItems(prev => prev.filter(item => item.id !== id))
      return true
    } catch (err) {
      console.error('Error deleting item:', err)
      setError('Failed to delete item')
      return false
    }
  }

  // Cycle item status
  const cycleItemStatus = async (id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return

    const statusOrder: TodoStatus[] = ['not_started', 'started', 'in_progress', 'completed']
    const currentIndex = statusOrder.indexOf(item.status)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

    const updates: Partial<TodoItem> = {
      status: nextStatus,
      started_at: nextStatus === 'started' || nextStatus === 'in_progress' ? new Date().toISOString() : item.started_at,
      completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
      completed_by: nextStatus === 'completed' ? user?.id || null : null
    }

    return await updateItem(id, updates)
  }

  // Filter and sort items
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
      let aValue: any, bValue: any

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

  // Get item count for a list
  const getItemCount = (listId: string): number => {
    return items.filter(item => item.list_id === listId).length
  }

  // Get completed item count for a list
  const getCompletedItemCount = (listId: string): number => {
    return items.filter(item => item.list_id === listId && item.status === 'completed').length
  }

  // Get list count for a category
  const getListCount = (categoryId: string): number => {
    return lists.filter(list => list.category_id === categoryId).length
  }

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchCategories()
      fetchPieData()
      setLoading(false)
    }
  }, [user, fetchCategories, fetchPieData])

  return {
    categories,
    lists,
    items,
    analytics,
    pieData,
    loading,
    error,
    fetchCategories,
    fetchLists,
    fetchItems,
    fetchAnalytics,
    fetchPieData,
    createCategory,
    createList,
    createItem,
    updateCategory,
    updateList,
    updateItem,
    deleteCategory,
    deleteList,
    deleteItem,
    cycleItemStatus,
    filterAndSortItems,
    getItemCount,
    getCompletedItemCount,
    getListCount
  }

}
