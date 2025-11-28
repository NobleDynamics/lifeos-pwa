import { create } from 'zustand'
import { Resource } from '@/types/database'

// ============================================================================
// TYPES
// ============================================================================

export interface PathStackItem {
  id: string
  title: string
  path: string
}

interface ResourceNavigationState {
  // Current parent ID (null = root level)
  currentParentId: string | null
  // Path stack for breadcrumbs: [{id, title, path}, ...]
  pathStack: PathStackItem[]
  // Search query
  searchQuery: string
  // UI state
  showForm: 'folder' | 'task' | null
  editingResource: Resource | null
  // Context menu
  contextMenu: {
    show: boolean
    x: number
    y: number
    resource: Resource | null
  }
}

interface ResourceNavigationActions {
  // Navigation
  navigateInto: (resource: Resource) => void
  navigateBack: () => boolean
  navigateToRoot: () => void
  navigateToBreadcrumb: (index: number) => void
  
  // Search
  setSearchQuery: (query: string) => void
  
  // Form management
  setShowForm: (form: 'folder' | 'task' | null) => void
  setEditingResource: (resource: Resource | null) => void
  openCreateForm: (type: 'folder' | 'task') => void
  openEditForm: (resource: Resource) => void
  closeForm: () => void
  
  // Context menu
  showContextMenu: (x: number, y: number, resource: Resource) => void
  hideContextMenu: () => void
  
  // Title helper
  getCurrentTitle: () => string
  
  // Reset
  resetNavigation: () => void
}

// ============================================================================
// STORE
// ============================================================================

export const useResourceStore = create<ResourceNavigationState & ResourceNavigationActions>((set, get) => ({
  // Initial state
  currentParentId: null,
  pathStack: [],
  searchQuery: '',
  showForm: null,
  editingResource: null,
  contextMenu: {
    show: false,
    x: 0,
    y: 0,
    resource: null,
  },

  // ========== Navigation Actions ==========
  
  /**
   * Navigate deeper into a resource (folder/project)
   * Adds the resource to the path stack
   */
  navigateInto: (resource: Resource) => {
    const { pathStack } = get()
    set({
      currentParentId: resource.id,
      pathStack: [...pathStack, {
        id: resource.id,
        title: resource.title,
        path: resource.path,
      }],
      searchQuery: '', // Clear search when navigating
    })
  },

  /**
   * Navigate back one level in the hierarchy
   * Returns false if already at root (can't go back further)
   */
  navigateBack: () => {
    const { pathStack } = get()
    
    if (pathStack.length === 0) {
      // Already at root, can't go back further
      return false
    }
    
    if (pathStack.length === 1) {
      // Going back to root
      set({
        currentParentId: null,
        pathStack: [],
        searchQuery: '',
      })
      return true
    }
    
    // Go back to previous level
    const newStack = pathStack.slice(0, -1)
    const previousItem = newStack[newStack.length - 1]
    
    set({
      currentParentId: previousItem.id,
      pathStack: newStack,
      searchQuery: '',
    })
    return true
  },

  /**
   * Navigate directly to root level
   */
  navigateToRoot: () => {
    set({
      currentParentId: null,
      pathStack: [],
      searchQuery: '',
    })
  },

  /**
   * Navigate to a specific level in the breadcrumb trail
   * @param index - Index in the pathStack (0 = first folder entered)
   */
  navigateToBreadcrumb: (index: number) => {
    const { pathStack } = get()
    
    if (index < 0) {
      // Navigate to root
      set({
        currentParentId: null,
        pathStack: [],
        searchQuery: '',
      })
      return
    }
    
    if (index >= pathStack.length) {
      // Invalid index, do nothing
      return
    }
    
    // Slice the stack to the target level
    const newStack = pathStack.slice(0, index + 1)
    const targetItem = newStack[newStack.length - 1]
    
    set({
      currentParentId: targetItem.id,
      pathStack: newStack,
      searchQuery: '',
    })
  },

  // ========== Search ==========
  
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  // ========== Form Management ==========
  
  setShowForm: (form) => set({ showForm: form }),
  
  setEditingResource: (resource) => set({ editingResource: resource }),
  
  /**
   * Open form for creating a new resource
   */
  openCreateForm: (type: 'folder' | 'task') => {
    set({
      showForm: type,
      editingResource: null,
    })
  },
  
  /**
   * Open form for editing an existing resource
   */
  openEditForm: (resource: Resource) => {
    const formType: 'folder' | 'task' = 
      resource.type === 'folder' || resource.type === 'project' 
        ? 'folder' 
        : 'task'
    
    set({
      showForm: formType,
      editingResource: resource,
    })
  },
  
  /**
   * Close the form
   */
  closeForm: () => {
    set({
      showForm: null,
      editingResource: null,
    })
  },

  // ========== Context Menu ==========
  
  showContextMenu: (x: number, y: number, resource: Resource) => {
    set({
      contextMenu: {
        show: true,
        x,
        y,
        resource,
      },
    })
  },
  
  hideContextMenu: () => {
    set({
      contextMenu: {
        show: false,
        x: 0,
        y: 0,
        resource: null,
      },
    })
  },

  // ========== Helpers ==========
  
  /**
   * Get the current view title based on navigation state
   */
  getCurrentTitle: () => {
    const { pathStack } = get()
    
    if (pathStack.length === 0) {
      return 'Resources'
    }
    
    return pathStack[pathStack.length - 1].title
  },
  
  /**
   * Reset all navigation state to initial values
   */
  resetNavigation: () => {
    set({
      currentParentId: null,
      pathStack: [],
      searchQuery: '',
      showForm: null,
      editingResource: null,
      contextMenu: {
        show: false,
        x: 0,
        y: 0,
        resource: null,
      },
    })
  },
}))

// ============================================================================
// HELPER HOOKS
// ============================================================================

/**
 * Hook for navigation-related state and actions
 */
export function useResourceNavigation() {
  const {
    currentParentId,
    pathStack,
    navigateInto,
    navigateBack,
    navigateToRoot,
    navigateToBreadcrumb,
    getCurrentTitle,
    resetNavigation,
  } = useResourceStore()

  return {
    currentParentId,
    pathStack,
    navigateInto,
    navigateBack,
    navigateToRoot,
    navigateToBreadcrumb,
    getCurrentTitle,
    resetNavigation,
    // Computed values
    isAtRoot: currentParentId === null,
    depth: pathStack.length,
  }
}

/**
 * Hook for search state
 */
export function useResourceSearch() {
  const { searchQuery, setSearchQuery } = useResourceStore()
  return { searchQuery, setSearchQuery }
}

/**
 * Hook for form state and actions
 */
export function useResourceForm() {
  const {
    showForm,
    editingResource,
    setShowForm,
    setEditingResource,
    openCreateForm,
    openEditForm,
    closeForm,
  } = useResourceStore()

  return {
    showForm,
    editingResource,
    setShowForm,
    setEditingResource,
    openCreateForm,
    openEditForm,
    closeForm,
    // Computed
    isEditing: editingResource !== null,
  }
}

/**
 * Hook for context menu state and actions
 */
export function useResourceContextMenu() {
  const { contextMenu, showContextMenu, hideContextMenu } = useResourceStore()
  return { contextMenu, showContextMenu, hideContextMenu }
}
