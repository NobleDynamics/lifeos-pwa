/**
 * Resource to Node Tree Transformer
 * 
 * Converts a flat array of Supabase Resources into a nested Node tree
 * structure compatible with the ViewEngine.
 * 
 * @module engine/utils/resourcesToNodeTree
 */

import type { Resource } from '@/types/database'
import type { Node, NodeType } from '../types/node'
import { ResourceTypeToNodeType } from '../types/node'

// =============================================================================
// DEFAULT VARIANT MAPPING
// =============================================================================

/**
 * Returns the default variant for a resource type if none is specified in metadata.
 * This ensures every node has a renderable variant.
 */
function getDefaultVariant(resourceType: string): string {
  switch (resourceType) {
    case 'folder':
      return 'row_neon_group'
    case 'project':
      return 'view_list_stack'
    case 'task':
      return 'row_detail_check'
    case 'recipe':
      return 'card_media_top'
    case 'document':
      return 'row_simple'
    case 'event':
      return 'row_detail_check'
    default:
      return 'row_simple'
  }
}

// =============================================================================
// SINGLE RESOURCE TO NODE
// =============================================================================

/**
 * Converts a single Resource into a Node (without children linked yet).
 * 
 * Mapping rules:
 * - resource.type → node.type via ResourceTypeToNodeType
 * - resource.meta_data.variant → node.variant (or default based on type)
 * - resource.meta_data → node.metadata (preserving __config)
 * - resource.title → node.title
 */
export function resourceToNode(resource: Resource): Node {
  const meta = (resource.meta_data || {}) as Record<string, unknown>
  
  // Determine node type from resource type
  const nodeType: NodeType = ResourceTypeToNodeType[resource.type] || 'item'
  
  // Determine variant: explicit from metadata, or default based on resource type
  const variant = (meta.variant as string) || getDefaultVariant(resource.type)
  
  // Build metadata, preserving __config for slot system
  const metadata: Record<string, unknown> = { ...meta }
  
  // Add status from resource if not already in metadata
  if (!metadata.status && resource.status) {
    metadata.status = resource.status
  }
  
  // Add description from resource if not already in metadata
  if (!metadata.description && resource.description) {
    metadata.description = resource.description
  }
  
  return {
    id: resource.id,
    type: nodeType,
    variant,
    title: resource.title,
    metadata,
    children: [], // Will be populated by tree builder
  }
}

// =============================================================================
// FLAT ARRAY TO NESTED TREE
// =============================================================================

/**
 * Converts a flat array of Resources into a nested Node tree.
 * 
 * Algorithm (O(n) time complexity):
 * 1. Build ID → Resource map for O(1) lookups
 * 2. Build ID → Node map (convert all resources to nodes)
 * 3. Link children to parents in a single pass
 * 4. Return the root node
 * 
 * @param resources - Flat array of Resource objects from Supabase
 * @param rootId - The ID of the root resource (context root)
 * @returns The root Node with all descendants nested in .children
 * 
 * @example
 * const resources = await fetchResourceTree(rootPath)
 * const nodeTree = resourcesToNodeTree(resources, rootId)
 * return <ViewEngine root={nodeTree} />
 */
export function resourcesToNodeTree(resources: Resource[], rootId: string): Node | null {
  // Handle empty array
  if (resources.length === 0) {
    return null
  }
  
  // Step 1: Build ID → Node map (O(n))
  const nodeMap = new Map<string, Node>()
  
  for (const resource of resources) {
    nodeMap.set(resource.id, resourceToNode(resource))
  }
  
  // Step 2: Link children to parents (O(n))
  for (const resource of resources) {
    const node = nodeMap.get(resource.id)!
    
    if (resource.parent_id && nodeMap.has(resource.parent_id)) {
      const parentNode = nodeMap.get(resource.parent_id)!
      
      // Initialize children array if needed
      if (!parentNode.children) {
        parentNode.children = []
      }
      
      parentNode.children.push(node)
    }
  }
  
  // Step 3: Sort children by title for consistent ordering
  for (const node of nodeMap.values()) {
    if (node.children && node.children.length > 1) {
      node.children.sort((a, b) => a.title.localeCompare(b.title))
    }
  }
  
  // Step 4: Return root node
  const rootNode = nodeMap.get(rootId)
  
  if (!rootNode) {
    console.warn(`[resourcesToNodeTree] Root node not found: ${rootId}`)
    return null
  }
  
  return rootNode
}

// =============================================================================
// UTILITY: CREATE EMPTY ROOT NODE
// =============================================================================

/**
 * Creates an empty root node for when the context root exists but has no children.
 * Useful for newly created context roots.
 */
export function createEmptyRootNode(
  id: string,
  title: string,
  variant: string = 'view_directory'
): Node {
  return {
    id,
    type: 'container',
    variant,
    title,
    metadata: {
      placeholder: 'No items yet. Tap + to create one.',
    },
    children: [],
  }
}

// =============================================================================
// UTILITY: COUNT NODES IN TREE
// =============================================================================

/**
 * Recursively counts all nodes in a tree.
 * Useful for debugging and analytics.
 */
export function countNodesInTree(node: Node | null): number {
  if (!node) return 0
  
  let count = 1
  if (node.children) {
    for (const child of node.children) {
      count += countNodesInTree(child)
    }
  }
  return count
}
