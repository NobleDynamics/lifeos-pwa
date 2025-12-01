/**
 * Unified Node Type System
 * 
 * This module defines the core data model for the "Unified Node" architecture.
 * Nodes are abstract, recursive data structures that can represent any hierarchical
 * content (tasks, recipes, folders, etc.) with rendering driven by the `variant` field.
 * 
 * @module engine/types/node
 */

import { z } from 'zod'

// =============================================================================
// ENUMS & CONSTANTS
// =============================================================================

/**
 * Abstract node types that map to backend resource types:
 * - space: Top-level organizational unit (rarely rendered directly)
 * - container: Grouping element (maps to 'folder' in DB)
 * - collection: List/grid of items (maps to 'project' in DB)
 * - item: Leaf node (maps to 'task', 'recipe', 'workout', etc. in DB)
 */
export const NodeTypes = ['space', 'container', 'collection', 'item'] as const
export type NodeType = (typeof NodeTypes)[number]
/**
 * Relationship types that mirror the backend `resource_links.link_type` enum.
 * Used for lateral (non-hierarchical) connections between nodes.
 */
export const RelationshipTypes = [
  'HIERARCHY',
  'COMPONENT',
  'DEPENDENCY',
  'TRANSACTIONAL',
  'SPATIAL',
  'TEMPORAL',
  'SOCIAL',
  'REFERENCE',
] as const
export type RelationshipType = (typeof RelationshipTypes)[number]

/**
 * Field types for typed metadata fields.
 * Used by useSlot for automatic formatting and by AI/Agenda logic.
 * Inspired by "GoHighLevel" style typed fields.
 */
export const FieldTypes = [
  'text',      // Plain text string
  'number',    // Numeric value
  'currency',  // Money value (formatted with currency symbol)
  'date',      // ISO date string (formatted to human-readable)
  'boolean',   // True/false value
  'select',    // Single select from options
  'reference', // Reference to another node (UUID)
] as const
export type FieldType = (typeof FieldTypes)[number]

/**
 * Definition for a typed metadata field.
 * Allows schema-driven forms and intelligent slot formatting.
 */
export interface FieldDefinition {
  /** Unique key for this field in metadata */
  key: string
  /** Display label for forms/UI */
  label: string
  /** Field type for formatting and validation */
  type: FieldType
  /** Whether this field is required */
  required?: boolean
  /** Default value if not provided */
  defaultValue?: unknown
  /** For 'select' type: available options */
  options?: Array<{ value: string; label: string }>
  /** For 'currency' type: currency code (default: 'USD') */
  currency?: string
  /** For 'reference' type: the node type being referenced */
  referenceType?: NodeType
}

/**
 * Slot configuration for structural components.
 * Maps slot names to metadata field keys.
 * Stored in node.metadata.__config
 */
export interface SlotConfig {
  /** Map from slot name (e.g., 'headline') to metadata key (e.g., 'title') */
  [slotName: string]: string | {
    /** The metadata key to read from */
    key: string
    /** Optional field type for formatting */
    type?: FieldType
  }
}

/**
 * Maps backend resource types to abstract node types.
 * Used when transforming DB resources into Nodes (Phase 2).
 */
export const ResourceTypeToNodeType: Record<string, NodeType> = {
  folder: 'container',
  project: 'collection',
  task: 'item',
  recipe: 'item',
  ingredient: 'item',
  stock_item: 'item',
  workout: 'item',
  exercise: 'item',
  document: 'item',
  event: 'item',
}

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Represents a lateral relationship between two nodes.
 * Normalized structure for future DB compatibility with `resource_links` table.
 */
export interface NodeRelationship {
  /** UUID of the target node */
  targetId: string
  /** Type of relationship */
  type: RelationshipType
  /** Optional metadata for the relationship (e.g., quantity for ingredients) */
  meta?: Record<string, unknown>
}

/**
 * The Unified Node interface.
 * 
 * A Node is a recursive data structure where:
 * - `type` defines WHAT the node represents (semantic meaning)
 * - `variant` defines HOW the node should be rendered (UI component)
 * - `metadata` contains polymorphic data specific to the node's domain
 * - `children` enables infinite nesting
 * - `relationships` enables lateral connections
 */
export interface Node {
  /** Unique identifier (UUID) */
  id: string

  /** Abstract node type - determines default rendering if variant is missing */
  type: NodeType

  /** 
   * Variant string that drives rendering.
   * Maps to a React component via the registry.
   * Examples: 'list_row', 'grid_card', 'container_stack', 'hero_detail'
   */
  variant: string

  /** Display title */
  title: string

  /** 
   * Polymorphic metadata object.
   * Contents depend on the node's domain:
   * - Container: { color, icon }
   * - Task Item: { status, priority, dueDate, assigneeId }
   * - Recipe Item: { prepTime, cookTime, servings }
   */
  metadata: Record<string, unknown>

  /** Nested child nodes (optional) */
  children?: Node[]

  /** Lateral relationships to other nodes (optional) */
  relationships?: NodeRelationship[]

  /** 
   * Hybrid Data Pointer: Table name for strict data
   * e.g., 'transactions', 'health_logs'
   */
  pointer_table?: string

  /** 
   * Hybrid Data Pointer: UUID in the strict table
   */
  pointer_id?: string

  /** 
   * Agenda Protocol: Duration in minutes for time blocking
   * Default: 0
   */
  duration_minutes?: number
}

// =============================================================================
// ZOD SCHEMAS
// =============================================================================

/**
 * UUID validation regex - matches standard UUID v4 format
 */
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Schema for validating relationship objects
 */
export const NodeRelationshipSchema = z.object({
  targetId: z.string().regex(uuidRegex, 'Invalid UUID format'),
  type: z.enum(RelationshipTypes),
  meta: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Base node schema without recursive children (used internally)
 */
const BaseNodeSchema = z.object({
  id: z.string().regex(uuidRegex, 'Invalid UUID format'),
  type: z.enum(NodeTypes),
  variant: z.string().min(1, 'Variant cannot be empty'),
  title: z.string().min(1, 'Title cannot be empty'),
  metadata: z.record(z.string(), z.unknown()),
  relationships: z.array(NodeRelationshipSchema).optional(),
})

/**
 * Recursive schema for validating Node trees.
 * Uses z.lazy() for self-referential validation.
 */
export const NodeSchema: z.ZodType<Node> = BaseNodeSchema.extend({
  children: z.lazy(() => z.array(NodeSchema).optional()),
})

/**
 * Schema for validating an array of nodes (e.g., a flat list)
 */
export const NodeArraySchema = z.array(NodeSchema)

// =============================================================================
// TYPE GUARDS & UTILITIES
// =============================================================================

/**
 * Type guard to check if an unknown value is a valid Node
 */
export function isNode(value: unknown): value is Node {
  return NodeSchema.safeParse(value).success
}

/**
 * Safely parse JSON string into a Node, returning result with errors
 */
export function parseNodeJson(jsonString: string): {
  success: boolean
  data?: Node
  error?: string
} {
  try {
    const parsed = JSON.parse(jsonString)
    const result = NodeSchema.safeParse(parsed)

    if (result.success) {
      return { success: true, data: result.data }
    }

    // Format Zod errors for display
    const errorMessages = result.error.issues
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('\n')

    return { success: false, error: errorMessages }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Invalid JSON',
    }
  }
}

/**
 * Get the total count of nodes in a tree (including nested children)
 */
export function countNodes(node: Node): number {
  let count = 1
  if (node.children) {
    for (const child of node.children) {
      count += countNodes(child)
    }
  }
  return count
}

/**
 * Find a node by ID in a tree (depth-first search)
 */
export function findNodeById(root: Node, id: string): Node | null {
  if (root.id === id) return root

  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id)
      if (found) return found
    }
  }

  return null
}
