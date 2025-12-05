/**
 * useLongPress Hook
 * 
 * Provides long-press (touch) and right-click (mouse) detection for context menus.
 * This is a global utility hook that can be used by any component that needs
 * long-press/right-click behavior for triggering context menus.
 * 
 * Supports two signatures:
 * 1. Legacy: useLongPress(callback, { threshold }) - callback receives event
 * 2. New: useLongPress({ onLongPress, onClick, delay, disabled }) - options object
 * 
 * @module hooks/useLongPress
 */

import { useCallback, useRef } from 'react'

export interface LongPressEvent {
  clientX: number
  clientY: number
  target: EventTarget | null
}

// Legacy interface for backwards compatibility
export interface LegacyLongPressOptions {
  /** Delay in ms before triggering long press (default: 500) */
  threshold?: number
}

// New interface
export interface UseLongPressOptions {
  /** Delay in ms before triggering long press (default: 500) */
  delay?: number
  /** Callback when long press or right click is triggered */
  onLongPress: (event: LongPressEvent) => void
  /** Optional callback for regular click/tap */
  onClick?: () => void
  /** Whether long press is disabled */
  disabled?: boolean
}

// Legacy handlers interface (passes node as second arg)
export interface LegacyLongPressHandlers {
  onTouchStart: (e: React.TouchEvent, data?: unknown) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onTouchMove?: (e: React.TouchEvent) => void
  onContextMenu?: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent, data?: unknown) => void
  onMouseUp: (e: React.MouseEvent) => void
  onMouseLeave: (e: React.MouseEvent) => void
}

export interface LongPressHandlers {
  onTouchStart: (e: React.TouchEvent) => void
  onTouchEnd: (e: React.TouchEvent) => void
  onTouchMove: (e: React.TouchEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent) => void
  onMouseUp: (e: React.MouseEvent) => void
  onMouseLeave: (e: React.MouseEvent) => void
}

/**
 * Hook for detecting long press (touch) and right-click (mouse) events
 * 
 * @example Legacy signature (backwards compatible):
 * ```tsx
 * const handlers = useLongPress(
 *   (e) => handleContextMenu(e),
 *   { threshold: 500 }
 * )
 * 
 * return <div 
 *   onMouseDown={(e) => handlers.onMouseDown(e, node)}
 *   onTouchStart={(e) => handlers.onTouchStart(e, node)}
 *   {...handlers}
 * >Content</div>
 * ```
 * 
 * @example New signature:
 * ```tsx
 * const handlers = useLongPress({
 *   onLongPress: (e) => {
 *     setMenuPosition({ x: e.clientX, y: e.clientY })
 *     setShowMenu(true)
 *   },
 *   onClick: () => {
 *     // Handle regular click
 *   }
 * })
 * 
 * return <div {...handlers}>Content</div>
 * ```
 */
export function useLongPress(
  callbackOrOptions: ((event: React.MouseEvent | React.TouchEvent) => void) | UseLongPressOptions,
  legacyOptions?: LegacyLongPressOptions
): LongPressHandlers | LegacyLongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })
  const dataRef = useRef<unknown>(null)

  // Determine which signature is being used
  const isLegacySignature = typeof callbackOrOptions === 'function'
  
  const callback = isLegacySignature 
    ? callbackOrOptions as (event: React.MouseEvent | React.TouchEvent) => void
    : null
  const options = isLegacySignature 
    ? null 
    : callbackOrOptions as UseLongPressOptions

  const delay = legacyOptions?.threshold ?? options?.delay ?? 500
  const onLongPress = options?.onLongPress
  const onClick = options?.onClick
  const disabled = options?.disabled ?? false

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Legacy touch start (with optional data parameter)
  const legacyOnTouchStart = useCallback((e: React.TouchEvent, data?: unknown) => {
    if (!callback) return
    
    dataRef.current = data
    const touch = e.touches[0]
    startPosRef.current = { x: touch.clientX, y: touch.clientY }
    isLongPressRef.current = false

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      callback(e)
    }, delay)
  }, [callback, delay])

  // Legacy mouse down (with optional data parameter)
  const legacyOnMouseDown = useCallback((e: React.MouseEvent, data?: unknown) => {
    if (!callback || e.button !== 0) return // Only left click
    
    dataRef.current = data
    startPosRef.current = { x: e.clientX, y: e.clientY }
    isLongPressRef.current = false

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      callback(e)
    }, delay)
  }, [callback, delay])

  // New touch start
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || !onLongPress) return
    
    const touch = e.touches[0]
    startPosRef.current = { x: touch.clientX, y: touch.clientY }
    isLongPressRef.current = false

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress({
        clientX: touch.clientX,
        clientY: touch.clientY,
        target: e.target,
      })
    }, delay)
  }, [delay, disabled, onLongPress])

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    clearTimer()
    
    // If it wasn't a long press and we have an onClick handler, trigger it
    if (!isLongPressRef.current && onClick) {
      onClick()
    }
    
    // Prevent click event if it was a long press
    if (isLongPressRef.current) {
      e.preventDefault()
    }
  }, [clearTimer, onClick])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // Cancel long press if user moves finger more than 10px
    const touch = e.touches[0]
    const moveThreshold = 10
    const deltaX = Math.abs(touch.clientX - startPosRef.current.x)
    const deltaY = Math.abs(touch.clientY - startPosRef.current.y)
    
    if (deltaX > moveThreshold || deltaY > moveThreshold) {
      clearTimer()
    }
  }, [clearTimer])

  // Mouse handlers (for right-click context menu)
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    if (disabled) return
    
    e.preventDefault()
    e.stopPropagation()
    
    if (onLongPress) {
      onLongPress({
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target,
      })
    }
  }, [disabled, onLongPress])

  // New mouse down
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || e.button !== 0 || !onLongPress) return // Only left click
    
    startPosRef.current = { x: e.clientX, y: e.clientY }
    isLongPressRef.current = false

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true
      onLongPress({
        clientX: e.clientX,
        clientY: e.clientY,
        target: e.target,
      })
    }, delay)
  }, [delay, disabled, onLongPress])

  const onMouseUp = useCallback((e: React.MouseEvent) => {
    clearTimer()
    
    if (!isLongPressRef.current && onClick && e.button === 0) {
      onClick()
    }
  }, [clearTimer, onClick])

  const onMouseLeave = useCallback(() => {
    clearTimer()
  }, [clearTimer])

  // Return legacy handlers if using legacy signature
  if (isLegacySignature) {
    return {
      onTouchStart: legacyOnTouchStart,
      onTouchEnd,
      onMouseDown: legacyOnMouseDown,
      onMouseUp,
      onMouseLeave,
    } as LegacyLongPressHandlers
  }

  // Return new handlers
  return {
    onTouchStart,
    onTouchEnd,
    onTouchMove,
    onContextMenu,
    onMouseDown,
    onMouseUp,
    onMouseLeave,
  }
}

export default useLongPress
