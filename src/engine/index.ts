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

// Action & Context Menu Types (JSONB-driven UI interactions)
export type {
  FormFieldType,
  SelectOption,
  CreateFieldSchema,
  ActionType,
  ActionOption,
  HeaderActionConfig,
  ContextMenuActionType,
  ContextMenuOption,
  ContextMenuConfig,
  FormResult,
  ContextMenuState,
  DynamicFormState,
} from './types/actions'

export {
  FormFieldTypes,
  ActionTypes,
  ContextMenuActionTypes,
  DEFAULT_CONTEXT_MENU,
  DEFAULT_HEADER_ACTION,
  isHeaderActionConfig,
  isContextMenuConfig,
  shouldShowOption,
} from './types/actions'

// Shared Components
export { DynamicFormSheet, PRESET_COLORS, CURATED_ICONS } from './components/shared/DynamicFormSheet'
export type { DynamicFormSheetProps } from './components/shared/DynamicFormSheet'

export { ContextMenuSheet } from './components/shared/ContextMenuSheet'

// Context Menu Context
export {
  ContextMenuProvider,
  useContextMenu,
  useContextMenuTrigger,
} from './context/ContextMenuContext'

export type {
  ContextMenuState as ContextMenuContextState,
  ContextMenuContextValue,
  ContextMenuHandlers,
} from './context/ContextMenuContext'

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
  BehaviorConfig,
} from './context/EngineActionsContext'

// Siblings Context (for sharing media siblings between view and card)
export {
  SiblingsProvider,
  useSiblings,
  useSiblingsWithFallback,
} from './context/SiblingsContext'

export type { SiblingsContextValue, SiblingsProviderProps } from './context/SiblingsContext'

// Shell Navigation Context (for persistent shell architecture)
export {
  ShellNavigationProvider,
  useShellNavigation,
  findPathToNode,
  findNodeInTree,
  findContainingChild,
} from './context/ShellNavigationContext'

// Shell Action Context (for dynamic header actions)
export {
  ShellActionProvider,
  useShellAction,
} from './context/ShellActionContext'

export type {
  CreateOption,
  ActionConfig,
} from './context/ShellActionContext'

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

// Aggregation Hook for Smart Components
export { 
  useChildAggregation, 
  useChildSum, 
  useChildCount as useChildAggregationCount,
  useRechartsData,
} from './hooks/useChildAggregation'
export type { 
  AggregationConfig, 
  AggregatedItem, 
  AggregatedData 
} from './hooks/useChildAggregation'

// Source-Agnostic Aggregation (supports source_id lookups)
export {
  useDataAggregation,
  useSlotBasedAggregation,
} from './hooks/useDataAggregation'
export type { DataAggregationConfig } from './hooks/useDataAggregation'

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
export { ViewGridFixed } from './components/variants/views/view_grid_fixed'
export { ViewBoardColumns } from './components/variants/views/view_board_columns'
export { LayoutAppShell } from './components/variants/layouts/layout_app_shell'
export { LayoutTopTabs } from './components/variants/layouts/layout_top_tabs'

// Rows (List Items)
export { RowDetailCheck } from './components/variants/rows/row_detail_check'
export { RowNeonGroup } from './components/variants/rows/row_neon_group'
export { RowSimple } from './components/variants/rows/row_simple'
export { RowInputStepper } from './components/variants/rows/row_input_stepper'
export { RowInputCurrency } from './components/variants/rows/row_input_currency'
export { RowTransactionHistory } from './components/variants/rows/row_transaction_history'
export { RowMediaLeft } from './components/variants/rows/row_media_left'
export { RowSimpleDescription } from './components/variants/rows/row_simple_description'
export { RowNote } from './components/variants/rows/row_note'

// Cards (Grid Items)
export { CardMediaTop } from './components/variants/cards/card_media_top'
export { CardMediaThumbnail } from './components/variants/cards/card_media_thumbnail'
export { CardMediaCover } from './components/variants/cards/card_media_cover'
export { CardStatHero } from './components/variants/cards/card_stat_hero'
export { CardFolder } from './components/variants/cards/card_folder'

// Note Cards
export { CardNote } from './components/variants/cards/card_note'
export { CardNoteLarge } from './components/variants/cards/card_note_large'

// Kanban Cards
export { CardKanbanDetails } from './components/variants/cards/card_kanban_details'
export { CardKanbanImage } from './components/variants/cards/card_kanban_image'

// Compact Cards (for side-by-side layouts)
export { CardMediaTopCompact } from './components/variants/cards/card_media_top_compact'
export { CardMediaThumbnailCompact } from './components/variants/cards/card_media_thumbnail_compact'
export { CardMediaCoverCompact } from './components/variants/cards/card_media_cover_compact'

// Progress Cards
export { CardProgressSimple } from './components/variants/cards/card_progress_simple'
export { CardProgressStacked } from './components/variants/cards/card_progress_stacked'
export { CardProgressMulti } from './components/variants/cards/card_progress_multi'

// Chart Cards
export { CardChartBar } from './components/variants/cards/card_chart_bar'
export { CardChartLine } from './components/variants/cards/card_chart_line'
export { CardChartPie } from './components/variants/cards/card_chart_pie'
export { CardChartRadar } from './components/variants/cards/card_chart_radar'

// Dashboard Layouts
export { ViewDashboardMasonry, ViewDashboardResponsive } from './components/variants/layouts/view_dashboard_masonry'

// Gallery & Carousel Layouts
export { ViewGalleryGrid } from './components/variants/layouts/view_gallery_grid'
export { ViewCarouselSnap } from './components/variants/layouts/view_carousel_snap'

// Shared Components
export { MoveToColumnSheet } from './components/shared/MoveToColumnSheet'
export type { MoveToColumnSheetProps } from './components/shared/MoveToColumnSheet'

export { MediaLightboxModal } from './components/shared/MediaLightboxModal'
export type { MediaLightboxModalProps } from './components/shared/MediaLightboxModal'

// =============================================================================
// ENGINE INITIALIZATION
// =============================================================================

import { registerVariants, setFallbackComponent } from './registry'
import { DebugNode } from './components/DebugNode'

// New Structural Components
import { ViewListStack } from './components/variants/views/view_list_stack'
import { ViewDirectory } from './components/variants/views/view_directory'
import { ViewGridFixed } from './components/variants/views/view_grid_fixed'
import { LayoutAppShell } from './components/variants/layouts/layout_app_shell'
import { LayoutTopTabs } from './components/variants/layouts/layout_top_tabs'
import { RowDetailCheck } from './components/variants/rows/row_detail_check'
import { RowNeonGroup } from './components/variants/rows/row_neon_group'
import { RowSimple } from './components/variants/rows/row_simple'
import { RowInputStepper } from './components/variants/rows/row_input_stepper'
import { RowInputCurrency } from './components/variants/rows/row_input_currency'
import { RowTransactionHistory } from './components/variants/rows/row_transaction_history'
import { CardMediaTop } from './components/variants/cards/card_media_top'
import { CardMediaThumbnail } from './components/variants/cards/card_media_thumbnail'
import { CardMediaCover } from './components/variants/cards/card_media_cover'
import { CardStatHero } from './components/variants/cards/card_stat_hero'
import { CardFolder } from './components/variants/cards/card_folder'

// Compact Cards
import { CardMediaTopCompact } from './components/variants/cards/card_media_top_compact'
import { CardMediaThumbnailCompact } from './components/variants/cards/card_media_thumbnail_compact'
import { CardMediaCoverCompact } from './components/variants/cards/card_media_cover_compact'

// New Row Components
import { RowMediaLeft } from './components/variants/rows/row_media_left'
import { RowSimpleDescription } from './components/variants/rows/row_simple_description'
import { RowNote } from './components/variants/rows/row_note'

// Note Cards
import { CardNote } from './components/variants/cards/card_note'
import { CardNoteLarge } from './components/variants/cards/card_note_large'

// Progress Cards
import { CardProgressSimple } from './components/variants/cards/card_progress_simple'
import { CardProgressStacked } from './components/variants/cards/card_progress_stacked'
import { CardProgressMulti } from './components/variants/cards/card_progress_multi'

// Chart Cards
import { CardChartBar } from './components/variants/cards/card_chart_bar'
import { CardChartLine } from './components/variants/cards/card_chart_line'
import { CardChartPie } from './components/variants/cards/card_chart_pie'
import { CardChartRadar } from './components/variants/cards/card_chart_radar'

// Dashboard Layouts
import { ViewDashboardMasonry, ViewDashboardResponsive } from './components/variants/layouts/view_dashboard_masonry'

// Gallery & Carousel Layouts
import { ViewGalleryGrid } from './components/variants/layouts/view_gallery_grid'
import { ViewCarouselSnap } from './components/variants/layouts/view_carousel_snap'

// Kanban Components
import { ViewBoardColumns } from './components/variants/views/view_board_columns'
import { CardKanbanDetails } from './components/variants/cards/card_kanban_details'
import { CardKanbanImage } from './components/variants/cards/card_kanban_image'

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
    view_grid_fixed: ViewGridFixed,
    layout_app_shell: LayoutAppShell,
    layout_top_tabs: LayoutTopTabs,

    // Rows (List Items)
    row_detail_check: RowDetailCheck,
    row_neon_group: RowNeonGroup,
    row_simple: RowSimple,
    row_input_stepper: RowInputStepper,
    row_input_currency: RowInputCurrency,
    row_transaction_history: RowTransactionHistory,
    row_media_left: RowMediaLeft,
    row_simple_description: RowSimpleDescription,
    row_note: RowNote,

    // Cards (Grid Items)
    card_media_top: CardMediaTop,
    card_media_thumbnail: CardMediaThumbnail,
    card_media_cover: CardMediaCover,
    card_stat_hero: CardStatHero,
    card_folder: CardFolder,

    // Note Cards
    card_note: CardNote,
    card_note_large: CardNoteLarge,

    // Compact Cards (for side-by-side layouts in 6-col grid)
    card_media_top_compact: CardMediaTopCompact,
    card_media_thumbnail_compact: CardMediaThumbnailCompact,
    card_media_cover_compact: CardMediaCoverCompact,

    // Progress Cards
    card_progress_simple: CardProgressSimple,
    card_progress_stacked: CardProgressStacked,
    card_progress_multi: CardProgressMulti,

    // Chart Cards
    card_chart_bar: CardChartBar,
    card_chart_line: CardChartLine,
    card_chart_pie: CardChartPie,
    card_chart_radar: CardChartRadar,

    // Dashboard Layouts
    view_dashboard_masonry: ViewDashboardMasonry,
    view_dashboard_responsive: ViewDashboardResponsive,

    // Gallery & Carousel Layouts
    view_gallery_grid: ViewGalleryGrid,
    view_carousel_snap: ViewCarouselSnap,

    // Kanban Board Variants
    view_board_columns: ViewBoardColumns,
    card_kanban_details: CardKanbanDetails,
    card_kanban_image: CardKanbanImage,

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
    'view_list_stack', 'view_directory', 'view_dashboard_masonry',
    'row_detail_check', 'row_neon_group', 'row_simple',
    'card_media_top', 'card_progress_*', 'card_chart_*')
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
