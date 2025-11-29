/**
 * ListRow Variant Component
 * 
 * Renders a node as a single row in a list view.
 * Typically used for items (tasks, recipes, etc.).
 * 
 * @module engine/components/variants/ListRow
 */

import { Circle, CheckCircle2, PlayCircle } from 'lucide-react'
import type { VariantComponentProps } from '../../registry'
import { useNode, useNodeMeta } from '../../context/NodeContext'
import { cn } from '@/lib/utils'

// Status icons mapping
const statusIcons = {
  active: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
}

/**
 * ListRow - Renders an item as a list row.
 * 
 * Features:
 * - Status indicator icon (circle/play/check)
 * - Title with proper truncation
 * - Priority badge (if set)
 * - Due date display (if set)
 * - Cyberpunk dark card styling
 */
export function ListRow({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Extract metadata
  const status = useNodeMeta<string>('status', 'active')
  const priority = useNodeMeta<'low' | 'medium' | 'high' | 'critical'>('priority')
  const dueDate = useNodeMeta<string>('dueDate')
  const color = useNodeMeta<string>('color')
  
  // Get status icon
  const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Circle
  const isCompleted = status === 'completed'
  
  // Priority colors
  const priorityColors = {
    low: 'bg-dark-400 text-dark-300',
    medium: 'bg-blue-500/20 text-blue-400',
    high: 'bg-orange-500/20 text-orange-400',
    critical: 'bg-red-500/20 text-red-400',
  }
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg",
        "bg-dark-100/50 hover:bg-dark-100 transition-colors",
        "border border-dark-200",
        isCompleted && "opacity-60"
      )}
      style={{ marginLeft: depth > 0 ? depth * 8 : 0 }}
      data-variant="list_row"
      data-node-id={node.id}
    >
      {/* Status Icon */}
      <StatusIcon 
        size={20} 
        className={cn(
          "flex-shrink-0",
          isCompleted ? "text-green-500" : "text-dark-400",
          status === 'in_progress' && "text-cyan-500"
        )}
        style={color && !isCompleted ? { color } : undefined}
      />
      
      {/* Title */}
      <span 
        className={cn(
          "flex-1 truncate text-sm",
          isCompleted && "line-through text-dark-500"
        )}
      >
        {node.title}
      </span>
      
      {/* Priority Badge */}
      {priority && (
        <span 
          className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            priorityColors[priority] || priorityColors.low
          )}
        >
          {priority}
        </span>
      )}
      
      {/* Due Date */}
      {dueDate && (
        <span className="text-xs text-dark-500">
          {formatDueDate(dueDate)}
        </span>
      )}
    </div>
  )
}

/**
 * Format due date for display
 */
function formatDueDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    // Check if tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    
    // Otherwise show short date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}
