/**
 * CardMediaCoverCompact Variant Component
 * 
 * A compact poster-style card with tall aspect ratio (3:4).
 * Designed for 2-per-row layouts (col_span: 3 in 6-column grid).
 * Image fills 100% with gradient overlay and white text at bottom.
 * 
 * @module engine/components/variants/cards/card_media_cover_compact
 */

import { Image as ImageIcon } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * CardMediaCoverCompact - Compact poster-style card with overlay text.
 * 
 * Structure:
 * ┌─────────────┐
 * │             │
 * │   [image]   │  ← Compact tall aspect ratio (3:4)
 * │             │
 * │▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← Gradient fade
 * │ Title       │  ← White text overlay
 * │ Subtext     │
 * └─────────────┘
 * 
 * Slots:
 * - url: Image URL to display
 * - headline: Primary text (default: node.title)
 * - subtext: Secondary text below headline
 * - border_color: Optional colored border
 * - neon_glow: Enable neon glow effect (default: false)
 * - accent_color: Color for neon glow (default: #06b6d4)
 * - target_id: Optional node ID to navigate to on click
 */
export function CardMediaCoverCompact({ node }: VariantComponentProps) {
  const actions = useEngineActions()
  
  // Slot-based data access
  const url = useSlot<string>('url')
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const borderColor = useSlot<string>('border_color')
  const neonGlow = useSlot<boolean>('neon_glow', false)
  const accentColor = useSlot<string>('accent_color', '#06b6d4')
  const targetId = useSlot<string>('target_id')
  
  // Is this card clickable/navigable?
  const isClickable = !!targetId
  
  // Handle click - navigate to target
  const handleClick = () => {
    if (targetId && actions) {
      actions.onNavigateInto(targetId, headline, '')
    }
  }
  
  // Neon glow style
  const glowStyle = neonGlow && accentColor ? {
    boxShadow: `0 0 8px ${accentColor}33, 0 0 16px ${accentColor}11`,
  } : {}
  
  return (
    <div
      className={cn(
        "relative aspect-[3/4] overflow-hidden rounded-lg",
        "bg-dark-200",
        "border transition-all duration-200",
        "hover:shadow-lg hover:shadow-cyan-500/10",
        isClickable && "cursor-pointer active:scale-[0.98]",
        "group"
      )}
      style={{
        borderColor: borderColor || (neonGlow ? accentColor : 'rgba(26, 26, 36, 0.5)'),
        ...glowStyle,
      }}
      data-variant="card_media_cover_compact"
      data-node-id={node.id}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {/* Image or Placeholder */}
      {url ? (
        <img 
          src={url} 
          alt={headline || 'Cover'}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        /* Fallback: Icon placeholder */
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-dark-200">
          <ImageIcon 
            size={32} 
            className="text-dark-400" 
            strokeWidth={1}
          />
        </div>
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Text Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-2 space-y-0.5">
        {headline && (
          <h3 className="font-semibold text-xs text-white leading-tight line-clamp-2 drop-shadow-lg">
            {headline}
          </h3>
        )}
        {subtext && (
          <p className="text-[10px] text-white/70 line-clamp-1 drop-shadow-md">
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}

export default CardMediaCoverCompact
