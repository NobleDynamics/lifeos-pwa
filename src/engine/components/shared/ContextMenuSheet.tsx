/**
 * ContextMenuSheet - Metadata-Driven Context Menu
 * 
 * Bottom sheet component that displays context menu options from JSONB metadata.
 * Uses ContextMenuContext for state management.
 * 
 * Features:
 * - Mobile-first bottom sheet design
 * - Options from metadata (parent or item level)
 * - Dynamic icons and colors
 * - Dividers between option groups
 * - Conditional show_if filtering
 * 
 * @module engine/components/shared/ContextMenuSheet
 */

import { useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Folder } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { useContextMenu } from '../../context/ContextMenuContext'
import { shouldShowOption } from '../../types/actions'
import { useBackButton } from '@/hooks/useBackButton'
import { cn } from '@/lib/utils'
import { DRAWER_HANDLE_HEIGHT } from '@/components/Layout'

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

/**
 * Render a Lucide icon by name dynamically
 */
function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name]
  if (!IconComponent) {
    return <Folder className={className} style={style} />
  }
  return <IconComponent className={className} style={style} />
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * ContextMenuSheet - Renders context menu options as a bottom sheet
 * 
 * This component reads from ContextMenuContext and renders options
 * from the resolved ContextMenuConfig.
 * 
 * @example
 * // Place once in your app near the root:
 * <ContextMenuProvider>
 *   <App />
 *   <ContextMenuSheet />
 * </ContextMenuProvider>
 */
export function ContextMenuSheet() {
  const { state, hideContextMenu, handleOptionClick } = useContextMenu()
  const { isOpen, node, config } = state
  
  // Filter options based on show_if conditions
  const visibleOptions = config?.options.filter(option => {
    if (!option.show_if || !node) return true
    return shouldShowOption(option, node.metadata)
  }) || []
  
  // Handle back button to close
  useBackButton({
    id: 'context-menu-sheet',
    priority: 35, // Higher than form sheet (30)
    handler: () => {
      if (isOpen) {
        hideContextMenu()
        return true
      }
      return false
    }
  })
  
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        hideContextMenu()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, hideContextMenu])
  
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  // Don't render if no node or config
  if (!node || !config || visibleOptions.length === 0) {
    return null
  }
  
  // Use portal to render outside SwipeDeck transform context
  // This ensures fixed positioning works correctly relative to viewport
  const menuContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={hideContextMenu}
          />
          
          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 400,
            }}
            className="relative w-full max-w-lg bg-dark-100 rounded-t-2xl shadow-xl overflow-hidden"
            style={{ marginBottom: `${DRAWER_HANDLE_HEIGHT}px` }}
          >
            {/* Drag Handle */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 bg-dark-400 rounded-full" />
            </div>
            
            {/* Header - Show node title */}
            <div className="px-4 py-3 border-b border-dark-300">
              <h3 className="text-sm font-medium text-white truncate">
                {node.title}
              </h3>
              {node.metadata?.description && (
                <p className="text-xs text-dark-400 truncate mt-0.5">
                  {node.metadata.description as string}
                </p>
              )}
            </div>
            
            {/* Options List */}
            <div className="py-2 max-h-[50vh] overflow-y-auto">
              {visibleOptions.map((option, index) => {
                const showDivider = option.divider_before && index > 0
                
                return (
                  <div key={option.id}>
                    {/* Divider */}
                    {showDivider && (
                      <div className="my-2 border-t border-dark-300" />
                    )}
                    
                    {/* Option Button */}
                    <button
                      onClick={() => handleOptionClick(option)}
                      className={cn(
                        "w-full px-4 py-3 text-left",
                        "flex items-center gap-3",
                        "hover:bg-dark-200/50 active:bg-dark-200 transition-colors"
                      )}
                    >
                      {/* Icon */}
                      {option.icon && (
                        <DynamicIcon
                          name={option.icon}
                          className="w-5 h-5 flex-shrink-0"
                          style={{ color: option.color || '#ffffff' }}
                        />
                      )}
                      
                      {/* Label */}
                      <span
                        className="text-sm font-medium"
                        style={{ color: option.color || '#ffffff' }}
                      >
                        {option.label}
                      </span>
                    </button>
                  </div>
                )
              })}
            </div>
            
            {/* Cancel Button */}
            <div className="p-4 border-t border-dark-300">
              <button
                onClick={hideContextMenu}
                className={cn(
                  "w-full py-3 rounded-lg",
                  "text-sm font-medium text-dark-400",
                  "bg-dark-200 hover:bg-dark-300 transition-colors"
                )}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

  // Portal to document.body to escape SwipeDeck's transform containing block
  return createPortal(menuContent, document.body)
}

export default ContextMenuSheet
