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
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  
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
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search 
            size={16} 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-500" 
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
