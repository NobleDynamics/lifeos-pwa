/**
 * CardStatHero Variant Component
 * 
 * A minimalist hero metric card with large centered number,
 * bottom label, and optional trend indicator.
 * 
 * Supports both direct metadata and child aggregation.
 * 
 * @module engine/components/variants/cards/card_stat_hero
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { useChildAggregation, type AggregationConfig } from '../../../hooks/useChildAggregation'
import { cn } from '@/lib/utils'

/**
 * Format a numeric value based on format type
 */
function formatValue(value: number, format?: string): string {
  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case 'percent':
      return `${Math.round(value)}%`
    case 'compact':
      return new Intl.NumberFormat('en-US', {
        notation: 'compact',
        compactDisplay: 'short',
      }).format(value)
    case 'decimal':
      return value.toFixed(1)
    default:
      return new Intl.NumberFormat('en-US').format(Math.round(value))
  }
}

/**
 * CardStatHero - Minimalist hero metric card.
 * 
 * Structure:
 * ┌───────────────────────────┐
 * │                      ↑ +5%│  ← Trend indicator (top-right)
 * │                           │
 * │        $12,450            │  ← Large centered value
 * │                           │
 * │      Total Revenue        │  ← Label (bottom-center)
 * └───────────────────────────┘
 * 
 * Data Sources (in precedence order):
 * 1. Direct metadata: value, label, trend, trend_direction
 * 2. Child aggregation via aggregation config
 * 
 * Slots:
 * - value: The numeric value to display
 * - label: Description text below the value
 * - format: Value format ('currency', 'percent', 'compact', 'number')
 * - trend: Trend percentage (e.g., 5 for +5%)
 * - trend_direction: 'up' | 'down' | 'flat' (auto-detected from trend if not set)
 * - color: Accent color (default: cyan)
 * 
 * Aggregation Config (optional, via metadata.aggregation):
 * - target_key: Key to aggregate from children
 * - operation: 'sum' | 'count' | 'average' | 'max' | 'min'
 */
export function CardStatHero({ node }: VariantComponentProps) {
  const { rootNode } = useNode()

  // Slot-based data access
  const directValue = useSlot<number>('value')
  const label = useSlot<string>('label') ?? node.title
  const format = useSlot<string>('format', 'number')
  const trend = useSlot<number>('trend')
  const trendDirection = useSlot<'up' | 'down' | 'flat'>('trend_direction')
  const color = useSlot<string>('color', '#06b6d4')
  
  // Check for aggregation config
  const aggregationConfig = useSlot<AggregationConfig>('aggregation')
  
  // Use aggregation if configured and no direct value
  const aggregatedData = useChildAggregation(
    aggregationConfig ? node : null,
    aggregationConfig ?? { target_key: 'value', operation: 'sum' }
  )
  
  // Determine final value (direct takes precedence)
  const value = directValue ?? (aggregationConfig ? aggregatedData.total : 0)
  
  // Determine trend direction
  const computedTrendDirection = trendDirection ?? (
    trend !== undefined 
      ? (trend > 0 ? 'up' : trend < 0 ? 'down' : 'flat')
      : undefined
  )
  
  // Trend icon and color
  const TrendIcon = computedTrendDirection === 'up' 
    ? TrendingUp 
    : computedTrendDirection === 'down' 
      ? TrendingDown 
      : Minus
  
  const trendColor = computedTrendDirection === 'up' 
    ? 'text-green-400' 
    : computedTrendDirection === 'down' 
      ? 'text-red-400' 
      : 'text-dark-400'

  return (
    <div
      className={cn(
        "relative rounded-xl p-4",
        "bg-dark-100/80 backdrop-blur-sm",
        "border border-dark-200 hover:border-cyan-500/30",
        "transition-all duration-200",
        "flex flex-col items-center justify-center",
        "min-h-[120px]"
      )}
      style={{
        borderColor: color ? `${color}22` : undefined,
      }}
      data-variant="card_stat_hero"
      data-node-id={node.id}
    >
      {/* Trend Indicator (Top Right) */}
      {trend !== undefined && (
        <div className={cn(
          "absolute top-3 right-3",
          "flex items-center gap-1",
          "text-xs font-medium",
          trendColor
        )}>
          <TrendIcon size={14} strokeWidth={2} />
          <span>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        </div>
      )}
      
      {/* Large Centered Value */}
      <div 
        className="text-3xl font-bold tracking-tight text-white"
        style={{ color }}
      >
        {formatValue(value, format)}
      </div>
      
      {/* Label (Bottom Center) */}
      {label && (
        <div className="mt-2 text-xs text-dark-400 text-center">
          {label}
        </div>
      )}
      
      {/* Aggregation source indicator (dev hint) */}
      {aggregationConfig && !directValue && aggregatedData.nodeCount > 0 && (
        <div className="absolute bottom-2 left-2 text-[10px] text-dark-500">
          Σ {aggregatedData.nodeCount}
        </div>
      )}
    </div>
  )
}
