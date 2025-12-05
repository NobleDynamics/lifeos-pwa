import { useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/store/useAppStore'

/**
 * Global registry for back button handlers
 * Higher priority handlers get called first (child components should have higher priority)
 */
type BackHandler = {
  id: string
  priority: number
  handler: () => boolean
}

const backHandlers: BackHandler[] = []
let historyInitialized = false

// Track our "floor" entry to prevent app exit
let historyDepth = 0
const MIN_HISTORY_DEPTH = 2

function registerHandler(id: string, priority: number, handler: () => boolean) {
  // Remove existing handler with same id
  const existingIndex = backHandlers.findIndex(h => h.id === id)
  if (existingIndex >= 0) {
    backHandlers.splice(existingIndex, 1)
  }
  
  // Add new handler
  backHandlers.push({ id, priority, handler })
  
  // Sort by priority descending (higher priority first)
  backHandlers.sort((a, b) => b.priority - a.priority)
}

function unregisterHandler(id: string) {
  const index = backHandlers.findIndex(h => h.id === id)
  if (index >= 0) {
    backHandlers.splice(index, 1)
  }
}

/**
 * Push a new history entry and track depth
 */
function pushHistory() {
  window.history.pushState({ lifeos: true, depth: historyDepth + 1 }, '')
  historyDepth++
}

/**
 * Ensure we have minimum history entries to prevent app exit
 */
function ensureHistoryFloor() {
  while (historyDepth < MIN_HISTORY_DEPTH) {
    pushHistory()
  }
}

/**
 * useBackButton - Handles Android hardware/software back button
 * 
 * Priority order when back is pressed:
 * 1. Child component handlers (modals, nested views) - higher priority
 * 2. App-level navigation (pane history) - lower priority
 * 
 * @param options.onCloseModal - Callback that returns true if it handled the back action
 * @param options.priority - Higher numbers get called first (default: 10 for modals, 0 for app-level)
 */
export function useBackButton(options?: {
  /** Optional callback to handle back. Return true if handled (prevents further propagation). */
  onCloseModal?: () => boolean
  /** Priority level. Higher = called first. Default 10 for components, 0 for app-level. */
  priority?: number
}) {
  const goBack = useAppStore((state) => state.goBack)
  const handlerIdRef = useRef<string>(`handler-${Math.random().toString(36).substr(2, 9)}`)

  // Create the handler function
  const handleBack = useCallback(() => {
    // If we have a custom handler, use it
    if (options?.onCloseModal) {
      return options.onCloseModal()
    }
    // Otherwise this is the app-level handler - try app navigation
    return goBack()
  }, [options?.onCloseModal, goBack])

  useEffect(() => {
    const handlerId = handlerIdRef.current
    const priority = options?.priority ?? (options?.onCloseModal ? 10 : 0)
    
    // Register this handler
    registerHandler(handlerId, priority, handleBack)

    // Initialize history only once globally
    if (!historyInitialized) {
      historyInitialized = true
      
      // Push initial "floor" entries to prevent app exit
      // These entries act as a buffer - back button can never exhaust them
      ensureHistoryFloor()

      // Set up single global popstate listener
      const handlePopState = (e: PopStateEvent) => {
        // Track that we went back (consumed a history entry)
        const eventDepth = (e.state as { depth?: number })?.depth
        if (eventDepth !== undefined) {
          historyDepth = eventDepth
        } else {
          // Unknown state - assume we're at the floor
          historyDepth = 0
        }
        
        // FIRST: Re-push history to maintain floor (before handlers)
        // This ensures we always have a buffer entry
        pushHistory()
        
        // Try each handler in priority order
        let handled = false
        for (const { handler } of backHandlers) {
          if (handler()) {
            handled = true
            break
          }
        }
        
        // If no handler dealt with it, goBack is the fallback at priority 0
        // which should always return true (traps at dashboard)
        if (!handled) {
          console.warn('[useBackButton] No handler handled back - this should not happen')
        }
      }

      window.addEventListener('popstate', handlePopState)

      // Note: We don't clean up the global listener since it should persist
    }

    return () => {
      unregisterHandler(handlerId)
    }
  }, [handleBack, options?.priority, options?.onCloseModal])

  return { canGoBack: useAppStore((state) => state.canGoBack) }
}
