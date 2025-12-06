/**
 * ImmersivePaneModal - Fullscreen ViewEngine Container
 * 
 * A fullscreen modal for rendering ViewEngine content that needs to be
 * isolated from the global app swipe navigation (e.g., Kanban boards).
 * 
 * Features:
 * - Portal to document.body (escapes SwipeDeck transform context)
 * - Touch event isolation for internal gestures
 * - Back button integration
 * - Header with close button and title
 * 
 * @module engine/components/shared/ImmersivePaneModal
 */

import { useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import ViewEnginePane from '@/panes/ViewEnginePane'
import { useBackButton } from '@/hooks/useBackButton'

// =============================================================================
// TYPES
// =============================================================================

export interface ImmersivePaneModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** The context to render (e.g., 'user.projects') */
  context: string | null
  /** Display title for the header */
  title?: string
  /** Callback to close the modal */
  onClose: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export function ImmersivePaneModal({
  isOpen,
  context,
  title,
  onClose,
}: ImmersivePaneModalProps) {
  // Store isOpen in a ref so handler can access current value
  const isOpenRef = useRef(isOpen)
  isOpenRef.current = isOpen
  
  // Store onClose in a ref to avoid recreating handler
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Register back button handler at PRIORITY 100 (highest - modal level)
  useBackButton({
    id: 'immersive-modal',
    priority: 100,
    handler: () => {
      if (isOpenRef.current) {
        onCloseRef.current()
        return true
      }
      return false
    }
  })

  // Prevent body scroll when modal is open
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
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Touch event handlers to isolate from parent swipe
  const handleTouchTrap = useCallback((e: React.TouchEvent | React.PointerEvent) => {
    // Stop propagation to prevent SwipeDeck from receiving these events
    e.stopPropagation()
  }, [])

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && context && (
        <div 
          className="fixed inset-0 z-50 flex flex-col"
          onTouchStart={handleTouchTrap}
          onTouchMove={handleTouchTrap}
          onTouchEnd={handleTouchTrap}
          onPointerDown={handleTouchTrap}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-dark/95 backdrop-blur-sm"
            onClick={onClose}
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
              <h2 className="font-semibold text-white truncate">
                {title || 'App'}
              </h2>
              
              <button
                onClick={onClose}
                className="p-2 -mr-2 rounded-lg hover:bg-dark-200 transition-colors"
                aria-label="Close"
              >
                <X size={20} className="text-dark-400" />
              </button>
            </div>

            {/* Content Area - ViewEnginePane */}
            <div 
              className="flex-1 overflow-hidden relative bg-dark"
              onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing
            >
              <ViewEnginePane
                context={context}
                title={title}
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  // Portal to document.body to escape SwipeDeck's transform containing block
  return createPortal(modalContent, document.body)
}

export default ImmersivePaneModal
