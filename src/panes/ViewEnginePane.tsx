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

import { useMemo, useCallback, useState, useEffect } from 'react'
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
import { NoteViewerModal, type VersionEntry } from '@/engine/components/shared/NoteViewerModal'
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
 * - Back (pressing back): React to popstate, read new URL, sync React state
 * - The global useBackButton system handles popstate interception
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

  // Note modal state
  const [selectedNoteNode, setSelectedNoteNode] = useState<Node | null>(null)

  // Step 3: Transform resources to Node tree (memoized for performance)
  // ALWAYS transform from the root - never swap the root node
  const fullNodeTree = useMemo(() => {
    if (!rootId || !resources || resources.length === 0) {
      return null
    }
    return resourcesToNodeTree(resources, rootId)
  }, [rootId, resources])

  // ==========================================================================
  // BROWSER HISTORY-BASED BACK NAVIGATION
  // ==========================================================================
  
  /**
   * Back button handler - syncs with browser history (URL hash)
   * 
   * BROWSER HISTORY STRATEGY:
   * - Forward navigation pushes history entries with nodeId in URL hash
   * - Back button reads the CURRENT URL hash (which browser has already navigated to)
   * - We sync React state with the URL, giving "go back to where I was" behavior
   * 
   * Priority: 20 (called before shell at 15 and app-level at 0)
   * 
   * IMPORTANT: When URL is empty, we sync state to null but return FALSE
   * This lets the shell handler run next to handle tab-level navigation
   */
  const handleHistoryBack = useCallback(() => {
    // Read the nodeId from the CURRENT URL (after browser back)
    const urlNodeId = getNodeIdFromUrl()
    
    // If URL has a SPECIFIC nodeId different from our current state, sync to it
    if (urlNodeId !== null && urlNodeId !== targetNodeId) {
      setTargetNodeId(urlNodeId)
      return true // We handled the navigation - synced to a specific node
    }
    
    // If URL is empty but we have a targetNodeId, clear it
    // BUT return false so shell can handle tab-level navigation
    if (targetNodeId !== null && urlNodeId === null) {
      setTargetNodeId(null)
      // Don't return true! Let the shell handler decide what to do
      // (e.g., switch from non-default tab to default tab, then to dashboard)
      return false
    }
    
    // URL matches our state - nothing to do at this level
    // Let lower priority handlers (shell/app-level) deal with it
    return false
  }, [targetNodeId])
  
  // Register back button handler at PRIORITY 20 (highest for navigation)
  useBackButton({
    onCloseModal: handleHistoryBack,
    priority: 20,
  })

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
   * Handle opening a note in the viewer/editor modal
   */
  const handleOpenNote = useCallback((node: Node) => {
    setSelectedNoteNode(node)
  }, [])

  /**
   * Handle saving note content from the modal
   */
  const handleSaveNote = useCallback((content: string, history: VersionEntry[]) => {
    if (!selectedNoteNode) return

    // Find the original resource to get the FULL meta_data from DB
    const resource = resources?.find(r => r.id === selectedNoteNode.id)
    if (!resource) {
      console.warn('[ViewEnginePane] Resource not found for note:', selectedNoteNode.id)
      return
    }

    // Merge new content and history into the ORIGINAL metadata from the database
    const currentMeta = (resource.meta_data || {}) as Record<string, unknown>
    const updates = {
      meta_data: {
        ...currentMeta,
        content,
        history,
        updated_at: new Date().toISOString(),
      }
    }

    console.log('[ViewEnginePane] Saving note:', selectedNoteNode.id, 'content length:', content.length)
    updateResourceMutation.mutate({
      id: selectedNoteNode.id,
      updates
    })
  }, [selectedNoteNode, resources, updateResourceMutation])

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
  // RENDER STATES
  // ==========================================================================
  
  // NOTE: Back button handling is now managed by layout_app_shell (priority 15)
  // The shell handles: folder navigation, tab switching, and delegates to app-level for exit

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
            onOpenNote={handleOpenNote}
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
          onOpenNote={handleOpenNote}
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

      {/* Note Viewer/Editor Modal */}
      {selectedNoteNode && (
        <NoteViewerModal
          isOpen={!!selectedNoteNode}
          onClose={() => setSelectedNoteNode(null)}
          node={selectedNoteNode}
          onSave={handleSaveNote}
        />
      )}
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
