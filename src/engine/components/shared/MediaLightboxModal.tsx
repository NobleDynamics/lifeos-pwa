/**
 * MediaLightboxModal - Fullscreen Media Lightbox
 * 
 * A fullscreen lightbox modal for viewing images with swipe navigation.
 * Features:
 * - Horizontal swipe navigation between sibling media items
 * - Rubber-banding at edges
 * - Image preloading for adjacent items
 * - Long-press for context menu
 * - Portal rendering to escape SwipeDeck transforms
 * 
 * @module engine/components/shared/MediaLightboxModal
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MoreVertical, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Node } from '../../types/node'
import { useContextMenu } from '../../context/ContextMenuContext'

// =============================================================================
// TYPES
// =============================================================================

export interface MediaLightboxModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** The current media node being viewed */
  currentNode: Node
  /** All media nodes in the gallery for navigation */
  siblings: Node[]
  /** Initial index in siblings array */
  initialIndex: number
  /** Optional parent node for context menu inheritance */
  parentNode?: Node | null
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SWIPE_THRESHOLD = 0.2 // 20% of width to trigger page change
const VELOCITY_THRESHOLD = 0.3 // pixels per ms for flick detection
const ANIMATION_DURATION = 250 // ms
const LONG_PRESS_DELAY = 500 // ms

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the URL from a media node's metadata
 */
function getMediaUrl(node: Node): string | null {
  const metadata = node.metadata as Record<string, unknown>
  return (metadata.url as string) || (metadata.imageUrl as string) || null
}

/**
 * Get alt text from a media node
 */
function getMediaAlt(node: Node): string {
  const metadata = node.metadata as Record<string, unknown>
  return (metadata.alt as string) || node.title || 'Image'
}

// =============================================================================
// COMPONENT
// =============================================================================

export function MediaLightboxModal({
  isOpen,
  onClose,
  currentNode,
  siblings,
  initialIndex,
  parentNode = null,
}: MediaLightboxModalProps) {
  // Current index in siblings array
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  
  // Swipe state
  const [dragDelta, setDragDelta] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  
  // Preloaded images
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  
  // Long press state
  const [isLongPressing, setIsLongPressing] = useState(false)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Gesture tracking
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    directionLocked: null as null | 'horizontal' | 'vertical',
  })
  
  // Context menu
  const { showContextMenu } = useContextMenu()
  
  // Current node based on index
  const activeNode = useMemo(() => {
    return siblings[currentIndex] || currentNode
  }, [siblings, currentIndex, currentNode])
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setDragDelta(0)
      setIsAnimating(false)
      setPreloadedImages(new Set())
    }
  }, [isOpen, initialIndex])

  // Measure container width
  useEffect(() => {
    if (!containerRef.current) return
    
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [isOpen])

  // Preload adjacent images
  useEffect(() => {
    if (!isOpen) return
    
    const toPreload: string[] = []
    
    // Current image
    const currentUrl = getMediaUrl(activeNode)
    if (currentUrl) toPreload.push(currentUrl)
    
    // Previous image
    if (currentIndex > 0) {
      const prevUrl = getMediaUrl(siblings[currentIndex - 1])
      if (prevUrl) toPreload.push(prevUrl)
    }
    
    // Next image
    if (currentIndex < siblings.length - 1) {
      const nextUrl = getMediaUrl(siblings[currentIndex + 1])
      if (nextUrl) toPreload.push(nextUrl)
    }
    
    // Preload images
    toPreload.forEach(url => {
      if (!preloadedImages.has(url)) {
        const img = new Image()
        img.src = url
        img.onload = () => {
          setPreloadedImages(prev => new Set([...prev, url]))
        }
      }
    })
  }, [isOpen, currentIndex, siblings, activeNode, preloadedImages])

  // ==========================================================================
  // SWIPE HANDLERS
  // ==========================================================================
  
  const getBaseOffset = useCallback(() => {
    return -currentIndex * containerWidth
  }, [currentIndex, containerWidth])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    setIsLongPressing(false)
  }, [])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Stop propagation to prevent SwipeDeck from receiving this event
    e.stopPropagation()
    
    if (isAnimating) return
    
    const touch = e.touches[0]
    gestureRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isDragging: true,
      directionLocked: null,
    }
    
    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      setIsLongPressing(true)
      // Show context menu
      showContextMenu(activeNode, parentNode, { x: touch.clientX, y: touch.clientY })
      gestureRef.current.isDragging = false
    }, LONG_PRESS_DELAY)
  }, [isAnimating, activeNode, parentNode, showContextMenu])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Stop propagation to prevent SwipeDeck from receiving this event
    e.stopPropagation()
    
    const gesture = gestureRef.current
    if (!gesture.isDragging || !containerWidth) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - gesture.startX
    const deltaY = touch.clientY - gesture.startY
    
    // Cancel long press on movement
    if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
      clearLongPressTimer()
    }
    
    // Lock direction on first significant move
    if (!gesture.directionLocked) {
      if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.2) {
          gesture.directionLocked = 'vertical'
          return
        }
        gesture.directionLocked = 'horizontal'
      } else {
        return
      }
    }
    
    if (gesture.directionLocked === 'vertical') return
    
    // Apply rubber-banding at edges
    let newDelta = deltaX
    const isAtStart = currentIndex === 0
    const isAtEnd = currentIndex === siblings.length - 1
    
    // Rubber-band at left edge (can't go before first item)
    if (deltaX > 0 && isAtStart) {
      newDelta = deltaX * 0.3
    }
    // Rubber-band at right edge (can't go past last item)
    if (deltaX < 0 && isAtEnd) {
      newDelta = deltaX * 0.3
    }
    
    setDragDelta(newDelta)
  }, [containerWidth, currentIndex, siblings.length, clearLongPressTimer])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Stop propagation to prevent SwipeDeck from receiving this event
    e.stopPropagation()
    
    // Clear long press timer
    clearLongPressTimer()
    
    const gesture = gestureRef.current
    if (!gesture.isDragging) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - gesture.startX
    const deltaTime = Date.now() - gesture.startTime
    const velocity = deltaX / deltaTime
    
    gesture.isDragging = false
    gesture.directionLocked = null
    
    // Determine if we should change page
    const threshold = containerWidth * SWIPE_THRESHOLD
    const velocityMet = Math.abs(velocity) > VELOCITY_THRESHOLD
    const distanceMet = Math.abs(deltaX) > threshold
    
    let newIndex = currentIndex
    
    if (velocityMet || distanceMet) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swiped right → go to previous
        newIndex = currentIndex - 1
      } else if (deltaX < 0 && currentIndex < siblings.length - 1) {
        // Swiped left → go to next
        newIndex = currentIndex + 1
      }
    }
    
    setIsAnimating(true)
    setDragDelta(0)
    setCurrentIndex(newIndex)
    
    setTimeout(() => setIsAnimating(false), ANIMATION_DURATION)
  }, [currentIndex, containerWidth, siblings.length, clearLongPressTimer])

  // Mouse handlers for desktop
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    showContextMenu(activeNode, parentNode, { x: e.clientX, y: e.clientY })
  }, [activeNode, parentNode, showContextMenu])

  // Navigate to specific index
  const goToIndex = useCallback((index: number) => {
    if (index < 0 || index >= siblings.length || index === currentIndex) return
    setIsAnimating(true)
    setCurrentIndex(index)
    setTimeout(() => setIsAnimating(false), ANIMATION_DURATION)
  }, [currentIndex, siblings.length])

  // ==========================================================================
  // OTHER HANDLERS
  // ==========================================================================

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (e.key) {
        case 'Escape':
          handleClose()
          break
        case 'ArrowLeft':
          goToIndex(currentIndex - 1)
          break
        case 'ArrowRight':
          goToIndex(currentIndex + 1)
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, currentIndex, handleClose, goToIndex])

  // Calculate transform
  const baseOffset = getBaseOffset()
  const currentOffset = baseOffset + dragDelta

  // Get current image URL
  const currentUrl = getMediaUrl(activeNode)
  const currentAlt = getMediaAlt(activeNode)

  // Use portal to render outside SwipeDeck transform context
  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col"
          onContextMenu={handleContextMenu}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/95"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative flex flex-col h-full max-h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm z-10">
              <button
                onClick={handleClose}
                className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X size={24} className="text-white" />
              </button>
              
              <span className="text-white/80 text-sm font-medium">
                {currentIndex + 1} / {siblings.length}
              </span>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  showContextMenu(activeNode, parentNode, { x: e.clientX, y: e.clientY })
                }}
                className="p-2 -mr-2 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="More options"
              >
                <MoreVertical size={24} className="text-white" />
              </button>
            </div>

            {/* Image Container - Swipeable */}
            <div 
              ref={containerRef}
              className="flex-1 overflow-hidden relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'pan-y pinch-zoom' }}
            >
              {/* Images strip */}
              <div 
                className="flex h-full"
                style={{
                  width: `${siblings.length * 100}%`,
                  transform: `translate3d(${currentOffset}px, 0, 0)`,
                  transition: dragDelta !== 0 ? 'none' : `transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
                  willChange: 'transform',
                }}
              >
                {siblings.map((sibling, index) => {
                  const url = getMediaUrl(sibling)
                  const alt = getMediaAlt(sibling)
                  
                  return (
                    <div 
                      key={sibling.id}
                      className="flex items-center justify-center h-full"
                      style={{ width: `${100 / siblings.length}%` }}
                    >
                      {url ? (
                        <img 
                          src={url}
                          alt={alt}
                          className="max-w-full max-h-full object-contain"
                          loading={Math.abs(index - currentIndex) <= 1 ? 'eager' : 'lazy'}
                          draggable={false}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-white/50">
                          <ImageIcon size={48} strokeWidth={1} />
                          <span className="mt-2 text-sm">No image</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Navigation arrows (desktop) */}
              {currentIndex > 0 && (
                <button
                  onClick={() => goToIndex(currentIndex - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors hidden sm:flex"
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} className="text-white" />
                </button>
              )}
              {currentIndex < siblings.length - 1 && (
                <button
                  onClick={() => goToIndex(currentIndex + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 hover:bg-black/70 transition-colors hidden sm:flex"
                  aria-label="Next image"
                >
                  <ChevronRight size={24} className="text-white" />
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center px-4 py-3 bg-black/50 backdrop-blur-sm text-sm z-10">
              {siblings.length > 1 ? (
                <span className="text-white/50">
                  ← Swipe for more →
                </span>
              ) : (
                <span className="text-white/50">
                  {activeNode.title || 'Image'}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  // Portal to document.body to escape SwipeDeck's transform containing block
  return createPortal(modalContent, document.body)
}

