/**
 * CardMediaThumbnail Variant Component
 * 
 * A strict square image card optimized for photo galleries.
 * Borderless or minimal border with aspect-ratio-1.
 * 
 * Features:
 * - Tap to open fullscreen lightbox with sibling navigation
 * - Long-press to show context menu
 * - Square aspect ratio (1:1)
 * 
 * @module engine/components/variants/cards/card_media_thumbnail
 */

import { useCallback } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useSlot } from '../../../hooks/useSlot'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSiblingsWithFallback } from '../../../context/SiblingsContext'
import { useLongPress } from '@/hooks/useLongPress'
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
 * 
 * Interactions:
 * - Tap: Opens fullscreen lightbox with sibling navigation
 * - Long-press / Right-click: Shows context menu
 */
export function CardMediaThumbnail({ node }: VariantComponentProps) {
  // Slot-based data access
  const url = useSlot<string>('url')
  const alt = useSlot<string>('alt') ?? node.title ?? 'Thumbnail'
  
  // Get siblings from context (provided by parent view like view_grid_fixed)
  const { siblings, currentIndex } = useSiblingsWithFallback(node)
  
  // Actions context for opening lightbox and context menu
  const actions = useEngineActions()
  
  // Create a trigger function using the actions context
  const triggerContextMenu = useCallback((x: number, y: number) => {
    if (actions?.nodeToResource && actions?.onOpenContextMenu) {
      // Convert node to resource and trigger context menu
      const resource = actions.nodeToResource(node)
      // Create a synthetic event with the coordinates
      const syntheticEvent = {
        preventDefault: () => {},
        stopPropagation: () => {},
        clientX: x,
        clientY: y,
      } as React.MouseEvent
      actions.onOpenContextMenu(syntheticEvent, resource)
    }
  }, [actions, node])
  
  // Handle tap to open lightbox
  const handleClick = useCallback(() => {
    if (actions?.onOpenMedia) {
      actions.onOpenMedia(node, siblings, currentIndex)
    }
  }, [actions, node, siblings, currentIndex])
  
  // Handle context menu (long-press / right-click)
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    triggerContextMenu(e.clientX, e.clientY)
  }, [triggerContextMenu])
  
  // Long press handlers for mobile
  const longPressHandlers = useLongPress({
    onLongPress: (e) => {
      triggerContextMenu(e.clientX, e.clientY)
    },
    onClick: handleClick,
    delay: 500,
  })
  
  return (
    <div
      className={cn(
        "aspect-square overflow-hidden rounded-lg",
        "bg-dark-200/50",
        "border border-dark-200/50 hover:border-cyan-500/30",
        "transition-all duration-200",
        "hover:shadow-lg hover:shadow-cyan-500/5",
        "cursor-pointer select-none", // Indicate interactivity
        "active:scale-[0.98]" // Touch feedback
      )}
      data-variant="card_media_thumbnail"
      data-node-id={node.id}
      onContextMenu={handleContextMenu}
      {...longPressHandlers}
    >
      {url ? (
        <img 
          src={url} 
          alt={alt}
          className="w-full h-full object-cover pointer-events-none"
          loading="lazy"
          draggable={false}
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
