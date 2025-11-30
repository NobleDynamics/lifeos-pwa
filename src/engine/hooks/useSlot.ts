/**
 * useSlot Hook
 * 
 * Provides an indirection layer for structural components to access
 * node data without being coupled to specific metadata field names.
 * 
 * This enables "Headless" ViewEngine components that work with any domain.
 * 
 * @module engine/hooks/useSlot
 */

import { useNode } from '../context/NodeContext'
import type { FieldType, SlotConfig } from '../types/node'

// =============================================================================
// SLOT CONVENTIONS (Default Mappings)
// =============================================================================

/**
 * Default slot-to-property mappings when no __config is provided.
 * Implements "Convention over Configuration" for common slots.
 */
const DEFAULT_SLOT_MAPPINGS: Record<string, string> = {
  headline: '__title',      // Special: maps to node.title
  subtext: 'description',
  accent_color: 'color',
  icon_start: 'icon',
  media: 'imageUrl',
}

// =============================================================================
// FORMATTING UTILITIES
// =============================================================================

/**
 * Format a date string for display
 */
function formatDate(value: unknown): string {
  if (typeof value !== 'string' && !(value instanceof Date)) {
    return String(value)
  }
  
  try {
    const date = typeof value === 'string' ? new Date(value) : value
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    // Check if tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    }
    
    // Otherwise show short date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return String(value)
  }
}

/**
 * Format a currency value for display
 */
function formatCurrency(value: unknown, currency = 'USD'): string {
  if (typeof value !== 'number') {
    const num = Number(value)
    if (isNaN(num)) return String(value)
    value = num
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value as number)
}

/**
 * Format a number for display
 */
function formatNumber(value: unknown): string {
  if (typeof value !== 'number') {
    const num = Number(value)
    if (isNaN(num)) return String(value)
    value = num
  }
  
  return new Intl.NumberFormat('en-US').format(value as number)
}

/**
 * Format a boolean for display
 */
function formatBoolean(value: unknown): string {
  return value ? 'Yes' : 'No'
}

/**
 * Apply formatting based on field type
 */
function applyFormatting<T>(value: unknown, type?: FieldType): T {
  if (value === undefined || value === null) {
    return value as T
  }
  
  switch (type) {
    case 'date':
      return formatDate(value) as T
    case 'currency':
      return formatCurrency(value) as T
    case 'number':
      return formatNumber(value) as T
    case 'boolean':
      return formatBoolean(value) as T
    case 'text':
    case 'select':
    case 'reference':
    default:
      return value as T
  }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Options for useSlot hook
 */
export interface UseSlotOptions {
  /** Field type for automatic formatting */
  type?: FieldType
  /** Currency code for currency formatting (default: 'USD') */
  currency?: string
}

/**
 * Access a slot value from the current node.
 * 
 * Lookup chain:
 * 1. Check metadata.__config[slotName] for mapped field key
 * 2. Fallback to metadata[slotName] directly
 * 3. Apply default slot mappings (e.g., 'headline' → node.title)
 * 
 * @param slotName - The slot name (e.g., 'headline', 'subtext', 'badge')
 * @param defaultValue - Optional default if slot value is undefined
 * @param options - Optional formatting options
 * @returns The slot value (optionally formatted)
 * 
 * @example
 * // Simple usage - gets title via default mapping
 * const headline = useSlot('headline')
 * 
 * @example
 * // With explicit config in JSON:
 * // { metadata: { __config: { badge: "due_date" }, due_date: "2025-12-01" } }
 * const badge = useSlot('badge', undefined, { type: 'date' })
 * // Returns "Dec 1"
 * 
 * @example
 * // Direct fallback (no __config):
 * // { metadata: { subtext: "Buy milk from store" } }
 * const subtext = useSlot('subtext')
 * // Returns "Buy milk from store"
 */
export function useSlot<T = unknown>(
  slotName: string,
  defaultValue?: T,
  options?: UseSlotOptions
): T | undefined {
  const { node } = useNode()
  const metadata = node.metadata
  
  // Step 1: Check for __config mapping
  const config = metadata.__config as SlotConfig | undefined
  
  if (config && slotName in config) {
    const mapping = config[slotName]
    
    // Handle both string and object config formats
    let key: string
    let type = options?.type
    
    if (typeof mapping === 'string') {
      key = mapping
    } else {
      key = mapping.key
      type = mapping.type ?? type
    }
    
    // Special case: __title maps to node.title
    const value = key === '__title' ? node.title : metadata[key]
    
    if (value !== undefined) {
      return applyFormatting<T>(value, type)
    }
  }
  
  // Step 2: Direct fallback to metadata[slotName]
  if (slotName in metadata) {
    return applyFormatting<T>(metadata[slotName], options?.type)
  }
  
  // Step 3: Apply default slot mappings
  const defaultKey = DEFAULT_SLOT_MAPPINGS[slotName]
  if (defaultKey) {
    // Special case: __title maps to node.title
    if (defaultKey === '__title') {
      return applyFormatting<T>(node.title, options?.type)
    }
    
    const value = metadata[defaultKey]
    if (value !== undefined) {
      return applyFormatting<T>(value, options?.type)
    }
  }
  
  // Step 4: Return default value
  return defaultValue
}

/**
 * Access multiple slots at once.
 * Useful for components that need many slot values.
 * 
 * @param slotNames - Array of slot names to retrieve
 * @returns Object with slot values keyed by slot name
 * 
 * @example
 * const { headline, subtext, badge } = useSlots(['headline', 'subtext', 'badge'])
 */
export function useSlots<T extends string>(
  slotNames: T[]
): Record<T, unknown> {
  const { node } = useNode()
  const metadata = node.metadata
  const config = metadata.__config as SlotConfig | undefined
  
  const result = {} as Record<T, unknown>
  
  for (const slotName of slotNames) {
    // Check __config
    if (config && slotName in config) {
      const mapping = config[slotName]
      const key = typeof mapping === 'string' ? mapping : mapping.key
      const value = key === '__title' ? node.title : metadata[key]
      result[slotName] = value
      continue
    }
    
    // Direct fallback
    if (slotName in metadata) {
      result[slotName] = metadata[slotName]
      continue
    }
    
    // Default mapping
    const defaultKey = DEFAULT_SLOT_MAPPINGS[slotName]
    if (defaultKey) {
      result[slotName] = defaultKey === '__title' ? node.title : metadata[defaultKey]
      continue
    }
    
    result[slotName] = undefined
  }
  
  return result
}

/**
 * Check if a slot has a value (not undefined or null).
 * 
 * @param slotName - The slot name to check
 * @returns true if the slot has a defined value
 */
export function useSlotExists(slotName: string): boolean {
  const value = useSlot(slotName)
  return value !== undefined && value !== null
}
