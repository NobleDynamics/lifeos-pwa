/**
 * DynamicFormSheet - Metadata-Driven Form Renderer
 * 
 * Renders forms dynamically based on CreateFieldSchema arrays from JSONB metadata.
 * This is the core component for the "Generic Engine" create/edit functionality.
 * 
 * Supported Field Types:
 * - text, textarea: Text inputs
 * - number, currency: Numeric inputs with optional formatting
 * - date, datetime: Date/time pickers
 * - select, multi_select: Dropdown selections
 * - media: File upload (future)
 * - color: Color picker with preset palette
 * - icon: Icon picker with curated icons grid
 * - toggle: Boolean switch
 * - profile_select: Household profile picker
 * - node_reference: Reference to another node (future)
 * 
 * @module engine/components/shared/DynamicFormSheet
 */

import { useState, useCallback, useMemo } from 'react'
import {
  Check,
  X,
  Palette,
  Grid3X3,
  Calendar,
  Hash,
  Type,
  AlignLeft,
  ToggleLeft,
  List,
  ChevronDown,
  DollarSign,
  Clock,
  Folder,
  Upload,
  UserCircle,
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { FormSheet, Avatar } from '@/components/shared'
import { usePrimaryHousehold, useHouseholdProfiles } from '@/hooks/useIdentity'
import { cn } from '@/lib/utils'
import type { CreateFieldSchema, FormResult, SelectOption } from '../../types/actions'

// =============================================================================
// CONSTANTS (Shared with ResourceForm for consistency)
// =============================================================================

/** Preset colors for color picker */
export const PRESET_COLORS = [
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

/** Curated icons for LifeOS (4 rows of 7) */
export const CURATED_ICONS = [
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

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

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

/**
 * Get icon for field type
 */
function getFieldIcon(type: CreateFieldSchema['type']) {
  switch (type) {
    case 'text': return Type
    case 'textarea': return AlignLeft
    case 'number': return Hash
    case 'currency': return DollarSign
    case 'date': return Calendar
    case 'datetime': return Clock
    case 'select': return List
    case 'multi_select': return List
    case 'media': return Upload
    case 'color': return Palette
    case 'icon': return Grid3X3
    case 'toggle': return ToggleLeft
    case 'profile_select': return UserCircle
    default: return Type
  }
}

// =============================================================================
// FIELD RENDERERS
// =============================================================================

interface FieldRendererProps {
  field: CreateFieldSchema
  value: unknown
  onChange: (value: unknown) => void
  accentColor: string
}

/** Text input field */
function TextField({ field, value, onChange }: FieldRendererProps) {
  return (
    <input
      type="text"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
      className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary"
    />
  )
}

/** Textarea field */
function TextareaField({ field, value, onChange }: FieldRendererProps) {
  return (
    <textarea
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
      rows={3}
      className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
    />
  )
}

/** Number input field */
function NumberField({ field, value, onChange }: FieldRendererProps) {
  return (
    <input
      type="number"
      value={(value as number) ?? ''}
      onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
      placeholder={field.placeholder || '0'}
      min={field.min}
      max={field.max}
      step={field.step || 1}
      className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary"
    />
  )
}

/** Currency input field */
function CurrencyField({ field, value, onChange }: FieldRendererProps) {
  const currencySymbol = field.currency_code === 'EUR' ? '€' : field.currency_code === 'GBP' ? '£' : '$'
  
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">{currencySymbol}</span>
      <input
        type="number"
        value={(value as number) ?? ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder="0.00"
        min={field.min ?? 0}
        max={field.max}
        step={field.step || 0.01}
        className="w-full pl-8 pr-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white placeholder:text-dark-500 focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  )
}

/** Date input field */
function DateField({ field, value, onChange }: FieldRendererProps) {
  // Convert ISO string to YYYY-MM-DD for date input
  const dateValue = value ? (value as string).split('T')[0] : ''
  
  return (
    <input
      type="date"
      value={dateValue}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
    />
  )
}

/** DateTime input field */
function DateTimeField({ field, value, onChange }: FieldRendererProps) {
  // Convert ISO string to datetime-local format
  const dtValue = value ? (value as string).slice(0, 16) : ''
  
  return (
    <input
      type="datetime-local"
      value={dtValue}
      onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
      className="w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
    />
  )
}

/** Select dropdown field */
function SelectField({ field, value, onChange }: FieldRendererProps) {
  const [isOpen, setIsOpen] = useState(false)
  const options = field.options || []
  const selectedOption = options.find(opt => opt.value === value)
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-4 py-3 bg-dark-200 border border-dark-300 rounded-lg text-left",
          "flex items-center justify-between",
          "focus:outline-none focus:ring-2 focus:ring-primary",
          selectedOption ? "text-white" : "text-dark-500"
        )}
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon && <DynamicIcon name={selectedOption.icon} className="w-4 h-4" />}
          {selectedOption?.label || field.placeholder || 'Select...'}
        </span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 w-full mt-1 py-1 bg-dark-100 border border-dark-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full px-4 py-2.5 text-left text-sm flex items-center gap-2",
                  "hover:bg-dark-200 transition-colors",
                  value === option.value ? "text-primary" : "text-white"
                )}
              >
                {option.icon && <DynamicIcon name={option.icon} className="w-4 h-4" style={{ color: option.color }} />}
                {option.label}
                {value === option.value && <Check className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** Color picker field */
function ColorField({ field, value, onChange, accentColor }: FieldRendererProps) {
  const colors = field.color_palette || PRESET_COLORS
  const currentColor = (value as string) || colors[0]
  
  return (
    <div className="flex flex-wrap gap-2">
      {colors.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onChange(color)}
          className={cn(
            "w-10 h-10 rounded-lg transition-all duration-200",
            currentColor === color
              ? "ring-2 ring-white ring-offset-2 ring-offset-dark-100 scale-110"
              : "hover:scale-105"
          )}
          style={{ backgroundColor: color }}
        >
          {currentColor === color && (
            <Check size={20} className="text-white mx-auto" />
          )}
        </button>
      ))}
    </div>
  )
}

/** Icon picker field */
function IconField({ field, value, onChange, accentColor }: FieldRendererProps) {
  const icons = field.icon_set
    ? CURATED_ICONS.filter(i => field.icon_set!.includes(i.name))
    : CURATED_ICONS
  const selectedIcon = (value as string) || null
  
  // Use the field's color if available, otherwise use accent color
  const highlightColor = accentColor
  
  return (
    <div className="grid grid-cols-7 gap-2">
      {icons.map((icon) => {
        const isSelected = selectedIcon === icon.name || (icon.name === 'Folder' && !selectedIcon)
        
        return (
          <button
            key={icon.name}
            type="button"
            onClick={() => onChange(icon.name === 'Folder' ? null : icon.name)}
            title={icon.label}
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
              "bg-dark-200 border-2",
              isSelected
                ? "scale-110"
                : "border-dark-300 hover:border-dark-200 hover:bg-dark-150 hover:scale-105"
            )}
            style={{
              borderColor: isSelected ? highlightColor : undefined,
              boxShadow: isSelected ? `0 0 12px ${highlightColor}60` : undefined
            }}
          >
            <DynamicIcon
              name={icon.name}
              className="w-5 h-5"
              style={{ color: isSelected ? highlightColor : '#6b7280' }}
            />
          </button>
        )
      })}
    </div>
  )
}

/** Toggle/Boolean field */
function ToggleField({ field, value, onChange, accentColor }: FieldRendererProps) {
  const isOn = Boolean(value)
  
  return (
    <div className="flex items-center justify-between p-3 bg-dark-200 rounded-lg">
      <div>
        <p className="text-sm font-medium text-white">{field.label}</p>
        {field.help_text && (
          <p className="text-xs text-dark-500">{field.help_text}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!isOn)}
        className={cn(
          "w-12 h-6 rounded-full transition-colors duration-200 relative",
          isOn ? "bg-primary" : "bg-dark-400"
        )}
        style={isOn ? { backgroundColor: accentColor } : undefined}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200",
            isOn && "translate-x-6"
          )}
        />
      </button>
    </div>
  )
}

/** Profile select field (for household members) */
function ProfileSelectField({ field, value, onChange }: FieldRendererProps) {
  const { activeHouseholdId } = usePrimaryHousehold()
  const { data: householdProfiles = [] } = useHouseholdProfiles(activeHouseholdId)
  
  if (householdProfiles.length === 0) {
    return (
      <div className="text-sm text-dark-500 p-3 bg-dark-200 rounded-lg">
        No household members available
      </div>
    )
  }
  
  return (
    <div className="space-y-2">
      {/* Unassigned option */}
      <button
        type="button"
        onClick={() => onChange(null)}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
          !value
            ? "border-primary bg-primary/10"
            : "border-dark-300 bg-dark-200 hover:border-dark-200"
        )}
      >
        <div className="w-8 h-8 rounded-full bg-dark-300 flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-dark-500" />
        </div>
        <span className="text-sm text-white">Unassigned</span>
      </button>
      
      {/* Profile options */}
      {householdProfiles.map((profile) => (
        <button
          key={profile.id}
          type="button"
          onClick={() => onChange(profile.id)}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
            value === profile.id
              ? "border-primary bg-primary/10"
              : "border-dark-300 bg-dark-200 hover:border-dark-200"
          )}
        >
          <Avatar
            src={profile.avatar_url}
            name={profile.full_name}
            size="sm"
          />
          <div className="flex-1 text-left">
            <span className="text-sm text-white">{profile.full_name || 'Unnamed'}</span>
            {profile.is_shadow && (
              <span className="ml-2 text-xs text-dark-500">(Dependent)</span>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

/** Media upload field (placeholder for future implementation) */
function MediaField({ field, value, onChange }: FieldRendererProps) {
  return (
    <div className="p-4 border-2 border-dashed border-dark-300 rounded-lg text-center">
      <Upload className="w-8 h-8 mx-auto mb-2 text-dark-400" />
      <p className="text-sm text-dark-400">
        {field.placeholder || 'Click to upload or drag and drop'}
      </p>
      {field.accept && (
        <p className="text-xs text-dark-500 mt-1">
          Accepts: {field.accept}
        </p>
      )}
      {/* TODO: Implement actual file upload */}
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface DynamicFormSheetProps {
  /** Whether the form is visible */
  isOpen: boolean
  /** Form title (e.g., "Add Photo", "Edit Item") */
  title: string
  /** Array of field schemas to render */
  schema: CreateFieldSchema[]
  /** Initial values for edit mode */
  initialValues?: FormResult
  /** Called when form is closed */
  onClose: () => void
  /** Called when form is submitted with valid data */
  onSubmit: (result: FormResult) => void | Promise<void>
  /** Optional accent color for buttons and highlights */
  accentColor?: string
  /** Whether form is in submitting state */
  isSubmitting?: boolean
}

/**
 * DynamicFormSheet - Renders forms from CreateFieldSchema arrays
 * 
 * @example
 * <DynamicFormSheet
 *   isOpen={showForm}
 *   title="Add Photo"
 *   schema={[
 *     { key: 'url', label: 'Photo', type: 'media', accept: 'image/*', required: true },
 *     { key: 'title', label: 'Title', type: 'text' },
 *     { key: 'alt', label: 'Description', type: 'textarea' }
 *   ]}
 *   onClose={() => setShowForm(false)}
 *   onSubmit={(data) => createNode(data)}
 * />
 */
export function DynamicFormSheet({
  isOpen,
  title,
  schema,
  initialValues = {},
  onClose,
  onSubmit,
  accentColor = '#00EAFF',
  isSubmitting = false,
}: DynamicFormSheetProps) {
  // Initialize form values from schema defaults and initial values
  const [formValues, setFormValues] = useState<FormResult>(() => {
    const defaults: FormResult = {}
    schema.forEach(field => {
      if (initialValues[field.key] !== undefined) {
        defaults[field.key] = initialValues[field.key]
      } else if (field.default_value !== undefined) {
        defaults[field.key] = field.default_value
      }
    })
    return defaults
  })
  
  const [error, setError] = useState<string | null>(null)
  
  // Reset form when initialValues or schema changes
  useMemo(() => {
    const defaults: FormResult = {}
    schema.forEach(field => {
      if (initialValues[field.key] !== undefined) {
        defaults[field.key] = initialValues[field.key]
      } else if (field.default_value !== undefined) {
        defaults[field.key] = field.default_value
      }
    })
    setFormValues(defaults)
    setError(null)
  }, [schema, initialValues])
  
  // Update a single field value
  const updateField = useCallback((key: string, value: unknown) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
    setError(null)
  }, [])
  
  // Validate form
  const validateForm = useCallback((): boolean => {
    for (const field of schema) {
      if (field.required) {
        const value = formValues[field.key]
        if (value === undefined || value === null || value === '') {
          setError(`${field.label} is required`)
          return false
        }
      }
    }
    return true
  }, [schema, formValues])
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    try {
      await onSubmit(formValues)
    } catch (err) {
      console.error('[DynamicFormSheet] Submit error:', err)
      setError('Failed to save. Please try again.')
    }
  }, [validateForm, formValues, onSubmit])
  
  // Check if form has required fields filled
  const isValid = useMemo(() => {
    return schema.every(field => {
      if (!field.required) return true
      const value = formValues[field.key]
      return value !== undefined && value !== null && value !== ''
    })
  }, [schema, formValues])
  
  // Render appropriate field component based on type
  const renderField = (field: CreateFieldSchema) => {
    const props: FieldRendererProps = {
      field,
      value: formValues[field.key],
      onChange: (value) => updateField(field.key, value),
      accentColor,
    }
    
    switch (field.type) {
      case 'text':
        return <TextField {...props} />
      case 'textarea':
        return <TextareaField {...props} />
      case 'number':
        return <NumberField {...props} />
      case 'currency':
        return <CurrencyField {...props} />
      case 'date':
        return <DateField {...props} />
      case 'datetime':
        return <DateTimeField {...props} />
      case 'select':
        return <SelectField {...props} />
      case 'color':
        return <ColorField {...props} />
      case 'icon':
        return <IconField {...props} />
      case 'toggle':
        return <ToggleField {...props} />
      case 'profile_select':
        return <ProfileSelectField {...props} />
      case 'media':
        return <MediaField {...props} />
      default:
        return <TextField {...props} />
    }
  }
  
  if (!isOpen) return null
  
  return (
    <FormSheet title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
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
            disabled={isSubmitting || !isValid}
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
        
        {/* Dynamic Fields */}
        {schema.map(field => {
          // Toggle fields render their own label/container
          if ((field.type as string) === 'toggle') {
            return (
              <div key={field.key}>
                {renderField(field)}
              </div>
            )
          }
          
          const FieldIcon = getFieldIcon(field.type)
          
          return (
            <div key={field.key} className="space-y-2">
              <label className="block text-sm font-medium text-dark-400 flex items-center gap-2">
                <FieldIcon size={14} />
                {field.label}
                {field.required && <span className="text-red-400">*</span>}
              </label>
              {renderField(field)}
              {field.help_text && field.type !== 'toggle' && (
                <p className="text-xs text-dark-500">{field.help_text}</p>
              )}
            </div>
          )
        })}
      </form>
    </FormSheet>
  )
}

export default DynamicFormSheet
