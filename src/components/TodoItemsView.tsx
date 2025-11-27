import React from 'react'
import { Plus, CheckCircle, Clock } from 'lucide-react'
import { TodoItem } from '@/types/database'
import { useTodoData } from '@/hooks/useTodoData'
import { useTodoNavigation, useTodoUI } from '@/store/useTodoStore'
import { cn } from '@/lib/utils'

interface TodoItemsViewProps {
  accentColor?: string
}

export function TodoItemsView({ accentColor = '#00EAFF' }: TodoItemsViewProps) {
  const { items, loading } = useTodoData()
  const { selectedListId } = useTodoNavigation()
  const { setShowForm, setEditingItem } = useTodoUI()

  const handleCreateItem = () => {
    setEditingItem(null)
    setShowForm('item')
  }

  const handleItemClick = (item: TodoItem) => {
    setEditingItem(item)
    setShowForm('item')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400'
      case 'in_progress':
        return 'text-blue-600 dark:text-blue-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Items Yet</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first item to get started</p>
        <button
          onClick={handleCreateItem}
          className={cn(
            "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white",
            "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          )}
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Item
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700",
            "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
            "hover:border-gray-300 dark:hover:border-gray-600"
          )}
          onClick={() => handleItemClick(item)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getStatusIcon(item.status)}
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(item.status)}
                    <span className={`text-xs ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </div>
                  {item.due_date && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
