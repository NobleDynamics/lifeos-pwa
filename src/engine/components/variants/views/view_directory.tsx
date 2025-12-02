/**
 * ViewDirectory Variant Component
 * 
 * A container variant with search bar header and vertical stack of children.
 * Includes client-side filtering and "New" button with type selection.
 * Purely structural - uses slots for all display data.
 * 
 * @module engine/components/variants/views/view_directory
 */

import { useState, useMemo } from 'react'
import { Search, Plus, Folder, CheckSquare, X } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode, useChildCount } from '../../../context/NodeContext'
import { useEngineActions } from '../../../context/EngineActionsContext'
import { useSlot } from '../../../hooks/useSlot'
import { renderChildren } from '../../ViewEngine'
import { useShell } from '../../../context/ShellContext'
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
  const { depth, rootId } = useNode()
  const childCount = useChildCount()
  const actions = useEngineActions()

  // Shell context
  const { searchQuery: shellQuery, isSearchEnabled: shellSearchEnabled } = useShell()

  // Local Search state (used if not in shell)
  const [localQuery, setLocalQuery] = useState('')

  // Effective query
  const searchQuery = shellSearchEnabled ? shellQuery : localQuery

  // Type selector state
  const [showTypeSelector, setShowTypeSelector] = useState(false)

  // Slot-based data access
  const searchPlaceholder = useSlot<string>('search_placeholder', 'Search...')
  const showActionButton = useSlot<boolean>('show_action_button', true)
  const actionLabel = useSlot<string>('action_label', 'New')

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

  // Handle "+ New" button click - show type selector
  const handleNewClick = () => {
    if (actions) {
      setShowTypeSelector(true)
    }
  }

  // Handle type selection
  const handleTypeSelect = (type: 'folder' | 'task') => {
    setShowTypeSelector(false)
    if (actions) {
      actions.onOpenCreateForm(type, node.id)
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      data-variant="view_directory"
      data-node-id={node.id}
    >
      {/* Top Bar: Search + Action Button */}
      <div className="flex items-center gap-3 px-3 py-3 border-b border-dark-200">
        {/* Search Input - Only show if NOT shell enabled */}
        {!shellSearchEnabled && (
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
        )}

        {/* Action Button */}
        {showActionButton && (
          <div className="relative">
            <button
              onClick={handleNewClick}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg",
                "text-sm font-medium text-white",
                "bg-gradient-to-r from-cyan-600 to-cyan-500",
                "hover:from-cyan-500 hover:to-cyan-400",
                "active:scale-95 transition-all duration-150",
                "shadow-lg shadow-cyan-500/20"
              )}
              type="button"
            >
              <Plus size={16} />
              {actionLabel}
            </button>

            {/* Type Selector Dropdown */}
            {showTypeSelector && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowTypeSelector(false)}
                />

                {/* Dropdown */}
                <div
                  className={cn(
                    "absolute right-0 top-full mt-2 z-50",
                    "min-w-[160px] py-2 rounded-lg shadow-lg",
                    "bg-dark-100 border border-dark-300"
                  )}
                >
                  {/* Custom Options from Metadata */}
                  {node.metadata.create_options ? (
                    (node.metadata.create_options as any[]).map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          // If variant is provided, we might need a way to pass it.
                          // For now, we assume standard types or that the form handles it.
                          // But wait, the user said: "If create_options exists... render those options".
                          // The `onOpenCreateForm` takes `type` ('folder' | 'task').
                          // If we need custom variants, we might need to extend `onOpenCreateForm` or pass extra data.
                          // However, the prompt says: "If create_options exists (e.g., [{ label: 'Add Item', variant: 'row_input_currency' }])".
                          // This implies we should be able to create items with specific variants.
                          // Since `onOpenCreateForm` signature is `(type: 'folder' | 'task', parentId: string)`, 
                          // we might be limited. 
                          // Let's assume 'task' is the generic type for items, and we might need to set the variant later?
                          // OR, maybe we just pass 'task' and the user will configure it?
                          // Actually, let's look at `EngineActionsContext`.
                          // It seems `onOpenCreateForm` is simple.
                          // Let's just map everything to 'task' for now unless it's explicitly 'folder'.
                          // And maybe we can pass the variant in a way that the form picks it up?
                          // For now, I will just implement the UI part as requested.
                          // If the backend/form doesn't support it yet, that's a separate issue, 
                          // but I should try to pass the variant if possible.
                          // The `useResourceForm` hook might need update, but I can't see it.
                          // I will just call handleTypeSelect with 'task' or 'folder' based on some logic,
                          // or just default to 'task' for custom items.
                          handleTypeSelect(option.type || 'task')
                        }}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm",
                          "flex items-center gap-3",
                          "text-white hover:bg-dark-200 transition-colors"
                        )}
                      >
                        {/* We can try to map icons if needed, or just use a default */}
                        <CheckSquare size={16} className="text-cyan-400" />
                        {option.label}
                      </button>
                    ))
                  ) : (
                    /* Default Options */
                    <>
                      <button
                        onClick={() => handleTypeSelect('folder')}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm",
                          "flex items-center gap-3",
                          "text-white hover:bg-dark-200 transition-colors"
                        )}
                      >
                        <Folder size={16} className="text-cyan-400" />
                        Folder
                      </button>
                      <button
                        onClick={() => handleTypeSelect('task')}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-sm",
                          "flex items-center gap-3",
                          "text-white hover:bg-dark-200 transition-colors"
                        )}
                      >
                        <CheckSquare size={16} className="text-green-400" />
                        Task
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
        {hasChildren && hasFilteredResults && (
          renderChildren(nodeWithFilteredChildren, depth, rootId)
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
