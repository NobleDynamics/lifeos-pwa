import { useRef, useState, useCallback, useEffect, ReactNode } from 'react'

interface SwipeDeckProps {
  children: ReactNode[]
  currentIndex: number
  onIndexChange: (index: number) => void
  className?: string
}

// Configuration - strict thresholds to reduce accidental swipes
const MIN_DRAG_THRESHOLD = 15 // Minimum pixels to move before gesture is recognized
const DIRECTION_LOCK_THRESHOLD = 10 // Pixels to determine if swipe is horizontal or vertical
const DISTANCE_THRESHOLD = 0.35 // 35% of viewport width to trigger page change
const VELOCITY_THRESHOLD = 0.4 // pixels per ms for flick detection
const RUBBER_BAND_FACTOR = 0.3 // resistance at edges
const ANIMATION_DURATION = 250 // ms

export default function SwipeDeck({ 
  children, 
  currentIndex, 
  onIndexChange,
  className = ''
}: SwipeDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dragDelta, setDragDelta] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Track gesture data
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    lastX: 0,
    isDragging: false,
    isGestureActive: false, // True only after threshold passed AND horizontal
    directionLocked: null as null | 'horizontal' | 'vertical',
  })
  
  const pageCount = children.length
  
  // Get container width
  const getWidth = useCallback(() => {
    return containerRef.current?.offsetWidth || window.innerWidth
  }, [])
  
  // Calculate offset for current page
  const getBaseOffset = useCallback(() => {
    return -currentIndex * getWidth()
  }, [currentIndex, getWidth])
  
  // Apply rubber-banding at edges
  const applyRubberBand = useCallback((delta: number): number => {
    const baseOffset = getBaseOffset()
    const newOffset = baseOffset + delta
    const width = getWidth()
    const maxOffset = 0
    const minOffset = -(pageCount - 1) * width
    
    // Beyond first page
    if (newOffset > maxOffset) {
      const overflow = newOffset - maxOffset
      return delta - overflow * (1 - RUBBER_BAND_FACTOR)
    }
    
    // Beyond last page
    if (newOffset < minOffset) {
      const overflow = minOffset - newOffset
      return delta + overflow * (1 - RUBBER_BAND_FACTOR)
    }
    
    return delta
  }, [getBaseOffset, getWidth, pageCount])
  
  // Handle gesture start
  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (isAnimating) return
    
    gestureRef.current = {
      startX: clientX,
      startY: clientY,
      startTime: Date.now(),
      lastX: clientX,
      isDragging: true,
      isGestureActive: false,
      directionLocked: null,
    }
    setDragDelta(0)
  }, [isAnimating])
  
  // Handle gesture move
  const handleMove = useCallback((clientX: number, clientY: number) => {
    const gesture = gestureRef.current
    if (!gesture.isDragging) return
    
    const deltaX = clientX - gesture.startX
    const deltaY = clientY - gesture.startY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    
    // Determine direction if not yet locked
    if (!gesture.directionLocked) {
      // Need to move at least DIRECTION_LOCK_THRESHOLD to determine direction
      if (absDeltaX > DIRECTION_LOCK_THRESHOLD || absDeltaY > DIRECTION_LOCK_THRESHOLD) {
        // If more vertical movement, lock to vertical (allow scrolling)
        if (absDeltaY > absDeltaX * 1.2) { // 1.2 factor biases toward vertical for natural feel
          gesture.directionLocked = 'vertical'
          return
        } else if (absDeltaX > absDeltaY) {
          // Horizontal movement - check if we've passed minimum threshold
          gesture.directionLocked = 'horizontal'
        }
      } else {
        // Not enough movement yet, don't do anything
        return
      }
    }
    
    // If vertical, ignore (let browser handle scrolling)
    if (gesture.directionLocked === 'vertical') {
      return
    }
    
    // Now we're in horizontal mode - check if gesture is active (past minimum threshold)
    if (!gesture.isGestureActive) {
      if (absDeltaX >= MIN_DRAG_THRESHOLD) {
        gesture.isGestureActive = true
      } else {
        return // Not past threshold yet
      }
    }
    
    // Update position
    gesture.lastX = clientX
    
    // Apply rubber-banding and update delta (subtract initial threshold to make it feel responsive)
    const adjustedDelta = deltaX > 0 
      ? deltaX - MIN_DRAG_THRESHOLD 
      : deltaX + MIN_DRAG_THRESHOLD
    const rubberBandedDelta = applyRubberBand(adjustedDelta)
    setDragDelta(rubberBandedDelta)
  }, [applyRubberBand])
  
  // Handle gesture end
  const handleEnd = useCallback(() => {
    const gesture = gestureRef.current
    if (!gesture.isDragging) return
    
    const { startX, startTime, lastX, isGestureActive } = gesture
    const dragDistance = lastX - startX
    const elapsedTime = Date.now() - startTime
    const velocity = dragDistance / elapsedTime
    const width = getWidth()
    
    gesture.isDragging = false
    gesture.isGestureActive = false
    gesture.directionLocked = null
    
    // If gesture wasn't active (didn't pass threshold), just reset
    if (!isGestureActive) {
      setDragDelta(0)
      return
    }
    
    // Determine if we should change page
    const distanceThresholdMet = Math.abs(dragDistance) > width * DISTANCE_THRESHOLD
    const velocityThresholdMet = Math.abs(velocity) > VELOCITY_THRESHOLD
    
    let newIndex = currentIndex
    
    if (distanceThresholdMet || velocityThresholdMet) {
      if (dragDistance < 0 && currentIndex < pageCount - 1) {
        // Swiped left → go to next page
        newIndex = currentIndex + 1
      } else if (dragDistance > 0 && currentIndex > 0) {
        // Swiped right → go to previous page
        newIndex = currentIndex - 1
      }
    }
    
    // Animate to target
    setIsAnimating(true)
    setDragDelta(0)
    
    if (newIndex !== currentIndex) {
      onIndexChange(newIndex)
    }
    
    // Clear animation flag after animation completes
    setTimeout(() => {
      setIsAnimating(false)
    }, ANIMATION_DURATION)
  }, [currentIndex, pageCount, getWidth, onIndexChange])
  
  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX, e.touches[0].clientY)
  }, [handleStart])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const gesture = gestureRef.current
    // Only prevent default if we're in horizontal mode and gesture is active
    if (gesture.directionLocked === 'horizontal' && gesture.isGestureActive) {
      e.preventDefault()
    }
    handleMove(e.touches[0].clientX, e.touches[0].clientY)
  }, [handleMove])
  
  const handleTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])
  
  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }, [handleStart])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (gestureRef.current.isDragging) {
      handleMove(e.clientX, e.clientY)
    }
  }, [handleMove])
  
  const handleMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])
  
  const handleMouseLeave = useCallback(() => {
    if (gestureRef.current.isDragging) {
      handleEnd()
    }
  }, [handleEnd])
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onIndexChange(currentIndex - 1)
      } else if (e.key === 'ArrowRight' && currentIndex < pageCount - 1) {
        onIndexChange(currentIndex + 1)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, pageCount, onIndexChange])
  
  // Recalculate on resize
  useEffect(() => {
    const handleResize = () => {
      setDragDelta(0)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Calculate current transform
  const baseOffset = getBaseOffset()
  const currentOffset = baseOffset + dragDelta
  const isDraggingActive = gestureRef.current.isGestureActive
  
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: 'pan-y pinch-zoom' }}
    >
      {/* Page container */}
      <div 
        className="flex h-full"
        style={{
          transform: `translate3d(${currentOffset}px, 0, 0)`,
          transition: dragDelta !== 0 ? 'none' : `transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
          willChange: 'transform',
        }}
      >
        {children.map((child, index) => (
          <div 
            key={index}
            className="flex-shrink-0 w-full h-full"
            style={{ width: '100%' }}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

// Hook for programmatic navigation
export function useSwipeDeck(initialIndex: number = 0, pageCount: number) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  
  const goToPage = useCallback((index: number) => {
    const clampedIndex = Math.max(0, Math.min(pageCount - 1, index))
    setCurrentIndex(clampedIndex)
  }, [pageCount])
  
  const goNext = useCallback(() => {
    goToPage(currentIndex + 1)
  }, [currentIndex, goToPage])
  
  const goPrev = useCallback(() => {
    goToPage(currentIndex - 1)
  }, [currentIndex, goToPage])
  
  return {
    currentIndex,
    setCurrentIndex,
    goToPage,
    goNext,
    goPrev,
  }
}
