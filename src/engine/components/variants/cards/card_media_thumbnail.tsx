/**
 * CardMediaThumbnail Variant Component
 * 
 * A strict square image card optimized for photo galleries.
 * Borderless or minimal border with aspect-ratio-1.
 * 
 * @module engine/components/variants/cards/card_media_thumbnail
 */

import { useCallback } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * CardMediaThumbnail - Square image thumbnail card.
 * 
 * Structure:
 * ┌─────────────────┐
 * │                 │
 * │     [image]     │  ← Square aspect ratio (1:1)
 * │                 │
 * └─────────────────┘
 * 
 * Slots:
 * - url: Image URL to display
 * - alt: Alt text for accessibility (default: 'Thumbnail')
 */
export function CardMediaThumbnail({ node }: VariantComponentProps) {
  // Slot-based data access
  const url = useSlot<string>('url')
  const alt = useSlot<string>('alt') ?? node.title ?? 'Thumbnail'
  
  // Prevent native browser context menu (e.g., Chrome's "Save image as...")
  // This ensures our custom interactions (future lightbox) take precedence
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Future: integrate with ContextMenuContext for custom context menu
    // or trigger lightbox view
  }, [])
  
  return (
    <div
      className={cn(
        "aspect-square overflow-hidden rounded-lg",
        "bg-dark-200/50",
        "border border-dark-200/50 hover:border-cyan-500/30",
        "transition-all duration-200",
        "hover:shadow-lg hover:shadow-cyan-500/5",
        "cursor-pointer select-none" // Indicate interactivity
      )}
      data-variant="card_media_thumbnail"
      data-node-id={node.id}
      onContextMenu={handleContextMenu}
    >
      {url ? (
        <img 
          src={url} 
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        /* Fallback: Icon placeholder */
        <div className="w-full h-full flex items-center justify-center bg-dark-200">
          <ImageIcon 
            size={32} 
            className="text-dark-400" 
            strokeWidth={1.5}
          />
        </div>
      )}
    </div>
  )
}
