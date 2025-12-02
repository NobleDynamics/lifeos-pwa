/**
 * ShellNavigationContext - Navigation state for Persistent Shell Architecture
 * 
 * This context allows the App Shell to know:
 * 1. Which node the user has drilled into (targetNodeId)
 * 2. Which bottom tab should be active (even when deep in a subtree)
 * 3. Navigation callbacks for drilling in/out
 * 
 * @module engine/context/ShellNavigationContext
 */

import { createContext, useContext, ReactNode, useCallback, useMemo } from 'react'
import type { Node } from '../types/node'

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Find the path from root to a target node.
 * Returns an array of node IDs from root to target (inclusive).
 * Returns null if the target is not found.
 */
export function findPathToNode(root: Node, targetId: string): string[] | null {
  if (root.id === targetId) {
    return [root.id]
  }

  if (!root.children) {
    return null
  }

  for (const child of root.children) {
    const childPath = findPathToNode(child, targetId)
    if (childPath) {
      return [root.id, ...childPath]
    }
  }

  return null
}

/**
 * Find a node by ID in the tree.
 */
export function findNodeInTree(root: Node, targetId: string): Node | null {
  if (root.id === targetId) {
    return root
  }

  if (!root.children) {
    return null
  }

  for (const child of root.children) {
    const found = findNodeInTree(child, targetId)
    if (found) {
      return found
    }
  }

  return null
}

/**
 * Determine which direct child of a parent contains the target node.
 * This is used to figure out which Tab is "active" when the user has drilled
 * deep into a subtree.
 * 
 * @param parent - The parent node (e.g., the App Shell)
 * @param targetId - The ID of the currently viewed node
 * @returns The ID of the direct child that contains targetId, or null
 */
export function findContainingChild(parent: Node, targetId: string): string | null {
  if (!parent.children) {
    return null
  }

  // If targetId is a direct child, return it
  const directChild = parent.children.find(c => c.id === targetId)
  if (directChild) {
    return directChild.id
  }

  // Otherwise, search each child's subtree
  for (const child of parent.children) {
    const path = findPathToNode(child, targetId)
    if (path) {
      return child.id
    }
  }

  return null
}

// =============================================================================
// CONTEXT TYPES
// =============================================================================

interface ShellNavigationContextValue {
  /** The ID of the node currently being viewed (may be deep in the tree) */
  targetNodeId: string | null
  
  /** The path from root to the target node */
  targetPath: string[]
  
  /** Navigate into a child node */
  navigateToNode: (nodeId: string) => void
  
  /** Navigate back to parent */
  navigateBack: () => void
  
  /** Navigate to a specific level in the path */
  navigateToLevel: (index: number) => void
  
  /** Check if we can navigate back */
  canNavigateBack: boolean
  
  /** The root node of the tree (App Shell) */
  rootNode: Node | null
}

const ShellNavigationContext = createContext<ShellNavigationContextValue | null>(null)

// =============================================================================
// PROVIDER
// =============================================================================

interface ShellNavigationProviderProps {
  children: ReactNode
  /** The root node (App Shell) */
  rootNode: Node | null
  /** Current target node ID */
  targetNodeId: string | null
  /** Callback when navigation changes */
  onNavigate: (nodeId: string | null, path: string[]) => void
}

export function ShellNavigationProvider({
  children,
  rootNode,
  targetNodeId,
  onNavigate,
}: ShellNavigationProviderProps) {
  // Calculate the path from root to target
  const targetPath = useMemo(() => {
    if (!rootNode || !targetNodeId) {
      return rootNode ? [rootNode.id] : []
    }
    const path = findPathToNode(rootNode, targetNodeId)
    return path || [rootNode.id]
  }, [rootNode, targetNodeId])

  const navigateToNode = useCallback((nodeId: string) => {
    if (!rootNode) return
    const newPath = findPathToNode(rootNode, nodeId)
    if (newPath) {
      onNavigate(nodeId, newPath)
    }
  }, [rootNode, onNavigate])

  const navigateBack = useCallback(() => {
    if (targetPath.length <= 1) {
      // Already at root, can't go back
      return
    }
    // Go to parent (second-to-last in path)
    const parentId = targetPath[targetPath.length - 2]
    const parentPath = targetPath.slice(0, -1)
    onNavigate(parentId, parentPath)
  }, [targetPath, onNavigate])

  const navigateToLevel = useCallback((index: number) => {
    if (index < 0 || index >= targetPath.length) return
    const nodeId = targetPath[index]
    const newPath = targetPath.slice(0, index + 1)
    onNavigate(nodeId, newPath)
  }, [targetPath, onNavigate])

  // Can navigate back if we're deeper than the root
  const canNavigateBack = targetPath.length > 1

  const value: ShellNavigationContextValue = {
    targetNodeId,
    targetPath,
    navigateToNode,
    navigateBack,
    navigateToLevel,
    canNavigateBack,
    rootNode,
  }

  return (
    <ShellNavigationContext.Provider value={value}>
      {children}
    </ShellNavigationContext.Provider>
  )
}

// =============================================================================
// HOOK
// =============================================================================

export function useShellNavigation() {
  const context = useContext(ShellNavigationContext)
  if (!context) {
    // Return a no-op default for components outside the shell
    return {
      targetNodeId: null,
      targetPath: [],
      navigateToNode: () => {},
      navigateBack: () => {},
      navigateToLevel: () => {},
      canNavigateBack: false,
      rootNode: null,
    }
  }
  return context
}
