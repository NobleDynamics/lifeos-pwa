/**
 * RowNeonGroup Variant Component
 * 
 * A row with signature "Cyberpunk" neon glow effect, typically used for 
 * folder/group navigation. Features colored border, glow shadow, and chevron.
 * Purely structural - uses slots for all display data.
 * 
 * @module engine/components/variants/rows/row_neon_group
 */

import { Folder, ChevronRight } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode, useChildCount } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { useLongPress } from '@/hooks/useLongPress'
import { Avatar } from '@/components/shared/Avatar'
import { cn } from '@/lib/utils'

/**
 * RowNeonGroup - Neon-styled row for groups/folders with cyberpunk aesthetic.
 * 
 * Structure:
 * ┌════════════════════════════════════════════════════════════════════╗
 * ║ [Icon]  headline                      [count badge] [→] [Avatar]  ║
 * ║         subtext                                                    ║
 * ╚════════════════════════════════════════════════════════════════════╝
 *   ^ Neon glow border using accent_color
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - subtext: Secondary text (default: metadata.description)
 * - accent_color: Neon border/glow color (default: #06b6d4)
 * - icon_start: Icon config (default: folder icon)
 * - count_badge: Text for count badge (auto: child count)
 * - end_element: Avatar/element config for right side
 * - show_chevron: Whether to show navigation chevron (default: true)
 */
export function RowNeonGroup({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const childCount = useChildCount()
  const actions = useEngineActions()
  
  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const accentColor = useSlot<string>('accent_color', '#06b6d4')
  const countBadge = useSlot<string | number>('count_badge')
  const endElement = useSlot<{ name?: string; avatar?: string } | string>('end_element')
  const showChevron = useSlot<boolean>('show_chevron', true)
  
  // Derive avatar props from end_element
  const avatarSrc = typeof endElement === 'string' 
    ? endElement 
    : endElement?.avatar
  const avatarName = typeof endElement === 'string' 
    ? undefined 
    : endElement?.name
  
  // Use child count for badge if not explicitly set
  const displayBadge = countBadge ?? (childCount > 0 ? `${childCount} ${childCount === 1 ? 'item' : 'items'}` : null)

  // Handle row click - navigate into folder
  const handleClick = () => {
    if (actions) {
      const path = (node.metadata.path as string) || ''
      actions.onNavigateInto(node.id, node.title, path)
    }
  }

  // Handle context menu / long press - open edit/delete menu
  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (actions) {
      const resource = actions.nodeToResource(node)
      actions.onOpenContextMenu(e, resource)
    }
  }

  // Long press handler for touch devices
  const longPressHandlers = useLongPress(
    (e) => handleContextMenu(e as React.MouseEvent | React.TouchEvent),
    { threshold: 500 }
  )
  
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer",
        "bg-dark-100/80 hover:bg-dark-100 transition-all duration-200",
        "border",
        "active:scale-[0.98]" // Touch feedback
      )}
      style={{ 
        marginLeft: depth > 0 ? depth * 8 : 0,
        borderColor: accentColor,
        boxShadow: `0 0 10px ${accentColor}33, 0 0 20px ${accentColor}11`,
      }}
      data-variant="row_neon_group"
      data-node-id={node.id}
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={(e) => longPressHandlers.onMouseDown(e, node)}
      onMouseUp={longPressHandlers.onMouseUp}
      onMouseLeave={longPressHandlers.onMouseLeave}
      onTouchStart={(e) => longPressHandlers.onTouchStart(e, node)}
      onTouchEnd={longPressHandlers.onTouchEnd}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
    >
      {/* Icon (Left) - Large and colored */}
      <div className="flex-shrink-0">
        <Folder 
          size={28} 
          style={{ color: accentColor }}
          fill={`${accentColor}33`}
        />
      </div>
      
      {/* Middle: Headline and Subtext */}
      <div className="flex-1 min-w-0">
        {/* Headline */}
        <div className="text-sm font-medium truncate">
          {headline}
        </div>
        
        {/* Subtext */}
        {subtext && (
          <div className="text-xs text-dark-400 mt-0.5 line-clamp-1">
            {subtext}
          </div>
        )}
      </div>
      
      {/* Count Badge */}
      {displayBadge && (
        <span 
          className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full bg-dark-200/80"
          style={{ color: accentColor }}
        >
          {displayBadge}
        </span>
      )}
      
      {/* Chevron */}
      {showChevron && (
        <ChevronRight 
          size={20} 
          className="flex-shrink-0 text-dark-400"
        />
      )}
      
      {/* End Element (Avatar) */}
      {endElement && (
        <div className="flex-shrink-0">
          <Avatar 
            src={avatarSrc} 
            name={avatarName} 
            size="sm" 
          />
        </div>
      )}
    </div>
  )
}
