/**
 * Node Context Provider
 * 
 * Provides node data to descendant components without prop drilling.
 * Each node in the tree gets its own context scope, allowing children
 * to access their parent node's data, depth level, and root information.
 * 
 * @module engine/context/NodeContext
 */

import { createContext, useContext, ReactNode, useMemo } from 'react'
import type { Node } from '../types/node'

// =============================================================================
// CONTEXT DEFINITION
// =============================================================================

/**
 * Context value available to all nodes in the tree
 */
export interface NodeContextValue {
  /** The current node being rendered */
  node: Node
  
  /** Depth level in the tree (0 = root) */
  depth: number
  
  /** ID of the parent node (null for root) */
  parentId: string | null
  
  /** ID of the root node in this tree */
  rootId: string
}

const NodeContext = createContext<NodeContextValue | null>(null)

// =============================================================================
// PROVIDER COMPONENT
// =============================================================================

export interface NodeProviderProps {
  /** The node to provide to descendants */
  node: Node
  
  /** Current depth level (default: 0) */
  depth?: number
  
  /** Parent node ID (default: null) */
  parentId?: string | null
  
  /** Root node ID of the tree */
  rootId: string
  
  /** Child components */
  children: ReactNode
}

/**
 * Provides node context to child components.
 * Wrap each node's rendered output with this provider.
 */
export function NodeProvider({
  node,
  depth = 0,
  parentId = null,
  rootId,
  children,
}: NodeProviderProps) {
  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<NodeContextValue>(
    () => ({
      node,
      depth,
      parentId,
      rootId,
    }),
    [node, depth, parentId, rootId]
  )

  return <NodeContext.Provider value={value}>{children}</NodeContext.Provider>
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Access the current node context.
 * Must be called within a NodeProvider.
 * 
 * @throws Error if called outside of NodeProvider
 * @returns NodeContextValue with node, depth, parentId, and rootId
 * 
 * @example
 * function MyVariant() {
 *   const { node, depth } = useNode()
 *   return <div style={{ marginLeft: depth * 16 }}>{node.title}</div>
 * }
 */
export function useNode(): NodeContextValue {
  const context = useContext(NodeContext)
  
  if (!context) {
    throw new Error(
      'useNode must be used within a NodeProvider. ' +
      'Ensure your variant component is rendered by ViewEngine.'
    )
  }
  
  return context
}

/**
 * Access a specific metadata field from the current node.
 * Provides type-safe access with optional default value.
 * 
 * @param key - The metadata key to access
 * @param defaultValue - Optional default if key is missing
 * @returns The metadata value or undefined/default
 * 
 * @example
 * function TaskRow() {
 *   const status = useNodeMeta<string>('status', 'active')
 *   const priority = useNodeMeta<'low' | 'medium' | 'high'>('priority')
 *   return <div>{status} - {priority ?? 'no priority'}</div>
 * }
 */
export function useNodeMeta<T = unknown>(
  key: string,
  defaultValue?: T
): T | undefined {
  const { node } = useNode()
  const value = node.metadata[key]
  
  if (value === undefined) {
    return defaultValue
  }
  
  return value as T
}

/**
 * Check if the current node is the root of the tree.
 * 
 * @returns true if this node is the root (depth === 0)
 */
export function useIsRoot(): boolean {
  const { depth } = useNode()
  return depth === 0
}

/**
 * Check if the current node has children.
 * 
 * @returns true if the node has at least one child
 */
export function useHasChildren(): boolean {
  const { node } = useNode()
  return Boolean(node.children && node.children.length > 0)
}

/**
 * Get the child count of the current node.
 * 
 * @returns Number of direct children (0 if no children)
 */
export function useChildCount(): number {
  const { node } = useNode()
  return node.children?.length ?? 0
}
