/**
 * ViewCarouselSnap Variant Component
 * 
 * A horizontal scrolling container with snap scrolling.
 * CRITICAL: Implements Touch Trap to prevent horizontal swipes from
 * bubbling up to the Global App Navigation slider.
 * 
 * @module engine/components/variants/layouts/view_carousel_snap
 */

import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { renderChildren } from '../../ViewEngine'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * ViewCarouselSnap - Horizontal scrolling carousel with touch trap.
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────────────────┐
 * │ [Optional Header]                                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │ ◄═══════════════════ HORIZONTAL SCROLL ═══════════════════►│
 * │ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │
 * │ │  Card  │ │  Card  │ │  Card  │ │  Card  │ │  Card  │ ... │
 * │ │   1    │ │   2    │ │   3    │ │   4    │ │   5    │     │
 * │ └────────┘ └────────┘ └────────┘ └────────┘ └────────┘     │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * Features:
 * - Snap scrolling: snap-x snap-mandatory (children use snap-start)
 * - Hidden scrollbar: scrollbar-hide utility
 * - Touch Trap: onTouchStart + onPointerDown with e.stopPropagation()
 * 
 * Slots:
 * - headline: Section title (optional)
 * - subtext: Section description (optional)
 * - item_width: Width of each item (default: 'w-40' for covers, 'w-32' for thumbnails)
 * 
 * Designed for: card_media_cover, card_media_thumbnail children
 */
export function ViewCarouselSnap({ node }: VariantComponentProps) {
  const { depth, rootId, rootNode } = useNode()

  // Slots
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const showHeader = useSlot<boolean>('show_header', true)
  const itemWidth = useSlot<string>('item_width', 'w-40') // CSS class for item width

  // Check if we have children to render
  const hasChildren = node.children && node.children.length > 0

  /**
   * Touch Trap Handler
   * 
   * CRITICAL: Prevents horizontal swipe gestures from bubbling up to 
   * the Global App Navigation (which uses horizontal swipes to switch apps).
   * 
   * Both onTouchStart (mobile) and onPointerDown (desktop/stylus) are handled
   * to ensure complete coverage across all input methods.
   */
  const handleTouchTrap = (e: React.TouchEvent | React.PointerEvent) => {
    // Stop event from propagating to parent elements
    // This prevents the global swipe navigation from intercepting our scroll
    e.stopPropagation()
  }

  return (
    <div
      className="flex flex-col"
      data-variant="view_carousel_snap"
      data-node-id={node.id}
    >
      {/* Header (Optional) */}
      {showHeader && (headline || subtext) && (
        <div className="px-4 pb-3">
          {headline && (
            <h2 className="text-sm font-semibold text-white">{headline}</h2>
          )}
          {subtext && (
            <p className="text-xs text-dark-400 mt-0.5">{subtext}</p>
          )}
        </div>
      )}

      {/* Horizontal Scroll Container with Touch Trap */}
      {hasChildren ? (
        <div
          onTouchStart={handleTouchTrap}
          onPointerDown={handleTouchTrap}
          className={cn(
            // Horizontal scroll
            "flex gap-3 overflow-x-auto",
            // Snap scrolling
            "snap-x snap-mandatory",
            // Hide scrollbar (Tailwind plugin or custom CSS)
            "scrollbar-hide",
            // Padding for edge cards
            "px-4 pb-2",
            // Smooth momentum scrolling on iOS
            "-webkit-overflow-scrolling-touch"
          )}
          style={{
            // Additional fallback for hiding scrollbar
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Render children with snap-start applied via wrapper */}
          {node.children?.map((child, index) => (
            <div
              key={child.id}
              className={cn(
                "flex-shrink-0 snap-start",
                itemWidth
              )}
            >
              {renderChildren(
                { ...node, children: [child] }, 
                depth, 
                rootId, 
                rootNode
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-dark-400 text-sm italic border border-dashed border-dark-300 rounded-lg mx-4">
          No items
        </div>
      )}
    </div>
  )
}
