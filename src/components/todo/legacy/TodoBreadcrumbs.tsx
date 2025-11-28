import React from 'react'
import { useTodoNavigation } from '@/store/useTodoStore'

export function TodoBreadcrumbs() {
  const { currentView, selectedCategoryName, selectedListName } = useTodoNavigation()
  
  return (
    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
      <span>To-Do</span>
      {currentView === 'lists' && (
        <>
          <span>›</span>
          <span className="text-white">{selectedCategoryName || 'Lists'}</span>
        </>
      )}
      {currentView === 'items' && (
        <>
          <span>›</span>
          <span>{selectedCategoryName || 'Lists'}</span>
          <span>›</span>
          <span className="text-white">{selectedListName || 'Tasks'}</span>
        </>
      )}
    </div>
  )
}
