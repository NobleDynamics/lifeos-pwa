/**
 * ViewEngine - Recursive Node Renderer
 * 
 * The core rendering component that traverses a Node tree and renders
 * each node using the appropriate variant component from the registry.
 * 
 * @module engine/components/ViewEngine
 */

import { memo } from 'react'
import type { Node } from '../types/node'
import { resolveVariant } from '../registry'
import { NodeProvider } from '../context/NodeContext'

// =============================================================================
// VIEW ENGINE
// =============================================================================

export interface ViewEngineProps {
  /** The root node of the tree to render */
  root: Node
  /** Optional CSS class name for the container */
  className?: string
}

/**
 * ViewEngine - Renders a Node tree recursively.
 * 
 * The engine:
 * 1. Takes a root Node as input
 * 2. Resolves each node to its variant component via the registry
 * 3. Wraps each node in a NodeProvider for context access
 * 4. Recursively renders children
 * 
 * @example
 * <ViewEngine root={myNodeTree} className="my-tree" />
 */
export function ViewEngine({ root, className }: ViewEngineProps) {
  return (
    <div className={className} data-engine-root={root.id}>
      <NodeRenderer node={root} depth={0} rootId={root.id} />
    </div>
  )
}

// =============================================================================
// NODE RENDERER (Internal)
// =============================================================================

interface NodeRendererProps {
  node: Node
  depth: number
  rootId: string
  parentId?: string
}

/**
 * Internal component that renders a single node and its context.
 * Memoized to prevent unnecessary re-renders when sibling nodes change.
 */
const NodeRenderer = memo(function NodeRenderer({
  node,
  depth,
  rootId,
  parentId,
}: NodeRendererProps) {
  // Resolve the variant component from the registry
  const Component = resolveVariant(node)
  
  return (
    <NodeProvider
      node={node}
      depth={depth}
      parentId={parentId ?? null}
      rootId={rootId}
    >
      <Component node={node} />
    </NodeProvider>
  )
})

// =============================================================================
// CHILD RENDERING HELPER
// =============================================================================

/**
 * Helper function for variant components to render their children.
 * Call this from within a variant component to render nested nodes.
 * 
 * @param node - The current node (typically from useNode() or props)
 * @param depth - Current depth level
 * @param rootId - Root node ID of the tree
 * @returns Array of rendered child nodes, or null if no children
 * 
 * @example
 * function ContainerStack({ node }: VariantComponentProps) {
 *   const { depth, rootId } = useNode()
 *   return (
 *     <div className="container">
 *       <h3>{node.title}</h3>
 *       <div className="children">
 *         {renderChildren(node, depth, rootId)}
 *       </div>
 *     </div>
 *   )
 * }
 */
export function renderChildren(
  node: Node,
  depth: number,
  rootId: string
): React.ReactNode {
  if (!node.children || node.children.length === 0) {
    return null
  }
  
  return node.children.map((child) => (
    <NodeRenderer
      key={child.id}
      node={child}
      depth={depth + 1}
      rootId={rootId}
      parentId={node.id}
    />
  ))
}

/**
 * Hook-based helper for rendering children from within a variant component.
 * Uses the current node context to get depth and rootId automatically.
 * 
 * @returns A function that renders children of the current node
 * 
 * @example
 * function ContainerStack({ node }: VariantComponentProps) {
 *   const renderMyChildren = useRenderChildren()
 *   return (
 *     <div className="container">
 *       <h3>{node.title}</h3>
 *       {renderMyChildren()}
 *     </div>
 *   )
 * }
 */
export { useRenderChildren } from './hooks/useRenderChildren'
