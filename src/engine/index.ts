/**
 * Unified Node Engine
 * 
 * Main entry point for the ViewEngine system.
 * Exports all public APIs and initializes the registry with default variants.
 * 
 * @module engine
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  Node,
  NodeType,
  NodeRelationship,
  RelationshipType,
} from './types/node'

export {
  NodeTypes,
  RelationshipTypes,
  NodeSchema,
  NodeRelationshipSchema,
  NodeArraySchema,
  parseNodeJson,
  isNode,
  countNodes,
  findNodeById,
  ResourceTypeToNodeType,
} from './types/node'

// =============================================================================
// CONTEXT EXPORTS
// =============================================================================

export {
  NodeProvider,
  useNode,
  useNodeMeta,
  useIsRoot,
  useHasChildren,
  useChildCount,
} from './context/NodeContext'

export type { NodeContextValue, NodeProviderProps } from './context/NodeContext'

// =============================================================================
// REGISTRY EXPORTS
// =============================================================================

export type { VariantComponentProps, VariantComponent } from './registry'

export {
  registerVariant,
  registerVariants,
  setFallbackComponent,
  resolveVariant,
  hasVariant,
  getRegisteredVariants,
  getDefaultVariant,
  setDefaultVariant,
  unregisterVariant,
  clearRegistry,
} from './registry'

// =============================================================================
// VIEW ENGINE EXPORTS
// =============================================================================

export { ViewEngine, renderChildren } from './components/ViewEngine'
export type { ViewEngineProps } from './components/ViewEngine'

export { useRenderChildren } from './components/hooks/useRenderChildren'

// =============================================================================
// BUILT-IN VARIANT EXPORTS
// =============================================================================

export { DebugNode } from './components/DebugNode'
export { ListRow } from './components/variants/ListRow'
export { GridCard } from './components/variants/GridCard'
export { ContainerStack } from './components/variants/ContainerStack'

// =============================================================================
// ENGINE INITIALIZATION
// =============================================================================

import { registerVariants, setFallbackComponent } from './registry'
import { DebugNode } from './components/DebugNode'
import { ListRow } from './components/variants/ListRow'
import { GridCard } from './components/variants/GridCard'
import { ContainerStack } from './components/variants/ContainerStack'

/**
 * Initialize the ViewEngine with default variants.
 * Call this once at app startup (e.g., in main.tsx or App.tsx).
 * 
 * @example
 * import { initializeEngine } from '@/engine'
 * initializeEngine()
 */
export function initializeEngine(): void {
  // Register fallback component
  setFallbackComponent(DebugNode)
  
  // Register built-in variants
  registerVariants({
    list_row: ListRow,
    grid_card: GridCard,
    container_stack: ContainerStack,
    // Aliases for convenience
    row: ListRow,
    card: GridCard,
    stack: ContainerStack,
    container: ContainerStack,
  })
  
  console.log('[ViewEngine] Initialized with default variants:', 
    'list_row', 'grid_card', 'container_stack')
}

// =============================================================================
// DEFAULT JSON FOR SANDBOX
// =============================================================================

/**
 * Default JSON structure for the sandbox pane.
 * Demonstrates a simple container with nested items.
 */
export const DEFAULT_SANDBOX_JSON = `{
  "id": "00000000-0000-0000-0000-000000000001",
  "type": "container",
  "variant": "container_stack",
  "title": "My First Container",
  "metadata": { "color": "#06b6d4" },
  "children": [
    {
      "id": "00000000-0000-0000-0000-000000000002",
      "type": "item",
      "variant": "list_row",
      "title": "Task 1: Build ViewEngine",
      "metadata": { "status": "completed", "priority": "high" }
    },
    {
      "id": "00000000-0000-0000-0000-000000000003",
      "type": "item",
      "variant": "list_row",
      "title": "Task 2: Test Recursion",
      "metadata": { "status": "active", "priority": "medium" }
    },
    {
      "id": "00000000-0000-0000-0000-000000000004",
      "type": "container",
      "variant": "container_stack",
      "title": "Nested Folder",
      "metadata": { "color": "#f59e0b" },
      "children": [
        {
          "id": "00000000-0000-0000-0000-000000000005",
          "type": "item",
          "variant": "list_row",
          "title": "Nested Task",
          "metadata": { "status": "active" }
        },
        {
          "id": "00000000-0000-0000-0000-000000000006",
          "type": "item",
          "variant": "unknown_variant_test",
          "title": "This should show DebugNode",
          "metadata": { "test": true }
        }
      ]
    },
    {
      "id": "00000000-0000-0000-0000-000000000007",
      "type": "collection",
      "variant": "grid_card",
      "title": "Recipe: Pasta",
      "metadata": { 
        "color": "#10b981",
        "semanticType": "recipe",
        "prepTime": 15,
        "cookTime": 20,
        "servings": 4,
        "description": "A delicious pasta dish"
      }
    }
  ]
}`
