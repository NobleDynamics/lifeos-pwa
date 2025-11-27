import { create } from 'zustand'
import { TodoCategory, TodoList, TodoItem, TodoFilters } from '@/types/database'

interface TodoNavigationState {
  currentView: 'categories' | 'lists' | 'items'
  selectedCategoryId: string | null
  selectedListId: string | null
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
  setSelectedCategory: (id: string | null) => void
  setSelectedList: (id: string | null) => void
  setSelectedItem: (id: string | null) => void
  setSearchQuery: (query: string) => void
  setFilters: (filters: Partial<TodoFilters>) => void
  resetFilters: () => void
  toggleAnalytics: () => void
  setShowForm: (form: TodoNavigationState['showForm']) => void
  setEditingItem: (item: TodoCategory | TodoList | TodoItem | null) => void
  showContextMenu: (x: number, y: number, item: TodoCategory | TodoList | TodoItem, type: 'category' | 'list' | 'item') => void
  hideContextMenu: () => void
  navigateBack: () => void
  navigateToCategory: (categoryId: string) => void
  navigateToList: (listId: string) => void
  navigateToItems: (listId: string) => void
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
  selectedListId: null,
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
  
  setSelectedCategory: (id) => set({ selectedCategoryId: id }),
  
  setSelectedList: (id) => set({ selectedListId: id }),
  
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
  
  navigateBack: () => {
    const { currentView, selectedListId, selectedCategoryId } = get()
    
    if (currentView === 'items' && selectedListId) {
      set({ currentView: 'lists', selectedItemId: null })
    } else if (currentView === 'lists' && selectedCategoryId) {
      set({ currentView: 'categories', selectedListId: null })
    } else {
      set({ currentView: 'categories', selectedCategoryId: null, selectedListId: null, selectedItemId: null })
    }
  },
  
  navigateToCategory: (categoryId) => set({
    currentView: 'lists',
    selectedCategoryId: categoryId,
    selectedListId: null,
    selectedItemId: null
  }),
  
  navigateToList: (listId) => set({
    currentView: 'items',
    selectedListId: listId,
    selectedItemId: null
  }),
  
  navigateToItems: (listId) => set({
    currentView: 'items',
    selectedListId: listId,
    selectedItemId: null
  })
}))

// Helper hooks
export function useTodoNavigation() {
  const {
    currentView,
    selectedCategoryId,
    selectedListId,
    selectedItemId,
    navigateBack,
    navigateToCategory,
    navigateToList,
    navigateToItems
  } = useTodoStore()

  return {
    currentView,
    selectedCategoryId,
    selectedListId,
    selectedItemId,
    navigateBack,
    navigateToCategory,
    navigateToList,
    navigateToItems
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
