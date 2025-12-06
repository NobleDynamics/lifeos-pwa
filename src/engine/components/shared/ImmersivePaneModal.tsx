/**
 * ImmersivePaneModal - Fullscreen ViewEngine Container
 * 
 * A fullscreen modal for rendering ViewEngine content that needs to be
 * isolated from the global app swipe navigation (e.g., Kanban boards).
 * 
 * Features:
 * - Portal to document.body (escapes SwipeDeck transform context)
 * - Touch event isolation for internal gestures
 * - Back button integration with smart navigation
 * - Header matching layout_app_shell pattern
 * - ContextMenu support for long-press actions
 * - Bottom padding for drawer handle visibility
 * 
 * @module engine/components/shared/ImmersivePaneModal
 */

import { useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, LayoutGrid, Plus } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import ViewEnginePane from '@/panes/ViewEnginePane'
import { useBackButton } from '@/hooks/useBackButton'
import { ContextMenuProvider, ContextMenuSheet } from '@/engine'
import { DRAWER_HANDLE_HEIGHT } from '@/components/Layout'
import { cn } from '@/lib/utils'

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
  /** Icon name (Lucide) for the header */
  icon?: string
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
  icon,
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

  // Get icon component
  const iconName = icon || 'LayoutGrid'
  // @ts-ignore - Dynamic icon lookup
  const IconComponent = LucideIcons[iconName] || LayoutGrid

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
          />

          {/* Modal Content - Full height flex container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative flex flex-col h-full"
          >
            {/* Header - Matches layout_app_shell pattern */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2 safe-top z-10 bg-dark-100/90 backdrop-blur-sm border-b border-dark-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Back Button */}
                  <button
                    onClick={onClose}
                    className="p-1 -ml-1 rounded-lg hover:bg-dark-200 transition-colors"
                    aria-label="Go back"
                  >
                    <ChevronLeft size={24} className="text-dark-400" />
                  </button>

                  {/* App Icon */}
                  <IconComponent size={24} className="text-primary flex-shrink-0" />

                  {/* Title */}
                  <h1 className="text-xl font-bold truncate text-white">
                    {title || 'App'}
                  </h1>
                </div>

                {/* Action Button Placeholder - Can be extended for "+ Add Card" etc. */}
                {/* Future: Accept actionConfig prop to enable this */}
                {/*
                <button
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                    "text-sm font-medium text-white",
                    "bg-gradient-to-r from-cyan-600 to-cyan-500",
                    "hover:from-cyan-500 hover:to-cyan-400",
                    "active:scale-95 transition-all duration-150",
                    "shadow-lg shadow-cyan-500/20"
                  )}
                >
                  <Plus size={16} />
                  Add
                </button>
                */}
              </div>
            </div>

            {/* Content Area - ViewEnginePane with ContextMenu support */}
            {/* 
              Height structure:
              - flex-1 min-h-0: Fill remaining space after header
              - Inner div with calculated height: Account for drawer handle
              - overflow-hidden on outer, overflow managed by inner components
            */}
            <div 
              className="flex-1 min-h-0 flex flex-col relative bg-dark"
              onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing
            >
              <div 
                className="flex-1 min-h-0 overflow-hidden"
                style={{ marginBottom: `${DRAWER_HANDLE_HEIGHT}px` }}
              >
                <ContextMenuProvider>
                  <ViewEnginePane
                    context={context}
                    title={title}
                  />
                  <ContextMenuSheet />
                </ContextMenuProvider>
              </div>
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
