/**
 * useBackButton - Push/Pop History-Based Back Navigation
 * 
 * ARCHITECTURE (PWA-friendly, Android-compatible):
 * 1. When something opens (modal, drawer, etc.), PUSH a history entry
 * 2. When back is pressed, popstate fires and we close based on state
 * 3. When closing programmatically (X button), call history.back()
 * 
 * WHY THIS WORKS ON ANDROID:
 * - Android back button only triggers popstate if there's history to pop
 * - With sentinel-only approach, Android exits immediately (no history to pop)
 * - With push/pop, there's always a history entry to pop, triggering popstate
 * 
 * USAGE:
 * 1. Call pushBackState() when opening a modal/sheet
 * 2. Call history.back() when closing (or popBackState() helper)
 * 3. The popstate listener will call your registered handler
 * 
 * FALLBACK HANDLERS:
 * For components that don't push history (like the drawer closing),
 * fallback handlers can still be registered and will be called
 * when nothing was popped from the stack.
 * 
 * @module hooks/useBackButton
 */

import { useEffect, useRef } from 'react'

// =============================================================================
// TYPES
// =============================================================================

interface BackState {
  lifeos: true
  type: string
  id: string
  timestamp: number
}

interface BackHandler {
  id: string
  priority: number
  handler: () => boolean
  /** If true, this handler uses push/pop pattern */
  usesHistory?: boolean
}

// =============================================================================
// GLOBAL STATE
// =============================================================================

/** Track what we've pushed to history */
const historyStack: BackState[] = []

/** Map of state IDs to close handlers */
const closeHandlers = new Map<string, () => void>()

/** Fallback handlers for things that don't use history (sorted by priority) */
const fallbackHandlers: BackHandler[] = []

/** Flag to prevent double initialization */
let initialized = false

/** Flag to prevent processing popstate during programmatic back() */
let isPopstateFromBackCall = false

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Push a history state when opening something (modal, sheet, etc.)
 * 
 * @param type - Type of UI element (e.g., 'modal', 'sheet', 'drawer')
 * @param id - Unique identifier for this element
 * @param onClose - Handler to call when back is pressed
 * 
 * @example
 * // When opening a modal:
 * useEffect(() => {
 *   if (isOpen) {
 *     pushBackState('modal', 'my-modal', handleClose)
 *   }
 * }, [isOpen])
 */
export function pushBackState(type: string, id: string, onClose: () => void): void {
  const state: BackState = {
    lifeos: true,
    type,
    id,
    timestamp: Date.now()
  }
  
  try {
    history.pushState(state, '')
    historyStack.push(state)
    closeHandlers.set(id, onClose)
    console.log(`[BackButton] Pushed: ${type}/${id} (stack size: ${historyStack.length})`)
  } catch (error) {
    console.error('[BackButton] Failed to push state:', error)
  }
}

/**
 * Remove a state from tracking (for programmatic close without back)
 * Call this when closing via X button or backdrop click
 * 
 * @param id - The ID that was used when pushing
 */
export function popBackState(id: string): void {
  const idx = historyStack.findIndex(s => s.id === id)
  if (idx >= 0) {
    isPopstateFromBackCall = true
    history.back()
    // Note: The actual removal from historyStack happens in popstate handler
    console.log(`[BackButton] Popping via history.back(): ${id}`)
  } else {
    // Not in our stack, just remove the handler
    closeHandlers.delete(id)
    console.log(`[BackButton] Not in stack, just removed handler: ${id}`)
  }
}

/**
 * Check if a state is in the history stack
 */
export function isInHistoryStack(id: string): boolean {
  return historyStack.some(s => s.id === id)
}

/**
 * Get the current stack size (for debugging)
 */
export function getHistoryStackSize(): number {
  return historyStack.length
}

/**
 * Register a fallback handler (for things that don't use push/pop)
 * These are called when popstate has no matching state or no state at all
 */
export function registerFallbackHandler(id: string, priority: number, handler: () => boolean): void {
  // Remove existing handler with same id
  const existingIndex = fallbackHandlers.findIndex(h => h.id === id)
  if (existingIndex >= 0) {
    fallbackHandlers.splice(existingIndex, 1)
  }
  
  fallbackHandlers.push({ id, priority, handler })
  fallbackHandlers.sort((a, b) => b.priority - a.priority) // Higher priority first
}

/**
 * Unregister a fallback handler
 */
export function unregisterFallbackHandler(id: string): void {
  const index = fallbackHandlers.findIndex(h => h.id === id)
  if (index >= 0) {
    fallbackHandlers.splice(index, 1)
  }
}

// =============================================================================
// POPSTATE HANDLER
// =============================================================================

function handlePopState(event: PopStateEvent): void {
  console.log('[BackButton] popstate event:', event.state)
  
  const state = event.state as BackState | null
  
  // Check if this is one of our pushed states
  if (state?.lifeos && state?.id) {
    // Remove from our tracking stack
    const idx = historyStack.findIndex(s => s.id === state.id)
    if (idx >= 0) {
      historyStack.splice(idx, 1)
      console.log(`[BackButton] Removed from stack: ${state.id} (remaining: ${historyStack.length})`)
    }
    
    // Call the close handler
    const closeHandler = closeHandlers.get(state.id)
    if (closeHandler) {
      console.log(`[BackButton] Calling close handler for: ${state.id}`)
      closeHandler()
      closeHandlers.delete(state.id)
    }
    
    isPopstateFromBackCall = false
    return
  }
  
  // No matching state - this could be:
  // 1. Initial app load navigation
  // 2. Something we didn't push
  // 3. User navigated way back
  
  // If we still have items in our stack that weren't in history, clean them up
  if (historyStack.length > 0) {
    // Pop the most recent item from our stack
    const topItem = historyStack.pop()
    if (topItem) {
      console.log(`[BackButton] Stack cleanup - popping: ${topItem.id}`)
      const closeHandler = closeHandlers.get(topItem.id)
      if (closeHandler) {
        closeHandler()
        closeHandlers.delete(topItem.id)
      }
    }
    isPopstateFromBackCall = false
    return
  }
  
  // Nothing in our stack - call fallback handlers
  console.log('[BackButton] No stack items, trying fallback handlers')
  for (const { handler, id } of fallbackHandlers) {
    try {
      if (handler()) {
        console.log(`[BackButton] Fallback handler handled: ${id}`)
        isPopstateFromBackCall = false
        return
      }
    } catch (error) {
      console.error(`[BackButton] Fallback handler error: ${id}`, error)
    }
  }
  
  // If we get here, nothing handled the back - we should push a new base state
  // to prevent the app from exiting on the next back press
  console.log('[BackButton] Nothing handled back, re-establishing base state')
  try {
    history.pushState({ lifeos: true, type: 'base', id: 'base', timestamp: Date.now() }, '')
  } catch (error) {
    console.error('[BackButton] Failed to push base state:', error)
  }
  
  isPopstateFromBackCall = false
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the back button system
 * Call this once from the root Layout component
 */
export function initBackNavigation(): void {
  if (initialized) {
    console.log('[BackButton] Already initialized')
    return
  }
  initialized = true
  
  // Push an initial base state so there's always something in history
  try {
    history.replaceState({ lifeos: true, type: 'base', id: 'base', timestamp: Date.now() }, '')
    console.log('[BackButton] Initialized with base state')
  } catch (error) {
    console.error('[BackButton] Failed to set base state:', error)
  }
  
  // Listen for popstate
  window.addEventListener('popstate', handlePopState)
}

/**
 * Check if initialized (for debugging)
 */
export function isBackNavigationInitialized(): boolean {
  return initialized
}

// =============================================================================
// REACT HOOK (Backward-compatible API)
// =============================================================================

interface UseBackButtonOptions {
  /** Unique identifier for this handler */
  id?: string
  
  /** 
   * NEW API: Handler to call when back is pressed (simpler)
   * Use with pushHistory: true (default) for modals
   */
  onClose?: () => void
  
  /**
   * LEGACY API: Handler that returns true if it handled the back action
   * This registers as a fallback handler (no history push)
   */
  handler?: () => boolean
  
  /** 
   * Priority for fallback handlers (legacy API).
   * Higher priority = called first. Default: 10
   */
  priority?: number
  
  /** 
   * If true, pushes history state on mount (for modals).
   * Requires onClose. Default: false for backward compatibility.
   */
  pushHistory?: boolean
}

/**
 * Hook for registering back button handling
 * 
 * LEGACY API (fallback handlers):
 * @example
 * useBackButton({
 *   id: 'my-component',
 *   priority: 30,
 *   handler: () => {
 *     if (isOpen) { close(); return true }
 *     return false
 *   }
 * })
 * 
 * NEW API (push/pop history - recommended for modals):
 * @example
 * useBackButton({
 *   id: 'my-modal',
 *   onClose: handleClose,
 *   pushHistory: true,
 * })
 */
export function useBackButton(options?: UseBackButtonOptions): void {
  // Handle legacy call with no options
  if (!options) return
  
  const { id, onClose, handler, priority = 10, pushHistory = false } = options
  
  // Generate a stable ID if not provided
  const idRef = useRef(id || `handler-${Math.random().toString(36).substring(2, 11)}`)
  
  // Store handlers in refs to always have the latest
  const onCloseRef = useRef(onClose)
  const handlerRef = useRef(handler)
  onCloseRef.current = onClose
  handlerRef.current = handler

  useEffect(() => {
    const handlerId = idRef.current
    
    // NEW API: Push history on mount (for modals)
    if (pushHistory && onCloseRef.current) {
      pushBackState('hook', handlerId, () => onCloseRef.current?.())
      
      // On unmount, clean up if still in stack
      return () => {
        if (isInHistoryStack(handlerId)) {
          const idx = historyStack.findIndex(s => s.id === handlerId)
          if (idx >= 0) {
            historyStack.splice(idx, 1)
          }
          closeHandlers.delete(handlerId)
          console.log(`[BackButton] Cleanup on unmount: ${handlerId}`)
        }
      }
    }
    
    // LEGACY API: Register as fallback handler
    if (handlerRef.current) {
      registerFallbackHandler(handlerId, priority, () => {
        return handlerRef.current?.() ?? false
      })
      
      return () => {
        unregisterFallbackHandler(handlerId)
      }
    }
    
    // NEW API with onClose but no pushHistory: register as fallback
    if (onCloseRef.current && !pushHistory) {
      registerFallbackHandler(handlerId, priority, () => {
        onCloseRef.current?.()
        return true
      })
      
      return () => {
        unregisterFallbackHandler(handlerId)
      }
    }
  }, [priority, pushHistory])
}

// =============================================================================
// LEGACY COMPATIBILITY
// =============================================================================

/**
 * @deprecated Use useBackButton hook instead
 * This is kept for backward compatibility during migration
 */
export function registerBackHandler(id: string, priority: number, handler: () => boolean): void {
  registerFallbackHandler(id, priority, handler)
}

/**
 * @deprecated Use useBackButton hook instead
 */
export function unregisterBackHandler(id: string): void {
  unregisterFallbackHandler(id)
}

/**
 * @deprecated No longer needed - back is handled via popstate
 */
export function handleBackPress(): boolean {
  // Call fallback handlers if anything is registered
  for (const { handler, id } of fallbackHandlers) {
    try {
      if (handler()) {
        console.log(`[BackButton] Legacy handleBackPress handled by: ${id}`)
        return true
      }
    } catch (error) {
      console.error(`[BackButton] Handler error: ${id}`, error)
    }
  }
  return false
}

export default useBackButton
