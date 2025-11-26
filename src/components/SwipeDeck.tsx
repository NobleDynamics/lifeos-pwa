import { useRef, useState, useCallback, useEffect, ReactNode } from 'react'

interface SwipeDeckProps {
  children: ReactNode[]
  currentIndex: number
  onIndexChange: (index: number) => void
  className?: string
}

// Configuration - increased thresholds to reduce accidental swipes
const DISTANCE_THRESHOLD = 0.35 // 35% of viewport width (was 25%)
const VELOCITY_THRESHOLD = 0.3 // pixels per ms (was 0.5 - lower = require faster flick)
const RUBBER_BAND_FACTOR = 0.3 // resistance at edges
const ANIMATION_DURATION = 250 // ms

export default function SwipeDeck({ 
  children, 
  currentIndex, 
  onIndexChange,
  className = ''
}: SwipeDeckProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragDelta, setDragDelta] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Track gesture data
  const gestureRef = useRef({
    startX: 0,
    startTime: 0,
    lastX: 0,
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
  const handleStart = useCallback((clientX: number) => {
    if (isAnimating) return
    
    gestureRef.current = {
      startX: clientX,
      startTime: Date.now(),
      lastX: clientX,
    }
    setIsDragging(true)
    setDragDelta(0)
  }, [isAnimating])
  
  // Handle gesture move
  const handleMove = useCallback((clientX: number) => {
    if (!isDragging) return
    
    const { startX } = gestureRef.current
    const delta = clientX - startX
    gestureRef.current.lastX = clientX
    
    // Apply rubber-banding
    const adjustedDelta = applyRubberBand(delta)
    setDragDelta(adjustedDelta)
  }, [isDragging, applyRubberBand])
  
  // Handle gesture end
  const handleEnd = useCallback(() => {
    if (!isDragging) return
    
    const { startX, startTime, lastX } = gestureRef.current
    const dragDistance = lastX - startX
    const elapsedTime = Date.now() - startTime
    const velocity = dragDistance / elapsedTime
    const width = getWidth()
    
    setIsDragging(false)
    
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
  }, [isDragging, currentIndex, pageCount, getWidth, onIndexChange])
  
  // Touch event handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX)
  }, [handleStart])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }, [handleMove])
  
  const handleTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])
  
  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientX)
  }, [handleStart])
  
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault()
      handleMove(e.clientX)
    }
  }, [isDragging, handleMove])
  
  const handleMouseUp = useCallback(() => {
    handleEnd()
  }, [handleEnd])
  
  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleEnd()
    }
  }, [isDragging, handleEnd])
  
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
      // Force re-render to recalculate positions
      setDragDelta(0)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  
  // Calculate current transform
  const baseOffset = getBaseOffset()
  const currentOffset = baseOffset + dragDelta
  
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
      style={{ touchAction: 'pan-y' }}
    >
      {/* Page container */}
      <div 
        className="flex h-full"
        style={{
          transform: `translate3d(${currentOffset}px, 0, 0)`,
          transition: isDragging ? 'none' : `transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
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
