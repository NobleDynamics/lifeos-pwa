/**
 * Variant Registry
 * 
 * Maps variant strings to React components for the ViewEngine.
 * Implements self-healing fallback when a variant is missing or unknown.
 * 
 * @module engine/registry
 */

import type { ComponentType } from 'react'
import type { Node } from './types/node'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Props interface for all variant components.
 * Variant components receive the node data directly.
 */
export interface VariantComponentProps {
  node: Node
}

/**
 * Type alias for variant component types
 */
export type VariantComponent = ComponentType<VariantComponentProps>

// =============================================================================
// REGISTRY STORAGE
// =============================================================================

/**
 * Internal registry mapping variant strings to components.
 * Populated via registerVariant() calls.
 */
const variantRegistry = new Map<string, VariantComponent>()

/**
 * Default variant mappings by node type.
 * Used when a node's variant is missing or unregistered.
 */
const defaultVariantsByType: Record<string, string> = {
  space: 'container_stack',
  container: 'container_stack',
  collection: 'grid_card',
  item: 'list_row',
}

/**
 * Reference to the fallback component (DebugNode).
 * Set via setFallbackComponent() during engine initialization.
 */
let fallbackComponent: VariantComponent | null = null

// =============================================================================
// REGISTRATION API
// =============================================================================

/**
 * Register a variant component in the registry.
 * 
 * @param variant - The variant string (e.g., 'list_row', 'grid_card')
 * @param component - The React component to render for this variant
 * 
 * @example
 * registerVariant('list_row', ListRow)
 * registerVariant('grid_card', GridCard)
 */
export function registerVariant(variant: string, component: VariantComponent): void {
  if (variantRegistry.has(variant)) {
    console.warn(`[Registry] Overwriting existing variant "${variant}"`)
  }
  variantRegistry.set(variant, component)
}

/**
 * Register multiple variants at once.
 * 
 * @param variants - Object mapping variant strings to components
 * 
 * @example
 * registerVariants({
 *   list_row: ListRow,
 *   grid_card: GridCard,
 *   container_stack: ContainerStack,
 * })
 */
export function registerVariants(variants: Record<string, VariantComponent>): void {
  for (const [variant, component] of Object.entries(variants)) {
    registerVariant(variant, component)
  }
}

/**
 * Set the fallback component used when a variant cannot be resolved.
 * Typically called once during engine initialization with DebugNode.
 * 
 * @param component - The fallback component (usually DebugNode)
 */
export function setFallbackComponent(component: VariantComponent): void {
  fallbackComponent = component
}

/**
 * Unregister a variant from the registry.
 * Primarily used for testing.
 * 
 * @param variant - The variant string to remove
 * @returns true if the variant was removed, false if it didn't exist
 */
export function unregisterVariant(variant: string): boolean {
  return variantRegistry.delete(variant)
}

/**
 * Clear all registered variants.
 * Primarily used for testing.
 */
export function clearRegistry(): void {
  variantRegistry.clear()
}

// =============================================================================
// RESOLUTION API
// =============================================================================

/**
 * Resolve a node to its variant component.
 * Implements the self-healing fallback chain:
 * 
 * 1. Try exact variant match in registry
 * 2. Try default variant for the node's type
 * 3. Return fallback component (DebugNode)
 * 
 * @param node - The node to resolve
 * @returns The React component to render this node
 * 
 * @example
 * const Component = resolveVariant(node)
 * return <Component node={node} />
 */
export function resolveVariant(node: Node): VariantComponent {
  // 1. Try exact variant match
  const exactMatch = variantRegistry.get(node.variant)
  if (exactMatch) {
    return exactMatch
  }
  
  // 2. Try default variant for node type
  const defaultVariant = defaultVariantsByType[node.type]
  if (defaultVariant) {
    const defaultMatch = variantRegistry.get(defaultVariant)
    if (defaultMatch) {
      console.warn(
        `[Registry] Unknown variant "${node.variant}" for node "${node.id}". ` +
        `Falling back to default "${defaultVariant}" for type "${node.type}".`
      )
      return defaultMatch
    }
  }
  
  // 3. Self-healing: Use fallback component
  if (fallbackComponent) {
    console.warn(
      `[Registry] No component found for variant "${node.variant}" or type "${node.type}". ` +
      `Using DebugNode fallback for node "${node.id}".`
    )
    return fallbackComponent
  }
  
  // 4. Critical failure: No fallback set
  throw new Error(
    `[Registry] Cannot render node "${node.id}": ` +
    `No component for variant "${node.variant}", no default for type "${node.type}", ` +
    `and no fallback component set. Call setFallbackComponent(DebugNode) during initialization.`
  )
}

/**
 * Check if a variant is registered.
 * 
 * @param variant - The variant string to check
 * @returns true if the variant is registered
 */
export function hasVariant(variant: string): boolean {
  return variantRegistry.has(variant)
}

/**
 * Get all registered variant names.
 * Useful for debugging and documentation.
 * 
 * @returns Array of registered variant strings
 */
export function getRegisteredVariants(): string[] {
  return Array.from(variantRegistry.keys())
}

/**
 * Get the default variant for a node type.
 * 
 * @param nodeType - The node type (e.g., 'container', 'item')
 * @returns The default variant string, or undefined if none set
 */
export function getDefaultVariant(nodeType: string): string | undefined {
  return defaultVariantsByType[nodeType]
}

/**
 * Override the default variant for a node type.
 * 
 * @param nodeType - The node type
 * @param variant - The variant to use as default
 */
export function setDefaultVariant(nodeType: string, variant: string): void {
  defaultVariantsByType[nodeType] = variant
}
