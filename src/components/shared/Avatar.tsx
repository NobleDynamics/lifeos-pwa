import { useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import { User } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// TYPES
// ============================================================================

export interface AvatarProps {
  /** Avatar source - can be URL, icon string (icon:name:#hex), or null */
  src?: string | null
  /** Fallback name for initials */
  name?: string | null
  /** Size in pixels */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  /** Additional class names */
  className?: string
}

// Size mappings
const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const iconSizeMap = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse icon avatar string format: icon:[name]:[hex]
 * Example: icon:Dog:#00EAFF
 */
function parseIconAvatar(src: string): { iconName: string; color: string } | null {
  if (!src.startsWith('icon:')) return null
  
  const parts = src.split(':')
  if (parts.length < 3) return null
  
  const iconName = parts[1]
  const color = parts.slice(2).join(':') // Handle colors like #00EAFF
  
  return { iconName, color }
}

/**
 * Get initials from a name
 */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase()
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * Generate a consistent color from a string (for initials background)
 */
function stringToColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Cyberpunk color palette
  const colors = [
    '#00EAFF', // Cyan
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#DDA0DD', // Plum
    '#BB8FCE', // Purple
    '#F7DC6F', // Gold
  ]
  
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Render a Lucide icon by name
 */
function DynamicIcon({ name, size, color }: { name: string; size: number; color: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name]
  if (!IconComponent) {
    return <User size={size} style={{ color }} />
  }
  return <IconComponent size={size} style={{ color }} />
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * Avatar - Universal avatar component with icon support
 * 
 * Supports three modes:
 * 1. **Icon Avatar:** String format `icon:[name]:[hex]` renders a Lucide icon
 *    Example: `icon:Dog:#00EAFF` renders a cyan dog icon
 * 2. **Image URL:** Regular URL renders the image
 * 3. **Initials:** Falls back to initials from name with consistent color
 * 
 * @example
 * // Icon avatar (for shadow users like pets/kids)
 * <Avatar src="icon:Dog:#00EAFF" name="Max" />
 * 
 * // Image avatar
 * <Avatar src="https://example.com/photo.jpg" name="John" />
 * 
 * // Initials fallback
 * <Avatar name="John Smith" />
 */
export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const { mode, iconData, initials, bgColor } = useMemo(() => {
    // Check if it's an icon avatar
    if (src && src.startsWith('icon:')) {
      const parsed = parseIconAvatar(src)
      if (parsed) {
        return {
          mode: 'icon' as const,
          iconData: parsed,
          initials: '',
          bgColor: parsed.color,
        }
      }
    }
    
    // Check if it's an image URL
    if (src && (src.startsWith('http') || src.startsWith('data:'))) {
      return {
        mode: 'image' as const,
        iconData: null,
        initials: '',
        bgColor: '',
      }
    }
    
    // Fallback to initials
    const displayName = name || 'U'
    return {
      mode: 'initials' as const,
      iconData: null,
      initials: getInitials(displayName),
      bgColor: stringToColor(displayName),
    }
  }, [src, name])

  const sizeClass = sizeMap[size]
  const iconSize = iconSizeMap[size]

  // Image mode
  if (mode === 'image' && src) {
    return (
      <div
        className={cn(
          'rounded-full overflow-hidden flex-shrink-0 bg-dark-200',
          sizeClass,
          className
        )}
      >
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={(e) => {
            // On error, hide the image and show initials instead
            (e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      </div>
    )
  }

  // Icon mode
  if (mode === 'icon' && iconData) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center flex-shrink-0',
          sizeClass,
          className
        )}
        style={{
          backgroundColor: `${iconData.color}20`,
          boxShadow: `0 0 8px ${iconData.color}30`,
        }}
      >
        <DynamicIcon
          name={iconData.iconName}
          size={iconSize}
          color={iconData.color}
        />
      </div>
    )
  }

  // Initials mode (default)
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0 font-medium text-white',
        sizeClass,
        className
      )}
      style={{
        backgroundColor: `${bgColor}30`,
        color: bgColor,
        boxShadow: `0 0 6px ${bgColor}20`,
      }}
    >
      {initials}
    </div>
  )
}
