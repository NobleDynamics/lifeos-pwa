import { useState, useEffect, useCallback } from 'react'
import { X, Check, Palette } from 'lucide-react'
import { TodoCategory } from '@/types/database'
import { useTodoData } from '@/hooks/useTodoData'
import { useTodoUI } from '@/store/useTodoStore'
import { cn } from '@/lib/utils'
import { useBackButton } from '@/hooks/useBackButton'

// Preset colors for categories
const presetColors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  '#98D8C8', // Mint
  '#F7DC6F', // Gold
  '#BB8FCE', // Purple
  '#85C1E9', // Light Blue
]

interface CategoryFormProps {
  editingCategory?: TodoCategory | null
  onClose?: () => void
  accentColor?: string
}

export function CategoryForm({ editingCategory, onClose, accentColor = '#00EAFF' }: CategoryFormProps) {
  const { createCategory, updateCategory, refreshCategories } = useTodoData()
  const { setShowForm, editingItem } = useTodoUI()
  
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(presetColors[0])
  const [isShared, setIsShared] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle back button to close form
  const handleClose = useCallback(() => {
    setShowForm(null)
    onClose?.()
  }, [setShowForm, onClose])

  useBackButton({
    onCloseModal: () => {
      handleClose()
      return true
    }
  })

  // Initialize form with editing data
  useEffect(() => {
    const categoryToEdit = editingCategory || (editingItem as TodoCategory)
    if (categoryToEdit) {
      setName(categoryToEdit.name || '')
      setDescription(categoryToEdit.description || '')
      setColor(categoryToEdit.color || presetColors[0])
      setIsShared(categoryToEdit.is_shared || false)
    }
  }, [editingCategory, editingItem])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    setIsSubmitting(true)

    try {
      const categoryData: Partial<TodoCategory> = {
        name: name.trim(),
        description: description.trim() || null,
        color,
        is_shared: isShared,
      }

      const categoryToEdit = editingCategory || (editingItem as TodoCategory)
      
      if (categoryToEdit?.id) {
        await updateCategory(categoryToEdit.id, categoryData)
      } else {
        await createCategory(categoryData)
      }

      handleClose()
    } catch (err) {
      console.error('Error saving category:', err)
      setError('Failed to save category. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isEditing = !!(editingCategory || editingItem)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-dark-100 rounded-t-2xl shadow-xl animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-300">
          <h2 className="text-lg font-semibold">
            {isEditing ? 'Edit Category' : 'Create Category'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-dark-200 transition-colors"
          >
            <X size={20} className="text-dark-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 pb-20 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-400">
              Category Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Work, Personal, Shopping"
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
              placeholder="Brief description of this category..."
              rows={2}
              className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-400 flex items-center gap-2">
              <Palette size={14} />
              Color
            </label>
            <div className="flex flex-wrap gap-2">
              {presetColors.map((presetColor) => (
                <button
                  key={presetColor}
                  type="button"
                  onClick={() => setColor(presetColor)}
                  className={cn(
                    "w-10 h-10 rounded-lg transition-all duration-200",
                    color === presetColor 
                      ? "ring-2 ring-white ring-offset-2 ring-offset-dark-100 scale-110" 
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: presetColor }}
                >
                  {color === presetColor && (
                    <Check size={20} className="text-white mx-auto" />
                  )}
                </button>
              ))}
            </div>
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

          {/* Preview */}
          <div className="p-3 bg-dark-200 rounded-lg">
            <p className="text-xs text-dark-500 mb-2">Preview</p>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: color + '30' }}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
              </div>
              <div>
                <p className="font-medium">{name || 'Category Name'}</p>
                <p className="text-xs text-dark-500">
                  {description || 'No description'}
                </p>
              </div>
            </div>
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
                ? 'Update Category' 
                : 'Create Category'
            }
          </button>
        </form>
      </div>
    </div>
  )
}
