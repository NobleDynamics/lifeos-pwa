/**
 * CardFolder Variant Component
 * 
 * A grid-style folder card with centered icon, title, and optional item count.
 * Like row_neon_group but designed for grid layouts.
 * Supports optional neon glow border and navigation.
 * 
 * @module engine/components/variants/cards/card_folder
 */

import { Folder, ChevronRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode, useChildCount } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * Dynamically render a Lucide icon by name
 */
function DynamicIcon({ 
  name, 
  size = 32, 
  color,
  fill
}: { 
  name: string
  size?: number
  color?: string
  fill?: string
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name]
  
  if (!IconComponent) {
    return <Folder size={size} style={{ color }} fill={fill} />
  }
  
  return <IconComponent size={size} style={{ color }} fill={fill} />
}

/**
 * CardFolder - Grid-style folder card.
 * 
 * Structure:
 * ┌══════════════════════╗
 * ║       [Icon]         ║
 * ║       Title          ║
 * ║     [3 items]        ║
 * ╚══════════════════════╝
 *   ^ Optional neon glow border
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - icon_start: Lucide icon name (default: 'Folder')
 * - accent_color: Icon color and neon glow color (default: #06b6d4)
 * - border_color: Optional colored border (overrides accent_color for border)
 * - neon_glow: Enable neon glow effect (default: false)
 * - count_badge: Text for count badge (default: child count)
 * - show_count: Whether to show item count (default: true)
 * - target_id: Optional node ID to navigate to on click (if not set, navigates into own children)
 */
export function CardFolder({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const childCount = useChildCount()
  const actions = useEngineActions()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const iconStart = useSlot<string>('icon_start', 'Folder')
  const accentColor = useSlot<string>('accent_color', '#06b6d4')
  const borderColor = useSlot<string>('border_color')
  const neonGlow = useSlot<boolean>('neon_glow', false)
  const countBadge = useSlot<string | number>('count_badge')
  const showCount = useSlot<boolean>('show_count', true)
  const targetId = useSlot<string>('target_id')
  
  // Use child count for badge if not explicitly set
  const displayCount = countBadge ?? (childCount > 0 ? `${childCount} ${childCount === 1 ? 'item' : 'items'}` : null)
  
  // Handle click - navigate to target or into folder
  const handleClick = () => {
    if (actions) {
      const navId = targetId || node.id
      const path = (node.metadata.path as string) || ''
      actions.onNavigateInto(navId, headline, path)
    }
  }
  
  // Neon glow style
  const glowStyle = neonGlow && accentColor ? {
    boxShadow: `0 0 12px ${accentColor}33, 0 0 24px ${accentColor}11`,
  } : {}
  
  // Determine border color
  const effectiveBorderColor = borderColor || (neonGlow ? accentColor : 'rgb(26, 26, 36)')
  
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-4 rounded-xl",
        "bg-dark-100/80 backdrop-blur-sm",
        "border transition-all duration-200",
        "hover:shadow-lg cursor-pointer",
        "active:scale-[0.98]"
      )}
      style={{ 
        borderColor: effectiveBorderColor,
        ...glowStyle,
      }}
      data-variant="card_folder"
      data-node-id={node.id}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Icon */}
      <div className="flex items-center justify-center">
        <DynamicIcon 
          name={iconStart}
          size={32}
          color={accentColor}
          fill={`${accentColor}22`}
        />
      </div>
      
      {/* Title */}
      <h3 className="font-medium text-sm text-white text-center line-clamp-2">
        {headline}
      </h3>
      
      {/* Item Count */}
      {showCount && displayCount && (
        <span 
          className="text-xs px-2 py-0.5 rounded-full bg-dark-200/80"
          style={{ color: accentColor }}
        >
          {displayCount}
        </span>
      )}
    </div>
  )
}

export default CardFolder
