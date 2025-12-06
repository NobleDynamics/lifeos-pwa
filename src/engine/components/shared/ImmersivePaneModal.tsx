/**
 * ImmersivePaneModal - Fullscreen ViewEngine Container
 * 
 * A fullscreen modal for rendering ViewEngine content that needs to be
 * isolated from the global app swipe navigation (e.g., Kanban boards).
 * 
 * Features:
 * - Portal to document.body (escapes SwipeDeck transform context)
 * - Touch event isolation for internal gestures
 * - Push/Pop history for proper Android back button support
 * - Header matching layout_app_shell pattern
 * - ContextMenu support for long-press actions
 * - Bottom spacing for drawer handle visibility
 * 
 * @module engine/components/shared/ImmersivePaneModal
 */

import { useEffect, useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, LayoutGrid, Plus, MoreVertical } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import ViewEnginePane from '@/panes/ViewEnginePane'
import { pushBackState, popBackState, isInHistoryStack } from '@/hooks/useBackButton'
import { ContextMenuProvider, ContextMenuSheet } from '@/engine'
import { DRAWER_HANDLE_HEIGHT } from '@/components/Layout'
import { cn } from '@/lib/utils'

// =============================================================================
// CONSTANTS
// =============================================================================

const HEADER_HEIGHT = 64 // px - height of the modal header
const BACK_STATE_ID = 'immersive-modal'

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

// Interface for extended ViewEnginePane props
interface ViewEnginePaneExtended {
  context: string
  title?: string
  /** Disable internal fixed positioning (when inside immersive modal) */
  disableImmersiveMode?: boolean
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
  // Track if we've pushed history for this open session
  const hasOpenedRef = useRef(false)
  
  // Action dropdown state
  const [showActionMenu, setShowActionMenu] = useState(false)

  // Push history when opening, clean up when closing
  useEffect(() => {
    if (isOpen && !hasOpenedRef.current) {
      // Push history state for Android back button
      pushBackState('modal', BACK_STATE_ID, () => {
        onClose()
      })
      hasOpenedRef.current = true
      console.log('[ImmersiveModal] Opened - pushed history state')
    }
    
    if (!isOpen && hasOpenedRef.current) {
      // Clean up if closed via something other than back button
      if (isInHistoryStack(BACK_STATE_ID)) {
        // Modal was closed programmatically, need to pop history
        popBackState(BACK_STATE_ID)
      }
      hasOpenedRef.current = false
      console.log('[ImmersiveModal] Closed')
    }
  }, [isOpen, onClose])

  // Handle close button click
  const handleCloseClick = useCallback(() => {
    if (isInHistoryStack(BACK_STATE_ID)) {
      // Use history.back() to properly pop the state
      popBackState(BACK_STATE_ID)
    } else {
      // Fallback: just call onClose
      onClose()
    }
  }, [onClose])

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
        handleCloseClick()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleCloseClick])

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

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            className="relative flex flex-col w-full h-full"
          >
            {/* Header - Fixed height, matches layout_app_shell pattern */}
            <header 
              className="flex-shrink-0 px-4 pt-4 pb-2 safe-top z-10 bg-dark-100/90 backdrop-blur-sm border-b border-dark-200"
              style={{ minHeight: `${HEADER_HEIGHT}px` }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {/* Back Button */}
                  <button
                    onClick={handleCloseClick}
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

                {/* Action Button */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowActionMenu(!showActionMenu)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg",
                      "text-sm font-medium text-white",
                      "bg-gradient-to-r from-cyan-600 to-cyan-500",
                      "hover:from-cyan-500 hover:to-cyan-400",
                      "active:scale-95 transition-all duration-150",
                      "shadow-lg shadow-cyan-500/20"
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
                      <div
                        className={cn(
                          "absolute right-0 top-full mt-2 z-50",
                          "min-w-[160px] py-2 rounded-lg shadow-lg",
                          "bg-dark-100 border border-dark-300"
                        )}
                      >
                        <button
                          onClick={() => {
                            setShowActionMenu(false)
                            // TODO: Implement add card action
                            console.log('[ImmersiveModal] Add card clicked')
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-left text-sm",
                            "flex items-center gap-3",
                            "text-white hover:bg-dark-200 transition-colors"
                          )}
                        >
                          <Plus size={16} className="text-cyan-400" />
                          <span>Add Card</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowActionMenu(false)
                            // TODO: Implement add column action
                            console.log('[ImmersiveModal] Add column clicked')
                          }}
                          className={cn(
                            "w-full px-4 py-2.5 text-left text-sm",
                            "flex items-center gap-3",
                            "text-white hover:bg-dark-200 transition-colors"
                          )}
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

            {/* Content Area - Flex-grow with proper height constraints */}
            <main 
              className="flex-1 min-h-0 flex flex-col relative bg-dark overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ContextMenuProvider>
                {/* Inner wrapper to constrain height for child components */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ViewEnginePane
                    context={context}
                    title={title}
                    // @ts-ignore - Extended prop for immersive context
                    disableImmersiveMode={true}
                  />
                </div>
                <ContextMenuSheet />
              </ContextMenuProvider>
            </main>

            {/* Bottom spacer for drawer handle visibility - fixed at bottom */}
            <footer 
              className="flex-shrink-0 bg-dark-100/50"
              style={{ height: `${DRAWER_HANDLE_HEIGHT}px`, minHeight: `${DRAWER_HANDLE_HEIGHT}px` }}
              aria-hidden="true"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  // Portal to document.body to escape SwipeDeck's transform containing block
  return createPortal(modalContent, document.body)
}

export default ImmersivePaneModal
