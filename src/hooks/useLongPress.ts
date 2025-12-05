/**
 * useLongPress Hook
 * 
 * Provides long-press (touch) and right-click (mouse) detection for context menus.
 * This is a global utility hook that can be used by any component that needs
 * long-press/right-click behavior for triggering context menus.
 * 
 * @module hooks/useLongPress
 */

import { useCallback, useRef } from 'react'

export interface LongPressEvent {
  clientX: number
  clientY: number
  target: EventTarget | null
}

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
 * @example
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
export function useLongPress({
  delay = 500,
  onLongPress,
  onClick,
  disabled = false,
}: UseLongPressOptions): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isLongPressRef = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return
    
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
    
    onLongPress({
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.target,
    })
  }, [disabled, onLongPress])

  // Optional: Also support long-press with mouse (hold left click)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || e.button !== 0) return // Only left click
    
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
