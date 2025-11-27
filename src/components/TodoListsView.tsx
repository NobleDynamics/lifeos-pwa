import React from 'react'
import { Plus, Target } from 'lucide-react'
import { TodoList } from '@/types/database'
import { useTodoData } from '@/hooks/useTodoData'
import { useTodoNavigation, useTodoUI } from '@/store/useTodoStore'
import { cn } from '@/lib/utils'

interface TodoListsViewProps {
  accentColor?: string
}

export function TodoListsView({ accentColor = '#00EAFF' }: TodoListsViewProps) {
  const { lists, loading } = useTodoData()
  const { selectedCategoryId, navigateToList } = useTodoNavigation()
  const { setShowForm, setEditingItem } = useTodoUI()

  const handleCreateList = () => {
    setEditingItem(null)
    setShowForm('list')
  }

  const handleListClick = (listId: string) => {
    navigateToList(listId)
  }

  if (loading && lists.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (lists.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Lists Yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first list to start organizing your tasks</p>
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
      {lists.map((list) => (
        <div
          key={list.id}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
            "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
            "hover:border-gray-300 dark:hover:border-gray-600"
          )}
          onClick={() => handleListClick(list.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: accentColor + '20' }}
              >
                <Target
                  className="w-5 h-5"
                  style={{ color: accentColor }}
                />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {list.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {list.description || 'No description'}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {0} items
                    </span>
                  </div>
                  {list.is_shared && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      Shared
                    </span>
                  )}
                </div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      ))}
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
