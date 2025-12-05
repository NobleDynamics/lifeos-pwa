/**
 * Action & Context Menu Type System
 * 
 * This module defines the type system for JSONB-driven header actions and context menus.
 * These schemas enable metadata-driven UI interactions following the "Generic Engine" philosophy.
 * 
 * Key Concepts:
 * - HeaderActionConfig: Defines the "+" button in the app shell header
 * - ContextMenuConfig: Defines long-press/right-click context menu options
 * - CreateFieldSchema: Defines dynamic form fields for create/edit operations
 * 
 * @module engine/types/actions
 */

// =============================================================================
// FORM FIELD TYPES
// =============================================================================

/**
 * Extended field types for dynamic form generation.
 * Includes all common input types plus specialized pickers.
 */
export const FormFieldTypes = [
  'text',           // Single line text input
  'textarea',       // Multi-line text input
  'number',         // Numeric input
  'currency',       // Currency input with formatting
  'date',           // Date picker
  'datetime',       // Date + time picker
  'select',         // Single select dropdown
  'multi_select',   // Multi-select (tags)
  'media',          // File/image upload
  'color',          // Color picker (preset palette)
  'icon',           // Icon picker (curated icons grid)
  'toggle',         // Boolean toggle switch
  'profile_select', // Household profile picker
  'node_reference', // Reference to another node (UUID)
] as const

export type FormFieldType = (typeof FormFieldTypes)[number]

/**
 * Select option for dropdown/multi-select fields.
 */
export interface SelectOption {
  /** Value stored in metadata */
  value: string
  /** Display label */
  label: string
  /** Optional icon name (Lucide) */
  icon?: string
  /** Optional color for visual distinction */
  color?: string
}

/**
 * Schema definition for a single form field.
 * Used by DynamicFormSheet to render appropriate input components.
 */
export interface CreateFieldSchema {
  /** Unique key - maps to metadata property (e.g., "title", "url", "vendor_id") */
  key: string
  
  /** Display label for the form field */
  label: string
  
  /** Field type determines the input component rendered */
  type: FormFieldType
  
  /** Whether this field is required for form submission */
  required?: boolean
  
  /** Default value if not provided */
  default_value?: unknown
  
  /** Placeholder text for text inputs */
  placeholder?: string
  
  /** Help text shown below the field */
  help_text?: string
  
  // === Type-specific options ===
  
  /** For 'select' and 'multi_select': available options */
  options?: SelectOption[]
  
  /** For 'media': accepted file types (e.g., "image/*", "image/png,image/jpeg") */
  accept?: string
  
  /** For 'media': max file size in MB */
  max_size_mb?: number
  
  /** For 'number' and 'currency': minimum value */
  min?: number
  
  /** For 'number' and 'currency': maximum value */
  max?: number
  
  /** For 'number': step increment */
  step?: number
  
  /** For 'currency': currency code (default: 'USD') */
  currency_code?: string
  
  /** For 'node_reference': filter by node type */
  reference_filter?: {
    /** Filter by node type */
    type?: string
    /** Filter by variant */
    variant?: string
    /** Filter by parent_id (scope to specific container) */
    parent_id?: string
  }
  
  /** For 'icon': subset of icons to show (default: all curated icons) */
  icon_set?: string[]
  
  /** For 'color': custom color palette (default: preset colors) */
  color_palette?: string[]
}

// =============================================================================
// HEADER ACTION TYPES
// =============================================================================

/**
 * Action types for header action button options.
 */
export const ActionTypes = [
  'create',   // Open create form with create_schema
  'navigate', // Navigate to a specific node
  'custom',   // Emit custom event via onTriggerBehavior
] as const

export type ActionType = (typeof ActionTypes)[number]

/**
 * Single action option in the header action dropdown.
 */
export interface ActionOption {
  /** Unique identifier for this action */
  id: string
  
  /** Display label (e.g., "Upload Photo", "Add Item") */
  label: string
  
  /** Lucide icon name (e.g., "Camera", "Upload", "Plus") */
  icon?: string
  
  /** Tooltip/subtitle text */
  description?: string
  
  /** Accent color (hex) for visual distinction */
  color?: string
  
  /** Action type determines behavior on click */
  action_type: ActionType
  
  // === Type-specific options ===
  
  /** For 'create': form fields to render */
  create_schema?: CreateFieldSchema[]
  
  /** For 'create': variant to assign to created node (default: parent decides) */
  create_variant?: string
  
  /** For 'create': type to assign to created node (default: 'item') */
  create_node_type?: 'container' | 'collection' | 'item'
  
  /** For 'navigate': target node ID to navigate to */
  target_id?: string
  
  /** For 'custom': event/action name to emit via onTriggerBehavior */
  custom_handler?: string
  
  /** For 'custom': additional payload to pass to handler */
  custom_payload?: Record<string, unknown>
}

/**
 * Configuration for the header action button.
 * Stored in node.metadata.header_action
 */
export interface HeaderActionConfig {
  /** Button label (default: "Add") */
  label?: string
  
  /** Button icon (default: "Plus") */
  icon?: string
  
  /** Dropdown options when button is clicked */
  options: ActionOption[]
}

// =============================================================================
// CONTEXT MENU TYPES
// =============================================================================

/**
 * Action types for context menu options.
 */
export const ContextMenuActionTypes = [
  'edit',     // Open edit form with specified fields
  'delete',   // Show confirm dialog, then delete node
  'move',     // Show move target picker, update parent_id
  'navigate', // Navigate to node detail view
  'custom',   // Emit custom event via onTriggerBehavior
] as const

export type ContextMenuActionType = (typeof ContextMenuActionTypes)[number]

/**
 * Single option in a context menu.
 */
export interface ContextMenuOption {
  /** Unique identifier for this option */
  id: string
  
  /** Display label (e.g., "Edit", "Delete", "Share") */
  label: string
  
  /** Lucide icon name */
  icon?: string
  
  /** Accent color (hex) - typically red for destructive actions */
  color?: string
  
  /** Show a divider line above this option */
  divider_before?: boolean
  
  /** Action type determines behavior on click */
  action_type: ContextMenuActionType
  
  // === Type-specific options ===
  
  /** For 'edit': full field schema for edit form (preferred over edit_fields) */
  edit_schema?: CreateFieldSchema[]
  
  /** For 'edit': legacy - list of metadata keys to edit (uses parent's create_schema) */
  edit_fields?: string[]
  
  /** For 'move': allowed parent node IDs, or 'siblings' for same-level move */
  move_targets?: string[] | 'siblings'
  
  /** For 'navigate': target node ID (default: the item itself) */
  target_id?: string
  
  /** For 'custom': event/action name to emit via onTriggerBehavior */
  custom_handler?: string
  
  /** For 'custom': additional payload to pass to handler */
  custom_payload?: Record<string, unknown>
  
  /** Condition for showing this option (simple key-value check on node.metadata) */
  show_if?: {
    key: string
    value: unknown
    operator?: 'eq' | 'neq' | 'exists' | 'not_exists'
  }
}

/**
 * Configuration for item context menus.
 * Can be stored in:
 * - Parent node: metadata.child_context_menu (applies to all children)
 * - Item node: metadata.context_menu (overrides parent for this item)
 */
export interface ContextMenuConfig {
  /** Context menu options */
  options: ContextMenuOption[]
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Result of form submission from DynamicFormSheet.
 * Maps field keys to their values.
 */
export type FormResult = Record<string, unknown>

/**
 * State for the context menu system.
 */
export interface ContextMenuState {
  /** Whether the context menu is visible */
  isOpen: boolean
  
  /** The node the context menu is for */
  node: import('./node').Node | null
  
  /** Resolved context menu configuration */
  config: ContextMenuConfig | null
  
  /** Position for floating menu (desktop) */
  position?: { x: number; y: number }
}

/**
 * State for the dynamic form system.
 */
export interface DynamicFormState {
  /** Whether the form is visible */
  isOpen: boolean
  
  /** Form title */
  title: string
  
  /** Form fields to render */
  schema: CreateFieldSchema[]
  
  /** Initial values (for edit mode) */
  initialValues?: FormResult
  
  /** Node being edited (null for create) */
  editingNode?: import('./node').Node | null
  
  /** Parent ID for new node creation */
  parentId?: string
  
  /** Callback when form is submitted */
  onSubmit?: (result: FormResult) => void | Promise<void>
  
  /** Optional: node type to create */
  createNodeType?: 'container' | 'collection' | 'item'
  
  /** Optional: variant to assign to created node */
  createVariant?: string
}

// =============================================================================
// DEFAULT CONFIGURATIONS
// =============================================================================

/**
 * Default context menu for items that don't have a custom config.
 * Provides basic Edit and Delete functionality.
 */
export const DEFAULT_CONTEXT_MENU: ContextMenuConfig = {
  options: [
    {
      id: 'edit',
      label: 'Edit',
      icon: 'Pencil',
      action_type: 'edit',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'Trash2',
      color: '#ef4444',
      divider_before: true,
      action_type: 'delete',
    },
  ],
}

/**
 * Default header action for containers without custom config.
 * Provides basic folder/item creation.
 */
export const DEFAULT_HEADER_ACTION: HeaderActionConfig = {
  label: 'New',
  icon: 'Plus',
  options: [
    {
      id: 'new_folder',
      label: 'New Folder',
      icon: 'Folder',
      action_type: 'create',
      create_node_type: 'container',
      create_schema: [
        { key: 'title', label: 'Folder Name', type: 'text', required: true },
        { key: 'icon', label: 'Icon', type: 'icon' },
        { key: 'color', label: 'Color', type: 'color' },
      ],
    },
    {
      id: 'new_item',
      label: 'New Item',
      icon: 'Plus',
      action_type: 'create',
      create_node_type: 'item',
      create_schema: [
        { key: 'title', label: 'Name', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
      ],
    },
  ],
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Check if a value is a valid HeaderActionConfig
 */
export function isHeaderActionConfig(value: unknown): value is HeaderActionConfig {
  if (!value || typeof value !== 'object') return false
  const config = value as HeaderActionConfig
  return Array.isArray(config.options)
}

/**
 * Check if a value is a valid ContextMenuConfig
 */
export function isContextMenuConfig(value: unknown): value is ContextMenuConfig {
  if (!value || typeof value !== 'object') return false
  const config = value as ContextMenuConfig
  return Array.isArray(config.options)
}

/**
 * Check if a context menu option should be shown based on its show_if condition
 */
export function shouldShowOption(
  option: ContextMenuOption,
  metadata: Record<string, unknown>
): boolean {
  if (!option.show_if) return true
  
  const { key, value, operator = 'eq' } = option.show_if
  const actualValue = metadata[key]
  
  switch (operator) {
    case 'eq':
      return actualValue === value
    case 'neq':
      return actualValue !== value
    case 'exists':
      return actualValue !== undefined && actualValue !== null
    case 'not_exists':
      return actualValue === undefined || actualValue === null
    default:
      return true
  }
}
