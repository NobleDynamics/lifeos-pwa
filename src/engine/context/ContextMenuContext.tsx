/**
 * ContextMenuContext - Global Context Menu State Management
 * 
 * Provides a global context for managing context menu visibility and configuration.
 * This enables metadata-driven context menus following the "Generic Engine" philosophy.
 * 
 * Usage:
 * 1. Wrap your app with ContextMenuProvider
 * 2. Use useContextMenu() hook to show/hide context menu
 * 3. ContextMenuSheet component reads from this context
 * 
 * @module engine/context/ContextMenuContext
 */

import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react'
import type { Node } from '../types/node'
import type { ContextMenuConfig, ContextMenuOption } from '../types/actions'

// =============================================================================
// TYPES
// =============================================================================

export interface ContextMenuState {
  /** Whether the context menu is visible */
  isOpen: boolean
  
  /** The node the context menu is for */
  node: Node | null
  
  /** The parent node (for inheriting context menu config) */
  parentNode: Node | null
  
  /** Resolved context menu configuration */
  config: ContextMenuConfig | null
  
  /** Position for floating menu (desktop) */
  position: { x: number; y: number } | null
}

export interface ContextMenuContextValue {
  /** Current context menu state */
  state: ContextMenuState
  
  /** 
   * Show context menu for a node 
   * @param node - The node to show context menu for
   * @param parentNode - The parent node (for inheriting child_context_menu)
   * @param position - Optional position for floating menu (desktop)
   */
  showContextMenu: (node: Node, parentNode?: Node | null, position?: { x: number; y: number }) => void
  
  /** Hide the context menu */
  hideContextMenu: () => void
  
  /** Handle an option click (calls action handler and closes menu) */
  handleOptionClick: (option: ContextMenuOption) => void
  
  /** Register action handlers for context menu actions */
  registerHandlers: (handlers: ContextMenuHandlers) => void
}

/**
 * Handlers for context menu actions.
 * These are provided by ViewEnginePane to connect actions to the data layer.
 */
export interface ContextMenuHandlers {
  /** Called when 'edit' action is selected */
  onEdit?: (node: Node, option: ContextMenuOption) => void
  
  /** Called when 'delete' action is selected */
  onDelete?: (node: Node, option: ContextMenuOption) => void
  
  /** Called when 'move' action is selected */
  onMove?: (node: Node, option: ContextMenuOption) => void
  
  /** Called when 'move_to_column' action is selected (Kanban) */
  onMoveToColumn?: (node: Node, option: ContextMenuOption) => void
  
  /** Called when 'navigate' action is selected */
  onNavigate?: (node: Node, option: ContextMenuOption) => void
  
  /** Called when 'custom' action is selected */
  onCustom?: (node: Node, option: ContextMenuOption) => void
}

// =============================================================================
// CONTEXT
// =============================================================================

const ContextMenuContext = createContext<ContextMenuContextValue | null>(null)

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Resolve the context menu configuration for a node.
 * Resolution order:
 * 1. Item-level: node.metadata.context_menu
 * 2. Parent-level: parentNode.metadata.child_context_menu
 * 3. Default: null (no context menu)
 */
function resolveContextMenuConfig(node: Node, parentNode: Node | null): ContextMenuConfig | null {
  // Check item-level first
  const itemConfig = node.metadata?.context_menu as ContextMenuConfig | undefined
  if (itemConfig?.options && itemConfig.options.length > 0) {
    return itemConfig
  }
  
  // Check parent-level
  const parentConfig = parentNode?.metadata?.child_context_menu as ContextMenuConfig | undefined
  if (parentConfig?.options && parentConfig.options.length > 0) {
    return parentConfig
  }
  
  // No config found
  return null
}

// =============================================================================
// PROVIDER
// =============================================================================

interface ContextMenuProviderProps {
  children: ReactNode
}

export function ContextMenuProvider({ children }: ContextMenuProviderProps) {
  const [state, setState] = useState<ContextMenuState>({
    isOpen: false,
    node: null,
    parentNode: null,
    config: null,
    position: null,
  })
  
  const [handlers, setHandlers] = useState<ContextMenuHandlers>({})
  
  const showContextMenu = useCallback((
    node: Node,
    parentNode: Node | null = null,
    position?: { x: number; y: number }
  ) => {
    const config = resolveContextMenuConfig(node, parentNode)
    
    // Only show if we have a config with options
    if (!config || config.options.length === 0) {
      console.log('[ContextMenu] No config found for node:', node.id)
      return
    }
    
    setState({
      isOpen: true,
      node,
      parentNode,
      config,
      position: position || null,
    })
  }, [])
  
  const hideContextMenu = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false,
    }))
  }, [])
  
  const handleOptionClick = useCallback((option: ContextMenuOption) => {
    const { node } = state
    if (!node) return
    
    // Hide menu first
    hideContextMenu()
    
    // Call appropriate handler based on action_type
    switch (option.action_type) {
      case 'edit':
        handlers.onEdit?.(node, option)
        break
      case 'delete':
        handlers.onDelete?.(node, option)
        break
      case 'move':
        handlers.onMove?.(node, option)
        break
      case 'move_to_column':
        handlers.onMoveToColumn?.(node, option)
        break
      case 'navigate':
        handlers.onNavigate?.(node, option)
        break
      case 'custom':
        handlers.onCustom?.(node, option)
        break
    }
  }, [state, handlers, hideContextMenu])
  
  const registerHandlers = useCallback((newHandlers: ContextMenuHandlers) => {
    setHandlers(prev => ({ ...prev, ...newHandlers }))
  }, [])
  
  const value = useMemo<ContextMenuContextValue>(() => ({
    state,
    showContextMenu,
    hideContextMenu,
    handleOptionClick,
    registerHandlers,
  }), [state, showContextMenu, hideContextMenu, handleOptionClick, registerHandlers])
  
  return (
    <ContextMenuContext.Provider value={value}>
      {children}
    </ContextMenuContext.Provider>
  )
}

// =============================================================================
// HOOKS
// =============================================================================

/**
 * Access context menu state and actions.
 * 
 * @example
 * const { showContextMenu, hideContextMenu, state } = useContextMenu()
 * 
 * // Show context menu on long press
 * const handlers = useLongPress({
 *   onLongPress: (e) => showContextMenu(node, parentNode, { x: e.clientX, y: e.clientY })
 * })
 */
export function useContextMenu() {
  const context = useContext(ContextMenuContext)
  
  if (!context) {
    // Return no-op defaults when outside provider (for sandbox/testing)
    return {
      state: {
        isOpen: false,
        node: null,
        parentNode: null,
        config: null,
        position: null,
      } as ContextMenuState,
      showContextMenu: () => {},
      hideContextMenu: () => {},
      handleOptionClick: () => {},
      registerHandlers: () => {},
    }
  }
  
  return context
}

/**
 * Hook for variants to get context menu trigger handler.
 * Returns a function that can be called with the long press event.
 * 
 * @param node - The node to show context menu for
 * @param parentNode - Optional parent node for inherited config
 * 
 * @example
 * const triggerContextMenu = useContextMenuTrigger(node, parentNode)
 * 
 * const longPressHandlers = useLongPress({
 *   onLongPress: (e) => triggerContextMenu(e.clientX, e.clientY)
 * })
 */
export function useContextMenuTrigger(node: Node, parentNode: Node | null = null) {
  const { showContextMenu } = useContextMenu()
  
  return useCallback((x: number, y: number) => {
    showContextMenu(node, parentNode, { x, y })
  }, [node, parentNode, showContextMenu])
}

export default ContextMenuProvider
