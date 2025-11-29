/**
 * useRenderChildren Hook
 * 
 * Provides a convenient way for variant components to render their children
 * without manually passing depth and rootId parameters.
 * 
 * @module engine/components/hooks/useRenderChildren
 */

import { useCallback } from 'react'
import { useNode } from '../../context/NodeContext'
import { renderChildren } from '../ViewEngine'

/**
 * Hook that returns a function to render the current node's children.
 * Automatically uses the current node context for depth and rootId.
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
export function useRenderChildren() {
  const { node, depth, rootId } = useNode()
  
  return useCallback(() => {
    return renderChildren(node, depth, rootId)
  }, [node, depth, rootId])
}
