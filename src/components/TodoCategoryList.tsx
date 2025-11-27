import React, { useState } from 'react'
import { Plus, MoreVertical, Target, List, CheckCircle, Clock } from 'lucide-react'
import { TodoCategory } from '@/types/database'
import { useTodoData } from '@/hooks/useTodoData'
import { useTodoNavigation, useTodoUI, useTodoContextMenu } from '@/store/useTodoStore'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/utils'

interface TodoCategoryListProps {
  accentColor?: string
}

export function TodoCategoryList({ accentColor = '#00EAFF' }: TodoCategoryListProps) {
  const { categories, loading, getListCount } = useTodoData()
  const { navigateToCategory } = useTodoNavigation()
  const { setShowForm, setEditingItem } = useTodoUI()
  const { showContextMenu, hideContextMenu } = useTodoContextMenu()

  const handleCategoryClick = (categoryId: string) => {
    navigateToCategory(categoryId)
  }

  const handleCreateCategory = () => {
    setEditingItem(null)
    setShowForm('category')
  }

  const handleEditCategory = (category: TodoCategory) => {
    setEditingItem(category)
    setShowForm('category')
    hideContextMenu()
  }

  const handleCategoryContextMenu = (e: React.MouseEvent, category: TodoCategory) => {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, category, 'category')
  }

  const longPressHandlers = useLongPress(
    (e, category) => handleCategoryContextMenu(e as React.MouseEvent, category as TodoCategory),
    { threshold: 500 }
  )

  if (loading) {
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

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Categories Yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first category to start organizing your tasks</p>
        <button
          onClick={handleCreateCategory}
          className={cn(
            "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white",
            "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          )}
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Category
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const listCount = getListCount(category.id)
        
        return (
          <div
            key={category.id}
            className={cn(
              "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
              "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
              "hover:border-gray-300 dark:hover:border-gray-600"
            )}
            onClick={() => handleCategoryClick(category.id)}
            onContextMenu={(e) => handleCategoryContextMenu(e, category)}
            {...longPressHandlers(category)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color + '20' }}
                >
                  <Target
                    className="w-5 h-5"
                    style={{ color: category.color }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {category.description || 'No description'}
                  </p>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <List className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {listCount} lists
                      </span>
                    </div>
                    {category.is_shared && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
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
                    handleCategoryContextMenu(e, category)
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-400" />
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
