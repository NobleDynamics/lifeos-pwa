/**
 * useChildAggregation Hook
 * 
 * Smart aggregation hook that traverses child nodes and computes
 * aggregate values based on configuration. Used by dashboard cards
 * and progress components to automatically summarize data.
 * 
 * @module engine/hooks/useChildAggregation
 */

import { useMemo } from 'react'
import type { Node } from '../types/node'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Configuration for aggregation operations
 */
export interface AggregationConfig {
  /** The metadata key to aggregate (e.g., 'amount', 'calories', 'duration') */
  target_key: string
  
  /** Optional key to group by (e.g., 'category', 'status', 'type') */
  group_by?: string
  
  /** Operation to perform (default: 'sum') */
  operation?: 'sum' | 'count' | 'average' | 'min' | 'max'
  
  /** Optional key for label when grouping (default: group_by value) */
  label_key?: string
  
  /** Optional key for color assignment (e.g., 'color', 'accent_color') */
  color_key?: string
  
  /** Whether to include nested children recursively (default: false) */
  recursive?: boolean
  
  /** Filter predicate to include only certain nodes */
  filter?: (node: Node) => boolean
}

/**
 * A single aggregated group/item
 */
export interface AggregatedItem {
  /** Display label for this group/item */
  label: string
  
  /** Computed value */
  value: number
  
  /** Optional color for visualization */
  color?: string
  
  /** Original group key (if grouped) */
  groupKey?: string
  
  /** Number of items in this group */
  count: number
  
  /** Percentage of total (0-100) */
  percentage: number
}

/**
 * Result of aggregation operation
 */
export interface AggregatedData {
  /** Total aggregated value across all items */
  total: number
  
  /** Aggregated items (one per group if grouped, one total if not) */
  items: AggregatedItem[]
  
  /** Maximum value among items (useful for progress bars) */
  max: number
  
  /** Minimum value among items */
  min: number
  
  /** Average value */
  average: number
  
  /** Total number of nodes processed */
  nodeCount: number
  
  /** Whether data is empty */
  isEmpty: boolean
}

/**
 * Default colors for chart segments (cyberpunk theme)
 */
const DEFAULT_COLORS = [
  '#06b6d4', // cyan (primary)
  '#ec4899', // pink
  '#a855f7', // purple
  '#22c55e', // green
  '#eab308', // yellow
  '#f97316', // orange
  '#3b82f6', // blue
  '#ef4444', // red
]

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extract numeric value from node metadata
 */
function extractValue(node: Node, key: string): number {
  const value = node.metadata[key]
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

/**
 * Extract string value from node metadata
 */
function extractString(node: Node, key: string): string {
  const value = node.metadata[key]
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return String(value ?? '')
}

/**
 * Collect all child nodes (optionally recursive)
 */
function collectChildren(node: Node, recursive: boolean, filter?: (n: Node) => boolean): Node[] {
  const children = node.children ?? []
  let result: Node[] = []
  
  for (const child of children) {
    if (!filter || filter(child)) {
      result.push(child)
    }
    
    if (recursive && child.children?.length) {
      result = result.concat(collectChildren(child, true, filter))
    }
  }
  
  return result
}

/**
 * Perform aggregation operation on values
 */
function aggregate(values: number[], operation: AggregationConfig['operation']): number {
  if (values.length === 0) return 0
  
  switch (operation) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0)
    case 'count':
      return values.length
    case 'average':
      return values.reduce((a, b) => a + b, 0) / values.length
    case 'min':
      return Math.min(...values)
    case 'max':
      return Math.max(...values)
    default:
      return values.reduce((a, b) => a + b, 0)
  }
}

// =============================================================================
// MAIN HOOK
// =============================================================================

/**
 * Aggregate data from child nodes based on configuration.
 * 
 * @param node - The parent node whose children to aggregate
 * @param config - Aggregation configuration
 * @returns Aggregated data with totals, items, and statistics
 * 
 * @example
 * // Sum all 'amount' values grouped by 'category'
 * const { total, items } = useChildAggregation(node, {
 *   target_key: 'amount',
 *   group_by: 'category',
 *   operation: 'sum'
 * })
 * 
 * @example
 * // Count items by status
 * const { items } = useChildAggregation(node, {
 *   target_key: 'id', // any key works for count
 *   group_by: 'status',
 *   operation: 'count'
 * })
 */
export function useChildAggregation(
  node: Node | null | undefined,
  config: AggregationConfig
): AggregatedData {
  return useMemo(() => {
    // Handle null/undefined node
    if (!node) {
      return {
        total: 0,
        items: [],
        max: 0,
        min: 0,
        average: 0,
        nodeCount: 0,
        isEmpty: true,
      }
    }
    
    const {
      target_key,
      group_by,
      operation = 'sum',
      label_key,
      color_key,
      recursive = false,
      filter,
    } = config
    
    // Collect applicable children
    const children = collectChildren(node, recursive, filter)
    
    if (children.length === 0) {
      return {
        total: 0,
        items: [],
        max: 0,
        min: 0,
        average: 0,
        nodeCount: 0,
        isEmpty: true,
      }
    }
    
    // Group data if group_by is specified
    if (group_by) {
      const groups = new Map<string, { values: number[]; nodes: Node[]; color?: string }>()
      
      for (const child of children) {
        const groupKey = extractString(child, group_by) || 'Other'
        const value = extractValue(child, target_key)
        const color = color_key ? extractString(child, color_key) : undefined
        
        if (!groups.has(groupKey)) {
          groups.set(groupKey, { values: [], nodes: [], color })
        }
        
        const group = groups.get(groupKey)!
        group.values.push(value)
        group.nodes.push(child)
        
        // Use first color found in group
        if (color && !group.color) {
          group.color = color
        }
      }
      
      // Compute aggregated items
      let colorIndex = 0
      const items: AggregatedItem[] = []
      
      for (const [groupKey, group] of groups) {
        const aggregatedValue = aggregate(group.values, operation)
        const label = label_key 
          ? extractString(group.nodes[0], label_key) || groupKey
          : groupKey
        
        items.push({
          label,
          value: aggregatedValue,
          color: group.color || DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length],
          groupKey,
          count: group.nodes.length,
          percentage: 0, // Computed below
        })
        
        colorIndex++
      }
      
      // Sort by value descending
      items.sort((a, b) => b.value - a.value)
      
      // Compute totals and percentages
      const total = items.reduce((sum, item) => sum + item.value, 0)
      const max = items.length > 0 ? Math.max(...items.map(i => i.value)) : 0
      const min = items.length > 0 ? Math.min(...items.map(i => i.value)) : 0
      
      // Update percentages
      for (const item of items) {
        item.percentage = total > 0 ? (item.value / total) * 100 : 0
      }
      
      return {
        total,
        items,
        max,
        min,
        average: items.length > 0 ? total / items.length : 0,
        nodeCount: children.length,
        isEmpty: false,
      }
    } else {
      // No grouping - aggregate all values
      const values = children.map(child => extractValue(child, target_key))
      const total = aggregate(values, operation)
      
      const item: AggregatedItem = {
        label: node.title || 'Total',
        value: total,
        color: DEFAULT_COLORS[0],
        count: children.length,
        percentage: 100,
      }
      
      return {
        total,
        items: [item],
        max: total,
        min: total,
        average: total,
        nodeCount: children.length,
        isEmpty: false,
      }
    }
  }, [node, config])
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Simple sum aggregation hook for common use case
 */
export function useChildSum(
  node: Node | null | undefined,
  targetKey: string,
  groupBy?: string
): AggregatedData {
  return useChildAggregation(node, {
    target_key: targetKey,
    group_by: groupBy,
    operation: 'sum',
  })
}

/**
 * Simple count aggregation hook
 */
export function useChildCount(
  node: Node | null | undefined,
  groupBy?: string
): AggregatedData {
  return useChildAggregation(node, {
    target_key: 'id', // Any key works for count
    group_by: groupBy,
    operation: 'count',
  })
}

/**
 * Get aggregated data formatted for Recharts
 */
export function useRechartsData(
  node: Node | null | undefined,
  config: AggregationConfig
): Array<{ name: string; value: number; fill: string }> {
  const { items } = useChildAggregation(node, config)
  
  return useMemo(() => {
    return items.map(item => ({
      name: item.label,
      value: item.value,
      fill: item.color || DEFAULT_COLORS[0],
    }))
  }, [items])
}

export default useChildAggregation
