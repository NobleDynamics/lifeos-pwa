import React, { useMemo } from 'react'
import { Plus, List, MoreVertical } from 'lucide-react'
import { TodoList } from '@/types/database'
import { useLists, useAllItems } from '@/hooks/useTodoData'
import { useTodoNavigation, useTodoUI, useTodoSearch, useTodoContextMenu } from '@/store/useTodoStore'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/utils'

interface TodoListsViewProps {
  accentColor?: string
}

export function TodoListsView({ accentColor = '#00EAFF' }: TodoListsViewProps) {
  const { selectedCategoryId, navigateToList } = useTodoNavigation()
  const { setShowForm, setEditingItem } = useTodoUI()
  const { searchQuery } = useTodoSearch()
  const { showContextMenu, hideContextMenu } = useTodoContextMenu()
  
  // Use TanStack Query hooks - automatically fetches when selectedCategoryId changes
  const { data: rawLists = [], isLoading: loading } = useLists(selectedCategoryId)
  const { data: allItems = [] } = useAllItems()

  // Filter lists by search query
  const lists = useMemo(() => {
    if (!searchQuery.trim()) return rawLists
    
    const query = searchQuery.toLowerCase()
    return rawLists.filter(list =>
      list.name.toLowerCase().includes(query) ||
      list.description?.toLowerCase().includes(query)
    )
  }, [rawLists, searchQuery])

  // Get item count for a list
  const getItemCount = (listId: string): number => {
    return allItems.filter(item => item.list_id === listId).length
  }

  // Get completed item count for a list
  const getCompletedItemCount = (listId: string): number => {
    return allItems.filter(item => item.list_id === listId && item.status === 'completed').length
  }

  const handleCreateList = () => {
    setEditingItem(null)
    setShowForm('list')
  }

  const handleListClick = (list: TodoList) => {
    navigateToList(list.id, list.name)
  }

  const handleListContextMenu = (e: React.MouseEvent, list: TodoList) => {
    e.preventDefault()
    e.stopPropagation()
    showContextMenu(e.clientX, e.clientY, list, 'list')
  }

  const longPressHandlers = useLongPress(
    (e, list) => handleListContextMenu(e as React.MouseEvent, list as TodoList),
    { threshold: 500 }
  )

  if (loading && lists.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-dark-100 rounded-lg shadow-sm border border-dark-300 p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-dark-200 rounded-lg"></div>
                <div>
                  <div className="h-4 bg-dark-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-dark-200 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-dark-200 rounded w-8"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div className="text-center py-12">
        <List className="w-12 h-12 text-dark-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Lists Yet</h3>
        <p className="text-dark-500 mb-6">Create your first list to start organizing your tasks</p>
        <button
          onClick={handleCreateList}
          className={cn(
            "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white",
            "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          )}
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create List
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {lists.map((list) => {
        const itemCount = getItemCount(list.id)
        const completedCount = getCompletedItemCount(list.id)
        
        return (
          <div
            key={list.id}
            className={cn(
              "bg-dark-100 rounded-lg shadow-sm border border-dark-300",
              "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
              "hover:border-dark-200"
            )}
            onClick={() => handleListClick(list)}
            onContextMenu={(e) => handleListContextMenu(e, list)}
            onMouseDown={(e) => longPressHandlers.onMouseDown(e, list)}
            onTouchStart={(e) => longPressHandlers.onTouchStart(e, list)}
            onMouseUp={longPressHandlers.onMouseUp}
            onMouseLeave={longPressHandlers.onMouseLeave}
            onTouchEnd={longPressHandlers.onTouchEnd}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: accentColor + '20' }}
                >
                  <List
                    className="w-5 h-5"
                    style={{ color: accentColor }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-white">
                    {list.name}
                  </h3>
                  <p className="text-xs text-dark-500 mt-1">
                    {list.description || 'No description'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-xs text-dark-500">
                        {completedCount}/{itemCount} items
                      </span>
                    </div>
                    {list.due_date && (
                      <span className="text-xs text-dark-400">
                        Due: {new Date(list.due_date).toLocaleDateString()}
                      </span>
                    )}
                    {list.is_shared && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/20 text-primary">
                        Shared
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleListContextMenu(e, list)
                  }}
                  className="p-1 text-dark-400 hover:text-white rounded-full hover:bg-dark-200"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-dark-400" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ChevronRight icon component
function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  )
}
