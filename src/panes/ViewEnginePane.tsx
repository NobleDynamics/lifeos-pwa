/**
 * ViewEnginePane - Bridge Component
 * 
 * Connects Supabase data to the ViewEngine by:
 * 1. Fetching the context root using useContextRoot
 * 2. Fetching the resource tree using useResourceTree
 * 3. Transforming flat resources into a nested Node tree
 * 4. Providing action callbacks via EngineActionsProvider
 * 5. Rendering via ViewEngine with navigation support
 * 
 * @module panes/ViewEnginePane
 */

import { useMemo, useEffect, useCallback } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import { 
  ViewEngine, 
  resourcesToNodeTree, 
  createEmptyRootNode,
  EngineActionsProvider,
  findNodeById,
} from '@/engine'
import { useContextRoot } from '@/hooks/useContextRoot'
import { useResourceTree, useCycleResourceStatus } from '@/hooks/useResourceData'
import { 
  useResourceNavigation, 
  useResourceForm, 
  useResourceContextMenu 
} from '@/store/useResourceStore'
import { ResourceBreadcrumbs } from '@/components/ResourceBreadcrumbs'
import { ResourceForm } from '@/components/ResourceForm'
import { ResourceContextMenu } from '@/components/ResourceContextMenu'
import { Resource } from '@/types/database'

// =============================================================================
// TYPES
// =============================================================================

export interface ViewEnginePaneProps {
  /** Context namespace (e.g., 'household.todos', 'cloud.files') */
  context: string
  /** Optional display title for the empty state */
  title?: string
}

// =============================================================================
// LOADING COMPONENT
// =============================================================================

function LoadingState({ title }: { title?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-dark-500 text-sm">
          Loading {title || 'content'}...
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// ERROR COMPONENT
// =============================================================================

function ErrorState({ error, title }: { error: string; title?: string }) {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6 text-red-400" />
        </div>
        <p className="text-red-400 text-sm">Failed to load {title || 'content'}</p>
        <p className="text-dark-500 text-xs max-w-xs mx-auto">{error}</p>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ViewEnginePane - The bridge between Supabase and ViewEngine
 * 
 * This component:
 * 1. Gets or creates the context root (e.g., household.todos folder)
 * 2. Fetches all descendants of the context root
 * 3. Transforms the flat array into a nested Node tree
 * 4. Provides action callbacks for create/update/delete/navigate
 * 5. Renders via the ViewEngine with breadcrumb navigation
 * 
 * @example
 * <ViewEnginePane context="household.todos" title="To-Do" />
 */
export function ViewEnginePane({ context, title }: ViewEnginePaneProps) {
  // Step 1: Get or create the context root
  const {
    rootId,
    rootPath,
    isLoading: isContextLoading,
    error: contextError,
  } = useContextRoot(context)

  // Step 2: Fetch the entire resource tree
  const {
    data: resources,
    isLoading: isTreeLoading,
    error: treeError,
  } = useResourceTree(rootPath)

  // Navigation store
  const { 
    setContextRoot, 
    navigateInto,
    currentParentId,
    pathStack,
  } = useResourceNavigation()

  // Form store
  const { openCreateForm } = useResourceForm()

  // Context menu store
  const { showContextMenu } = useResourceContextMenu()

  // Status cycling mutation
  const cycleStatusMutation = useCycleResourceStatus()

  // Sync context root with navigation store when it changes
  useEffect(() => {
    if (rootId) {
      setContextRoot(rootId, title || context)
    }
  }, [rootId, title, context, setContextRoot])

  // Step 3: Transform resources to Node tree (memoized for performance)
  const fullNodeTree = useMemo(() => {
    if (!rootId || !resources || resources.length === 0) {
      return null
    }
    return resourcesToNodeTree(resources, rootId)
  }, [rootId, resources])

  // Step 4: Get the current view node based on navigation
  // If we've navigated into a folder, show that folder's subtree
  const currentNodeTree = useMemo(() => {
    if (!fullNodeTree) return null
    
    // If at root (no path stack), show full tree
    if (pathStack.length === 0) {
      return fullNodeTree
    }
    
    // Find the current folder in the tree
    const currentFolderId = currentParentId
    if (!currentFolderId) return fullNodeTree
    
    const currentNode = findNodeById(fullNodeTree, currentFolderId)
    if (!currentNode) return fullNodeTree
    
    // Return the found node as the new root for rendering
    return currentNode
  }, [fullNodeTree, pathStack, currentParentId])

  // ==========================================================================
  // ACTION CALLBACKS
  // ==========================================================================

  /**
   * Handle opening the create form
   */
  const handleOpenCreateForm = useCallback((type: 'folder' | 'task', parentId: string) => {
    openCreateForm(type)
    // The form will use currentParentId from the store
  }, [openCreateForm])

  /**
   * Handle navigating into a folder
   */
  const handleNavigateInto = useCallback((nodeId: string, nodeTitle: string, nodePath: string) => {
    // Find the resource for this node to get path info
    const resource = resources?.find(r => r.id === nodeId)
    if (resource) {
      navigateInto(resource)
    }
  }, [resources, navigateInto])

  /**
   * Handle opening context menu
   */
  const handleOpenContextMenu = useCallback((e: React.MouseEvent | React.TouchEvent, resource: Resource) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Get coordinates based on event type
    let x: number, y: number
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      x = touch.clientX
      y = touch.clientY
    } else {
      x = e.clientX
      y = e.clientY
    }
    
    showContextMenu(x, y, resource)
  }, [showContextMenu])

  /**
   * Handle cycling resource status
   */
  const handleCycleStatus = useCallback((resource: Resource) => {
    cycleStatusMutation.mutate({ resource })
  }, [cycleStatusMutation])

  // === Loading State ===
  if (isContextLoading || isTreeLoading) {
    return <LoadingState title={title} />
  }

  // === Error State ===
  // Only show error for network/DB failures, not for missing variants
  if (contextError) {
    return <ErrorState error={contextError} title={title} />
  }
  if (treeError) {
    return <ErrorState error={treeError.message} title={title} />
  }

  // === Empty State ===
  // Context root exists but has no children yet
  if (!currentNodeTree && rootId) {
    const emptyRoot = createEmptyRootNode(
      rootId,
      title || context,
      'view_directory'
    )
    return (
      <div className="flex flex-col flex-1 min-h-0">
        {/* Breadcrumbs */}
        <div className="px-3 py-2 border-b border-dark-200">
          <ResourceBreadcrumbs />
        </div>
        
        <EngineActionsProvider
          rootId={rootId}
          currentParentId={currentParentId}
          onOpenCreateForm={handleOpenCreateForm}
          onNavigateInto={handleNavigateInto}
          onOpenContextMenu={handleOpenContextMenu}
          onCycleStatus={handleCycleStatus}
        >
          <ViewEngine root={emptyRoot} className="flex-1 overflow-y-auto" />
        </EngineActionsProvider>
        
        {/* Form & Context Menu */}
        <ResourceForm />
        <ResourceContextMenu />
      </div>
    )
  }

  // === No Data State ===
  // This shouldn't happen if context root creation worked
  if (!currentNodeTree) {
    return (
      <ErrorState 
        error="Unable to load data. Please try again." 
        title={title} 
      />
    )
  }

  // === Success: Render ViewEngine ===
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Breadcrumbs */}
      <div className="px-3 py-2 border-b border-dark-200">
        <ResourceBreadcrumbs />
      </div>
      
      <EngineActionsProvider
        rootId={rootId}
        currentParentId={currentParentId}
        onOpenCreateForm={handleOpenCreateForm}
        onNavigateInto={handleNavigateInto}
        onOpenContextMenu={handleOpenContextMenu}
        onCycleStatus={handleCycleStatus}
      >
        <ViewEngine root={currentNodeTree} className="flex-1 overflow-y-auto" />
      </EngineActionsProvider>
      
      {/* Form & Context Menu */}
      <ResourceForm />
      <ResourceContextMenu />
    </div>
  )
}

export default ViewEnginePane
