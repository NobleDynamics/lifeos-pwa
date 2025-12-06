/**
 * ImmersivePaneModal - Fullscreen ViewEngine Container (Simplified)
 * 
 * A modal for rendering ViewEngine content that needs to be
 * isolated from the global app swipe navigation (e.g., Kanban boards).
 * 
 * Features:
 * - Portal to document.body (escapes SwipeDeck transform context)
 * - Touch event isolation for internal gestures
 * - Simple close handling (no complex history management)
 * - Leaves 60px at bottom for drawer handle visibility
 * 
 * @module engine/components/shared/ImmersivePaneModal
 */

import { useEffect, useCallback, useState } from 'react'
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
// CONSTANTS
// =============================================================================

const HEADER_HEIGHT = 60 // px

// =============================================================================
// TYPES
// =============================================================================

export interface ImmersivePaneModalProps {
  isOpen: boolean
  context: string | null
  title?: string
  icon?: string
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
  const [showActionMenu, setShowActionMenu] = useState(false)

  // Simple back button handler - highest priority when modal is open
  useBackButton(isOpen ? {
    id: 'immersive-modal',
    priority: 100,
    handler: () => {
      console.log('[ImmersiveModal] Back handler called, closing modal')
      onClose()
      return true
    }
  } : undefined)

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
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Touch trap to prevent SwipeDeck interference
  const handleTouchTrap = useCallback((e: React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation()
  }, [])

  // Get icon component
  const iconName = icon || 'LayoutGrid'
  // @ts-ignore - Dynamic icon lookup
  const IconComponent = LucideIcons[iconName] || LayoutGrid

  // Calculate content height
  const contentHeight = `calc(100vh - ${HEADER_HEIGHT}px - ${DRAWER_HANDLE_HEIGHT}px - env(safe-area-inset-top, 0px))`

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && context && (
        <div 
          className="fixed inset-x-0 top-0 z-40 flex flex-col bg-dark"
          style={{ 
            bottom: `${DRAWER_HANDLE_HEIGHT}px`,
            height: `calc(100vh - ${DRAWER_HANDLE_HEIGHT}px)`
          }}
          onTouchStart={handleTouchTrap}
          onTouchMove={handleTouchTrap}
          onTouchEnd={handleTouchTrap}
          onPointerDown={handleTouchTrap}
        >
          {/* Backdrop - only covers the modal area */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-dark"
          />

          {/* Content Container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative flex flex-col h-full"
          >
            {/* Header */}
            <header 
              className="flex-shrink-0 px-4 pt-4 pb-2 safe-top bg-dark-100 border-b border-dark-200"
              style={{ height: `${HEADER_HEIGHT}px` }}
            >
              <div className="flex items-center justify-between gap-3 h-full">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Back Button - direct close */}
                  <button
                    onClick={onClose}
                    className="p-2 -ml-2 rounded-lg hover:bg-dark-200 active:bg-dark-300 transition-colors"
                    aria-label="Close"
                    type="button"
                  >
                    <ChevronLeft size={24} className="text-dark-400" />
                  </button>

                  {/* App Icon */}
                  <IconComponent size={22} className="text-primary flex-shrink-0" />

                  {/* Title */}
                  <h1 className="text-lg font-bold truncate text-white">
                    {title || 'App'}
                  </h1>
                </div>

                {/* Action Button */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                      "text-sm font-medium text-white",
                      "bg-gradient-to-r from-cyan-600 to-cyan-500",
                      "hover:from-cyan-500 hover:to-cyan-400",
                      "active:scale-95 transition-all duration-150"
                    )}
                    type="button"
                  >
                    <Plus size={16} />
                    Add
                  </button>

                  {/* Action Dropdown */}
                  {showActionMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowActionMenu(false)}
                      />
                      <div className="absolute right-0 top-full mt-2 z-50 min-w-[160px] py-2 rounded-lg shadow-lg bg-dark-100 border border-dark-300">
                        <button
                          onClick={() => {
                            setShowActionMenu(false)
                            console.log('[ImmersiveModal] Add card clicked')
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-white hover:bg-dark-200"
                        >
                          <Plus size={16} className="text-cyan-400" />
                          <span>Add Card</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowActionMenu(false)
                            console.log('[ImmersiveModal] Add column clicked')
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-white hover:bg-dark-200"
                        >
                          <LayoutGrid size={16} className="text-purple-400" />
                          <span>Add Column</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Content Area - Flex container to properly pass height */}
            <div 
              className="flex-1 min-h-0 relative bg-dark flex flex-col"
            >
              <ContextMenuProvider>
                <div className="flex-1 min-h-0 w-full overflow-hidden flex flex-col">
                  <ViewEnginePane
                    context={context}
                    title={title}
                    // @ts-ignore - Extended prop
                    disableImmersiveMode={true}
                  />
                </div>
                <ContextMenuSheet />
              </ContextMenuProvider>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}

export default ImmersivePaneModal
