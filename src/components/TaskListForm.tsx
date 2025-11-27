import { useState, useEffect } from 'react'
import { Calendar, MapPin } from 'lucide-react'
import { TodoList } from '@/types/database'
import { useTodoData } from '@/hooks/useTodoData'
import { useTodoUI, useTodoNavigation } from '@/store/useTodoStore'
import { cn } from '@/lib/utils'
import { FormSheet } from '@/components/shared/FormSheet'

interface TaskListFormProps {
  editingList?: TodoList | null
  onClose?: () => void
  accentColor?: string
}

export function TaskListForm({ editingList, onClose, accentColor = '#00EAFF' }: TaskListFormProps) {
  const { createList, updateList } = useTodoData()
  const { setShowForm, editingItem } = useTodoUI()
  const { selectedCategoryId } = useTodoNavigation()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [locationName, setLocationName] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form with editing data
  useEffect(() => {
    const listToEdit = editingList || (editingItem as TodoList)
    if (listToEdit) {
      setName(listToEdit.name || '')
      setDescription(listToEdit.description || '')
      setDueDate(listToEdit.due_date ? listToEdit.due_date.split('T')[0] : '')
      setLocationName(listToEdit.location_name || '')
      setIsShared(listToEdit.is_shared || false)
    }
  }, [editingList, editingItem])

  const handleClose = () => {
    setShowForm(null)
    onClose?.()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!name.trim()) {
      setError('List name is required')
      return
    }

    if (!selectedCategoryId && !editingList?.category_id && !(editingItem as TodoList)?.category_id) {
      setError('No category selected')
      return
    }

    setIsSubmitting(true)

    try {
      const listData: Partial<TodoList> = {
        name: name.trim(),
        description: description.trim() || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        location_name: locationName.trim() || null,
        is_shared: isShared,
        category_id: selectedCategoryId || (editingItem as TodoList)?.category_id,
      }

      const listToEdit = editingList || (editingItem as TodoList)
      
      if (listToEdit?.id) {
        await updateList(listToEdit.id, listData)
      } else {
        await createList(listData)
      }

      handleClose()
    } catch (err) {
      console.error('Error saving list:', err)
      setError('Failed to save list. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = !!(editingList || editingItem)

  return (
    <FormSheet
      title={isEditing ? 'Edit List' : 'Create List'}
      onClose={handleClose}
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
            List Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Weekly Groceries, Project Tasks"
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
            placeholder="Brief description of this list..."
            rows={2}
            className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
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
                "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200",
                isShared ? "translate-x-6" : "translate-x-0.5"
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
              ? 'Update List' 
              : 'Create List'
          }
        </button>
      </form>
    </FormSheet>
  )
}
