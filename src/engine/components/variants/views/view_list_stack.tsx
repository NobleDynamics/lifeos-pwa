/**
 * ViewListStack Variant Component
 * 
 * A generic vertical stack container that renders children in a collapsible list.
 * Purely structural - uses slots for all display data.
 * 
 * @module engine/components/variants/views/view_list_stack
 */

import { useState, useMemo } from 'react'
import { Folder, ChevronDown, ChevronRight } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode, useChildCount, useIsRoot } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { renderChildren } from '../../ViewEngine'
import { useShell } from '../../../context/ShellContext'
import { cn } from '@/lib/utils'

/**
 * ViewListStack - Generic collapsible container with vertical stack layout.
 * 
 * Structure:
 * ┌────────────────────────────────────────────────┐
 * │ [▼] [Icon]  headline              [count]      │
 * │             subtext                            │
 * ├────────────────────────────────────────────────┤
 * │   │ Child 1                                    │
 * │   │ Child 2                                    │
 * │   │ ...                                        │
 * └────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Primary text (default: node.title)
 * - subtext: Secondary text (default: metadata.description)
 * - accent_color: Neon border color (default: metadata.color → #06b6d4)
 * - icon_start: Icon name (default: 'folder')
 */
export function ViewListStack({ node }: VariantComponentProps) {
  const { depth, rootId } = useNode()
  const childCount = useChildCount()
  const isRoot = useIsRoot()

  // Collapsible state - starts expanded
  const [isExpanded, setIsExpanded] = useState(true)

  // Slot-based data access
  const headline = useSlot<string>('headline') ?? node.title
  const subtext = useSlot<string>('subtext')
  const accentColor = useSlot<string>('accent_color', '#06b6d4')

  // Shell context for filtering
  const { searchQuery } = useShell()

  // Filter children based on search query
  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim() || !node.children) {
      return node.children
    }

    const query = searchQuery.toLowerCase().trim()
    return node.children.filter(child => {
      if (child.title.toLowerCase().includes(query)) return true
      const description = child.metadata.description as string | undefined
      if (description?.toLowerCase().includes(query)) return true
      return false
    })
  }, [node.children, searchQuery])

  // Create a virtual node with filtered children for rendering
  const nodeWithFilteredChildren = useMemo(() => ({
    ...node,
    children: filteredChildren
  }), [node, filteredChildren])

  const hasChildren = childCount > 0
  const hasFilteredResults = filteredChildren && filteredChildren.length > 0

  return (
    <div
      className={cn(
        "rounded-lg overflow-hidden",
        "transition-all duration-200",
        !isRoot && "my-2"
      )}
      style={{
        marginLeft: depth > 0 ? 8 : 0,
      }}
      data-variant="view_list_stack"
      data-node-id={node.id}
    >
      {/* Header with Neon Glow */}
      <div
        className={cn(
          "flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer",
          "bg-dark-100/80 hover:bg-dark-100",
          "border transition-all duration-200",
          "hover:shadow-lg"
        )}
        style={{
          borderColor: `${accentColor}66`,
          boxShadow: `0 0 12px ${accentColor}22, inset 0 0 8px ${accentColor}11`,
        }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren && (
          <span className="flex-shrink-0 text-dark-400">
            {isExpanded ? (
              <ChevronDown size={16} />
            ) : (
              <ChevronRight size={16} />
            )}
          </span>
        )}

        {/* Icon */}
        <Folder
          size={18}
          className="flex-shrink-0"
          style={{ color: accentColor }}
          fill={`${accentColor}33`}
        />

        {/* Headline */}
        <span className="flex-1 font-medium text-sm truncate">
          {headline}
        </span>

        {/* Child Count Badge */}
        {hasChildren && (
          <span
            className="text-xs px-2 py-0.5 rounded-full bg-dark-200/80"
            style={{ color: accentColor }}
          >
            {childCount}
          </span>
        )}
      </div>

      {/* Subtext (if provided and expanded) */}
      {subtext && isExpanded && (
        <div className="px-3 py-2 text-xs text-dark-400" style={{ marginLeft: hasChildren ? 24 : 0 }}>
          {subtext}
        </div>
      )}

      {/* Children */}
      {hasChildren && isExpanded && (
        <div
          className="pl-2 pt-1 pb-1 border-l-2 ml-4"
          style={{ borderColor: `${accentColor}33` }}
        >
          {renderChildren(nodeWithFilteredChildren, depth, rootId)}
        </div>
      )}

      {/* Empty State */}
      {!hasChildren && isExpanded && (
        <div className="px-3 py-4 text-center text-xs text-dark-500 italic">
          Empty container
        </div>
      )}
    </div>
  )
}
