import React, { useCallback } from 'react'
import { Plus, BarChart3, ArrowLeft } from 'lucide-react'
import { TodoAnalytics } from './TodoAnalytics'
import { TodoCategoryList } from './TodoCategoryList'
import { TodoListsView } from './TodoListsView'
import { TodoItemsView } from './TodoItemsView'
import { TodoBreadcrumbs } from './TodoBreadcrumbs'
import { TodoSearchFilter } from './TodoSearchFilter'
import { TodoContextMenu } from './TodoContextMenu'
import { TodoDetailSheet } from './TodoDetailSheet'
import { CategoryForm } from './CategoryForm'
import { TaskListForm } from './TaskListForm'
import { TaskItemForm } from './TaskItemForm'
import { useCategories } from '@/hooks/useTodoData'
import { useTodoNavigation, useTodoUI } from '@/store/useTodoStore'
import { useAuth } from '@/lib/supabase'
import { useBackButton } from '@/hooks/useBackButton'
import { cn } from '@/lib/utils'

interface TodoPaneProps {
  accentColor?: string
  chartColors?: string[]
}

export function TodoPane({ accentColor = '#00EAFF', chartColors = ['#00EAFF', '#00D4FF', '#00BFFF', '#0099FF', '#0077FF', '#0055FF'] }: TodoPaneProps) {
  const { user } = useAuth()
  const { currentView, navigateBack, getCurrentTitle } = useTodoNavigation()
  const { showAnalytics, showForm, setShowForm, setEditingItem } = useTodoUI()
  const { data: categories = [], isLoading: loading } = useCategories()

  // Handle Android back button - navigate through todo hierarchy
  const handleBackButton = useCallback(() => {
    // navigateBack returns false if at root level
    return navigateBack()
  }, [navigateBack])

  useBackButton({
    onCloseModal: handleBackButton
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-dark-500">Please log in to access your To-Do lists</p>
        </div>
      </div>
    )
  }

  const handleCreateNew = () => {
    // Clear any editing state first - this ensures form is empty for new item
    setEditingItem(null)
    
    if (currentView === 'categories') {
      setShowForm('category')
    } else if (currentView === 'lists') {
      setShowForm('list')
    } else if (currentView === 'items') {
      setShowForm('item')
    }
  }

  const renderContent = () => {
    if (loading && categories.length === 0) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-dark-200 rounded w-32"></div>
            <div className="h-32 bg-dark-200 rounded"></div>
          </div>
        </div>
      )
    }

    switch (currentView) {
      case 'categories':
        return <TodoCategoryList accentColor={accentColor} />
      case 'lists':
        return <TodoListsView accentColor={accentColor} />
      case 'items':
        return <TodoItemsView accentColor={accentColor} />
      default:
        return <TodoCategoryList accentColor={accentColor} />
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="bg-dark-50 border-b border-dark-300 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {currentView !== 'categories' && (
              <button
                onClick={() => navigateBack()}
                className="p-2 text-dark-500 hover:text-white rounded-lg hover:bg-dark-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h2 className="text-lg font-semibold text-white">
              {getCurrentTitle()}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (showAnalytics) {
                  setShowForm(null)
                } else {
                  // Toggle analytics display without changing form state
                  // Analytics is handled by showAnalytics state, not showForm
                }
              }}
              className={cn(
                "p-2 rounded-lg transition-colors",
                showAnalytics 
                  ? "text-white" 
                  : "text-dark-500 hover:text-white hover:bg-dark-200"
              )}
              style={showAnalytics ? { backgroundColor: accentColor } : {}}
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity"
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-4 h-4 mr-1" />
              {currentView === 'categories' ? 'Category' : currentView === 'lists' ? 'List' : 'Item'}
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <TodoBreadcrumbs />

        {/* Search and Filters */}
        <div className="mt-4 space-y-3">
          <TodoSearchFilter />
        </div>
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="bg-dark-50 border-b border-dark-300 p-4">
          <TodoAnalytics accentColor={accentColor} chartColors={chartColors} />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {renderContent()}
      </div>

      {/* Modals and Overlays */}
      <TodoContextMenu />
      <TodoDetailSheet />
      
      {/* Forms */}
      {showForm === 'category' && <CategoryForm />}
      {showForm === 'list' && <TaskListForm />}
      {showForm === 'item' && <TaskItemForm />}
    </div>

  )
}
