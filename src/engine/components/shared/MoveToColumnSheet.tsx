/**
 * MoveToColumnSheet - Column Picker for Kanban Card Movement
 * 
 * A bottom sheet component that displays sibling columns within the same board,
 * allowing users to move a card from one column to another.
 * 
 * Features:
 * - Shows all sibling columns (same parent)
 * - Highlights current column (disabled)
 * - Colored indicators matching column_color
 * - Triggers onMoveNode callback on selection
 * 
 * @module engine/components/shared/MoveToColumnSheet
 */

import { useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Columns3, Check } from 'lucide-react'
import { useBackButton } from '@/hooks/useBackButton'
import { cn } from '@/lib/utils'
import { DRAWER_HANDLE_HEIGHT } from '@/components/Layout'
import type { Node } from '../../types/node'

// =============================================================================
// TYPES
// =============================================================================

export interface MoveToColumnSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean
  
  /** The node (card) being moved */
  node: Node | null
  
  /** Sibling columns to choose from */
  columns: Node[]
  
  /** Current column ID (will be highlighted/disabled) */
  currentColumnId: string | null
  
  /** Callback when a column is selected */
  onSelectColumn: (columnId: string) => void
  
  /** Callback to close the sheet */
  onClose: () => void
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * MoveToColumnSheet - Bottom sheet for moving cards between Kanban columns
 */
export function MoveToColumnSheet({
  isOpen,
  node,
  columns,
  currentColumnId,
  onSelectColumn,
  onClose,
}: MoveToColumnSheetProps) {
  // Handle back button to close
  useBackButton({
    id: 'move-to-column-sheet',
    priority: 40, // Higher than context menu (35)
    handler: () => {
      if (isOpen) {
        onClose()
        return true
      }
      return false
    }
  })

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle column selection
  const handleSelectColumn = useCallback((columnId: string) => {
    if (columnId === currentColumnId) return // Don't move to same column
    onSelectColumn(columnId)
    onClose()
  }, [currentColumnId, onSelectColumn, onClose])

  if (!node || columns.length === 0) {
    return null
  }

  return (
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
            onClick={onClose}
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

            {/* Header */}
            <div className="px-4 py-3 border-b border-dark-300">
              <div className="flex items-center gap-2">
                <Columns3 size={18} className="text-cyan-400" />
                <h3 className="text-sm font-medium text-white">
                  Move to Column
                </h3>
              </div>
              <p className="text-xs text-dark-400 mt-1 truncate">
                Moving: {node.title}
              </p>
            </div>

            {/* Column List */}
            <div className="py-2 max-h-[50vh] overflow-y-auto">
              {columns.map((column) => {
                const columnColor = (column.metadata?.column_color as string) || '#06b6d4'
                const isCurrentColumn = column.id === currentColumnId
                const childCount = column.children?.length || 0

                return (
                  <button
                    key={column.id}
                    onClick={() => handleSelectColumn(column.id)}
                    disabled={isCurrentColumn}
                    className={cn(
                      "w-full px-4 py-3 text-left",
                      "flex items-center gap-3",
                      "transition-colors",
                      isCurrentColumn
                        ? "opacity-50 cursor-not-allowed bg-dark-200/30"
                        : "hover:bg-dark-200/50 active:bg-dark-200"
                    )}
                  >
                    {/* Column Color Indicator */}
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: columnColor }}
                    />

                    {/* Column Name */}
                    <span className="flex-1 text-sm font-medium text-white truncate">
                      {column.title}
                    </span>

                    {/* Child Count Badge */}
                    <span className="text-xs text-dark-400">
                      {childCount} {childCount === 1 ? 'item' : 'items'}
                    </span>

                    {/* Current Column Check */}
                    {isCurrentColumn && (
                      <Check size={16} className="text-cyan-400 flex-shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>

            {/* Cancel Button */}
            <div className="p-4 border-t border-dark-300">
              <button
                onClick={onClose}
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
}

export default MoveToColumnSheet
