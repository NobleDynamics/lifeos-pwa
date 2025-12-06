/**
 * SiblingsContext - Share sibling nodes between view and card components
 * 
 * This context allows view components (like view_grid_fixed) to provide 
 * a list of sibling nodes that card components (like card_media_thumbnail) 
 * can use for navigation (e.g., lightbox swipe navigation).
 * 
 * @module engine/context/SiblingsContext
 */

import { createContext, useContext, ReactNode, useMemo } from 'react'
import type { Node } from '../types/node'

// =============================================================================
// TYPES
// =============================================================================

export interface SiblingsContextValue {
  /** All sibling nodes in the current container */
  siblings: Node[]
  /** Helper to find current node's index */
  getIndex: (nodeId: string) => number
}

// =============================================================================
// CONTEXT
// =============================================================================

const SiblingsContext = createContext<SiblingsContextValue | null>(null)

// =============================================================================
// PROVIDER
// =============================================================================

export interface SiblingsProviderProps {
  /** The sibling nodes to share */
  siblings: Node[]
  /** Child components */
  children: ReactNode
}

/**
 * Provides sibling nodes to child components
 * 
 * @example
 * // In a view component:
 * <SiblingsProvider siblings={mediaNodes}>
 *   {renderChildren(children, childStyle)}
 * </SiblingsProvider>
 */
export function SiblingsProvider({ siblings, children }: SiblingsProviderProps) {
  const value = useMemo<SiblingsContextValue>(() => ({
    siblings,
    getIndex: (nodeId: string) => siblings.findIndex(s => s.id === nodeId),
  }), [siblings])

  return (
    <SiblingsContext.Provider value={value}>
      {children}
    </SiblingsContext.Provider>
  )
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Get sibling nodes from context
 * Returns null if not within a SiblingsProvider
 * 
 * @example
 * const siblings = useSiblings()
 * if (siblings) {
 *   const { siblings: siblingsArray, getIndex } = siblings
 *   const myIndex = getIndex(node.id)
 * }
 */
export function useSiblings(): SiblingsContextValue | null {
  return useContext(SiblingsContext)
}

/**
 * Get sibling nodes with a fallback for when context is not available
 * Returns just the current node as a single-item array if no context
 * 
 * @example
 * const { siblings, currentIndex } = useSiblingsWithFallback(node)
 */
export function useSiblingsWithFallback(currentNode: Node): {
  siblings: Node[]
  currentIndex: number
} {
  const context = useSiblings()
  
  if (context) {
    return {
      siblings: context.siblings,
      currentIndex: context.getIndex(currentNode.id),
    }
  }
  
  // Fallback: just the current node
  return {
    siblings: [currentNode],
    currentIndex: 0,
  }
}
