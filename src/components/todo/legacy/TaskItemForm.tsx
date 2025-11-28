import { useState, useEffect } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import { TodoItem, TodoStatus } from '@/types/database'
import { useCreateItem, useUpdateItem } from '@/hooks/useTodoData'
import { useTodoUI, useTodoNavigation } from '@/store/useTodoStore'
import { cn } from '@/lib/utils'
import { FormSheet } from '@/components/shared/FormSheet'

interface TaskItemFormProps {
  editingItem?: TodoItem | null
  onClose?: () => void
  accentColor?: string
}

export function TaskItemForm({ editingItem: editingItemProp, onClose, accentColor = '#00EAFF' }: TaskItemFormProps) {
  const createItemMutation = useCreateItem()
  const updateItemMutation = useUpdateItem()
  const { setShowForm, editingItem } = useTodoUI()
  const { selectedListId } = useTodoNavigation()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TodoStatus>('not_started')
  const [dueDate, setDueDate] = useState('')
  const [locationName, setLocationName] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with editing data OR reset for new item
  useEffect(() => {
    const itemToEdit = editingItemProp || (editingItem as TodoItem)
    if (itemToEdit?.id) {
      // Editing existing item
      setName(itemToEdit.name || '')
      setDescription(itemToEdit.description || '')
      setStatus(itemToEdit.status || 'not_started')
      setDueDate(itemToEdit.due_date ? itemToEdit.due_date.split('T')[0] : '')
      setLocationName(itemToEdit.location_name || '')
      setIsShared(itemToEdit.is_shared || false)
    } else {
      // Creating new item - reset all fields
      setName('')
      setDescription('')
      setStatus('not_started')
      setDueDate('')
      setLocationName('')
      setIsShared(false)
    }
  }, [editingItemProp, editingItem])

  const handleClose = () => {
    setShowForm(null)
    onClose?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!name.trim()) {
      setError('Task name is required')
      return
    }

    if (!selectedListId && !editingItemProp?.list_id && !(editingItem as TodoItem)?.list_id) {
      setError('No list selected')
      return
    }

    setIsSubmitting(true)

    try {
      const itemData: Partial<TodoItem> = {
        name: name.trim(),
        description: description.trim() || null,
        status,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        location_name: locationName.trim() || null,
        is_shared: isShared,
        list_id: selectedListId || (editingItem as TodoItem)?.list_id,
      }

      const itemToEdit = editingItemProp || (editingItem as TodoItem)
      
      if (itemToEdit?.id) {
        await updateItemMutation.mutateAsync({ id: itemToEdit.id, updates: itemData })
      } else {
        await createItemMutation.mutateAsync(itemData)
      }

      // TanStack Query automatically invalidates and refetches
      handleClose()
    } catch (err) {
      console.error('Error saving item:', err)
      setError('Failed to save item. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = !!(editingItemProp || editingItem)

  const statusOptions: { value: TodoStatus; label: string; color: string }[] = [
    { value: 'not_started', label: 'Not Started', color: '#6B7280' },
    { value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
    { value: 'completed', label: 'Completed', color: '#10B981' },
  ]

  return (
    <FormSheet
      title={isEditing ? 'Edit Task' : 'Create Task'}
      onClose={handleClose}
      maxHeight="90vh"
    >
      <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-4">
        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Name Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-400">
            Task Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Buy groceries, Call client"
            className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-400">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Task details..."
            rows={2}
            className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-400">
            Status
          </label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatus(option.value)}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                  status === option.value
                    ? "border-white/30"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
                style={{ 
                  backgroundColor: status === option.value ? option.color + '40' : option.color + '20',
                  color: option.color
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-400 flex items-center gap-2">
            <Calendar size={14} />
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-400 flex items-center gap-2">
            <MapPin size={14} />
            Location
          </label>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="e.g., Home, Office, Store"
            className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Shared Toggle */}
        <div className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
          <div>
            <p className="text-sm font-medium">Share with Household</p>
            <p className="text-xs text-dark-500">Allow household members to view and edit</p>
          </div>
          <button
            type="button"
            onClick={() => setIsShared(!isShared)}
            className={cn(
              "w-12 h-6 rounded-full transition-colors duration-200 relative",
              isShared ? "bg-primary" : "bg-dark-400"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200",
                isShared && "translate-x-6"
              )}
            />
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className={cn(
            "w-full py-3 rounded-lg font-medium text-white transition-all duration-200",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "hover:opacity-90 active:scale-[0.98]"
          )}
          style={{ backgroundColor: accentColor }}
        >
          {isSubmitting 
            ? 'Saving...' 
            : isEditing 
              ? 'Update Task' 
              : 'Create Task'
          }
        </button>
      </form>
    </FormSheet>
  )
}
