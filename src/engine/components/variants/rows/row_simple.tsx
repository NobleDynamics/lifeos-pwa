/**
 * RowSimple Variant Component
 * 
 * A minimal bare-bones row with status icon, headline, and optional badge.
 * Purely structural - uses slots for all display data.
 * 
 * @module engine/components/variants/rows/row_simple
 */

import { Circle, CheckCircle2, PlayCircle } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

// Status icons mapping (generic status states)
const statusIcons = {
  active: Circle,
  not_started: Circle,
  pending: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
  done: CheckCircle2,
}

// Priority colors (generic priority levels)
const priorityColors: Record<string, string> = {
  low: 'bg-dark-400 text-dark-300',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
}

/**
 * RowSimple - Minimal row variant for simple list items.
 * 
 * Structure:
 * ┌────────────────────────────────────────────────────────────────┐
 * │ [○/●]  headline                         [badge] [badge_date]  │
 * └────────────────────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - status: Status for icon ('active', 'in_progress', 'completed')
 * - badge: Badge text (e.g., priority level)
 * - badge_date: Date badge (auto-formatted)
 * - accent_color: Icon color override
 */
export function RowSimple({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const status = useSlot<string>('status', 'active')
  const badge = useSlot<string>('badge')
  const badgeDate = useSlot<string>('badge_date', undefined, { type: 'date' })
  const accentColor = useSlot<string>('accent_color')
  
  // Get status icon
  const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Circle
  const isCompleted = status === 'completed' || status === 'done'
  
  // Get priority color class
  const badgeColorClass = badge ? (priorityColors[badge] || priorityColors.low) : ''
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg",
        "bg-dark-100/50 hover:bg-dark-100 transition-colors",
        "border border-dark-200",
        isCompleted && "opacity-60"
      )}
      style={{ marginLeft: depth > 0 ? depth * 8 : 0 }}
      data-variant="row_simple"
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
        style={accentColor && !isCompleted ? { color: accentColor } : undefined}
      />
      
      {/* Headline */}
      <span 
        className={cn(
          "flex-1 truncate text-sm",
          isCompleted && "line-through text-dark-500"
        )}
      >
        {headline}
      </span>
      
      {/* Badge (e.g., Priority) */}
      {badge && (
        <span 
          className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            badgeColorClass
          )}
        >
          {badge}
        </span>
      )}
      
      {/* Date Badge */}
      {badgeDate && (
        <span className="text-xs text-dark-500">
          {badgeDate}
        </span>
      )}
    </div>
  )
}
