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
 * STATE-FIRST BACK NAVIGATION:
 * - Navigation state lives in Zustand (useAppStore)
 * - Back handlers read from store synchronously (no stale state)
 * - URL hash is for display/deep-linking only, not navigation source
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
import { MediaLightboxModal } from '@/engine/components/shared/MediaLightboxModal'
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
import { useAppStore } from '@/store/useAppStore'

// =============================================================================
// TYPES
// =============================================================================

export interface ViewEnginePaneProps {
  /** Context namespace (e.g., 'household.todos', 'cloud.files') */
  context: string
  /** Optional display title for the empty state */
  title?: string
  /** 
   * Disable internal immersive mode handling (when inside ImmersivePaneModal).
   * When true:
   * - Skips the `fixed inset-0` styling for presentation_mode='immersive'
   * - Skips registering back button handlers (modal handles it)
   */
  disableImmersiveMode?: boolean
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

function ViewEnginePaneContent({ context, title, disableImmersiveMode = false }: ViewEnginePaneProps) {
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
  // NAVIGATION STATE (State-First Back Navigation)
  // ==========================================================================
  
  // The paneId is the context string - used for per-pane state in Zustand
  const paneId = context
  
  // Read navigation state from Zustand store (single source of truth)
  const targetNodeId = useAppStore(s => s.activeNodeByPane[paneId] ?? null)
  const navigateToNode = useAppStore(s => s.navigateToNode)
  
  // Initialize from URL hash on mount (deep linking support)
  useEffect(() => {
    const urlNodeId = getNodeIdFromUrl()
    if (urlNodeId && urlNodeId !== targetNodeId) {
      // Initialize store with URL state
      navigateToNode(paneId, urlNodeId)
    }
  }, []) // Only on mount
  
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

  // Media lightbox state
  const [selectedMediaNode, setSelectedMediaNode] = useState<Node | null>(null)
  const [mediaSiblings, setMediaSiblings] = useState<Node[]>([])
  const [mediaInitialIndex, setMediaInitialIndex] = useState(0)

  // Step 3: Transform resources to Node tree (memoized for performance)
  // ALWAYS transform from the root - never swap the root node
  const fullNodeTree = useMemo(() => {
    if (!rootId || !resources || resources.length === 0) {
      return null
    }
    return resourcesToNodeTree(resources, rootId)
  }, [rootId, resources])

  // ==========================================================================
  // STATE-FIRST BACK NAVIGATION
  // ==========================================================================
  
  /**
   * Back button handler - reads from Zustand store synchronously
   * 
   * STATE-FIRST STRATEGY:
   * - Navigation state lives in Zustand (activeNodeByPane, nodeStackByPane)
   * - Back handler calls store action which returns boolean synchronously
   * - No stale state issues since we read from store.getState()
   * 
   * Priority: 20 (called before shell at 15 and app-level at 0)
   * 
   * NOTE: When disableImmersiveMode is true, we skip registering back handlers
   * because the parent ImmersivePaneModal handles back navigation via history push/pop.
   */
  
  // Register back button handler at PRIORITY 20 (folder navigation)
  // Skip when inside immersive modal - the modal handles back
  useBackButton(disableImmersiveMode ? undefined : {
    id: `viewengine:${paneId}`,
    priority: 20,
    handler: () => useAppStore.getState().backFromNode(paneId)
  })

  // ==========================================================================
  // NAVIGATION CALLBACKS
  // ==========================================================================

  /**
   * Handle FORWARD navigation from ShellNavigationProvider
   * (Called when user clicks on a folder or tab)
   */
  const handleNavigate = useCallback((nodeId: string | null, _path: string[]) => {
    // Determine if this is a tab-level navigation
    const isTab = nodeId === null || nodeId === rootId || 
      (fullNodeTree?.children?.some(c => c.id === nodeId) ?? false)
    
    // Update store state (source of truth)
    const targetId = nodeId === rootId ? null : nodeId
    navigateToNode(paneId, targetId, isTab)
    
    // Update URL for deep linking (display only, not navigation source)
    pushNodeToHistory(targetId)
  }, [rootId, fullNodeTree, navigateToNode, paneId])

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
    // Update store state (source of truth)
    navigateToNode(paneId, nodeId, false)
    
    // Update URL for deep linking (display only)
    pushNodeToHistory(nodeId)
  }, [navigateToNode, paneId])

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
   * Handle opening the media lightbox
   */
  const handleOpenMedia = useCallback((node: Node, siblings: Node[], initialIndex: number) => {
    setSelectedMediaNode(node)
    setMediaSiblings(siblings)
    setMediaInitialIndex(initialIndex)
  }, [])

  /**
   * Handle showing context menu from media lightbox
   */
  const handleMediaContextMenu = useCallback((node: Node, x: number, y: number) => {
    // Find the resource that corresponds to this node
    const resource = resources?.find(r => r.id === node.id)
    if (resource) {
      showContextMenu(x, y, resource)
    } else {
      console.warn('[ViewEnginePane] Resource not found for node:', node.id)
    }
  }, [resources, showContextMenu])

  /**
   * Handle moving a node to a new parent (e.g., Kanban card between columns)
   */
  const handleMoveNode = useCallback((nodeId: string, newParentId: string) => {
    // Find current parent to pass as oldParentId (for cache updates)
    const resource = resources?.find(r => r.id === nodeId)
    
    console.log('[ViewEnginePane] Moving node:', nodeId, 'to parent:', newParentId)
    
    moveResourceMutation.mutate({
      id: nodeId,
      newParentId: newParentId,
      oldParentId: resource?.parent_id || null
    })
  }, [resources, moveResourceMutation])

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

      case 'move_to_column': {
        // This is handled by the dedicated onMoveNode callback
        // For trigger behavior, we still support it
        if (!config.payload?.parent_id) {
          console.warn('[ViewEnginePane] move_to_column missing payload.parent_id')
          return
        }

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
            onOpenMedia={handleOpenMedia}
            onMoveNode={handleMoveNode}
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
  // Skip internal immersive handling if parent is already handling it (ImmersivePaneModal)
  const isImmersive = !disableImmersiveMode && fullNodeTree?.metadata?.presentation_mode === 'immersive'

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
          onOpenMedia={handleOpenMedia}
          onMoveNode={handleMoveNode}
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

      {/* Media Lightbox Modal */}
      {selectedMediaNode && (
        <MediaLightboxModal
          isOpen={!!selectedMediaNode}
          onClose={() => setSelectedMediaNode(null)}
          currentNode={selectedMediaNode}
          siblings={mediaSiblings}
          initialIndex={mediaInitialIndex}
          onShowContextMenu={handleMediaContextMenu}
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
