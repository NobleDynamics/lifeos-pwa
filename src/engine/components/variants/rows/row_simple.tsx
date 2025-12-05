/**
 * RowSimple Variant Component
 * 
 * A minimal row with optional icon, headline, and badges.
 * Supports border color for status indication and target_id for navigation.
 * Purely structural - uses slots for all display data.
 * 
 * @module engine/components/variants/rows/row_simple
 */

import * as LucideIcons from 'lucide-react'
import { Circle, ChevronRight } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

// Priority colors (generic priority levels)
const priorityColors: Record<string, string> = {
  low: 'bg-dark-400 text-dark-300',
  medium: 'bg-blue-500/20 text-blue-400',
  high: 'bg-orange-500/20 text-orange-400',
  critical: 'bg-red-500/20 text-red-400',
}

/**
 * Dynamically render a Lucide icon by name
 */
function DynamicIcon({ 
  name, 
  size = 18, 
  color,
  className
}: { 
  name: string
  size?: number
  color?: string
  className?: string
}) {
  // Get the icon component from LucideIcons
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name]
  
  if (!IconComponent) {
    // Fallback to Circle icon if name not found
    return <Circle size={size} style={{ color }} className={className} />
  }
  
  return <IconComponent size={size} style={{ color }} className={className} />
}

/**
 * RowSimple - Minimal row variant for simple list items.
 * 
 * Structure:
 * ┌─[border_color]───────────────────────────────────────────────────┐
 * │ [icon]  headline                         [badge] [badge_date] [→]│
 * └──────────────────────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - icon_start: Lucide icon name (e.g., 'Folder', 'Star', 'CheckCircle2')
 * - icon_color: Color for the icon
 * - badge: Badge text (e.g., priority level)
 * - badge_date: Date badge (auto-formatted)
 * - border_color: Optional border color for status indication
 * - target_id: Optional node ID to navigate to on click
 * - show_chevron: Show navigation chevron (auto-enabled if target_id set)
 */
export function RowSimple({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const actions = useEngineActions()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const iconStart = useSlot<string>('icon_start')
  const iconColor = useSlot<string>('icon_color', '#71717a') // dark-400 default
  const badge = useSlot<string>('badge')
  const badgeDate = useSlot<string>('badge_date', undefined, { type: 'date' })
  const borderColor = useSlot<string>('border_color')
  const targetId = useSlot<string>('target_id')
  const showChevron = useSlot<boolean>('show_chevron', !!targetId)
  
  // Get priority color class
  const badgeColorClass = badge ? (priorityColors[badge.toLowerCase()] || priorityColors.low) : ''
  
  // Is this row clickable/navigable?
  const isClickable = !!targetId
  
  // Handle click - navigate to target
  const handleClick = () => {
    if (targetId && actions) {
      actions.onNavigateInto(targetId, headline, '')
    }
  }
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-lg",
        "bg-dark-100/50 hover:bg-dark-100 transition-colors",
        "border",
        isClickable && "cursor-pointer active:scale-[0.98]"
      )}
      style={{ 
        marginLeft: depth > 0 ? depth * 8 : 0,
        borderColor: borderColor || 'rgb(26, 26, 36)', // dark-200 default
      }}
      data-variant="row_simple"
      data-node-id={node.id}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      } : undefined}
    >
      {/* Optional Icon */}
      {iconStart && (
        <DynamicIcon 
          name={iconStart}
          size={18}
          color={iconColor}
          className="flex-shrink-0"
        />
      )}
      
      {/* Headline */}
      <span className="flex-1 truncate text-sm">
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
      
      {/* Navigation Chevron */}
      {showChevron && (
        <ChevronRight 
          size={16} 
          className="flex-shrink-0 text-dark-400"
        />
      )}
    </div>
  )
}
