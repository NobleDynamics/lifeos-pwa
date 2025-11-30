/**
 * CardMediaTop Variant Component
 * 
 * A card layout with image/media at the top and headline + subtext + badges below.
 * Purely structural - uses slots for all display data.
 * 
 * @module engine/components/variants/cards/card_media_top
 */

import { Clock, Image as ImageIcon } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode, useChildCount } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * CardMediaTop - Card with media/image at top and content below.
 * 
 * Structure:
 * ┌───────────────────────────────────────┐
 * │         [slot_media]                  │  ← Image if provided, accent bar if not
 * │                                       │
 * ├───────────────────────────────────────┤
 * │ [icon] headline                       │
 * │ subtext                               │
 * │ [badge_1] [badge_2] [badge_3]         │
 * └───────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - subtext: Secondary text (default: metadata.description)
 * - media: Image URL for top section
 * - accent_color: Color for top bar when no media (default: #06b6d4)
 * - icon_start: Icon to show next to headline
 * - badge_1: First badge text (e.g., cook time)
 * - badge_2: Second badge text (e.g., servings)
 * - badge_3: Third badge text (e.g., item count)
 * - badge_1_icon: Icon for badge_1 ('clock', etc.)
 */
export function CardMediaTop({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const childCount = useChildCount()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const media = useSlot<string>('media')
  const accentColor = useSlot<string>('accent_color', '#06b6d4')
  const badge1 = useSlot<string | number>('badge_1')
  const badge2 = useSlot<string | number>('badge_2')
  const badge3 = useSlot<string | number>('badge_3')
  const badge1Icon = useSlot<string>('badge_1_icon')
  
  // Resolve badge icon
  const Badge1Icon = badge1Icon === 'clock' ? Clock : null
  
  // Check for any badges
  const hasBadges = badge1 || badge2 || badge3 || childCount > 0
  
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden",
        "bg-dark-100/80 backdrop-blur-sm",
        "border border-dark-200 hover:border-cyan-500/50",
        "transition-all duration-200",
        "hover:shadow-lg hover:shadow-cyan-500/10"
      )}
      style={{ 
        marginLeft: depth > 0 ? depth * 8 : 0,
        borderColor: accentColor ? `${accentColor}33` : undefined,
      }}
      data-variant="card_media_top"
      data-node-id={node.id}
    >
      {/* Media/Image Area */}
      {media ? (
        <div className="aspect-video bg-dark-200 overflow-hidden">
          <img 
            src={media} 
            alt={headline}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div 
          className="h-2"
          style={{ backgroundColor: accentColor }}
        />
      )}
      
      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Headline Row */}
        <div className="flex items-start gap-2">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {headline}
          </h3>
        </div>
        
        {/* Subtext */}
        {subtext && (
          <p className="text-xs text-dark-400 line-clamp-2">
            {subtext}
          </p>
        )}
        
        {/* Badges Row */}
        {hasBadges && (
          <div className="flex flex-wrap gap-2">
            {/* Badge 1 (e.g., Time) */}
            {badge1 && (
              <span className="flex items-center gap-1 text-xs text-dark-400">
                {Badge1Icon && <Badge1Icon size={12} />}
                {badge1}
              </span>
            )}
            
            {/* Badge 2 */}
            {badge2 && (
              <span className="text-xs text-dark-400">
                {badge2}
              </span>
            )}
            
            {/* Badge 3 */}
            {badge3 && (
              <span className="text-xs text-dark-400">
                {badge3}
              </span>
            )}
            
            {/* Child count (auto) */}
            {childCount > 0 && !badge3 && (
              <span className="text-xs text-dark-500">
                {childCount} {childCount === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
