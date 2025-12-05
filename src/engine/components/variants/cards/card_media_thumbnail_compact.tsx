/**
 * CardMediaThumbnailCompact Variant Component
 * 
 * A compact square image card optimized for 2-per-row layouts.
 * Designed for col_span: 3 in 6-column grid (shows 2 side-by-side).
 * Smaller than the regular card_media_thumbnail.
 * 
 * @module engine/components/variants/cards/card_media_thumbnail_compact
 */

import { Image as ImageIcon } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * CardMediaThumbnailCompact - Compact square image thumbnail card.
 * 
 * Structure:
 * ┌───────────────┐
 * │               │
 * │   [image]     │  ← Square aspect ratio (1:1)
 * │               │
 * │  Title        │  ← Optional overlay title
 * └───────────────┘
 * 
 * Slots:
 * - url: Image URL to display
 * - alt: Alt text for accessibility (default: node.title)
 * - headline: Optional title overlay at bottom
 * - border_color: Optional colored border
 * - neon_glow: Enable neon glow effect (default: false)
 * - accent_color: Color for neon glow (default: #06b6d4)
 * - target_id: Optional node ID to navigate to on click
 */
export function CardMediaThumbnailCompact({ node }: VariantComponentProps) {
  const actions = useEngineActions()
  
  // Slot-based data access
  const url = useSlot<string>('url')
  const alt = useSlot<string>('alt') ?? node.title ?? 'Thumbnail'
  const headline = useSlot<string>('headline')
  const borderColor = useSlot<string>('border_color')
  const neonGlow = useSlot<boolean>('neon_glow', false)
  const accentColor = useSlot<string>('accent_color', '#06b6d4')
  const targetId = useSlot<string>('target_id')
  
  // Is this card clickable/navigable?
  const isClickable = !!targetId
  
  // Handle click - navigate to target
  const handleClick = () => {
    if (targetId && actions) {
      actions.onNavigateInto(targetId, alt, '')
    }
  }
  
  // Neon glow style
  const glowStyle = neonGlow && accentColor ? {
    boxShadow: `0 0 8px ${accentColor}33, 0 0 16px ${accentColor}11`,
  } : {}
  
  return (
    <div
      className={cn(
        "aspect-square overflow-hidden rounded-md relative",
        "bg-dark-200/50",
        "border transition-all duration-200",
        "hover:shadow-lg hover:shadow-cyan-500/5",
        isClickable && "cursor-pointer active:scale-[0.98]",
        "group"
      )}
      style={{
        borderColor: borderColor || (neonGlow ? accentColor : 'rgba(26, 26, 36, 0.5)'),
        ...glowStyle,
      }}
      data-variant="card_media_thumbnail_compact"
      data-node-id={node.id}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      {url ? (
        <img 
          src={url} 
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        /* Fallback: Icon placeholder */
        <div className="w-full h-full flex items-center justify-center bg-dark-200">
          <ImageIcon 
            size={24} 
            className="text-dark-400" 
            strokeWidth={1.5}
          />
        </div>
      )}
      
      {/* Optional title overlay */}
      {headline && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-1.5">
            <span className="text-[10px] font-medium text-white line-clamp-1 drop-shadow-lg">
              {headline}
            </span>
          </div>
        </>
      )}
    </div>
  )
}

export default CardMediaThumbnailCompact
