import React, { useEffect } from 'react'
import { Plus, CheckCircle, Clock, Circle, PlayCircle } from 'lucide-react'
import { TodoItem } from '@/types/database'
import { useTodoData } from '@/hooks/useTodoData'
import { useTodoNavigation, useTodoUI } from '@/store/useTodoStore'
import { cn } from '@/lib/utils'

interface TodoItemsViewProps {
  accentColor?: string
}

export function TodoItemsView({ accentColor = '#00EAFF' }: TodoItemsViewProps) {
  const { items, loading, fetchItems, cycleItemStatus } = useTodoData()
  const { selectedListId } = useTodoNavigation()
  const { setShowForm, setEditingItem } = useTodoUI()

  // Fetch items when the component mounts or list changes
  useEffect(() => {
    if (selectedListId) {
      console.log('TodoItemsView: Fetching items for list:', selectedListId)
      fetchItems(selectedListId)
    }
  }, [selectedListId, fetchItems])

  const handleCreateItem = () => {
    setEditingItem(null)
    setShowForm('item')
  }

  const handleItemClick = (item: TodoItem) => {
    setEditingItem(item)
    setShowForm('item')
  }

  const handleStatusClick = (e: React.MouseEvent, itemId: string) => {
    e.stopPropagation()
    cycleItemStatus(itemId)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <PlayCircle className="w-5 h-5 text-blue-500" />
      case 'started':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Circle className="w-5 h-5 text-dark-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'in_progress':
        return 'text-blue-500'
      case 'started':
        return 'text-yellow-500'
      default:
        return 'text-dark-400'
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-dark-100 rounded-lg shadow-sm border border-dark-300 p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-5 h-5 bg-dark-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-dark-200 rounded w-32 mb-2"></div>
                  <div className="h-3 bg-dark-200 rounded w-24"></div>
                </div>
              </div>
              <div className="h-4 bg-dark-200 rounded w-12"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-12 h-12 text-dark-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-white mb-2">No Items Yet</h3>
        <p className="text-dark-500 mb-6">Create your first item to get started</p>
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
            "bg-dark-100 rounded-lg shadow-sm border border-dark-300",
            "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
            "hover:border-dark-200",
            item.status === 'completed' && 'opacity-60'
          )}
          onClick={() => handleItemClick(item)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                onClick={(e) => handleStatusClick(e, item.id)}
                className="hover:scale-110 transition-transform"
              >
                {getStatusIcon(item.status)}
              </button>
              <div className="flex-1">
                <h3 className={cn(
                  "text-sm font-medium text-white",
                  item.status === 'completed' && 'line-through'
                )}>
                  {item.name}
                </h3>
                {item.description && (
                  <p className="text-xs text-dark-500 mt-1">
                    {item.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`text-xs capitalize ${getStatusColor(item.status)}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                  {item.due_date && (
                    <span className="text-xs text-dark-400">
                      Due: {new Date(item.due_date).toLocaleDateString()}
                    </span>
                  )}
                  {item.location_name && (
                    <span className="text-xs text-dark-400">
                      📍 {item.location_name}
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
