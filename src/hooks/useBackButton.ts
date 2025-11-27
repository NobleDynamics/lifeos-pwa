import { useEffect, useRef } from 'react'
import { useAppStore } from '@/store/useAppStore'

/**
 * useBackButton - Handles Android hardware/software back button
 * 
 * Priority order when back is pressed:
 * 1. Close drawer if open
 * 2. Close any modals (via optional callback)
 * 3. Navigate to previous pane in history
 * 4. Navigate to Dashboard if not there
 * 5. Do nothing (or show "press again to exit" toast)
 */
export function useBackButton(options?: {
  /** Optional callback to close modals before navigating. Return true if a modal was closed. */
  onCloseModal?: () => boolean
}) {
  const goBack = useAppStore((state) => state.goBack)
  const canGoBack = useAppStore((state) => state.canGoBack)
  const hasSetupHistory = useRef(false)

  useEffect(() => {
    // Push initial history entry so we can intercept back button
    if (!hasSetupHistory.current) {
      // Push a state so we have something to pop
      window.history.pushState({ lifeos: true }, '')
      hasSetupHistory.current = true
    }

    const handlePopState = (_e: PopStateEvent) => {
      // Check if modal needs closing first (via callback)
      if (options?.onCloseModal?.()) {
        // Modal was closed, re-push history entry
        window.history.pushState({ lifeos: true }, '')
        return
      }

      // Try to go back using our app's back logic
      const didGoBack = goBack()
      
      if (didGoBack) {
        // Re-push history entry so back button continues to work
        window.history.pushState({ lifeos: true }, '')
      } else {
        // At root (Dashboard), can't go back further
        // Re-push to prevent accidentally leaving the app
        window.history.pushState({ lifeos: true }, '')
        
        // Optional: Could show a toast here like "Press back again to exit"
        // For now, just stay on Dashboard
      }
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [goBack, options])

  return { canGoBack }
}
