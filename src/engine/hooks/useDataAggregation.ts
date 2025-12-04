/**
 * useDataAggregation Hook
 * 
 * Source-agnostic aggregation hook that can aggregate from:
 * 1. Own children (default behavior)
 * 2. A sibling node's children (via source_id)
 * 
 * This enables "Smart Components" like charts and progress cards to
 * aggregate data from any node in the tree, not just their own children.
 * 
 * @module engine/hooks/useDataAggregation
 */

import { useMemo } from 'react'
import type { Node } from '../types/node'
import { useNode } from '../context/NodeContext'
import { useSlot } from './useSlot'
import { 
  useChildAggregation, 
  type AggregationConfig, 
  type AggregatedData 
} from './useChildAggregation'

// Re-export types for convenience
export type { AggregationConfig, AggregatedData, AggregatedItem } from './useChildAggregation'

/**
 * Extended configuration that supports source_id for sibling lookups
 */
export interface DataAggregationConfig extends AggregationConfig {
  /** 
   * Optional ID of a sibling node to aggregate from instead of self.
   * If provided, will look up this node in the tree and aggregate its children.
   */
  source_id?: string
}

/**
 * Source-agnostic data aggregation hook.
 * 
 * If `config.source_id` is provided, aggregates from that node's children.
 * Otherwise, aggregates from the current node's children.
 * 
 * @param node - The current node (typically from props)
 * @param config - Aggregation configuration including optional source_id
 * @returns Aggregated data with totals, items, and statistics
 * 
 * @example
 * // Aggregate from own children (default)
 * const { total, items } = useDataAggregation(node, {
 *   target_key: 'amount',
 *   group_by: 'category',
 * })
 * 
 * @example
 * // Aggregate from a sibling node's children
 * const { total, items } = useDataAggregation(node, {
 *   source_id: '00000000-0000-0000-0000-000000000203',
 *   target_key: 'amount',
 *   group_by: 'category',
 * })
 */
export function useDataAggregation(
  node: Node | null | undefined,
  config: DataAggregationConfig
): AggregatedData {
  const { findNodeById } = useNode()
  
  // Determine the target node for aggregation
  const targetNode = useMemo(() => {
    // If source_id is provided, look up that node
    if (config.source_id) {
      const sourceNode = findNodeById(config.source_id)
      if (sourceNode) {
        return sourceNode
      }
      // If source node not found, log warning and fall back to self
      console.warn(
        `[useDataAggregation] source_id "${config.source_id}" not found in tree. ` +
        `Falling back to current node.`
      )
    }
    
    // Default: use the current node
    return node
  }, [node, config.source_id, findNodeById])
  
  // Delegate to the base aggregation hook
  return useChildAggregation(targetNode, config)
}

/**
 * Convenience hook that reads source_id from slot configuration.
 * 
 * This is the recommended hook for chart/progress components because it
 * automatically reads the source_id from the node's __config.
 * 
 * @param node - The current node (typically from props)
 * @param baseConfig - Base aggregation configuration (target_key, group_by, etc.)
 * @returns Aggregated data with totals, items, and statistics
 * 
 * @example
 * // In a chart component
 * const aggregated = useSlotBasedAggregation(node, {
 *   target_key: targetKey,
 *   group_by: groupBy,
 *   operation: 'sum',
 * })
 */
export function useSlotBasedAggregation(
  node: Node | null | undefined,
  baseConfig: AggregationConfig
): AggregatedData {
  // Read source_id from slot configuration
  const sourceId = useSlot<string>('source_id')
  
  // Merge with base config
  const config: DataAggregationConfig = useMemo(() => ({
    ...baseConfig,
    source_id: sourceId,
  }), [baseConfig, sourceId])
  
  return useDataAggregation(node, config)
}

export default useDataAggregation
