import { useState, useEffect } from 'react'
import { 
  Check, 
  Palette, 
  Folder, 
  CheckSquare, 
  Calendar,
  Grid3X3,
  X,
  // Curated icons for LifeOS
  List,
  ShoppingCart,
  Dumbbell,
  Utensils,
  Box,
  Archive,
  DollarSign,
  Cloud,
  House,
  Heart,
  Briefcase,
  GraduationCap,
  Music,
  FileText,
  Car,
  Plane,
  Book,
  Camera,
  Gift,
  Star,
  // Row 4 icons
  Image,
  Video,
  Paintbrush,
  Hammer,
  Pencil,
  Scissors,
  Shirt
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Resource, ResourceType } from '@/types/database'
import { useCreateResource, useUpdateResource, useResource } from '@/hooks/useResourceData'
import { useResourceNavigation, useResourceForm } from '@/store/useResourceStore'
import { cn } from '@/lib/utils'
import { FormSheet } from '@/components/shared/FormSheet'

// ============================================================================
// CONSTANTS
// ============================================================================

// Preset colors for folders
const presetColors = [
  '#00EAFF', // Cyan (default)
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

// Curated icons for LifeOS folder types (4 rows of 7)
const curatedIcons = [
  // Row 1
  { name: 'Folder', label: 'Folder' },
  { name: 'List', label: 'List' },
  { name: 'ShoppingCart', label: 'Shopping' },
  { name: 'Dumbbell', label: 'Fitness' },
  { name: 'Utensils', label: 'Meals' },
  { name: 'Box', label: 'Storage' },
  { name: 'Archive', label: 'Archive' },
  // Row 2
  { name: 'DollarSign', label: 'Finance' },
  { name: 'Cloud', label: 'Cloud' },
  { name: 'House', label: 'Home' },
  { name: 'Heart', label: 'Health' },
  { name: 'Briefcase', label: 'Work' },
  { name: 'GraduationCap', label: 'Learning' },
  { name: 'Music', label: 'Music' },
  // Row 3
  { name: 'FileText', label: 'Documents' },
  { name: 'Car', label: 'Auto' },
  { name: 'Plane', label: 'Travel' },
  { name: 'Book', label: 'Reading' },
  { name: 'Camera', label: 'Photos' },
  { name: 'Gift', label: 'Gifts' },
  { name: 'Star', label: 'Favorites' },
  // Row 4
  { name: 'Image', label: 'Images' },
  { name: 'Video', label: 'Videos' },
  { name: 'Paintbrush', label: 'Art' },
  { name: 'Hammer', label: 'Projects' },
  { name: 'Pencil', label: 'Notes' },
  { name: 'Scissors', label: 'Crafts' },
  { name: 'Shirt', label: 'Clothing' },
]

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

/**
 * Render a Lucide icon by name dynamically
 */
function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name]
  if (!IconComponent) {
    return <Folder className={className} style={style} />
  }
  return <IconComponent className={className} style={style} />
}

// ============================================================================
// TYPES
// ============================================================================

interface ResourceFormProps {
  accentColor?: string
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResourceForm({ accentColor = '#00EAFF' }: ResourceFormProps) {
  const { currentParentId } = useResourceNavigation()
  const { showForm, editingResource, closeForm, isEditing } = useResourceForm()
  
  const createResourceMutation = useCreateResource()
  const updateResourceMutation = useUpdateResource()
  
  // Fetch parent resource to inherit icon
  const { data: parentResource } = useResource(currentParentId)
  
  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [color, setColor] = useState(presetColors[0])
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null)
  const [isShared, setIsShared] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine resource type based on form type
  const resourceType: ResourceType = showForm === 'folder' ? 'folder' : 'task'
  const isFolder = showForm === 'folder'

  // Initialize form with editing data or reset
  useEffect(() => {
    if (editingResource) {
      setTitle(editingResource.title || '')
      setDescription(editingResource.description || '')
      const meta = editingResource.meta_data as Record<string, unknown>
      setColor((meta?.color as string) || presetColors[0])
      setSelectedIcon((meta?.icon as string) || null)
      setIsShared((meta?.is_shared as boolean) || false)
      setDueDate(editingResource.scheduled_at ? editingResource.scheduled_at.split('T')[0] : '')
    } else {
      // Reset form for new resource
      setTitle('')
      setDescription('')
      setColor(presetColors[0])
      setIsShared(false)
      setDueDate('')
      
      // Smart default: inherit icon from parent folder
      if (parentResource && showForm === 'folder') {
        const parentMeta = parentResource.meta_data as Record<string, unknown>
        const parentIcon = parentMeta?.icon as string
        if (parentIcon) {
          setSelectedIcon(parentIcon)
        } else {
          setSelectedIcon(null)
        }
      } else {
        setSelectedIcon(null)
      }
    }
    setError(null)
  }, [editingResource, showForm, parentResource])

  // Don't render if form is not shown
  if (!showForm) {
    return null
  }

  const handleClose = () => {
    closeForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!title.trim()) {
      setError(`${isFolder ? 'Folder' : 'Task'} name is required`)
      return
    }

    setIsSubmitting(true)

    try {
      // Build meta_data based on resource type
      const metaData: Record<string, unknown> = {
        is_shared: isShared,
      }
      
      if (isFolder) {
        metaData.color = color
        if (selectedIcon) {
          metaData.icon = selectedIcon
        }
      }

      if (isEditing && editingResource) {
        // Update existing resource
        await updateResourceMutation.mutateAsync({
          id: editingResource.id,
          updates: {
            title: title.trim(),
            description: description.trim() || null,
            meta_data: {
              ...(editingResource.meta_data as Record<string, unknown>),
              ...metaData,
            },
            scheduled_at: dueDate ? new Date(dueDate).toISOString() : null,
            is_schedulable: !!dueDate,
          },
        })
      } else {
        // Create new resource
        await createResourceMutation.mutateAsync({
          user_id: '', // Will be set by hook
          type: resourceType,
          title: title.trim(),
          description: description.trim() || null,
          parent_id: currentParentId,
          meta_data: metaData,
          scheduled_at: dueDate ? new Date(dueDate).toISOString() : null,
          is_schedulable: !!dueDate,
        })
      }

      handleClose()
    } catch (err) {
      console.error('Error saving resource:', err)
      setError(`Failed to save ${isFolder ? 'folder' : 'task'}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formTitle = isEditing 
    ? `Edit ${isFolder ? 'Folder' : 'Task'}`
    : `New ${isFolder ? 'Folder' : 'Task'}`

  return (
    <FormSheet
      title={formTitle}
      onClose={handleClose}
    >
      <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-4">
        {/* Top Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              "flex-1 py-2.5 rounded-lg font-medium text-white transition-all duration-200",
              "bg-dark-300 hover:bg-dark-200 active:scale-[0.98]",
              "flex items-center justify-center gap-2"
            )}
          >
            <X size={16} />
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className={cn(
              "flex-1 py-2.5 rounded-lg font-medium text-white transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "hover:opacity-90 active:scale-[0.98]",
              "flex items-center justify-center gap-2"
            )}
            style={{ backgroundColor: accentColor }}
          >
            <Check size={16} />
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Title Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-dark-400">
            {isFolder ? 'Folder Name' : 'Task Name'} *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={isFolder ? 'e.g., Work, Personal, Shopping' : 'e.g., Buy groceries, Call mom'}
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
            placeholder="Brief description..."
            rows={2}
            className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {/* Task-specific: Due Date */}
        {!isFolder && (
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
        )}

        {/* Folder-specific: Icon Picker */}
        {isFolder && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-dark-400 flex items-center gap-2">
              <Grid3X3 size={14} />
              Icon
            </label>
            <div className="grid grid-cols-7 gap-2">
              {curatedIcons.map((icon) => (
                <button
                  key={icon.name}
                  type="button"
                  onClick={() => setSelectedIcon(icon.name === 'Folder' ? null : icon.name)}
                  title={icon.label}
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                    "bg-dark-200 border-2",
                    (selectedIcon === icon.name || (icon.name === 'Folder' && !selectedIcon))
                      ? "border-primary shadow-[0_0_12px_rgba(0,234,255,0.5)] scale-110" 
                      : "border-dark-300 hover:border-dark-200 hover:bg-dark-150 hover:scale-105"
                  )}
                  style={{
                    borderColor: (selectedIcon === icon.name || (icon.name === 'Folder' && !selectedIcon)) ? color : undefined,
                    boxShadow: (selectedIcon === icon.name || (icon.name === 'Folder' && !selectedIcon)) ? `0 0 12px ${color}60` : undefined
                  }}
                >
                  <DynamicIcon
                    name={icon.name}
                    className="w-5 h-5"
                    style={{ 
                      color: (selectedIcon === icon.name || (icon.name === 'Folder' && !selectedIcon)) ? color : '#6b7280'
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Folder-specific: Color Picker */}
        {isFolder && (
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
        )}

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
            style={isShared ? { backgroundColor: accentColor } : undefined}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200",
                isShared && "translate-x-6"
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
              style={{ 
                backgroundColor: isFolder ? `${color}30` : 'transparent',
                border: !isFolder ? '1px solid var(--dark-300)' : 'none',
                boxShadow: isFolder ? `0 0 8px ${color}30` : undefined
              }}
            >
              {isFolder ? (
                selectedIcon ? (
                  <DynamicIcon
                    name={selectedIcon}
                    className="w-5 h-5"
                    style={{ color }}
                  />
                ) : (
                  <Folder
                    className="w-5 h-5"
                    style={{ color }}
                  />
                )
              ) : (
                <CheckSquare className="w-5 h-5 text-dark-400" />
              )}
            </div>
            <div>
              <p className="font-medium text-white">
                {title || (isFolder ? 'Folder Name' : 'Task Name')}
              </p>
              <p className="text-xs text-dark-500">
                {description || 'No description'}
              </p>
            </div>
          </div>
        </div>

      </form>
    </FormSheet>
  )
}
