/**
 * CardMediaTopCompact Variant Component
 * 
 * A compact card layout with image/media at the top and headline + badges below.
 * Designed for 2-per-row layouts (col_span: 3 in 6-column grid).
 * Smaller padding and more condensed layout than card_media_top.
 * 
 * @module engine/components/variants/cards/card_media_top_compact
 */

import { Clock, Image as ImageIcon, ChevronRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode, useChildCount } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * Dynamically render a Lucide icon by name
 */
function DynamicIcon({ name, size = 12, className }: { name: string; size?: number; className?: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name]
  if (!IconComponent) return <Clock size={size} className={className} />
  return <IconComponent size={size} className={className} />
}

/**
 * CardMediaTopCompact - Compact card with media/image at top and content below.
 * 
 * Structure:
 * ┌─────────────────────┐
 * │     [media]         │  ← Smaller aspect ratio (4:3)
 * ├─────────────────────┤
 * │ headline            │
 * │ [badge_1] [badge_2] │
 * └─────────────────────┘
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - subtext: Secondary text (optional)
 * - media: Image URL for top section
 * - accent_color: Color for top bar when no media (default: #06b6d4)
 * - border_color: Optional colored border
 * - neon_glow: Enable neon glow effect (default: false)
 * - badge_1: First badge text
 * - badge_1_icon: Icon name for badge_1
 * - badge_2: Second badge text
 * - target_id: Optional node ID to navigate to on click
 */
export function CardMediaTopCompact({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const childCount = useChildCount()
  const actions = useEngineActions()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const media = useSlot<string>('media')
  const accentColor = useSlot<string>('accent_color', '#06b6d4')
  const borderColor = useSlot<string>('border_color')
  const neonGlow = useSlot<boolean>('neon_glow', false)
  const badge1 = useSlot<string | number>('badge_1')
  const badge1Icon = useSlot<string>('badge_1_icon')
  const badge2 = useSlot<string | number>('badge_2')
  const targetId = useSlot<string>('target_id')
  
  // Is this card clickable/navigable?
  const isClickable = !!targetId
  
  // Handle click - navigate to target
  const handleClick = () => {
    if (targetId && actions) {
      actions.onNavigateInto(targetId, headline, '')
    }
  }
  
  // Check for any badges
  const hasBadges = badge1 || badge2 || childCount > 0
  
  // Neon glow style
  const glowStyle = neonGlow && accentColor ? {
    boxShadow: `0 0 10px ${accentColor}33, 0 0 20px ${accentColor}11`,
  } : {}
  
  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        "bg-dark-100/80 backdrop-blur-sm",
        "border transition-all duration-200",
        "hover:shadow-lg hover:shadow-cyan-500/10",
        isClickable && "cursor-pointer active:scale-[0.98]"
      )}
      style={{ 
        borderColor: borderColor || (neonGlow ? accentColor : 'rgb(26, 26, 36)'),
        ...glowStyle,
      }}
      data-variant="card_media_top_compact"
      data-node-id={node.id}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Media/Image Area - Compact aspect ratio */}
      {media ? (
        <div className="aspect-[4/3] bg-dark-200 overflow-hidden">
          <img 
            src={media} 
            alt={headline}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div 
          className="h-1.5"
          style={{ backgroundColor: accentColor }}
        />
      )}
      
      {/* Content - Compact padding */}
      <div className="p-2 space-y-1">
        {/* Headline */}
        <h3 className="font-medium text-xs leading-tight line-clamp-2">
          {headline}
        </h3>
        
        {/* Subtext (optional, truncated) */}
        {subtext && (
          <p className="text-[10px] text-dark-400 line-clamp-1">
            {subtext}
          </p>
        )}
        
        {/* Badges Row - Compact */}
        {hasBadges && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {badge1 && (
              <span className="flex items-center gap-0.5 text-[10px] text-dark-400">
                {badge1Icon && <DynamicIcon name={badge1Icon} size={10} />}
                {badge1}
              </span>
            )}
            {badge2 && (
              <span className="text-[10px] text-dark-400">
                {badge2}
              </span>
            )}
            {childCount > 0 && !badge2 && (
              <span className="text-[10px] text-dark-500">
                {childCount} items
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default CardMediaTopCompact
