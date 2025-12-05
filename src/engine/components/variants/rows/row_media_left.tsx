/**
 * RowMediaLeft Variant Component
 * 
 * A row with image thumbnail on the left and title/description on the right.
 * Supports square or round image shapes via media_shape slot.
 * No amount field - simpler than row_transaction_history.
 * 
 * @module engine/components/variants/rows/row_media_left
 */

import { Image as ImageIcon, ChevronRight } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * RowMediaLeft - Image on left, content on right.
 * 
 * Structure:
 * ┌────────────────────────────────────────────────────────────────┐
 * │ [○ or ▢]  Title                                           [→] │
 * │  image    Description                                         │
 * └────────────────────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - subtext: Secondary text below headline
 * - media: Image URL to display
 * - media_shape: 'round' | 'square' (default: 'round')
 * - media_size: Size in pixels (default: 48)
 * - border_color: Optional colored border
 * - neon_glow: Enable neon glow effect (default: false)
 * - accent_color: Color for neon glow (default: #06b6d4)
 * - target_id: Optional node ID to navigate to on click
 * - show_chevron: Show navigation chevron (auto-enabled if target_id set)
 */
export function RowMediaLeft({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const actions = useEngineActions()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const media = useSlot<string>('media')
  const mediaShape = useSlot<'round' | 'square'>('media_shape', 'round')
  const mediaSize = useSlot<number>('media_size', 48)
  const borderColor = useSlot<string>('border_color')
  const neonGlow = useSlot<boolean>('neon_glow', false)
  const accentColor = useSlot<string>('accent_color', '#06b6d4')
  const targetId = useSlot<string>('target_id')
  const showChevron = useSlot<boolean>('show_chevron', !!targetId)
  
  // Is this row clickable/navigable?
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
        "flex items-center gap-3 px-3 py-3 rounded-lg",
        "bg-dark-100/50 hover:bg-dark-100 transition-colors",
        "border",
        isClickable && "cursor-pointer active:scale-[0.98]"
      )}
      style={{ 
        marginLeft: depth > 0 ? depth * 8 : 0,
        borderColor: borderColor || (neonGlow ? accentColor : 'rgb(26, 26, 36)'),
        ...glowStyle,
      }}
      data-variant="row_media_left"
      data-node-id={node.id}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      } : undefined}
    >
      {/* Image Thumbnail */}
      <div 
        className={cn(
          "flex-shrink-0 overflow-hidden bg-dark-200 flex items-center justify-center",
          mediaShape === 'round' ? 'rounded-full' : 'rounded-lg'
        )}
        style={{ 
          width: mediaSize, 
          height: mediaSize,
        }}
      >
        {media ? (
          <img 
            src={media} 
            alt={headline}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <ImageIcon 
            size={mediaSize * 0.4} 
            className="text-dark-400" 
            strokeWidth={1.5}
          />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Headline */}
        <div className="font-medium text-sm text-white truncate">
          {headline}
        </div>
        
        {/* Subtext */}
        {subtext && (
          <div className="text-xs text-dark-400 mt-0.5 line-clamp-2">
            {subtext}
          </div>
        )}
      </div>
      
      {/* Navigation Chevron */}
      {showChevron && (
        <ChevronRight 
          size={16} 
          className="flex-shrink-0 text-dark-400"
        />
      )}
    </div>
  )
}

export default RowMediaLeft
