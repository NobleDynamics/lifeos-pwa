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

// Engine Actions Context (for wiring variants to data layer)
export {
  EngineActionsProvider,
  useEngineActions,
  useEngineActionsWithFallback,
} from './context/EngineActionsContext'

export type {
  EngineActionsValue,
  EngineActionsProviderProps,
} from './context/EngineActionsContext'

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
// HOOK EXPORTS
// =============================================================================

export { useSlot, useSlots, useSlotExists } from './hooks/useSlot'
export type { UseSlotOptions } from './hooks/useSlot'

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

export {
  resourceToNode,
  resourcesToNodeTree,
  createEmptyRootNode,
  countNodesInTree,
} from './utils'

// =============================================================================
// BUILT-IN VARIANT EXPORTS (Structural Taxonomy)
// =============================================================================

export { DebugNode } from './components/DebugNode'

// Views (Containers)
export { ViewListStack } from './components/variants/views/view_list_stack'
export { ViewDirectory } from './components/variants/views/view_directory'

// Rows (List Items)
export { RowDetailCheck } from './components/variants/rows/row_detail_check'
export { RowNeonGroup } from './components/variants/rows/row_neon_group'
export { RowSimple } from './components/variants/rows/row_simple'

// Cards (Grid Items)
export { CardMediaTop } from './components/variants/cards/card_media_top'

// =============================================================================
// ENGINE INITIALIZATION
// =============================================================================

import { registerVariants, setFallbackComponent } from './registry'
import { DebugNode } from './components/DebugNode'

// New Structural Components
import { ViewListStack } from './components/variants/views/view_list_stack'
import { ViewDirectory } from './components/variants/views/view_directory'
import { RowDetailCheck } from './components/variants/rows/row_detail_check'
import { RowNeonGroup } from './components/variants/rows/row_neon_group'
import { RowSimple } from './components/variants/rows/row_simple'
import { CardMediaTop } from './components/variants/cards/card_media_top'

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
  
  // Register structural variants (new taxonomy)
  registerVariants({
    // Views (Containers)
    view_list_stack: ViewListStack,
    view_directory: ViewDirectory,
    
    // Rows (List Items)
    row_detail_check: RowDetailCheck,
    row_neon_group: RowNeonGroup,
    row_simple: RowSimple,
    
    // Cards (Grid Items)
    card_media_top: CardMediaTop,
    
    // =========================================
    // LEGACY ALIASES (Backwards Compatibility)
    // =========================================
    // These map old domain-specific names to new structural components
    container_stack: ViewListStack,
    resource_directory: ViewDirectory,
    task_row_detailed: RowDetailCheck,
    folder_row_neon: RowNeonGroup,
    list_row: RowSimple,
    grid_card: CardMediaTop,
    
    // Convenience aliases
    row: RowSimple,
    card: CardMediaTop,
    stack: ViewListStack,
    container: ViewListStack,
  })
  
  console.log('[ViewEngine] Initialized with structural taxonomy:', 
    'view_list_stack', 'view_directory', 'row_detail_check', 'row_neon_group', 'row_simple', 'card_media_top')
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
