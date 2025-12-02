/**
 * ViewEnginePane - Bridge Component
 * 
 * Connects Supabase data to the ViewEngine by:
 * 1. Fetching the context root using useContextRoot
 * 2. Fetching the resource tree using useResourceTree
 * 3. Transforming flat resources into a nested Node tree
 * 4. Providing action callbacks via EngineActionsProvider
 * 5. Rendering via ViewEngine with PERSISTENT SHELL architecture
 * 
 * PERSISTENT SHELL ARCHITECTURE:
 * - Always render the full tree from Context Root (App Shell)
 * - Pass targetNodeId to the Shell via ShellNavigationProvider
 * - The Shell renders its chrome (header, tabs) permanently
 * - Only the viewport content changes based on targetNodeId
 * 
 * @module panes/ViewEnginePane
 */

import { useMemo, useCallback, useState } from 'react'
import { Loader2, AlertCircle } from 'lucide-react'
import {
  ViewEngine,
  resourcesToNodeTree,
  createEmptyRootNode,
  EngineActionsProvider,
  ShellNavigationProvider,
  type BehaviorConfig,
  type Node,
} from '@/engine'
import { useContextRoot } from '@/hooks/useContextRoot'
import {
  useResourceTree,
  useCycleResourceStatus,
  useUpdateResource,
  useMoveResource,
  useCreateResource,
} from '@/hooks/useResourceData'
import {
  useResourceForm,
  useResourceContextMenu,
  ResourceStoreProvider
} from '@/store/useResourceStore'
import { ResourceForm } from '@/components/ResourceForm'
import { ResourceContextMenu } from '@/components/ResourceContextMenu'
import { Resource } from '@/types/database'
import { cn } from '@/lib/utils'
import { useBackButton } from '@/hooks/useBackButton'

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
// URL STATE HELPERS
// =============================================================================

/**
 * Get nodeId from URL hash (e.g., #node=abc-123)
 */
function getNodeIdFromUrl(): string | null {
  const hash = window.location.hash
  if (!hash || !hash.startsWith('#node=')) return null
  return hash.slice(6) // Remove '#node='
}

/**
 * Update URL hash with nodeId (FORWARD navigation only)
 * 
 * NAVIGATION RULES:
 * - Forward (clicking folder): Use pushState (creates new history entry)
 * - Back (pressing back): React to popstate (do NOT push/replace)
 * - The global useBackButton system handles back button interception
 */
function pushNodeToHistory(nodeId: string | null) {
  const newHash = nodeId ? `#node=${nodeId}` : ''
  const url = new URL(window.location.href)
  url.hash = newHash
  window.history.pushState({ nodeId }, '', url.toString())
}

// =============================================================================
// CONTENT COMPONENT
// =============================================================================

function ViewEnginePaneContent({ context, title }: ViewEnginePaneProps) {
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

  // ==========================================================================
  // NAVIGATION STATE (Persistent Shell Architecture)
  // ==========================================================================
  
  // targetNodeId: The node the user has drilled into (null = at root)
  const [targetNodeId, setTargetNodeId] = useState<string | null>(() => {
    // Initialize from URL hash if present
    return getNodeIdFromUrl()
  })

  // Form store
  const { openCreateForm } = useResourceForm()

  // Context menu store
  const { showContextMenu } = useResourceContextMenu()

  // Status cycling mutation
  const cycleStatusMutation = useCycleResourceStatus()
  const updateResourceMutation = useUpdateResource()
  const moveResourceMutation = useMoveResource()
  const createResourceMutation = useCreateResource()

  // Step 3: Transform resources to Node tree (memoized for performance)
  // ALWAYS transform from the root - never swap the root node
  const fullNodeTree = useMemo(() => {
    if (!rootId || !resources || resources.length === 0) {
      return null
    }
    return resourcesToNodeTree(resources, rootId)
  }, [rootId, resources])

  // ==========================================================================
  // URL STATE MANAGEMENT
  // ==========================================================================
  
  // NOTE: We do NOT add a separate popstate listener here.
  // The global useBackButton system handles popstate events.
  // Our handleBack callback (registered below) reacts to back button presses.
  // This prevents the "War of the Handlers" bug where two listeners compete.

  // ==========================================================================
  // NAVIGATION CALLBACKS
  // ==========================================================================

  /**
   * Handle FORWARD navigation from ShellNavigationProvider
   * (Called when user clicks on a folder or tab)
   */
  const handleNavigate = useCallback((nodeId: string | null, _path: string[]) => {
    // Update React state
    if (nodeId === rootId) {
      setTargetNodeId(null)
    } else {
      setTargetNodeId(nodeId)
    }
    
    // FORWARD navigation: Push new history entry
    // This allows back button to return to previous location
    pushNodeToHistory(nodeId === rootId ? null : nodeId)
  }, [rootId])

  /**
   * Handle opening the create form
   */
  const handleOpenCreateForm = useCallback((type: 'folder' | 'task', parentId: string) => {
    openCreateForm(type)
    // The form will use currentParentId from the store
  }, [openCreateForm])

  /**
   * Handle navigating into a folder (FORWARD navigation)
   */
  const handleNavigateInto = useCallback((nodeId: string, _nodeTitle: string, _nodePath: string) => {
    // Update React state
    setTargetNodeId(nodeId)
    
    // FORWARD navigation: Push new history entry
    pushNodeToHistory(nodeId)
  }, [])

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

  /**
   * Handle generic behavior triggers
   * CRITICAL FIX: Use original resource meta_data to prevent data loss
   */
  const handleTriggerBehavior = useCallback((node: Node, config: BehaviorConfig) => {
    console.log('[ViewEnginePane] Trigger Behavior:', config, 'on Node:', node.id)

    switch (config.action) {
      case 'update_field': {
        if (!config.target) {
          console.warn('[ViewEnginePane] update_field missing target')
          return
        }

        // CRITICAL: Find the original resource to get the FULL meta_data from DB
        // node.metadata is the VIEW layer copy which may be incomplete
        const resource = resources?.find(r => r.id === node.id)
        if (!resource) {
          console.warn('[ViewEnginePane] Resource not found for node:', node.id)
          return
        }

        // Merge new value into the ORIGINAL metadata from the database
        const currentMeta = (resource.meta_data || {}) as Record<string, unknown>
        const updates = {
          meta_data: {
            ...currentMeta,
            [config.target]: config.payload
          }
        }

        console.log('[ViewEnginePane] Updating resource:', node.id, 'with:', updates)
        updateResourceMutation.mutate({
          id: node.id,
          updates
        })
        break
      }

      case 'toggle_status': {
        // Find resource to cycle status
        const resource = resources?.find(r => r.id === node.id)
        if (resource) {
          cycleStatusMutation.mutate({ resource })
        }
        break
      }

      case 'move_node': {
        if (!config.payload?.parent_id) {
          console.warn('[ViewEnginePane] move_node missing payload.parent_id')
          return
        }

        // Find current parent to pass as oldParentId (optional but good for cache updates)
        const resource = resources?.find(r => r.id === node.id)

        moveResourceMutation.mutate({
          id: node.id,
          newParentId: config.payload.parent_id,
          oldParentId: resource?.parent_id || null
        })
        break
      }

      case 'log_event': {
        // Create a new child node of type 'event' (stored as task/item)
        createResourceMutation.mutate({
          user_id: '', // Handled by hook
          type: 'task',
          parent_id: node.id,
          title: config.payload?.title || 'Event Logged',
          description: config.payload?.description || new Date().toLocaleString(),
          meta_data: {
            is_event: true,
            timestamp: new Date().toISOString(),
            ...config.payload
          }
        })
        break
      }

      default:
        console.warn(`[ViewEnginePane] Unknown behavior action: ${config.action}`)
    }
  }, [resources, updateResourceMutation, cycleStatusMutation, moveResourceMutation, createResourceMutation])

  // ==========================================================================
  // BACK BUTTON HANDLING (PASSIVE LISTENING STRATEGY)
  // ==========================================================================
  
  // Determine if we can navigate back within the ViewEngine
  const canNavigateBack = targetNodeId !== null && targetNodeId !== rootId
  
  /**
   * Back button handler - called by the global useBackButton system
   * 
   * PASSIVE LISTENING STRATEGY:
   * - When popstate fires, the URL has ALREADY changed to the previous entry
   * - We just need to update React state to match the new URL
   * - We do NOT call history.back() or history.push() here
   * - The global system handles history management
   * 
   * Returns true if we handled the back (was in a deep view OR at root)
   * At root: We "trap" the user to prevent accidental app exit (Android back closes app)
   * User must use global navigation (drawer/swipe) to leave the app view.
   */
  const handleBack = useCallback(() => {
    // If we're at root, consume the back event but don't navigate
    // This prevents Android app from exiting - user must use drawer to leave
    if (!targetNodeId || targetNodeId === rootId) {
      // Return true to indicate we "handled" the back (by consuming it)
      // This traps the user at the root - standard behavior for root views
      return true
    }
    
    // We're in a deep view - the browser already popped to the previous URL
    // Read the new nodeId from the URL (which has already changed)
    const newNodeId = getNodeIdFromUrl()
    
    // Update React state to match the browser's URL
    // This is "passive listening" - we react to the URL change, not cause it
    setTargetNodeId(newNodeId)
    
    // Return true to indicate we handled the back action
    return true
  }, [targetNodeId, rootId])
  
  // Register with the global back button system at PRIORITY 20
  // This is higher than modals (10) and app-level (0)
  useBackButton({
    onCloseModal: handleBack,
    priority: 20,
  })

  // ==========================================================================
  // RENDER STATES
  // ==========================================================================

  // === Loading State ===
  if (isContextLoading || isTreeLoading) {
    return <LoadingState title={title} />
  }

  // === Error State ===
  if (contextError) {
    return <ErrorState error={contextError} title={title} />
  }
  if (treeError) {
    return <ErrorState error={treeError.message} title={title} />
  }

  // === Empty State ===
  // Context root exists but has no children yet
  if (!fullNodeTree && rootId) {
    const emptyRoot = createEmptyRootNode(
      rootId,
      title || context,
      'view_directory'
    )
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <ShellNavigationProvider
          rootNode={emptyRoot}
          targetNodeId={null}
          onNavigate={handleNavigate}
        >
          <EngineActionsProvider
            rootId={rootId}
            currentParentId={rootId}
            onOpenCreateForm={handleOpenCreateForm}
            onNavigateInto={handleNavigateInto}
            onOpenContextMenu={handleOpenContextMenu}
            onCycleStatus={handleCycleStatus}
            onTriggerBehavior={handleTriggerBehavior}
          >
            {/* Shell controls its own scroll - no overflow here */}
            <ViewEngine root={emptyRoot} className="flex-1 min-h-0" />
          </EngineActionsProvider>
        </ShellNavigationProvider>

        {/* Form & Context Menu */}
        <ResourceForm />
        <ResourceContextMenu />
      </div>
    )
  }

  // === No Data State ===
  if (!fullNodeTree) {
    return (
      <ErrorState
        error="Unable to load data. Please try again."
        title={title}
      />
    )
  }

  // Check for immersive mode
  const isImmersive = fullNodeTree?.metadata?.presentation_mode === 'immersive'

  // Determine currentParentId for create forms
  // If targetNodeId is set, that's the current parent for new items
  // Otherwise, it's the rootId
  const currentParentId = targetNodeId || rootId

  // === Success: Render ViewEngine with Persistent Shell ===
  return (
    <div className={cn(
      "flex flex-col flex-1 min-h-0",
      isImmersive && "fixed inset-0 z-50 bg-dark-950" // Immersive Mode Overlay
    )}>
      <ShellNavigationProvider
        rootNode={fullNodeTree}
        targetNodeId={targetNodeId}
        onNavigate={handleNavigate}
      >
        <EngineActionsProvider
          rootId={rootId}
          currentParentId={currentParentId}
          onOpenCreateForm={handleOpenCreateForm}
          onNavigateInto={handleNavigateInto}
          onOpenContextMenu={handleOpenContextMenu}
          onCycleStatus={handleCycleStatus}
          onTriggerBehavior={handleTriggerBehavior}
        >
          {/* 
            PERSISTENT SHELL ARCHITECTURE:
            Always render the full tree from Context Root.
            The Shell (layout_app_shell) will use ShellNavigationContext
            to determine what to show in its viewport.
            Shell controls its own scroll - no overflow here!
          */}
          <ViewEngine root={fullNodeTree} className="flex-1 min-h-0" />
        </EngineActionsProvider>
      </ShellNavigationProvider>

      {/* Form & Context Menu */}
      <ResourceForm />
      <ResourceContextMenu />
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT (WRAPPER)
// =============================================================================

/**
 * ViewEnginePane - The bridge between Supabase and ViewEngine
 * 
 * This component:
 * 1. Provides a scoped ResourceStore for this pane
 * 2. Renders the content with Persistent Shell architecture
 * 
 * @example
 * <ViewEnginePane context="household.todos" title="To-Do" />
 */
export function ViewEnginePane(props: ViewEnginePaneProps) {
  return (
    <ResourceStoreProvider>
      <ViewEnginePaneContent {...props} />
    </ResourceStoreProvider>
  )
}

export default ViewEnginePane
