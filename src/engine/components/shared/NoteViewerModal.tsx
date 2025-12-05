/**
 * NoteViewerModal - Fullscreen Markdown Note Viewer/Editor
 * 
 * A fullscreen lightbox modal for viewing and editing markdown notes.
 * Features:
 * - View mode with rendered markdown (tap to edit)
 * - Edit mode with @uiw/react-md-editor (80/20 split with preview)
 * - Swipe gestures to transition between view/edit modes
 * - Autosave with 2-second debounce
 * - Throttled version history (60s or 50+ char changes)
 * - Mobile-optimized toolbar with 44px touch targets
 * 
 * @module engine/components/shared/NoteViewerModal
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Check, History, X, Clock, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react'
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
  /** Initial mode (default: 'view') */
  initialMode?: 'view' | 'edit'
}

// =============================================================================
// CONSTANTS
// =============================================================================

const VERSION_TIME_THRESHOLD = 60000 // 60 seconds
const VERSION_CHAR_THRESHOLD = 50 // 50 character difference
const FINAL_SAVE_CHAR_THRESHOLD = 10 // Minimum chars changed to save on close
const AUTOSAVE_DELAY = 2000 // 2 seconds
const SWIPE_THRESHOLD = 50 // Minimum pixels for swipe detection
const SWIPE_VELOCITY_THRESHOLD = 0.3 // pixels per ms

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Format a timestamp for display
 */
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

/**
 * Format relative time for last saved display
 */
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
// CUSTOM TOOLBAR COMMANDS
// =============================================================================

/**
 * Get custom toolbar configuration for mobile
 * Primary row: 6 most common tools with large touch targets
 * Extra commands available via dropdown or extra row
 */
const getToolbarCommands = () => [
  commands.bold,
  commands.italic,
  commands.link,
  commands.title1,
  commands.unorderedListCommand,
  commands.code,
  commands.divider,
  commands.quote,
  commands.strikethrough,
  commands.hr,
]

const getExtraToolbarCommands = () => [
  commands.codeEdit,
  commands.codeLive,
  commands.codePreview,
]

// =============================================================================
// COMPONENT
// =============================================================================

export function NoteViewerModal({
  isOpen,
  onClose,
  node,
  onSave,
  initialMode = 'view',
}: NoteViewerModalProps) {
  // Get initial content and history from node metadata
  const metadata = node.metadata as Record<string, unknown>
  const initialContent = (metadata.content as string) || ''
  const initialHistory = (metadata.history as VersionEntry[]) || []

  // State
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode)
  const [content, setContent] = useState(initialContent)
  const [originalContent, setOriginalContent] = useState(initialContent)
  const [history, setHistory] = useState<VersionEntry[]>(initialHistory)
  const [showHistory, setShowHistory] = useState(false)
  const [showPreview, setShowPreview] = useState(true) // 20% preview sidebar in edit mode
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [editorHeight, setEditorHeight] = useState(400)
  
  // Refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorContainerRef = useRef<HTMLDivElement>(null)
  
  // Version history throttling refs
  const lastVersionSaveTimeRef = useRef<number>(Date.now())
  const contentAtLastVersionRef = useRef<string>(initialContent)
  
  // Swipe gesture refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null)
  
  const hasUnsavedChanges = content !== originalContent

  // Reset state when node changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const meta = node.metadata as Record<string, unknown>
      const nodeContent = (meta.content as string) || ''
      const nodeHistory = (meta.history as VersionEntry[]) || []
      
      setContent(nodeContent)
      setOriginalContent(nodeContent)
      setHistory(nodeHistory)
      setMode(initialMode)
      setShowHistory(false)
      setShowPreview(true)
      setLastSaved(null)
      
      // Reset version tracking
      lastVersionSaveTimeRef.current = Date.now()
      contentAtLastVersionRef.current = nodeContent
    }
  }, [isOpen, node, initialMode])

  // Measure editor container height
  useEffect(() => {
    if (!editorContainerRef.current) return
    
    const observer = new ResizeObserver(entries => {
      const height = entries[0]?.contentRect.height
      if (height) {
        setEditorHeight(height)
      }
    })
    
    observer.observe(editorContainerRef.current)
    return () => observer.disconnect()
  }, [mode])

  /**
   * Check if we should create a new version in history
   * Based on time elapsed OR significant content change
   */
  const shouldCreateVersion = useCallback(() => {
    const timeSinceLastVersion = Date.now() - lastVersionSaveTimeRef.current
    const charDiff = Math.abs(content.length - contentAtLastVersionRef.current.length)
    
    // Also check actual content difference (not just length)
    const contentChanged = content !== contentAtLastVersionRef.current
    
    return contentChanged && (timeSinceLastVersion >= VERSION_TIME_THRESHOLD || charDiff >= VERSION_CHAR_THRESHOLD)
  }, [content])

  /**
   * Create a version history entry
   */
  const createVersionEntry = useCallback(() => {
    if (contentAtLastVersionRef.current === content) return null
    
    const newHistory = [
      { content: contentAtLastVersionRef.current, savedAt: new Date().toISOString() },
      ...history,
    ].slice(0, 10)
    
    // Update tracking refs
    lastVersionSaveTimeRef.current = Date.now()
    contentAtLastVersionRef.current = content
    
    return newHistory
  }, [content, history])

  /**
   * Perform save operation
   * Saves content always, but only creates version if throttle conditions met
   */
  const performSave = useCallback((forceVersion = false) => {
    if (!onSave || content === originalContent) return

    setIsSaving(true)

    // Determine if we should create a version
    const shouldVersion = forceVersion || shouldCreateVersion()
    let newHistory = history

    if (shouldVersion) {
      const versionHistory = createVersionEntry()
      if (versionHistory) {
        newHistory = versionHistory
        setHistory(newHistory)
      }
    }

    // Call save callback with current content and history
    onSave(content, newHistory)

    // Update state
    setOriginalContent(content)
    setLastSaved(new Date())
    setIsSaving(false)
  }, [content, originalContent, history, onSave, shouldCreateVersion, createVersionEntry])

  // Autosave with debounce (2 seconds after typing stops)
  useEffect(() => {
    if (mode !== 'edit' || content === originalContent || !onSave) return

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Set new timer
    saveTimerRef.current = setTimeout(() => {
      performSave(false) // Don't force version on autosave
    }, AUTOSAVE_DELAY)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [content, mode, originalContent, onSave, performSave])

  /**
   * Handle entering edit mode (from tap or swipe)
   */
  const enterEditMode = useCallback(() => {
    setMode('edit')
    setShowPreview(true) // Start with 20% preview visible
  }, [])

  /**
   * Handle exiting edit mode
   */
  const exitEditMode = useCallback(() => {
    // Save if there are changes
    if (hasUnsavedChanges && onSave) {
      // Check if we should force a version save on exit
      const charDiff = Math.abs(content.length - contentAtLastVersionRef.current.length)
      performSave(charDiff >= FINAL_SAVE_CHAR_THRESHOLD)
    }
    setMode('view')
  }, [hasUnsavedChanges, onSave, content, performSave])

  /**
   * Handle swipe in view mode (swipe left to edit)
   */
  const handleViewSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'left') {
      enterEditMode()
    }
  }, [enterEditMode])

  /**
   * Handle swipe in edit mode
   * - Swipe right: if preview showing, exit edit mode; else show preview
   * - Swipe left: hide preview (go to 100% edit)
   */
  const handleEditSwipe = useCallback((direction: 'left' | 'right') => {
    if (direction === 'right') {
      if (showPreview) {
        // Preview is showing - exit to view mode
        exitEditMode()
      } else {
        // Preview hidden - show it (go back to 80/20)
        setShowPreview(true)
      }
    } else if (direction === 'left') {
      // Hide preview - go to 100% edit mode
      setShowPreview(false)
    }
  }, [showPreview, exitEditMode])

  /**
   * Touch event handlers for swipe detection
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now(),
    }
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStartRef.current.x
    const deltaY = touch.clientY - touchStartRef.current.y
    const deltaTime = Date.now() - touchStartRef.current.time
    
    // Check if this is a horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5 && Math.abs(deltaX) >= SWIPE_THRESHOLD) {
      const velocity = Math.abs(deltaX) / deltaTime
      
      if (velocity >= SWIPE_VELOCITY_THRESHOLD || Math.abs(deltaX) >= SWIPE_THRESHOLD * 2) {
        e.preventDefault()
        e.stopPropagation()
        
        const direction = deltaX > 0 ? 'right' : 'left'
        
        if (mode === 'view') {
          handleViewSwipe(direction)
        } else {
          handleEditSwipe(direction)
        }
      }
    }
    
    touchStartRef.current = null
  }, [mode, handleViewSwipe, handleEditSwipe])

  /**
   * Handle tap on view content to enter edit mode
   */
  const handleViewContentClick = useCallback(() => {
    enterEditMode()
  }, [enterEditMode])

  /**
   * Handle close
   */
  const handleClose = useCallback(() => {
    // Save any pending changes with forced version if significant
    if (hasUnsavedChanges && onSave) {
      const charDiff = Math.abs(content.length - contentAtLastVersionRef.current.length)
      performSave(charDiff >= FINAL_SAVE_CHAR_THRESHOLD)
    }
    onClose()
  }, [hasUnsavedChanges, onSave, content, performSave, onClose])

  /**
   * Restore version from history
   */
  const handleRestoreVersion = useCallback((version: VersionEntry) => {
    setContent(version.content)
    setShowHistory(false)
    setMode('edit')
  }, [])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (showHistory) {
          setShowHistory(false)
        } else if (mode === 'edit') {
          exitEditMode()
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showHistory, mode, exitEditMode, handleClose])

  // Update "last saved" display periodically
  useEffect(() => {
    if (!lastSaved) return
    
    const interval = setInterval(() => {
      // Force re-render to update relative time
      setLastSaved(new Date(lastSaved.getTime()))
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [lastSaved])

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
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
            <div className="flex items-center justify-between px-4 py-3 border-b border-dark-200 bg-dark-100/90 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClose}
                  className="p-2 -ml-2 rounded-lg hover:bg-dark-200 transition-colors"
                  aria-label="Close"
                >
                  <ArrowLeft size={20} className="text-dark-400" />
                </button>
                <h2 className="font-semibold text-white truncate max-w-[200px] sm:max-w-none">
                  {node.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* History Button */}
                {history.length > 0 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      showHistory 
                        ? "bg-primary/20 text-primary" 
                        : "hover:bg-dark-200 text-dark-400"
                    )}
                    aria-label="Version history"
                    title={`${history.length} version${history.length > 1 ? 's' : ''} saved`}
                  >
                    <History size={18} />
                  </button>
                )}

                {/* Preview Toggle (only in edit mode) */}
                {mode === 'edit' && (
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      showPreview 
                        ? "bg-primary/20 text-primary" 
                        : "hover:bg-dark-200 text-dark-400"
                    )}
                    aria-label={showPreview ? 'Hide preview' : 'Show preview'}
                    title={showPreview ? 'Hide preview' : 'Show preview'}
                  >
                    {showPreview ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                )}

                {/* Done Button (only in edit mode) */}
                {mode === 'edit' && (
                  <button
                    onClick={exitEditMode}
                    className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                    aria-label="Done editing"
                  >
                    <Check size={18} />
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            <div 
              ref={editorContainerRef}
              className="flex-1 overflow-hidden relative"
            >
              {/* History Panel (overlay) */}
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="absolute right-0 top-0 bottom-0 w-72 bg-dark-100 border-l border-dark-200 z-10 flex flex-col"
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

              {/* View Mode */}
              {mode === 'view' && (
                <div 
                  className="h-full overflow-y-auto p-4 sm:p-6 cursor-pointer"
                  onClick={handleViewContentClick}
                >
                  <div className="max-w-3xl mx-auto">
                    {/* Swipe hint */}
                    <div className="flex items-center justify-center gap-2 text-xs text-dark-500 mb-4 pb-3 border-b border-dark-200/50">
                      <span>Tap or swipe left to edit</span>
                      <ChevronLeft size={14} />
                    </div>
                    <MDEditor.Markdown 
                      source={content || '*No content yet. Tap to start writing.*'} 
                      className="wmde-markdown"
                    />
                  </div>
                </div>
              )}

              {/* Edit Mode */}
              {mode === 'edit' && (
                <div className="h-full flex" data-color-mode="dark">
                  {/* Editor Section */}
                  <div className={cn(
                    "transition-all duration-200",
                    showPreview ? "w-4/5" : "w-full"
                  )}>
                    <MDEditor
                      value={content}
                      onChange={(val) => setContent(val || '')}
                      height={editorHeight}
                      preview="edit"
                      hideToolbar={false}
                      visibleDragbar={false}
                      commands={getToolbarCommands()}
                      extraCommands={getExtraToolbarCommands()}
                    />
                  </div>
                  
                  {/* Preview Sidebar (20%) */}
                  {showPreview && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="w-1/5 border-l border-dark-200 overflow-y-auto bg-dark/80 p-3"
                    >
                      <div className="text-xs text-dark-500 mb-2 flex items-center gap-1">
                        Preview
                        <ChevronRight size={12} />
                      </div>
                      <div className="text-xs opacity-70">
                        <MDEditor.Markdown 
                          source={content || '*No content*'} 
                          className="wmde-markdown wmde-markdown-preview-compact"
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-dark-200 bg-dark-100/90 backdrop-blur-sm text-xs">
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
                {mode === 'edit' && (
                  <span className="text-dark-500">
                    {showPreview ? 'Swipe → to view' : 'Swipe → for preview'}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

export default NoteViewerModal
