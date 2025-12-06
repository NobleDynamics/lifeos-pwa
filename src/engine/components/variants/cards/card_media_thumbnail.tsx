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

import { useCallback, useMemo } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useSlot } from '../../../hooks/useSlot'
import { useNode } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/utils'
import type { Node } from '../../../types/node'

/**
 * Check if a node is a media node (has a URL for image/video)
 */
function isMediaNode(node: Node): boolean {
  const metadata = node.metadata as Record<string, unknown>
  return !!(metadata.url || metadata.imageUrl)
}

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
  
  // Get parent node to access siblings
  const { node: parentNode } = useNode()
  
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
  
  // Get media siblings from parent (filter for media nodes only)
  const { siblings, currentIndex } = useMemo(() => {
    // parentNode in NodeContext is actually the current node being rendered
    // We need to get parent's children, but the thumbnail doesn't have direct access
    // So we'll look for siblings in parent's children if it has them
    const parent = parentNode
    
    if (!parent?.children) {
      return { siblings: [node], currentIndex: 0 }
    }
    
    // Filter to only include media nodes (nodes with url or imageUrl)
    const mediaNodes = parent.children.filter(isMediaNode)
    const index = mediaNodes.findIndex(n => n.id === node.id)
    
    return {
      siblings: mediaNodes.length > 0 ? mediaNodes : [node],
      currentIndex: index >= 0 ? index : 0
    }
  }, [parentNode, node])
  
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
