/**
 * ViewDirectory Variant Component
 * 
 * A container variant with search bar header and vertical stack of children.
 * Includes client-side filtering. The "New" button is controlled via ShellActionContext
 * so it appears in the App Shell header.
 * Purely structural - uses slots for all display data.
 * 
 * @module engine/components/variants/views/view_directory
 */

import { useState, useMemo, useEffect } from 'react'
import { Search } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode, useChildCount } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { useShellAction, type CreateOption } from '../../../context/ShellActionContext'
import { renderChildren } from '../../ViewEngine'
import { cn } from '@/lib/utils'

/**
 * ViewDirectory - Directory container with search and action button.
 * 
 * Structure:
 * ┌────────────────────────────────────────────────┐
 * │ [🔍 Search...                    ] [+ New]     │
 * ├────────────────────────────────────────────────┤
 * │ Child 1                                        │
 * │ Child 2                                        │
 * │ ...                                            │
 * ├────────────────────────────────────────────────┤
 * │ Showing X of Y results                         │
 * └────────────────────────────────────────────────┘
 * 
 * Slots:
 * - headline: Title (not displayed, used for context)
 * - search_placeholder: Search input placeholder text
 * - show_action_button: Whether to show "+ New" button (default: true)
 * - action_label: Label for action button (default: "New")
 */
export function ViewDirectory({ node }: VariantComponentProps) {
  const { depth, rootId, rootNode } = useNode()
  const childCount = useChildCount()
  const { setActionConfig, clearActionConfig } = useShellAction()

  // Local Search state - always use local search (shell search removed)
  const [localQuery, setLocalQuery] = useState('')
  const searchQuery = localQuery

  // Slot-based data access
  const searchPlaceholder = useSlot<string>('search_placeholder', 'Search...')
  const showActionButton = useSlot<boolean>('show_action_button', true)
  const actionLabel = useSlot<string>('action_label', 'New')

  // ==========================================================================
  // SHELL ACTION CONFIG (Phase 2: Dynamic Header)
  // ==========================================================================
  
  // Set action config on mount, clear on unmount
  useEffect(() => {
    if (!showActionButton) {
      clearActionConfig()
      return
    }

    // Build options from metadata or use defaults
    const customOptions = node.metadata.create_options as CreateOption[] | undefined
    
    const options: CreateOption[] = customOptions || [
      { label: 'Folder', type: 'folder', icon: 'Folder' },
      { label: 'Task', type: 'task', icon: 'CheckSquare' }
    ]

    setActionConfig({
      label: actionLabel,
      options,
      parentId: node.id
    })

    // Cleanup on unmount
    return () => {
      clearActionConfig()
    }
  }, [node.id, node.metadata.create_options, showActionButton, actionLabel, setActionConfig, clearActionConfig])

  // Filter children based on search query
  const filteredChildren = useMemo(() => {
    if (!searchQuery.trim() || !node.children) {
      return node.children
    }

    const query = searchQuery.toLowerCase().trim()
    return node.children.filter(child => {
      // Search in title
      if (child.title.toLowerCase().includes(query)) return true

      // Search in description metadata
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
  const isFiltering = searchQuery.trim().length > 0

  return (
    <div
      className="flex flex-col"
      data-variant="view_directory"
      data-node-id={node.id}
    >
      {/* Top Bar: Search Only (Action button moved to Shell Header) */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-dark-200">
        {/* Search Input - Always show local search per directory */}
        <div className="flex-1 relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500"
          />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "w-full pl-9 pr-3 py-2 rounded-lg",
              "bg-dark-100/50 border border-dark-200",
              "text-sm text-white placeholder:text-dark-500",
              "focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/25",
              "transition-colors"
            )}
          />
        </div>
      </div>

      {/* List Area - shell viewport handles scrolling and bottom buffer */}
      <div className="px-3 pt-2 space-y-2">
        {hasChildren && hasFilteredResults && (
          renderChildren(nodeWithFilteredChildren, depth, rootId, rootNode)
        )}

        {/* Empty State - No children */}
        {!hasChildren && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-dark-500 text-sm">
              No items yet
            </div>
            <div className="text-dark-600 text-xs mt-1">
              Tap "+ {actionLabel}" to create one
            </div>
          </div>
        )}

        {/* Empty State - No search results */}
        {hasChildren && !hasFilteredResults && isFiltering && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-dark-500 text-sm">
              No results for "{searchQuery}"
            </div>
            <div className="text-dark-600 text-xs mt-1">
              Try a different search term
            </div>
          </div>
        )}
      </div>

      {/* Footer: Result count (when filtering) */}
      {isFiltering && hasFilteredResults && (
        <div className="px-3 py-2 border-t border-dark-200 text-xs text-dark-500">
          Showing {filteredChildren?.length} of {childCount} results
        </div>
      )}
    </div>
  )
}
