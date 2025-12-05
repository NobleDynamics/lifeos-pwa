/**
 * NoteViewerModal - Fullscreen Markdown Note Viewer/Editor
 * 
 * A fullscreen lightbox modal for viewing and editing markdown notes.
 * Features:
 * - View mode with rendered markdown
 * - Edit mode with @uiw/react-md-editor
 * - Autosave with 2-second debounce
 * - Version history (last 10 versions)
 * 
 * @module engine/components/shared/NoteViewerModal
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Edit3, Check, History, X, Clock } from 'lucide-react'
import MDEditor from '@uiw/react-md-editor'
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
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  
  // Refs
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
      setLastSaved(null)
    }
  }, [isOpen, node, initialMode])

  // Autosave with debounce (2 seconds after typing stops)
  useEffect(() => {
    if (mode !== 'edit' || content === originalContent || !onSave) return

    // Clear existing timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
    }

    // Set new timer
    saveTimerRef.current = setTimeout(() => {
      performSave()
    }, 2000)

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
      }
    }
  }, [content, mode])

  // Perform save operation
  const performSave = useCallback(() => {
    if (!onSave || content === originalContent) return

    setIsSaving(true)

    // Add previous version to history (keep last 10)
    const newHistory = [
      { content: originalContent, savedAt: new Date().toISOString() },
      ...history,
    ].slice(0, 10)

    // Call save callback
    onSave(content, newHistory)

    // Update state
    setHistory(newHistory)
    setOriginalContent(content)
    setLastSaved(new Date())
    setIsSaving(false)
  }, [content, originalContent, history, onSave])

  // Handle mode toggle
  const handleModeToggle = () => {
    if (mode === 'edit') {
      // Switching to view - save if there are changes
      if (hasUnsavedChanges && onSave) {
        performSave()
      }
      setMode('view')
    } else {
      setMode('edit')
    }
  }

  // Handle close
  const handleClose = () => {
    // Save any pending changes
    if (hasUnsavedChanges && onSave) {
      performSave()
    }
    onClose()
  }

  // Restore version from history
  const handleRestoreVersion = (version: VersionEntry) => {
    setContent(version.content)
    setShowHistory(false)
    setMode('edit')
  }

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
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, showHistory])

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

                {/* Edit/Save Toggle */}
                <button
                  onClick={handleModeToggle}
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    mode === 'edit'
                      ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      : "hover:bg-dark-200 text-dark-400"
                  )}
                  aria-label={mode === 'edit' ? 'Save and view' : 'Edit'}
                >
                  {mode === 'edit' ? <Check size={18} /> : <Edit3 size={18} />}
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
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
                <div className="h-full overflow-y-auto p-4 sm:p-6">
                  <div className="max-w-3xl mx-auto">
                    <MDEditor.Markdown 
                      source={content || '*No content yet. Click edit to start writing.*'} 
                      className="wmde-markdown"
                    />
                  </div>
                </div>
              )}

              {/* Edit Mode */}
              {mode === 'edit' && (
                <div className="h-full" data-color-mode="dark">
                  <MDEditor
                    value={content}
                    onChange={(val) => setContent(val || '')}
                    height="100%"
                    preview="live"
                    hideToolbar={false}
                    visibleDragbar={false}
                  />
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
                {history.length > 0 && (
                  <span className="text-dark-500">
                    {history.length} version{history.length > 1 ? 's' : ''} saved
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
