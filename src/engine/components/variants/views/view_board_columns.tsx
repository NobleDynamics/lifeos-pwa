/**
 * ViewBoardColumns Variant Component
 * 
 * A horizontal scrolling board container for Kanban-style layouts.
 * Each child is rendered as a column with snap scrolling.
 * 
 * CRITICAL: Implements Touch Trap to prevent horizontal swipes from
 * bubbling up to the Global App Navigation slider.
 * 
 * @module engine/components/variants/views/view_board_columns
 */

import { useRef, useState, useEffect, useCallback } from 'react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { renderChildren } from '../../ViewEngine'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * ViewBoardColumns - Horizontal snap-scroll board for Kanban layouts.
 * 
 * Structure:
 * ┌────────────────────────────────────────────────────────────────────┐
 * │ [Optional Header: headline]                                        │
 * ├────────────────────────────────────────────────────────────────────┤
 * │ ◄═══════════════════ HORIZONTAL SNAP SCROLL ══════════════════════►│
 * │                                                                     │
 * │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
 * │  │   Column 1      │  │   Column 2      │  │   Column 3      │    │
 * │  │   ─────────     │  │   ─────────     │  │   ─────────     │    │
 * │  │   [cards...]    │  │   [cards...]    │  │   [cards...]    │    │
 * │  │                 │  │                 │  │                 │    │
 * │  │                 │  │                 │  │                 │    │
 * │  │ ═══ color ════  │  │ ═══ color ════  │  │ ═══ color ════  │    │
 * │  └─────────────────┘  └─────────────────┘  └─────────────────┘    │
 * │                                                                     │
 * ├────────────────────────────────────────────────────────────────────┤
 * │                        ● ○ ○  (dot indicators)                     │
 * └────────────────────────────────────────────────────────────────────┘
 * 
 * Features:
 * - 85% column width for peek effect
 * - Snap scrolling: snap-x snap-mandatory
 * - Touch Trap: prevents global swipe interference
 * - Column header with title + count badge
 * - Colored bottom border per column (from column_color metadata)
 * - Dot indicators showing current column position
 * 
 * Slots:
 * - headline: Board title (optional, uses node.title as fallback)
 * - show_header: Whether to show board header (default: false for boards)
 * - column_gap: Gap between columns in px (default: 12)
 */
export function ViewBoardColumns({ node }: VariantComponentProps) {
  const { depth, rootId, rootNode } = useNode()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [currentColumnIndex, setCurrentColumnIndex] = useState(0)

  // Slots
  const headline = useSlot<string>('headline') ?? node.title
  const showHeader = useSlot<boolean>('show_header', false)
  const columnGap = useSlot<number>('column_gap', 12)

  const columns = node.children || []
  const columnCount = columns.length

  /**
   * Touch Trap Handler
   * 
   * CRITICAL: Prevents horizontal swipe gestures from bubbling up to 
   * the Global App Navigation (which uses horizontal swipes to switch apps).
   */
  const handleTouchTrap = (e: React.TouchEvent | React.PointerEvent) => {
    e.stopPropagation()
  }

  /**
   * Handle scroll to update current column index for dot indicators
   */
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || columnCount === 0) return
    
    const container = scrollContainerRef.current
    const scrollLeft = container.scrollLeft
    const columnWidth = container.clientWidth * 0.85 + columnGap
    const newIndex = Math.round(scrollLeft / columnWidth)
    
    setCurrentColumnIndex(Math.min(Math.max(newIndex, 0), columnCount - 1))
  }, [columnCount, columnGap])

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  /**
   * Scroll to a specific column when dot indicator is clicked
   */
  const scrollToColumn = (index: number) => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const columnWidth = container.clientWidth * 0.85 + columnGap
    
    container.scrollTo({
      left: index * columnWidth,
      behavior: 'smooth'
    })
  }

  return (
    <div
      className="flex flex-col h-full"
      data-variant="view_board_columns"
      data-node-id={node.id}
    >
      {/* Optional Header */}
      {showHeader && headline && (
        <div className="px-4 py-3 border-b border-dark-200">
          <h2 className="text-base font-semibold text-white">{headline}</h2>
        </div>
      )}

      {/* Board Container with Horizontal Scroll */}
      <div className="flex-1 min-h-0 flex flex-col">
        {columnCount > 0 ? (
          <>
            {/* Columns Scroll Container */}
            <div
              ref={scrollContainerRef}
              onTouchStart={handleTouchTrap}
              onPointerDown={handleTouchTrap}
              className={cn(
                // Horizontal scroll
                "flex-1 flex overflow-x-auto overflow-y-hidden",
                // Snap scrolling
                "snap-x snap-mandatory",
                // Hide scrollbar
                "scrollbar-hide",
                // Padding
                "px-4 py-4",
                // Smooth momentum scrolling on iOS
                "-webkit-overflow-scrolling-touch"
              )}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                gap: `${columnGap}px`,
              }}
            >
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  depth={depth}
                  rootId={rootId}
                  rootNode={rootNode}
                />
              ))}
            </div>

            {/* Dot Indicators */}
            {columnCount > 1 && (
              <div className="flex justify-center gap-2 py-3 border-t border-dark-200/50">
                {columns.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToColumn(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      index === currentColumnIndex
                        ? "bg-cyan-400 scale-110"
                        : "bg-dark-400 hover:bg-dark-300"
                    )}
                    aria-label={`Go to column ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-dark-400 text-sm italic">
            No columns
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * KanbanColumn - Individual column within the board
 * 
 * Renders a vertical column with:
 * - Header (title + count)
 * - Scrollable card area
 * - Colored bottom border
 */
interface KanbanColumnProps {
  column: import('../../../types/node').Node
  depth: number
  rootId: string
  rootNode: import('../../../types/node').Node | null
}

function KanbanColumn({ column, depth, rootId, rootNode }: KanbanColumnProps) {
  const columnColor = (column.metadata?.column_color as string) || '#06b6d4'
  const childCount = column.children?.length || 0

  return (
    <div
      className={cn(
        // Column sizing - 85% of viewport width for peek effect
        "flex-shrink-0 w-[85%] max-w-[340px]",
        // Snap alignment
        "snap-start",
        // Column styling
        "flex flex-col",
        "bg-dark-100/60 backdrop-blur-sm",
        "rounded-xl",
        "border border-dark-200",
        // Full height
        "h-full"
      )}
      data-column-id={column.id}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-dark-200/50">
        <h3 className="font-medium text-sm text-white truncate">
          {column.title}
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full bg-dark-200/80"
          style={{ color: columnColor }}
        >
          {childCount}
        </span>
      </div>

      {/* Cards Container - Vertical Scroll */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-2">
        {childCount > 0 ? (
          renderChildren(column, depth + 1, rootId, rootNode)
        ) : (
          // Empty state - just blank space, no placeholder
          <div className="h-full" />
        )}
      </div>

      {/* Colored Bottom Border */}
      <div
        className="h-1 rounded-b-xl"
        style={{ backgroundColor: columnColor }}
      />
    </div>
  )
}
