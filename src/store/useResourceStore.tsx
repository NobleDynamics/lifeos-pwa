import { create, StoreApi, useStore } from 'zustand'
import { Resource } from '@/types/database'
import { createContext, useContext, useState, ReactNode } from 'react'

// ============================================================================
// TYPES
// ============================================================================

export interface PathStackItem {
  id: string
  title: string
  path: string
}

interface ResourceNavigationState {
  // Context root (the "floor" for this view's navigation)
  contextRootId: string | null
  contextTitle: string
  // Current parent ID (contextRootId = at root of context)
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
  // Context root management
  setContextRoot: (rootId: string | null, title: string) => void
  clearContextRoot: () => void

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

type ResourceStore = ResourceNavigationState & ResourceNavigationActions

// ============================================================================
// STORE FACTORY
// ============================================================================

export const createResourceStore = () => create<ResourceStore>((set, get) => ({
  // Initial state
  contextRootId: null,
  contextTitle: 'Resources',
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

  // ========== Context Root Management ==========

  setContextRoot: (rootId: string | null, title: string) => {
    set({
      contextRootId: rootId,
      contextTitle: title,
      // Start navigation at the context root
      currentParentId: rootId,
      pathStack: [],
      searchQuery: '',
    })
  },

  clearContextRoot: () => {
    set({
      contextRootId: null,
      contextTitle: 'Resources',
      currentParentId: null,
      pathStack: [],
      searchQuery: '',
    })
  },

  // ========== Navigation Actions ==========

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

  navigateBack: () => {
    const { pathStack, contextRootId } = get()

    if (pathStack.length === 0) {
      return false
    }

    if (pathStack.length === 1) {
      set({
        currentParentId: contextRootId,
        pathStack: [],
        searchQuery: '',
      })
      return true
    }

    const newStack = pathStack.slice(0, -1)
    const previousItem = newStack[newStack.length - 1]

    set({
      currentParentId: previousItem.id,
      pathStack: newStack,
      searchQuery: '',
    })
    return true
  },

  navigateToRoot: () => {
    const { contextRootId } = get()
    set({
      currentParentId: contextRootId,
      pathStack: [],
      searchQuery: '',
    })
  },

  navigateToBreadcrumb: (index: number) => {
    const { pathStack, contextRootId } = get()

    if (index < 0) {
      set({
        currentParentId: contextRootId,
        pathStack: [],
        searchQuery: '',
      })
      return
    }

    if (index >= pathStack.length) {
      return
    }

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

  openCreateForm: (type: 'folder' | 'task') => {
    set({
      showForm: type,
      editingResource: null,
    })
  },

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

  getCurrentTitle: () => {
    const { pathStack, contextTitle } = get()

    if (pathStack.length === 0) {
      return contextTitle
    }

    return pathStack[pathStack.length - 1].title
  },

  resetNavigation: () => {
    const { contextRootId } = get()
    set({
      currentParentId: contextRootId,
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
// CONTEXT & PROVIDER
// ============================================================================

const ResourceStoreContext = createContext<StoreApi<ResourceStore> | null>(null)

export const ResourceStoreProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(() => createResourceStore())
  return (
    <ResourceStoreContext.Provider value={store}>
      {children}
    </ResourceStoreContext.Provider>
  )
}

// ============================================================================
// HOOKS
// ============================================================================

function useResourceStoreContext<T>(selector: (state: ResourceStore) => T): T {
  const store = useContext(ResourceStoreContext)
  if (!store) {
    throw new Error('useResourceStore must be used within a ResourceStoreProvider')
  }
  return useStore(store, selector)
}

/**
 * Hook for navigation-related state and actions
 */
export function useResourceNavigation() {
  const {
    contextRootId,
    contextTitle,
    currentParentId,
    pathStack,
    setContextRoot,
    clearContextRoot,
    navigateInto,
    navigateBack,
    navigateToRoot,
    navigateToBreadcrumb,
    getCurrentTitle,
    resetNavigation,
  } = useResourceStoreContext((state) => state)

  return {
    contextRootId,
    contextTitle,
    currentParentId,
    pathStack,
    setContextRoot,
    clearContextRoot,
    navigateInto,
    navigateBack,
    navigateToRoot,
    navigateToBreadcrumb,
    getCurrentTitle,
    resetNavigation,
    // Computed values
    isAtRoot: currentParentId === contextRootId,
    depth: pathStack.length,
  }
}

/**
 * Hook for search state
 */
export function useResourceSearch() {
  const { searchQuery, setSearchQuery } = useResourceStoreContext((state) => ({
    searchQuery: state.searchQuery,
    setSearchQuery: state.setSearchQuery
  }))
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
  } = useResourceStoreContext((state) => ({
    showForm: state.showForm,
    editingResource: state.editingResource,
    setShowForm: state.setShowForm,
    setEditingResource: state.setEditingResource,
    openCreateForm: state.openCreateForm,
    openEditForm: state.openEditForm,
    closeForm: state.closeForm
  }))

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
  const { contextMenu, showContextMenu, hideContextMenu } = useResourceStoreContext((state) => ({
    contextMenu: state.contextMenu,
    showContextMenu: state.showContextMenu,
    hideContextMenu: state.hideContextMenu
  }))
  return { contextMenu, showContextMenu, hideContextMenu }
}
