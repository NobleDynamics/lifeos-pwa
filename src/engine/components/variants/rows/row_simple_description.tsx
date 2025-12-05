/**
 * RowSimpleDescription Variant Component
 * 
 * A minimal row with just title and description.
 * No icons, no badges, no checkbox - purely for content display.
 * Supports border color for visual grouping.
 * 
 * @module engine/components/variants/rows/row_simple_description
 */

import { ChevronRight } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * RowSimpleDescription - Title + Description only.
 * 
 * Structure:
 * ┌─[border_color]───────────────────────────────────────────────────┐
 * │ Title                                                        [→] │
 * │ Description text here...                                         │
 * └──────────────────────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - subtext: Secondary text / description
 * - border_color: Optional colored border
 * - neon_glow: Enable neon glow effect (default: false)
 * - accent_color: Color for neon glow (default: #06b6d4)
 * - target_id: Optional node ID to navigate to on click
 * - show_chevron: Show navigation chevron (auto-enabled if target_id set)
 */
export function RowSimpleDescription({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const actions = useEngineActions()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
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
        "flex items-start gap-3 px-3 py-3 rounded-lg",
        "bg-dark-100/50 hover:bg-dark-100 transition-colors",
        "border",
        isClickable && "cursor-pointer active:scale-[0.98]"
      )}
      style={{ 
        marginLeft: depth > 0 ? depth * 8 : 0,
        borderColor: borderColor || (neonGlow ? accentColor : 'rgb(26, 26, 36)'),
        ...glowStyle,
      }}
      data-variant="row_simple_description"
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
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Headline */}
        <div className="font-medium text-sm text-white">
          {headline}
        </div>
        
        {/* Subtext / Description */}
        {subtext && (
          <div className="text-xs text-dark-400 mt-1 leading-relaxed">
            {subtext}
          </div>
        )}
      </div>
      
      {/* Navigation Chevron */}
      {showChevron && (
        <ChevronRight 
          size={16} 
          className="flex-shrink-0 text-dark-400 mt-0.5"
        />
      )}
    </div>
  )
}

export default RowSimpleDescription
