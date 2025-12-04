/**
 * CardMediaCover Variant Component
 * 
 * A poster-style card with tall aspect ratio (2:3).
 * Image fills 100% with gradient overlay and white text at bottom.
 * 
 * Use case: Recipes, Movies, Albums, Book covers.
 * 
 * @module engine/components/variants/cards/card_media_cover
 */

import { Image as ImageIcon } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * CardMediaCover - Poster-style card with overlay text.
 * 
 * Structure:
 * ┌─────────────────┐
 * │                 │
 * │     [image]     │  ← Tall aspect ratio (2:3)
 * │                 │
 * │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  ← Gradient fade
 * │ Title           │  ← White text overlay
 * │ Subtext         │
 * └─────────────────┘
 * 
 * Slots:
 * - url: Image URL to display
 * - headline: Primary text (default: node.title)
 * - subtext: Secondary text below headline
 */
export function CardMediaCover({ node }: VariantComponentProps) {
  // Slot-based data access
  const url = useSlot<string>('url')
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  
  return (
    <div
      className={cn(
        "relative aspect-[2/3] overflow-hidden rounded-xl",
        "bg-dark-200",
        "border border-dark-200/50 hover:border-cyan-500/30",
        "transition-all duration-200",
        "hover:shadow-lg hover:shadow-cyan-500/10",
        "group"
      )}
      data-variant="card_media_cover"
      data-node-id={node.id}
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
            size={48} 
            className="text-dark-400" 
            strokeWidth={1}
          />
        </div>
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {/* Text Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 space-y-1">
        {headline && (
          <h3 className="font-semibold text-sm text-white leading-tight line-clamp-2 drop-shadow-lg">
            {headline}
          </h3>
        )}
        {subtext && (
          <p className="text-xs text-white/70 line-clamp-1 drop-shadow-md">
            {subtext}
          </p>
        )}
      </div>
    </div>
  )
}
