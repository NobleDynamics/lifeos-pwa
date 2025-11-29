import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from './Avatar'

// ============================================================================
// TYPES
// ============================================================================

export interface AvatarPickerProps {
  /** Current avatar value (icon:name:#hex format or URL) */
  value?: string | null
  /** Called when avatar selection changes */
  onChange: (value: string) => void
  /** Display name for preview */
  name?: string
  /** Label text */
  label?: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Curated "Persona" icons for avatars (Cyberpunk style)
const personaIcons = [
  { name: 'User', label: 'Person' },
  { name: 'Baby', label: 'Baby' },
  { name: 'Dog', label: 'Dog' },
  { name: 'Cat', label: 'Cat' },
  { name: 'Bot', label: 'Robot' },
  { name: 'Ghost', label: 'Ghost' },
  { name: 'Skull', label: 'Skull' },
  { name: 'Smile', label: 'Smile' },
  { name: 'Gamepad2', label: 'Gamer' },
  { name: 'Sparkles', label: 'Star' },
  { name: 'Heart', label: 'Heart' },
  { name: 'Zap', label: 'Energy' },
]

// Cyberpunk color palette
const avatarColors = [
  { hex: '#00EAFF', name: 'Cyan' },
  { hex: '#FF6B6B', name: 'Red' },
  { hex: '#4ECDC4', name: 'Teal' },
  { hex: '#45B7D1', name: 'Blue' },
  { hex: '#96CEB4', name: 'Green' },
  { hex: '#FFEAA7', name: 'Yellow' },
  { hex: '#DDA0DD', name: 'Plum' },
  { hex: '#BB8FCE', name: 'Purple' },
  { hex: '#F7DC6F', name: 'Gold' },
  { hex: '#85C1E9', name: 'Sky' },
  { hex: '#E74C3C', name: 'Crimson' },
  { hex: '#1ABC9C', name: 'Mint' },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse icon avatar string to extract icon name and color
 */
function parseIconAvatar(value: string): { iconName: string; color: string } | null {
  if (!value?.startsWith('icon:')) return null
  
  const parts = value.split(':')
  if (parts.length < 3) return null
  
  const iconName = parts[1]
  const color = parts.slice(2).join(':')
  
  return { iconName, color }
}

/**
 * Build icon avatar string from icon name and color
 */
function buildIconAvatar(iconName: string, color: string): string {
  return `icon:${iconName}:${color}`
}

/**
 * Render a Lucide icon by name
 */
function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name]
  if (!IconComponent) return null
  return <IconComponent className={className} style={style} />
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * AvatarPicker - Icon + Color selection for avatars
 * 
 * Allows users to pick a Lucide icon and a color, returning
 * a string in the format `icon:[name]:[hex]`
 * 
 * @example
 * <AvatarPicker
 *   value="icon:Dog:#00EAFF"
 *   onChange={(v) => setAvatar(v)}
 *   name="Max"
 *   label="Avatar"
 * />
 */
export function AvatarPicker({ value, onChange, name, label }: AvatarPickerProps) {
  // Parse current value or use defaults
  const parsed = value ? parseIconAvatar(value) : null
  const [selectedIcon, setSelectedIcon] = useState(parsed?.iconName || 'User')
  const [selectedColor, setSelectedColor] = useState(parsed?.color || '#00EAFF')

  // Handle icon selection
  const handleIconSelect = (iconName: string) => {
    setSelectedIcon(iconName)
    onChange(buildIconAvatar(iconName, selectedColor))
  }

  // Handle color selection
  const handleColorSelect = (color: string) => {
    setSelectedColor(color)
    onChange(buildIconAvatar(selectedIcon, color))
  }

  // Current avatar preview value
  const currentAvatar = buildIconAvatar(selectedIcon, selectedColor)

  return (
    <div className="space-y-4">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-dark-400">
          {label}
        </label>
      )}

      {/* Preview */}
      <div className="flex items-center gap-4 p-3 bg-dark-200 rounded-lg">
        <Avatar src={currentAvatar} name={name} size="xl" />
        <div>
          <p className="text-sm font-medium text-white">
            {name || 'Preview'}
          </p>
          <p className="text-xs text-dark-500">
            {personaIcons.find(i => i.name === selectedIcon)?.label || 'Person'} • {avatarColors.find(c => c.hex === selectedColor)?.name || 'Color'}
          </p>
        </div>
      </div>

      {/* Icon Grid */}
      <div className="space-y-2">
        <p className="text-xs text-dark-500 uppercase tracking-wide">Icon</p>
        <div className="grid grid-cols-6 gap-2">
          {personaIcons.map((icon) => (
            <button
              key={icon.name}
              type="button"
              onClick={() => handleIconSelect(icon.name)}
              title={icon.label}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200",
                "bg-dark-200 border-2",
                selectedIcon === icon.name
                  ? "scale-110" 
                  : "border-dark-300 hover:border-dark-200 hover:bg-dark-150 hover:scale-105"
              )}
              style={{
                borderColor: selectedIcon === icon.name ? selectedColor : undefined,
                boxShadow: selectedIcon === icon.name ? `0 0 12px ${selectedColor}60` : undefined
              }}
            >
              <DynamicIcon
                name={icon.name}
                className="w-5 h-5"
                style={{ 
                  color: selectedIcon === icon.name ? selectedColor : '#6b7280'
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Color Row */}
      <div className="space-y-2">
        <p className="text-xs text-dark-500 uppercase tracking-wide">Color</p>
        <div className="flex flex-wrap gap-2">
          {avatarColors.map((color) => (
            <button
              key={color.hex}
              type="button"
              onClick={() => handleColorSelect(color.hex)}
              title={color.name}
              className={cn(
                "w-8 h-8 rounded-full transition-all duration-200 relative",
                selectedColor === color.hex 
                  ? "ring-2 ring-white ring-offset-2 ring-offset-dark-100 scale-110" 
                  : "hover:scale-105"
              )}
              style={{ backgroundColor: color.hex }}
            >
              {selectedColor === color.hex && (
                <Check size={16} className="text-white absolute inset-0 m-auto drop-shadow-md" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
