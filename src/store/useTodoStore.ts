import { create } from 'zustand'
import { TodoCategory, TodoList, TodoItem, TodoFilters } from '@/types/database'

interface TodoNavigationState {
  currentView: 'categories' | 'lists' | 'items'
  selectedCategoryId: string | null
  selectedCategoryName: string | null  // Store name for dynamic title
  selectedListId: string | null
  selectedListName: string | null  // Store name for dynamic title
  selectedItemId: string | null
  searchQuery: string
  filters: TodoFilters
  showAnalytics: boolean
  showForm: 'category' | 'list' | 'item' | null
  editingItem: TodoCategory | TodoList | TodoItem | null
  contextMenu: {
    show: boolean
    x: number
    y: number
    item: TodoCategory | TodoList | TodoItem | null
    type: 'category' | 'list' | 'item' | null
  }
}

interface TodoNavigationActions {
  setCurrentView: (view: TodoNavigationState['currentView']) => void
  setSelectedCategory: (id: string | null, name?: string | null) => void
  setSelectedList: (id: string | null, name?: string | null) => void
  setSelectedItem: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<TodoFilters>) => void
  resetFilters: () => void
  toggleAnalytics: () => void
  setShowForm: (form: TodoNavigationState['showForm']) => void
  setEditingItem: (item: TodoCategory | TodoList | TodoItem | null) => void
  showContextMenu: (x: number, y: number, item: TodoCategory | TodoList | TodoItem, type: 'category' | 'list' | 'item') => void
  hideContextMenu: () => void
  navigateBack: () => boolean  // Returns false if at root (can't go back further)
  navigateToCategory: (categoryId: string, categoryName: string) => void
  navigateToList: (listId: string, listName: string) => void
  navigateToItems: (listId: string, listName: string) => void
  getCurrentTitle: () => string  // Computed title based on view
  resetNavigation: () => void  // Reset to categories view
}

const defaultFilters: TodoFilters = {
  search: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
  statusFilter: 'all',
  dateRange: 'all',
  dueSoonFilter: 'all'
}

export const useTodoStore = create<TodoNavigationState & TodoNavigationActions>((set, get) => ({
  // State
  currentView: 'categories',
  selectedCategoryId: null,
  selectedCategoryName: null,
  selectedListId: null,
  selectedListName: null,
  selectedItemId: null,
  searchQuery: '',
  filters: defaultFilters,
  showAnalytics: false,
  showForm: null,
  editingItem: null,
  contextMenu: {
    show: false,
    x: 0,
    y: 0,
    item: null,
    type: null
  },

  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  
  setSelectedCategory: (id, name = null) => set({ 
    selectedCategoryId: id,
    selectedCategoryName: name 
  }),
  
  setSelectedList: (id, name = null) => set({ 
    selectedListId: id,
    selectedListName: name 
  }),
  
  setSelectedItem: (id) => set({ selectedItemId: id }),
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters }
  })),
  
  resetFilters: () => set({ filters: defaultFilters }),
  
  toggleAnalytics: () => set((state) => ({ showAnalytics: !state.showAnalytics })),
  
  setShowForm: (form) => set({ showForm: form }),
  
  setEditingItem: (item) => set({ editingItem: item }),
  
  showContextMenu: (x, y, item, type) => set({
    contextMenu: {
      show: true,
      x,
      y,
      item,
      type
    }
  }),
  
  hideContextMenu: () => set({
    contextMenu: {
      show: false,
      x: 0,
      y: 0,
      item: null,
      type: null
    }
  }),
  
  // Navigate back through the hierarchy
  // Returns false if at root level (categories), true if navigated back
  navigateBack: () => {
    const { currentView } = get()
    
    if (currentView === 'items') {
      // Go from items back to lists - preserve category selection!
      set({ 
        currentView: 'lists', 
        selectedListId: null,
        selectedListName: null,
        selectedItemId: null 
        // Keep selectedCategoryId and selectedCategoryName so lists view works
      })
      return true
    } else if (currentView === 'lists') {
      // Go from lists back to categories
      set({ 
        currentView: 'categories', 
        selectedCategoryId: null,
        selectedCategoryName: null,
        selectedListId: null,
        selectedListName: null 
      })
      return true
    }
    
    // At categories level, can't go back further within the todo hierarchy
    // Return false so the app's global back button behavior can take over
    return false
  },
  
  // Navigate to a category (show its lists)
  navigateToCategory: (categoryId, categoryName) => set({
    currentView: 'lists',
    selectedCategoryId: categoryId,
    selectedCategoryName: categoryName,
    selectedListId: null,
    selectedListName: null,
    selectedItemId: null
  }),
  
  // Navigate to a list (alias for navigateToItems for backwards compat)
  navigateToList: (listId, listName) => set({
    currentView: 'items',
    selectedListId: listId,
    selectedListName: listName,
    selectedItemId: null
  }),
  
  // Navigate to items view for a list
  navigateToItems: (listId, listName) => set({
    currentView: 'items',
    selectedListId: listId,
    selectedListName: listName,
    selectedItemId: null
  }),
  
  // Get the current title based on view and selected items
  getCurrentTitle: () => {
    const { currentView, selectedCategoryName, selectedListName } = get()
    
    switch (currentView) {
      case 'categories':
        return 'Categories'
      case 'lists':
        return selectedCategoryName ? `${selectedCategoryName}` : 'Lists'
      case 'items':
        return selectedListName ? `${selectedListName}` : 'Items'
      default:
        return 'To-Do'
    }
  },
  
  // Reset navigation to categories view
  resetNavigation: () => set({
    currentView: 'categories',
    selectedCategoryId: null,
    selectedCategoryName: null,
    selectedListId: null,
    selectedListName: null,
    selectedItemId: null
  })
}))

// Helper hooks
export function useTodoNavigation() {
  const {
    currentView,
    selectedCategoryId,
    selectedCategoryName,
    selectedListId,
    selectedListName,
    selectedItemId,
    navigateBack,
    navigateToCategory,
    navigateToList,
    navigateToItems,
    getCurrentTitle,
    resetNavigation
  } = useTodoStore()

  return {
    currentView,
    selectedCategoryId,
    selectedCategoryName,
    selectedListId,
    selectedListName,
    selectedItemId,
    navigateBack,
    navigateToCategory,
    navigateToList,
    navigateToItems,
    getCurrentTitle,
    resetNavigation
  }
}

export function useTodoSearch() {
  const { searchQuery, setSearchQuery } = useTodoStore()
  return { searchQuery, setSearchQuery }
}

export function useTodoFilters() {
  const { filters, setFilters, resetFilters } = useTodoStore()
  return { filters, setFilters, resetFilters }
}

export function useTodoUI() {
  const { showAnalytics, toggleAnalytics, showForm, setShowForm, editingItem, setEditingItem } = useTodoStore()
  return { showAnalytics, toggleAnalytics, showForm, setShowForm, editingItem, setEditingItem }
}

export function useTodoContextMenu() {
  const { contextMenu, showContextMenu, hideContextMenu } = useTodoStore()
  return { contextMenu, showContextMenu, hideContextMenu }
}
