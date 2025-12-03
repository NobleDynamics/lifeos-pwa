/**
 * CardProgressSimple Variant Component
 * 
 * A simple progress card with a single large progress bar.
 * Shows current value, max value, and percentage.
 * 
 * @module engine/components/variants/cards/card_progress_simple
 */

import * as Progress from '@radix-ui/react-progress'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { useChildAggregation } from '../../../hooks/useChildAggregation'
import { cn } from '@/lib/utils'

/**
 * CardProgressSimple - Single progress bar card
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────┐
 * │  Title                              75%         │
 * │  ████████████████░░░░░░░░░░░░░░░░░░░░░         │
 * │  $750 of $1,000                                 │
 * └─────────────────────────────────────────────────┘
 * 
 * Data Sources (priority order):
 * 1. Direct metadata: value, max
 * 2. Aggregated from children using target_key
 * 
 * Slots:
 * - title: Card title (default: node.title)
 * - value: Current value (number)
 * - max: Maximum value (number, default: 100)
 * - target_key: If using children, the metadata key to sum (e.g., 'amount')
 * - color: Progress bar color (default: primary cyan)
 * - format: Display format - 'percent' | 'currency' | 'number' (default: 'number')
 * - currency_symbol: For 'currency' format (default: '$')
 * - show_label: Whether to show the label below bar (default: true)
 * - size: Progress bar size - 'sm' | 'md' | 'lg' (default: 'md')
 */
export function CardProgressSimple({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Slot-based configuration
  const title = useSlot<string>('title') ?? node.title
  const directValue = useSlot<number>('value')
  const max = useSlot<number>('max', 100)
  const targetKey = useSlot<string>('target_key', 'amount')
  const color = useSlot<string>('color', '#06b6d4')
  const format = useSlot<'percent' | 'currency' | 'number'>('format', 'number')
  const currencySymbol = useSlot<string>('currency_symbol', '$')
  const showLabel = useSlot<boolean>('show_label', true)
  const size = useSlot<'sm' | 'md' | 'lg'>('size', 'md')
  
  // Aggregate from children if no direct value
  const aggregated = useChildAggregation(node, {
    target_key: targetKey,
    operation: 'sum',
  })
  
  // Use direct value or aggregated total
  const value = directValue ?? aggregated.total
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0
  
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
    md: 'h-3',
    lg: 'h-4',
  }
  
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        "bg-dark-100/80 backdrop-blur-sm",
        "border border-dark-200",
        "hover:border-opacity-50 transition-colors"
      )}
      style={{
        borderColor: `${color}33`,
      }}
      data-variant="card_progress_simple"
      data-node-id={node.id}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-sm text-white truncate pr-2">
          {title}
        </h3>
        <span 
          className="text-sm font-semibold tabular-nums"
          style={{ color }}
        >
          {Math.round(percentage)}%
        </span>
      </div>
      
      {/* Progress Bar */}
      <Progress.Root
        className={cn(
          "relative overflow-hidden rounded-full bg-dark-300/50",
          sizeClasses[size]
        )}
        value={percentage}
      >
        <Progress.Indicator
          className="h-full transition-all duration-500 ease-out rounded-full"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}66`,
          }}
        />
      </Progress.Root>
      
      {/* Label */}
      {showLabel && (
        <div className="mt-2 text-xs text-dark-400">
          {formatValue(value)} of {formatValue(max)}
        </div>
      )}
    </div>
  )
}

export default CardProgressSimple
