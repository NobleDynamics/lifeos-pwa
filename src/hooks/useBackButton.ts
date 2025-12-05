/**
 * useBackButton - State-First, History-Shimmed Back Navigation
 * 
 * ARCHITECTURE:
 * 1. Single sentinel history entry - we REPLACE, never PUSH
 * 2. popstate is just a trigger that calls handleBackPress()
 * 3. Handler chain reads from Zustand synchronously (no stale state)
 * 4. At Dashboard with nothing to do: trap (re-assert sentinel)
 * 5. Capacitor-ready: handleBackPress() can be called from native back button
 * 
 * PRIORITY SYSTEM:
 * - Higher priority handlers are called first
 * - Each handler returns true if it handled the back action
 * - Once a handler returns true, no further handlers are called
 * 
 * RECOMMENDED PRIORITIES:
 * - 30: Modals, dialogs, overlays (highest)
 * - 20: ViewEnginePane node navigation (folder back)
 * - 15: layout_app_shell tab navigation (tab back)
 * - 0: Layout app-level (drawer close, pane back, dashboard trap)
 * 
 * @module hooks/useBackButton
 */

import { useEffect, useRef, useCallback } from 'react'

// =============================================================================
// TYPES
// =============================================================================

interface BackHandler {
  id: string
  priority: number
  handler: () => boolean
}

// =============================================================================
// GLOBAL STATE (Module-level singletons)
// =============================================================================

/** Sentinel state object for history.replaceState */
const SENTINEL = { lifeos: true }

/** Flag to ensure initialization happens only once */
let initialized = false

/** Registered back handlers, sorted by priority (descending) */
const handlers: BackHandler[] = []

// =============================================================================
// HANDLER REGISTRY
// =============================================================================

/**
 * Register a back button handler
 * @param id - Unique identifier for this handler (used for cleanup)
 * @param priority - Higher priority = called first (30=modal, 20=node, 15=tab, 0=app)
 * @param handler - Function that returns true if it handled the back action
 */
export function registerBackHandler(id: string, priority: number, handler: () => boolean): void {
  // Remove existing handler with same id (idempotent registration)
  const existingIndex = handlers.findIndex(h => h.id === id)
  if (existingIndex >= 0) {
    handlers.splice(existingIndex, 1)
  }
  
  // Add new handler
  handlers.push({ id, priority, handler })
  
  // Sort by priority descending (higher priority first)
  handlers.sort((a, b) => b.priority - a.priority)
}

/**
 * Unregister a back button handler
 * @param id - The id of the handler to remove
 */
export function unregisterBackHandler(id: string): void {
  const index = handlers.findIndex(h => h.id === id)
  if (index >= 0) {
    handlers.splice(index, 1)
  }
}

// =============================================================================
// CORE BACK LOGIC
// =============================================================================

/**
 * Handle a back press event
 * 
 * This is the core function that processes back navigation.
 * It can be called from:
 * - Browser popstate event
 * - Capacitor's App.addListener('backButton', ...)
 * - Programmatically for testing
 * 
 * @returns true if any handler processed the back action, false if none did
 */
export function handleBackPress(): boolean {
  // Call handlers in priority order until one returns true
  for (const { handler, id } of handlers) {
    try {
      if (handler()) {
        // Handler processed the back action
        return true
      }
    } catch (error) {
      console.error(`[useBackButton] Handler "${id}" threw an error:`, error)
      // Continue to next handler
    }
  }
  
  // No handler processed the back action
  // This should rarely happen since app-level handler traps at dashboard
  console.warn('[useBackButton] No handler processed back - this may indicate missing app-level handler')
  return false
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the back navigation system
 * 
 * This should be called once from the root Layout component.
 * It sets up:
 * 1. The sentinel history entry (using replaceState)
 * 2. The global popstate listener
 * 
 * The sentinel approach ensures:
 * - History never grows unboundedly
 * - We never exhaust history entries
 * - Back press is always trapped and handled by our code
 */
export function initBackNavigation(): void {
  if (initialized) {
    return
  }
  initialized = true
  
  // Replace current history state with our sentinel
  // This is our single, permanent history entry
  try {
    window.history.replaceState(SENTINEL, '')
  } catch (error) {
    console.error('[useBackButton] Failed to set initial sentinel:', error)
  }
  
  // Listen for back button (popstate)
  const handlePopState = (_event: PopStateEvent) => {
    // Process the back action
    handleBackPress()
    
    // CRITICAL: Always re-assert the sentinel
    // This ensures we always have a history entry to catch the next back
    try {
      window.history.replaceState(SENTINEL, '')
    } catch (error) {
      console.error('[useBackButton] Failed to re-assert sentinel:', error)
    }
  }
  
  window.addEventListener('popstate', handlePopState)
  
  // Note: We intentionally don't clean up this listener
  // It should persist for the lifetime of the app
}

/**
 * Check if back navigation is initialized
 * Useful for debugging
 */
export function isBackNavigationInitialized(): boolean {
  return initialized
}

/**
 * Get the current handler count
 * Useful for debugging
 */
export function getHandlerCount(): number {
  return handlers.length
}

// =============================================================================
// REACT HOOK
// =============================================================================

interface UseBackButtonOptions {
  /** Unique identifier for this handler (auto-generated if not provided) */
  id?: string
  /** Priority level. Higher = called first. Defaults: 30=modal, 20=node, 15=tab, 0=app */
  priority?: number
  /** Handler function that returns true if it handled the back action */
  handler?: () => boolean
}

/**
 * React hook for registering back button handlers
 * 
 * @example
 * // In a modal component (highest priority)
 * useBackButton({
 *   id: 'my-modal',
 *   priority: 30,
 *   handler: () => {
 *     if (isOpen) {
 *       close()
 *       return true
 *     }
 *     return false
 *   }
 * })
 * 
 * @example
 * // In ViewEnginePane (node/folder navigation)
 * useBackButton({
 *   id: `viewengine:${paneId}`,
 *   priority: 20,
 *   handler: () => useAppStore.getState().backFromNode(paneId)
 * })
 */
export function useBackButton(options?: UseBackButtonOptions): void {
  // Generate a stable random ID if not provided
  const handlerIdRef = useRef<string>(
    options?.id || `handler-${Math.random().toString(36).substring(2, 11)}`
  )
  
  // Memoize the handler to avoid re-registration on every render
  const stableHandler = useCallback(() => {
    if (options?.handler) {
      return options.handler()
    }
    // No-op handler if none provided (still useful for initialization)
    return false
  }, [options?.handler])
  
  useEffect(() => {
    const handlerId = handlerIdRef.current
    const priority = options?.priority ?? 10 // Default priority
    
    // Register the handler
    registerBackHandler(handlerId, priority, stableHandler)
    
    // Cleanup on unmount
    return () => {
      unregisterBackHandler(handlerId)
    }
  }, [stableHandler, options?.priority])
}

export default useBackButton
