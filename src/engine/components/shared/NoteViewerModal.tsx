/**
 * NoteViewerModal - Fullscreen Markdown Note Viewer/Editor
 * 
 * A fullscreen lightbox modal for viewing and editing markdown notes.
 * Features:
 * - Two-pane swipeable layout (Edit left, Preview right) like homescreen panes
 * - Real-time preview updates while editing
 * - Swipe gestures with partial reveal (peek at other pane)
 * - Autosave with 2-second debounce
 * - Throttled version history (60s or 50+ char changes)
 * - Mobile-optimized toolbar with 44px touch targets
 * 
 * @module engine/components/shared/NoteViewerModal
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, History, X, Clock, Edit3, Eye } from 'lucide-react'
import MDEditor, { commands } from '@uiw/react-md-editor'
import { cn } from '@/lib/utils'
import type { Node } from '../../types/node'

// =============================================================================
// TYPES
// =============================================================================

export interface VersionEntry {
  content: string
  savedAt: string // ISO timestamp
}

export interface NoteViewerModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback to close the modal */
  onClose: () => void
  /** The note node being viewed/edited */
  node: Node
  /** Callback when content is saved */
  onSave?: (content: string, history: VersionEntry[]) => void
  /** Initial pane (default: 1 = Preview on right) */
  initialPane?: 0 | 1
}

// =============================================================================
// CONSTANTS
// =============================================================================

const VERSION_TIME_THRESHOLD = 60000 // 60 seconds
const VERSION_CHAR_THRESHOLD = 50 // 50 character difference
const FINAL_SAVE_CHAR_THRESHOLD = 10 // Minimum chars changed to save on close
const AUTOSAVE_DELAY = 2000 // 2 seconds

// Swipe deck constants
const SWIPE_THRESHOLD = 0.25 // 25% of width to trigger page change
const VELOCITY_THRESHOLD = 0.4 // pixels per ms for flick detection
const ANIMATION_DURATION = 250 // ms

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })
}

function formatLastSaved(date: Date | null): string {
  if (!date) return ''
  
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffMs / 60000)

  if (diffSecs < 10) return 'Just saved'
  if (diffSecs < 60) return `Saved ${diffSecs}s ago`
  if (diffMins < 60) return `Saved ${diffMins}m ago`
  
  return `Saved at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

// =============================================================================
// CUSTOM TOOLBAR - Minimal set in horizontal row
// =============================================================================

const getToolbarCommands = () => [
  commands.bold,
  commands.italic,
  commands.strikethrough,
  commands.divider,
  commands.title1,
  commands.title2,
  commands.divider,
  commands.unorderedListCommand,
  commands.orderedListCommand,
  commands.divider,
  commands.link,
  commands.quote,
  commands.code,
]

// =============================================================================
// COMPONENT
// =============================================================================

export function NoteViewerModal({
  isOpen,
  onClose,
  node,
  onSave,
  initialPane = 1, // Start on Preview (right pane)
}: NoteViewerModalProps) {
  // Get initial content and history from node metadata
  const metadata = node.metadata as Record<string, unknown>
  const initialContent = (metadata.content as string) || ''
  const initialHistory = (metadata.history as VersionEntry[]) || []

  // Content state
  const [content, setContent] = useState(initialContent)
  const [originalContent, setOriginalContent] = useState(initialContent)
  const [history, setHistory] = useState<VersionEntry[]>(initialHistory)
  const [showHistory, setShowHistory] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Swipe deck state
  const [currentPane, setCurrentPane] = useState(initialPane) // 0 = Edit, 1 = Preview
  const [dragDelta, setDragDelta] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [containerWidth, setContainerWidth] = useState(0)
  
  // Refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastVersionSaveTimeRef = useRef<number>(Date.now())
  const contentAtLastVersionRef = useRef<string>(initialContent)
  
  // Gesture tracking
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isDragging: false,
    directionLocked: null as null | 'horizontal' | 'vertical',
  })
  
  const hasUnsavedChanges = content !== originalContent

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const meta = node.metadata as Record<string, unknown>
      const nodeContent = (meta.content as string) || ''
      const nodeHistory = (meta.history as VersionEntry[]) || []
      
      setContent(nodeContent)
      setOriginalContent(nodeContent)
      setHistory(nodeHistory)
      setShowHistory(false)
      setLastSaved(null)
      setCurrentPane(initialPane)
      setDragDelta(0)
      
      lastVersionSaveTimeRef.current = Date.now()
      contentAtLastVersionRef.current = nodeContent
    }
  }, [isOpen, node, initialPane])

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

  // Version history throttling
  const shouldCreateVersion = useCallback(() => {
    const timeSinceLastVersion = Date.now() - lastVersionSaveTimeRef.current
    const charDiff = Math.abs(content.length - contentAtLastVersionRef.current.length)
    const contentChanged = content !== contentAtLastVersionRef.current
    return contentChanged && (timeSinceLastVersion >= VERSION_TIME_THRESHOLD || charDiff >= VERSION_CHAR_THRESHOLD)
  }, [content])

  const createVersionEntry = useCallback(() => {
    if (contentAtLastVersionRef.current === content) return null
    
    const newHistory = [
      { content: contentAtLastVersionRef.current, savedAt: new Date().toISOString() },
      ...history,
    ].slice(0, 10)
    
    lastVersionSaveTimeRef.current = Date.now()
    contentAtLastVersionRef.current = content
    
    return newHistory
  }, [content, history])

  const performSave = useCallback((forceVersion = false) => {
    if (!onSave || content === originalContent) return

    setIsSaving(true)

    const shouldVersion = forceVersion || shouldCreateVersion()
    let newHistory = history

    if (shouldVersion) {
      const versionHistory = createVersionEntry()
      if (versionHistory) {
        newHistory = versionHistory
        setHistory(newHistory)
      }
    }

    onSave(content, newHistory)
    setOriginalContent(content)
    setLastSaved(new Date())
    setIsSaving(false)
  }, [content, originalContent, history, onSave, shouldCreateVersion, createVersionEntry])

  // Autosave debounce
  useEffect(() => {
    if (content === originalContent || !onSave) return

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = setTimeout(() => {
      performSave(false)
    }, AUTOSAVE_DELAY)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [content, originalContent, onSave, performSave])

  // ==========================================================================
  // SWIPE DECK HANDLERS
  // ==========================================================================
  
  const getBaseOffset = useCallback(() => {
    return -currentPane * containerWidth
  }, [currentPane, containerWidth])

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
  }, [isAnimating])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    // Stop propagation to prevent SwipeDeck from receiving this event
    e.stopPropagation()
    
    const gesture = gestureRef.current
    if (!gesture.isDragging || !containerWidth) return
    
    const touch = e.touches[0]
    const deltaX = touch.clientX - gesture.startX
    const deltaY = touch.clientY - gesture.startY
    
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
    const baseOffset = getBaseOffset()
    const newOffset = baseOffset + deltaX
    
    // Limit at left edge (can't go past Edit pane)
    if (newOffset > 0) {
      newDelta = deltaX * 0.3
    }
    // Limit at right edge (can't go past Preview pane)
    if (newOffset < -containerWidth) {
      const overflow = Math.abs(newOffset + containerWidth)
      newDelta = deltaX + overflow * 0.7
    }
    
    setDragDelta(newDelta)
  }, [containerWidth, getBaseOffset])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Stop propagation to prevent SwipeDeck from receiving this event
    e.stopPropagation()
    
    const gesture = gestureRef.current
    if (!gesture.isDragging) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - gesture.startX
    const deltaTime = Date.now() - gesture.startTime
    const velocity = deltaX / deltaTime
    
    gesture.isDragging = false
    gesture.directionLocked = null
    
    // Determine if we should change pane
    const threshold = containerWidth * SWIPE_THRESHOLD
    const velocityMet = Math.abs(velocity) > VELOCITY_THRESHOLD
    const distanceMet = Math.abs(deltaX) > threshold
    
    let newPane = currentPane
    
    if (velocityMet || distanceMet) {
      if (deltaX > 0 && currentPane > 0) {
        // Swiped right → go to Edit (pane 0)
        newPane = 0
      } else if (deltaX < 0 && currentPane < 1) {
        // Swiped left → go to Preview (pane 1)
        newPane = 1
      }
    }
    
    setIsAnimating(true)
    setDragDelta(0)
    setCurrentPane(newPane)
    
    setTimeout(() => setIsAnimating(false), ANIMATION_DURATION)
  }, [currentPane, containerWidth])

  // Navigate to specific pane
  const goToPane = useCallback((pane: 0 | 1) => {
    if (pane === currentPane) return
    setIsAnimating(true)
    setCurrentPane(pane)
    setTimeout(() => setIsAnimating(false), ANIMATION_DURATION)
  }, [currentPane])

  // ==========================================================================
  // OTHER HANDLERS
  // ==========================================================================

  const handleClose = useCallback(() => {
    if (hasUnsavedChanges && onSave) {
      const charDiff = Math.abs(content.length - contentAtLastVersionRef.current.length)
      performSave(charDiff >= FINAL_SAVE_CHAR_THRESHOLD)
    }
    onClose()
  }, [hasUnsavedChanges, onSave, content, performSave, onClose])

  const handleRestoreVersion = useCallback((version: VersionEntry) => {
    setContent(version.content)
    setShowHistory(false)
    goToPane(0) // Go to edit pane
  }, [goToPane])

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showHistory) {
          setShowHistory(false)
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showHistory, handleClose])

  // Update "last saved" display
  useEffect(() => {
    if (!lastSaved) return
    const interval = setInterval(() => {
      setLastSaved(new Date(lastSaved.getTime()))
    }, 30000)
    return () => clearInterval(interval)
  }, [lastSaved])

  // Calculate transform
  const baseOffset = getBaseOffset()
  const currentOffset = baseOffset + dragDelta

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-dark/95 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative flex flex-col h-full max-h-full"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-200 bg-dark-100/90 backdrop-blur-sm z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="p-2 -ml-2 rounded-lg hover:bg-dark-200 transition-colors"
                  aria-label="Close"
                >
                  <ArrowLeft size={20} className="text-dark-400" />
                </button>
                <h2 className="font-semibold text-white truncate max-w-[180px] sm:max-w-none">
                  {node.title}
                </h2>
              </div>

              <div className="flex items-center gap-1">
                {/* Pane indicator / toggle */}
                <div className="flex bg-dark-200/50 rounded-lg p-1 mr-2">
                  <button
                    onClick={() => goToPane(0)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                      currentPane === 0 
                        ? "bg-primary/20 text-primary" 
                        : "text-dark-400 hover:text-white"
                    )}
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button
                    onClick={() => goToPane(1)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5",
                      currentPane === 1 
                        ? "bg-primary/20 text-primary" 
                        : "text-dark-400 hover:text-white"
                    )}
                  >
                    <Eye size={14} />
                    Preview
                  </button>
                </div>

                {/* History Button - Always visible, disabled when empty */}
                <button
                  onClick={() => history.length > 0 && setShowHistory(!showHistory)}
                  disabled={history.length === 0}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    history.length === 0
                      ? "text-dark-500 cursor-not-allowed opacity-50"
                      : showHistory 
                        ? "bg-primary/20 text-primary" 
                        : "hover:bg-dark-200 text-dark-400"
                  )}
                  aria-label="Version history"
                  title={history.length > 0 
                    ? `${history.length} version${history.length > 1 ? 's' : ''} saved` 
                    : 'No version history yet'
                  }
                >
                  <History size={18} />
                </button>
              </div>
            </div>

            {/* Content Area - Two-pane swipe deck */}
            <div 
              ref={containerRef}
              className="flex-1 overflow-hidden relative"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{ touchAction: 'pan-y pinch-zoom' }}
            >
              {/* History Panel (overlay) */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute right-0 top-0 bottom-0 w-72 bg-dark-100 border-l border-dark-200 z-20 flex flex-col"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-dark-200">
                      <span className="text-sm font-medium text-white">Version History</span>
                      <button
                        onClick={() => setShowHistory(false)}
                        className="p-1 rounded hover:bg-dark-200"
                      >
                        <X size={16} className="text-dark-400" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {history.map((version, index) => (
                        <button
                          key={index}
                          onClick={() => handleRestoreVersion(version)}
                          className="w-full px-4 py-3 text-left border-b border-dark-200/50 hover:bg-dark-200/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 text-xs text-dark-400 mb-1">
                            <Clock size={12} />
                            {formatTimestamp(version.savedAt)}
                          </div>
                          <p className="text-sm text-dark-300 line-clamp-2">
                            {version.content.substring(0, 100)}...
                          </p>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Two-pane container */}
              <div 
                className="flex h-full"
                style={{
                  width: '200%',
                  transform: `translate3d(${currentOffset}px, 0, 0)`,
                  transition: dragDelta !== 0 ? 'none' : `transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
                  willChange: 'transform',
                }}
              >
                {/* Pane 0: Edit Mode */}
                <div 
                  className="w-1/2 h-full flex flex-col"
                  data-color-mode="dark"
                >
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    height="100%"
                    preview="edit"
                    hideToolbar={false}
                    visibleDragbar={false}
                    commands={getToolbarCommands()}
                    extraCommands={[]}
                    className="note-editor-fullheight"
                  />
                </div>
                
                {/* Pane 1: Preview Mode */}
                <div className="w-1/2 h-full overflow-y-auto p-4 sm:p-6 bg-dark">
                  <div className="max-w-3xl mx-auto">
                    <MDEditor.Markdown 
                      source={content || '*No content yet. Swipe right to edit.*'} 
                      className="wmde-markdown"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-dark-200 bg-dark-100/90 backdrop-blur-sm text-xs z-10">
              <div className="text-dark-500">
                {lastSaved ? formatLastSaved(lastSaved) : (
                  metadata.updated_at 
                    ? `Last edited ${formatTimestamp(metadata.updated_at as string)}` 
                    : 'Not yet saved'
                )}
              </div>
              <div className="flex items-center gap-2">
                {isSaving && (
                  <span className="text-primary animate-pulse">Saving...</span>
                )}
                {hasUnsavedChanges && !isSaving && (
                  <span className="text-yellow-500">Unsaved changes</span>
                )}
                <span className="text-dark-500">
                  ← Swipe to {currentPane === 0 ? 'preview' : 'edit'} →
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default NoteViewerModal
