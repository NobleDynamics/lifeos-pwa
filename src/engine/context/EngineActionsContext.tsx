/**
 * Engine Actions Context
 * 
 * Provides action callbacks to ViewEngine variants without coupling them
 * to specific data hooks. This maintains the decoupling of the ViewEngine
 * from the data layer while enabling interactive functionality.
 * 
 * @module engine/context/EngineActionsContext
 */

import { createContext, useContext, ReactNode, useMemo, useCallback } from 'react'
import { Resource } from '@/types/database'
import type { Node } from '../types/node'

// =============================================================================
// CONTEXT DEFINITION
// =============================================================================

/**
 * Actions available to ViewEngine variants
 */
export interface EngineActionsValue {
  /** The root ID of the current context (e.g., household.todos root folder) */
  rootId: string | null

  /** Current parent ID for navigation/creation context */
  currentParentId: string | null

  /** Open the create form for a new resource */
  onOpenCreateForm: (type: 'folder' | 'task', parentId: string) => void

  /** Navigate into a folder/container */
  onNavigateInto: (nodeId: string, nodeTitle: string, nodePath: string) => void

  /** Open context menu for a resource */
  onOpenContextMenu: (e: React.MouseEvent | React.TouchEvent, resource: Resource) => void

  /** Cycle resource status (active → completed → archived) */
  onCycleStatus: (resource: Resource) => void

  /** Convert a Node to a minimal Resource for mutation hooks */
  nodeToResource: (node: Node) => Resource
}

const EngineActionsContext = createContext<EngineActionsValue | null>(null)

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export interface EngineActionsProviderProps {
  /** Root ID of the context */
  rootId: string | null

  /** Current parent ID */
  currentParentId: string | null

  /** Callback when create form should open */
  onOpenCreateForm: (type: 'folder' | 'task', parentId: string) => void

  /** Callback when navigating into a folder */
  onNavigateInto: (nodeId: string, nodeTitle: string, nodePath: string) => void

  /** Callback when context menu should open */
  onOpenContextMenu: (e: React.MouseEvent | React.TouchEvent, resource: Resource) => void

  /** Callback when cycling status */
  onCycleStatus: (resource: Resource) => void

  /** Child components */
  children: ReactNode
}

/**
 * Helper function to reconstruct a minimal Resource from a Node
 * This allows variants to work with Node data while mutations need Resource format
 */
function createNodeToResourceMapper(rootId: string | null) {
  return (node: Node): Resource => {
    const metadata = node.metadata as Record<string, unknown>

    return {
      id: node.id,
      user_id: '', // Will be filled by mutation hook
      household_id: null,
      parent_id: (metadata.parent_id as string) || rootId,
      path: (metadata.path as string) || 'root',
      type: node.type === 'container' ? 'folder' :
        node.type === 'collection' ? 'project' : 'task',
      title: node.title,
      description: (metadata.description as string) || null,
      status: (metadata.status as 'active' | 'completed' | 'archived') || 'active',
      meta_data: metadata,
      is_schedulable: !!(metadata.scheduled_at),
      scheduled_at: (metadata.scheduled_at as string) || null,
      created_at: (metadata.created_at as string) || new Date().toISOString(),
      updated_at: (metadata.updated_at as string) || new Date().toISOString(),
      deleted_at: null,
      created_by: null,
      pointer_table: (metadata.pointer_table as string) || null,
      pointer_id: (metadata.pointer_id as string) || null,
      duration_minutes: (metadata.duration_minutes as number) || 0,
    }
  }
}

/**
 * Provides action callbacks to ViewEngine variants
 */
export function EngineActionsProvider({
  rootId,
  currentParentId,
  onOpenCreateForm,
  onNavigateInto,
  onOpenContextMenu,
  onCycleStatus,
  children,
}: EngineActionsProviderProps) {
  const nodeToResource = useMemo(
    () => createNodeToResourceMapper(rootId),
    [rootId]
  )

  const value = useMemo<EngineActionsValue>(
    () => ({
      rootId,
      currentParentId,
      onOpenCreateForm,
      onNavigateInto,
      onOpenContextMenu,
      onCycleStatus,
      nodeToResource,
    }),
    [rootId, currentParentId, onOpenCreateForm, onNavigateInto, onOpenContextMenu, onCycleStatus, nodeToResource]
  )

  return (
    <EngineActionsContext.Provider value={value}>
      {children}
    </EngineActionsContext.Provider>
  )
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Access engine actions from within a variant component.
 * Returns null if not within an EngineActionsProvider (for sandbox/testing).
 * 
 * @example
 * function MyVariant({ node }) {
 *   const actions = useEngineActions()
 *   
 *   const handleClick = () => {
 *     if (actions) {
 *       actions.onNavigateInto(node.id, node.title, node.metadata.path)
 *     }
 *   }
 *   
 *   return <div onClick={handleClick}>{node.title}</div>
 * }
 */
export function useEngineActions(): EngineActionsValue | null {
  return useContext(EngineActionsContext)
}

/**
 * Access engine actions with a fallback for when actions are not available.
 * Useful for variants that need to work both in live and sandbox modes.
 * 
 * @example
 * function MyVariant({ node }) {
 *   const { onNavigateInto, isInteractive } = useEngineActionsWithFallback()
 *   
 *   return (
 *     <div 
 *       onClick={() => isInteractive && onNavigateInto(node.id, node.title, '')}
 *       style={{ cursor: isInteractive ? 'pointer' : 'default' }}
 *     >
 *       {node.title}
 *     </div>
 *   )
 * }
 */
export function useEngineActionsWithFallback() {
  const actions = useEngineActions()

  const noOp = useCallback(() => { }, [])
  const noOpContextMenu = useCallback((_e: React.MouseEvent | React.TouchEvent, _r: Resource) => { }, [])
  const noOpCreateForm = useCallback((_t: 'folder' | 'task', _p: string) => { }, [])
  const noOpNavigate = useCallback((_id: string, _title: string, _path: string) => { }, [])
  const noOpCycleStatus = useCallback((_r: Resource) => { }, [])
  const defaultNodeToResource = useMemo(() => createNodeToResourceMapper(null), [])

  if (actions) {
    return {
      ...actions,
      isInteractive: true,
    }
  }

  return {
    rootId: null,
    currentParentId: null,
    onOpenCreateForm: noOpCreateForm,
    onNavigateInto: noOpNavigate,
    onOpenContextMenu: noOpContextMenu,
    onCycleStatus: noOpCycleStatus,
    nodeToResource: defaultNodeToResource,
    isInteractive: false,
  }
}
