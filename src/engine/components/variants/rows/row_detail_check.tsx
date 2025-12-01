/**
 * RowDetailCheck Variant Component
 * 
 * A row layout with checkbox/status on the left, headline + subtext in the middle,
 * and an optional action/avatar on the right.
 * Purely structural - uses slots for all display data.
 * 
 * @module engine/components/variants/rows/row_detail_check
 */

import { Circle, CheckCircle2, PlayCircle, Calendar, MapPin } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useEngineActions, type BehaviorConfig } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { useLongPress } from '@/hooks/useLongPress'
import { Avatar } from '@/components/shared/Avatar'
import { cn } from '@/lib/utils'

// Status icons mapping (generic status states)
const statusIcons = {
  active: Circle,
  not_started: Circle,
  pending: Circle,
  in_progress: PlayCircle,
  completed: CheckCircle2,
  done: CheckCircle2,
}

// Status display text mapping (generic)
const statusDisplayText: Record<string, string> = {
  active: 'Active',
  not_started: 'Not Started',
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  done: 'Done',
}

/**
 * RowDetailCheck - Detailed row with checkbox, headline, subtext, and action.
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ [○/●]  |  headline                                   [Avatar]  │
 * │        |  subtext                                              │
 * │        |  [badge_1] [badge_2] [badge_3]                        │
 * └─────────────────────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - subtext: Secondary text (default: metadata.description)
 * - status: Status for icon & badge ('active', 'in_progress', 'completed')
 * - badge_1: First badge text (often status display)
 * - badge_2: Second badge text (e.g., date with { type: 'date' })
 * - badge_3: Third badge text (e.g., location)
 * - badge_2_icon: Icon for badge_2 ('calendar', 'mappin')
 * - badge_3_icon: Icon for badge_3
 * - end_element: Avatar/element config for right side
 */
export function RowDetailCheck({ node }: VariantComponentProps) {
  const { depth } = useNode()
  const actions = useEngineActions()

  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const status = useSlot<string>('status', 'active')
  const badge1 = useSlot<string>('badge_1')
  const badge2 = useSlot<string>('badge_2', undefined, { type: 'date' })
  const badge3 = useSlot<string>('badge_3')
  const badge2Icon = useSlot<string>('badge_2_icon')
  const badge3Icon = useSlot<string>('badge_3_icon')
  const endElement = useSlot<{ name?: string; avatar?: string } | string>('end_element')

  // Get status icon
  const StatusIcon = statusIcons[status as keyof typeof statusIcons] || Circle
  const isCompleted = status === 'completed' || status === 'done'

  // Derive avatar props from end_element
  const avatarSrc = typeof endElement === 'string'
    ? endElement
    : endElement?.avatar
  const avatarName = typeof endElement === 'string'
    ? undefined
    : endElement?.name

  // Check if we have any badges to show
  const hasBadges = badge1 || badge2 || badge3

  // Resolve badge icons
  const Badge2Icon = badge2Icon === 'calendar' ? Calendar : badge2Icon === 'mappin' ? MapPin : null
  const Badge3Icon = badge3Icon === 'calendar' ? Calendar : badge3Icon === 'mappin' ? MapPin : null

  // Auto-detect badge icons if not specified (convention over config)
  const shouldShowCalendarIcon = !badge2Icon && badge2 && !Badge2Icon
  const shouldShowLocationIcon = !badge3Icon && badge3 && !Badge3Icon

  // Handle status icon click - cycle status or trigger behavior
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!actions) return

    // Check for custom behavior in metadata
    const behavior = node.metadata.behavior as BehaviorConfig | undefined

    if (behavior) {
      actions.onTriggerBehavior(node, behavior)
    } else {
      // Fallback to default status cycling
      const resource = actions.nodeToResource(node)
      actions.onCycleStatus(resource)
    }
  }

  // Handle row click/long-press - open context menu
  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
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
        "flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer",
        "bg-dark-100/50 hover:bg-dark-100 transition-colors",
        "border border-dark-200",
        isCompleted && "opacity-60"
      )}
      style={{ marginLeft: depth > 0 ? depth * 8 : 0 }}
      data-variant="row_detail_check"
      data-node-id={node.id}
      onContextMenu={handleContextMenu}
      onMouseDown={(e) => longPressHandlers.onMouseDown(e, node)}
      onMouseUp={longPressHandlers.onMouseUp}
      onMouseLeave={longPressHandlers.onMouseLeave}
      onTouchStart={(e) => longPressHandlers.onTouchStart(e, node)}
      onTouchEnd={longPressHandlers.onTouchEnd}
    >
      {/* Status Icon (Left) - Clickable to cycle status */}
      <div
        className="flex-shrink-0 pt-0.5 cursor-pointer hover:scale-110 transition-transform"
        onClick={handleStatusClick}
        role="button"
        aria-label={`Toggle status: currently ${status}`}
      >
        <StatusIcon
          size={20}
          className={cn(
            isCompleted ? "text-green-500" : "text-dark-400",
            status === 'in_progress' && "text-cyan-500"
          )}
        />
      </div>

      {/* Middle: Headline, Subtext, Badges */}
      <div className="flex-1 min-w-0">
        {/* Headline */}
        <div
          className={cn(
            "text-sm font-medium truncate",
            isCompleted && "line-through text-dark-500"
          )}
        >
          {headline}
        </div>

        {/* Subtext */}
        {subtext && (
          <div className="text-xs text-dark-400 mt-0.5 line-clamp-2">
            {subtext}
          </div>
        )}

        {/* Badges Row */}
        {hasBadges && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Badge 1 (Status) */}
            {badge1 && (
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  "bg-dark-200/80 text-dark-400"
                )}
              >
                {badge1}
              </span>
            )}

            {/* Badge 2 (e.g., Date) */}
            {badge2 && (
              <span className="flex items-center gap-1 text-xs text-dark-500">
                {Badge2Icon && <Badge2Icon size={14} />}
                {shouldShowCalendarIcon && <Calendar size={14} />}
                {badge2}
              </span>
            )}

            {/* Badge 3 (e.g., Location) */}
            {badge3 && (
              <span className="flex items-center gap-1 text-xs text-dark-500">
                {Badge3Icon && <Badge3Icon size={14} />}
                {shouldShowLocationIcon && <MapPin size={14} />}
                {badge3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right: End Element (Avatar) */}
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
