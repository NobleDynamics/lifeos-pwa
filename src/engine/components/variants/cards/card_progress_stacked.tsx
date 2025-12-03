/**
 * CardProgressStacked Variant Component
 * 
 * A progress card with multiple colored segments in one bar.
 * Shows breakdown of categories within a total budget/goal.
 * 
 * @module engine/components/variants/cards/card_progress_stacked
 */

import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { useChildAggregation, type AggregatedItem } from '../../../hooks/useChildAggregation'
import { cn } from '@/lib/utils'

/**
 * CardProgressStacked - Stacked segment progress bar
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────┐
 * │  Monthly Budget                    $2,450       │
 * │  ████████████▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░         │
 * │  ● Groceries $1,200  ● Dining $500  ● Gas $750 │
 * └─────────────────────────────────────────────────┘
 * 
 * Data Sources:
 * 1. Direct segments in metadata.segments[]
 * 2. Aggregated from children grouped by category
 * 
 * Slots:
 * - title: Card title (default: node.title)
 * - max: Maximum/budget value (number)
 * - target_key: Metadata key to sum (default: 'amount')
 * - group_by: Metadata key to group by (default: 'category')
 * - segments: Direct segment data array [{label, value, color}]
 * - show_legend: Whether to show legend (default: true)
 * - show_total: Whether to show total value (default: true)
 * - format: Display format - 'currency' | 'number' | 'percent' (default: 'currency')
 * - currency_symbol: For 'currency' format (default: '$')
 * - size: Bar height - 'sm' | 'md' | 'lg' (default: 'md')
 */
export function CardProgressStacked({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Slot-based configuration
  const title = useSlot<string>('title') ?? node.title
  const max = useSlot<number>('max', 0) // 0 means use total
  const targetKey = useSlot<string>('target_key', 'amount')
  const groupBy = useSlot<string>('group_by', 'category')
  const directSegments = useSlot<Array<{ label: string; value: number; color?: string }>>('segments')
  const showLegend = useSlot<boolean>('show_legend', true)
  const showTotal = useSlot<boolean>('show_total', true)
  const format = useSlot<'percent' | 'currency' | 'number'>('format', 'currency')
  const currencySymbol = useSlot<string>('currency_symbol', '$')
  const size = useSlot<'sm' | 'md' | 'lg'>('size', 'md')
  
  // Aggregate from children if no direct segments
  const aggregated = useChildAggregation(node, {
    target_key: targetKey,
    group_by: groupBy,
    operation: 'sum',
  })
  
  // Use direct segments or aggregated items
  const segments: AggregatedItem[] = directSegments 
    ? directSegments.map((seg, idx) => ({
        label: seg.label,
        value: seg.value,
        color: seg.color || getDefaultColor(idx),
        count: 1,
        percentage: 0,
      }))
    : aggregated.items
  
  // Calculate totals
  const total = segments.reduce((sum, seg) => sum + seg.value, 0)
  const budget = max > 0 ? max : total // If no max, use total (100%)
  const totalPercentage = budget > 0 ? Math.min((total / budget) * 100, 100) : 0
  
  // Calculate segment widths
  const segmentWidths = segments.map(seg => {
    return budget > 0 ? (seg.value / budget) * 100 : 0
  })
  
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
  
  // Size classes
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-4',
    lg: 'h-6',
  }
  
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        "bg-dark-100/80 backdrop-blur-sm",
        "border border-dark-200 hover:border-primary/30",
        "transition-colors"
      )}
      data-variant="card_progress_stacked"
      data-node-id={node.id}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-white truncate pr-2">
          {title}
        </h3>
        {showTotal && (
          <span className="text-sm font-semibold text-primary tabular-nums">
            {formatValue(total)}
            {max > 0 && (
              <span className="text-dark-400 font-normal">
                {' / '}{formatValue(max)}
              </span>
            )}
          </span>
        )}
      </div>
      
      {/* Stacked Progress Bar */}
      <div 
        className={cn(
          "relative overflow-hidden rounded-full bg-dark-300/50",
          sizeClasses[size]
        )}
      >
        <div className="absolute inset-0 flex">
          {segments.map((segment, index) => (
            <div
              key={segment.label}
              className="h-full transition-all duration-500 ease-out first:rounded-l-full last:rounded-r-full"
              style={{
                width: `${segmentWidths[index]}%`,
                backgroundColor: segment.color,
                boxShadow: `0 0 8px ${segment.color}44`,
              }}
              title={`${segment.label}: ${formatValue(segment.value)}`}
            />
          ))}
        </div>
        
        {/* Overflow indicator if over budget */}
        {total > budget && max > 0 && (
          <div 
            className="absolute right-0 top-0 bottom-0 w-1 bg-accent-red animate-pulse"
            title="Over budget!"
          />
        )}
      </div>
      
      {/* Legend */}
      {showLegend && segments.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {segments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-dark-400">
                {segment.label}
              </span>
              <span className="text-xs font-medium text-dark-300 tabular-nums">
                {formatValue(segment.value)}
              </span>
            </div>
          ))}
        </div>
      )}
      
      {/* Empty state */}
      {segments.length === 0 && (
        <div className="mt-2 text-xs text-dark-500">
          No data available
        </div>
      )}
    </div>
  )
}

/**
 * Default color palette for segments (cyberpunk theme)
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

export default CardProgressStacked
