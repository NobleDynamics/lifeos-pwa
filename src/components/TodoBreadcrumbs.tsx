import React from 'react'
import { useTodoNavigation } from '@/store/useTodoStore'

export function TodoBreadcrumbs() {
  const { currentView, selectedCategoryId, selectedListId } = useTodoNavigation()
  
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <span>To-Do</span>
      {currentView === 'lists' && <span>› Lists</span>}
      {currentView === 'items' && <span>› Lists › Items</span>}
    </div>
  )
}
