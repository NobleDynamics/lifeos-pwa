import React, { useMemo } from 'react'
import { Plus, CheckCircle, Circle, PlayCircle } from 'lucide-react'
import { TodoItem, TodoStatus } from '@/types/database'
import { useItems, useCycleItemStatus } from '@/hooks/useTodoData'
import { useTodoNavigation, useTodoUI, useTodoSearch, useTodoContextMenu } from '@/store/useTodoStore'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/utils'

interface TodoItemsViewProps {
  accentColor?: string
}

export function TodoItemsView({ accentColor = '#00EAFF' }: TodoItemsViewProps) {
  const { selectedListId } = useTodoNavigation()
  const { setShowForm, setEditingItem } = useTodoUI()
  const { searchQuery } = useTodoSearch()
  const { showContextMenu } = useTodoContextMenu()
  
  // Use TanStack Query hooks - automatically fetches when selectedListId changes
  const { data: rawItems = [], isLoading: loading } = useItems(selectedListId)
  const cycleStatusMutation = useCycleItemStatus()

  // Filter by search and sort by created_at to maintain stable order
  const items = useMemo(() => {
    let filtered = [...rawItems]
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      )
    }
    
    // Sort by created_at to maintain stable order (not affected by status changes)
    filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    return filtered
  }, [rawItems, searchQuery])

  const handleCreateTask = () => {
    setEditingItem(null)
    setShowForm('item')
  }

  // Cycle status: not_started -> in_progress -> completed -> not_started
  const cycleStatus = async (item: TodoItem) => {
    await cycleStatusMutation.mutateAsync({ item })
  }

  // Long press opens context menu (Edit/Delete)
  const handleLongPress = (e: React.MouseEvent | React.TouchEvent, item: TodoItem) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Get position from event
    let x = 0, y = 0
    if ('touches' in e) {
      x = e.touches[0]?.clientX || 0
      y = e.touches[0]?.clientY || 0
    } else {
      x = e.clientX
      y = e.clientY
    }
    
    showContextMenu(x, y, item, 'item')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <PlayCircle className="w-5 h-5 text-blue-500" />
      case 'started':
        // Treat 'started' same as 'not_started' (legacy status)
        return <Circle className="w-5 h-5 text-dark-400" />
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
        // Treat 'started' same as 'not_started' (legacy status)
        return 'text-dark-400'
      default:
        return 'text-dark-400'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      case 'started':
        return 'Not Started' // Treat legacy 'started' as 'not_started'
      case 'not_started':
        return 'Not Started'
      default:
        return 'Not Started'
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
        <h3 className="text-lg font-medium text-white mb-2">No Tasks Yet</h3>
        <p className="text-dark-500 mb-6">Create your first task to get started</p>
        <button
          onClick={handleCreateTask}
          className={cn(
            "inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white",
            "hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2"
          )}
          style={{ backgroundColor: accentColor }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Task
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <ItemCard
          key={item.id}
          item={item}
          accentColor={accentColor}
          onTap={() => cycleStatus(item)}
          onLongPress={(e) => handleLongPress(e, item)}
          getStatusIcon={getStatusIcon}
          getStatusColor={getStatusColor}
          getStatusLabel={getStatusLabel}
        />
      ))}
    </div>
  )
}

// Separate component to use the hook properly
function ItemCard({
  item,
  accentColor,
  onTap,
  onLongPress,
  getStatusIcon,
  getStatusColor,
  getStatusLabel
}: {
  item: TodoItem
  accentColor: string
  onTap: () => void
  onLongPress: (e: React.MouseEvent | React.TouchEvent) => void
  getStatusIcon: (status: string) => React.ReactNode
  getStatusColor: (status: string) => string
  getStatusLabel: (status: string) => string
}) {
  const longPressHandlers = useLongPress((e) => onLongPress(e), { threshold: 500 })

  return (
    <div
      className={cn(
        "bg-dark-100 rounded-lg shadow-sm border border-dark-300",
        "p-4 cursor-pointer transition-all duration-200 hover:shadow-md select-none",
        "hover:border-dark-200 active:scale-[0.98]",
        item.status === 'completed' && 'opacity-60'
      )}
      onClick={onTap}
      {...longPressHandlers}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="pointer-events-none">
            {getStatusIcon(item.status)}
          </div>
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
              <span className={`text-xs ${getStatusColor(item.status)}`}>
                {getStatusLabel(item.status)}
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
  )
}
