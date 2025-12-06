/**
 * CardKanbanDetails Variant Component
 * 
 * A Kanban card for task/item display with text details, priority indicator,
 * due date, assignee, and tags. Designed for use within view_board_columns.
 * 
 * Supports long-press for context menu with "Move to..." option.
 * 
 * @module engine/components/variants/cards/card_kanban_details
 */

import { Calendar, User } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { useContextMenuTrigger } from '../../../context/ContextMenuContext'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/utils'

/**
 * CardKanbanDetails - Text-based Kanban card with priority and metadata.
 * 
 * Structure:
 * ┌─────────────────────────────────────┐
 * │ ▌ headline                          │  ← Left border = priority_color
 * │   subtext (truncated 2 lines)       │
 * │                                     │
 * │   [📅 due_date] [👤 assignee]       │  ← Bottom row
 * │   [tag1] [tag2] [tag3]              │
 * └─────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Card title (default: node.title)
 * - subtext: Description text (optional)
 * - due_date: ISO date string for due date badge (optional)
 * - assignee: Avatar initials or name (optional)
 * - priority_color: Hex color for left border (optional, default: transparent)
 * - tags: Array of tag strings (optional)
 * 
 * Interactions:
 * - Long press → Opens context menu
 * - Click → Could navigate or open detail (via metadata.target_id)
 */
export function CardKanbanDetails({ node }: VariantComponentProps) {
  const { parentId, findNodeById } = useNode()
  
  // Get parent node for context menu inheritance
  const parentNode = parentId ? findNodeById(parentId) : null

  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const dueDate = useSlot<string>('due_date')
  const assignee = useSlot<string>('assignee')
  const priorityColor = useSlot<string>('priority_color')
  const tags = useSlot<string[]>('tags') || []

  // Context menu trigger
  const triggerContextMenu = useContextMenuTrigger(node, parentNode)
  
  // Long press handlers
  const longPressHandlers = useLongPress({
    onLongPress: (e) => {
      triggerContextMenu(e.clientX, e.clientY)
    },
    onClick: () => {
      // Could handle navigation here if target_id is set
      // For now, just a placeholder
    },
    delay: 500,
  })

  // Format due date for display
  const formattedDueDate = dueDate ? formatDueDate(dueDate) : null
  const isOverdue = dueDate ? new Date(dueDate) < new Date() : false

  return (
    <div
      className={cn(
        // Card base
        "rounded-lg overflow-hidden",
        "bg-dark-200/80 backdrop-blur-sm",
        "border border-dark-300",
        "transition-all duration-150",
        // Hover state
        "hover:border-dark-200 hover:bg-dark-200",
        // Active/pressed state
        "active:scale-[0.98]",
        // Cursor
        "cursor-pointer select-none"
      )}
      data-variant="card_kanban_details"
      data-node-id={node.id}
      {...longPressHandlers}
    >
      {/* Card Content with Priority Border */}
      <div
        className="flex"
        style={{
          borderLeftWidth: priorityColor ? '3px' : '0',
          borderLeftColor: priorityColor || 'transparent',
        }}
      >
        <div className="flex-1 p-3 space-y-2">
          {/* Headline */}
          <h4 className="font-medium text-sm text-white leading-tight line-clamp-2">
            {headline}
          </h4>

          {/* Subtext */}
          {subtext && (
            <p className="text-xs text-dark-400 line-clamp-2">
              {subtext}
            </p>
          )}

          {/* Metadata Row: Due Date + Assignee */}
          {(formattedDueDate || assignee) && (
            <div className="flex items-center gap-3 pt-1">
              {/* Due Date Badge */}
              {formattedDueDate && (
                <span
                  className={cn(
                    "flex items-center gap-1 text-xs",
                    isOverdue ? "text-red-400" : "text-dark-400"
                  )}
                >
                  <Calendar size={12} />
                  {formattedDueDate}
                </span>
              )}

              {/* Assignee Badge */}
              {assignee && (
                <span className="flex items-center gap-1 text-xs text-dark-400">
                  <User size={12} />
                  {assignee}
                </span>
              )}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded",
                    "bg-dark-300/80 text-dark-400"
                  )}
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 text-dark-500">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Format a date string for display in the card
 */
function formatDueDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    
    // Otherwise, format as short date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  } catch {
    return dateString
  }
}
