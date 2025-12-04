/**
 * CardProgressMulti Variant Component
 * 
 * A progress card with multiple individual progress bars stacked vertically.
 * Perfect for budget category breakdowns or multi-goal tracking.
 * 
 * @module engine/components/variants/cards/card_progress_multi
 */

import * as Progress from '@radix-ui/react-progress'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { useSlotBasedAggregation } from '../../../hooks/useDataAggregation'
import { cn } from '@/lib/utils'

/**
 * ProgressItem interface for direct data
 */
interface ProgressItem {
  label: string
  value: number
  max?: number
  color?: string
}

/**
 * CardProgressMulti - Multiple progress bars
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────┐
 * │  Spending by Category                           │
 * │                                                 │
 * │  Groceries          $300 / $400                 │
 * │  ████████████████████░░░░░░░░                  │
 * │                                                 │
 * │  Dining Out         $150 / $200                 │
 * │  ████████████████░░░░░░░░░░░░░                 │
 * │                                                 │
 * │  Entertainment      $80 / $150                  │
 * │  ████████████░░░░░░░░░░░░░░░░░                 │
 * └─────────────────────────────────────────────────┘
 * 
 * Data Sources:
 * 1. Direct items in metadata.items[]
 * 2. Children nodes with value/max in their metadata
 * 3. Aggregated from children grouped by category
 * 
 * Slots:
 * - title: Card title (default: node.title)
 * - items: Direct items array [{label, value, max, color}]
 * - target_key: Metadata key for value (default: 'amount')
 * - max_key: Metadata key for max (default: 'budget')
 * - group_by: Group children by this key (default: 'category')
 * - default_max: Default max value if not specified (default: 100)
 * - format: Display format - 'currency' | 'number' | 'percent' (default: 'currency')
 * - currency_symbol: For 'currency' format (default: '$')
 * - show_values: Whether to show value labels (default: true)
 * - compact: Compact spacing mode (default: false)
 * - limit: Maximum number of items to show (default: 10)
 */
export function CardProgressMulti({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Slot-based configuration
  const title = useSlot<string>('title') ?? node.title
  const directItems = useSlot<ProgressItem[]>('items')
  const targetKey = useSlot<string>('target_key', 'amount')
  const maxKey = useSlot<string>('max_key', 'budget')
  const groupBy = useSlot<string>('group_by', 'category')
  const defaultMax = useSlot<number>('default_max', 100)
  const format = useSlot<'percent' | 'currency' | 'number'>('format', 'currency')
  const currencySymbol = useSlot<string>('currency_symbol', '$')
  const showValues = useSlot<boolean>('show_values', true)
  const compact = useSlot<boolean>('compact', false)
  const limit = useSlot<number>('limit', 10)
  
  // Build items from various sources
  let items: Array<{
    label: string
    value: number
    max: number
    color: string
    percentage: number
  }> = []
  
  // Use source-agnostic aggregation (supports source_id for sibling lookups)
  const aggregated = useSlotBasedAggregation(node, {
    target_key: targetKey,
    group_by: groupBy,
    operation: 'sum',
  })
  
  if (directItems && directItems.length > 0) {
    // Use direct items from metadata
    items = directItems.map((item, idx) => {
      const itemMax = item.max ?? defaultMax
      return {
        label: item.label,
        value: item.value,
        max: itemMax,
        color: item.color || getDefaultColor(idx),
        percentage: itemMax > 0 ? Math.min((item.value / itemMax) * 100, 100) : 0,
      }
    })
  } else if (aggregated.items.length > 0) {
    // Use aggregated data (from own children or source_id sibling)
    items = aggregated.items.map((item, idx) => ({
      label: item.label,
      value: item.value,
      max: defaultMax,
      color: item.color || getDefaultColor(idx),
      percentage: defaultMax > 0 ? Math.min((item.value / defaultMax) * 100, 100) : 0,
    }))
  } else if (node.children && node.children.length > 0) {
    // Fall back: check if children have individual max values for direct use
    const childrenWithMax = node.children.filter(
      c => c.metadata[maxKey] !== undefined
    )
    
    if (childrenWithMax.length > 0) {
      // Use children directly (e.g., budget categories with individual limits)
      items = node.children.map((child, idx) => {
        const value = extractNumber(child.metadata[targetKey])
        const max = extractNumber(child.metadata[maxKey]) || defaultMax
        return {
          label: child.title,
          value,
          max,
          color: (child.metadata.color as string) || getDefaultColor(idx),
          percentage: max > 0 ? Math.min((value / max) * 100, 100) : 0,
        }
      })
    }
  }
  
  // Sort by value descending and limit
  items = items
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
  
  // Calculate total
  const total = items.reduce((sum, item) => sum + item.value, 0)
  
  // Format value for display
  const formatValue = (val: number): string => {
    switch (format) {
      case 'percent':
        return `${Math.round(val)}%`
      case 'currency':
        return `${currencySymbol}${val.toLocaleString()}`
      case 'number':
      default:
        return val.toLocaleString()
    }
  }
  
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        "bg-dark-100/80 backdrop-blur-sm",
        "border border-dark-200 hover:border-primary/30",
        "transition-colors"
      )}
      data-variant="card_progress_multi"
      data-node-id={node.id}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-sm text-white truncate pr-2">
          {title}
        </h3>
        <span className="text-xs text-dark-400">
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      
      {/* Progress Items */}
      {items.length > 0 ? (
        <div className={cn("space-y-4", compact && "space-y-3")}>
          {items.map((item) => (
            <div key={item.label}>
              {/* Item Header */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className={cn(
                    "text-sm text-dark-300 truncate",
                    compact && "text-xs"
                  )}>
                    {item.label}
                  </span>
                </div>
                {showValues && (
                  <span className={cn(
                    "text-sm font-medium tabular-nums ml-2 flex-shrink-0",
                    item.percentage >= 100 ? "text-accent-red" : "text-dark-300",
                    compact && "text-xs"
                  )}>
                    {formatValue(item.value)}
                    <span className="text-dark-500 font-normal">
                      {' / '}{formatValue(item.max)}
                    </span>
                  </span>
                )}
              </div>
              
              {/* Progress Bar */}
              <Progress.Root
                className={cn(
                  "relative overflow-hidden rounded-full bg-dark-300/50",
                  compact ? "h-1.5" : "h-2"
                )}
                value={item.percentage}
              >
                <Progress.Indicator
                  className={cn(
                    "h-full transition-all duration-500 ease-out rounded-full",
                    item.percentage >= 100 && "animate-pulse"
                  )}
                  style={{
                    width: `${item.percentage}%`,
                    backgroundColor: item.percentage >= 100 ? '#ef4444' : item.color,
                    boxShadow: `0 0 8px ${item.percentage >= 100 ? '#ef444444' : item.color + '44'}`,
                  }}
                />
              </Progress.Root>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-4 text-center text-dark-500 text-sm">
          No data available
        </div>
      )}
      
      {/* Total Footer */}
      {items.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dark-300/30 flex items-center justify-between">
          <span className="text-xs text-dark-500">Total</span>
          <span className="text-sm font-semibold text-primary tabular-nums">
            {formatValue(total)}
          </span>
        </div>
      )}
    </div>
  )
}

/**
 * Extract numeric value from unknown metadata
 */
function extractNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

/**
 * Default color palette (cyberpunk theme)
 */
function getDefaultColor(index: number): string {
  const colors = [
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#a855f7', // purple
    '#22c55e', // green
    '#eab308', // yellow
    '#f97316', // orange
    '#3b82f6', // blue
    '#ef4444', // red
  ]
  return colors[index % colors.length]
}

export default CardProgressMulti
