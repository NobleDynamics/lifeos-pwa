/**
 * CardChartBar Variant Component
 * 
 * A bar chart card using Recharts.
 * Supports both direct data and aggregated data from children.
 * Supports stacked bars for multi-series data.
 * 
 * @module engine/components/variants/cards/card_chart_bar
 */

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { BarChart3 } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { useChildAggregation } from '../../../hooks/useChildAggregation'
import { cn } from '@/lib/utils'

/**
 * Data point interface for single series
 */
interface DataPoint {
  name: string
  value: number
  color?: string
}

/**
 * Data point interface for stacked series
 */
interface StackedDataPoint {
  name: string
  [key: string]: string | number
}

/**
 * Series configuration for stacked bars
 */
interface SeriesConfig {
  key: string
  color?: string
  name?: string
}

/**
 * Default color palette (cyberpunk theme)
 */
const DEFAULT_COLORS = [
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#a855f7', // purple
  '#22c55e', // green
  '#eab308', // yellow
  '#f97316', // orange
  '#3b82f6', // blue
  '#ef4444', // red
]

/**
 * CardChartBar - Bar chart visualization
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────┐
 * │  Monthly Spending                               │
 * │  ┌─────────────────────────────────────────┐   │
 * │  │    █                                     │   │
 * │  │    █    █                               │   │
 * │  │    █    █         █                     │   │
 * │  │    █    █    █    █    █               │   │
 * │  │   Jan  Feb  Mar  Apr  May              │   │
 * │  └─────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────┘
 * 
 * Data Sources:
 * 1. Direct data in metadata.data[]
 * 2. Aggregated from children grouped by category
 * 
 * Slots:
 * - title: Card title (default: node.title)
 * - subtitle: Optional subtitle
 * - data: Direct data array [{name, value, color?}] or stacked [{name, series1, series2, ...}]
 * - series: Series config for stacked bars [{key, color, name}]
 * - stacked: Enable stacked bar mode (default: false)
 * - target_key: Metadata key to sum (default: 'amount')
 * - group_by: Metadata key to group by (default: 'category')
 * - height: Chart height in pixels (default: 200)
 * - color: Single bar color if not using per-bar colors (default: primary)
 * - show_grid: Whether to show grid lines (default: false)
 * - horizontal: Whether to render horizontally (default: false)
 * - format: Value format - 'currency' | 'number' | 'percent' (default: 'number')
 * - currency_symbol: For 'currency' format (default: '$')
 * - show_legend: Show legend for stacked bars (default: true when stacked)
 */
export function CardChartBar({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Slot-based configuration
  const title = useSlot<string>('title') ?? node.title
  const subtitle = useSlot<string>('subtitle')
  const directData = useSlot<DataPoint[] | StackedDataPoint[]>('data')
  const seriesConfig = useSlot<SeriesConfig[]>('series')
  const stacked = useSlot<boolean>('stacked', false)
  const targetKey = useSlot<string>('target_key', 'amount')
  const groupBy = useSlot<string>('group_by', 'category')
  const height = useSlot<number>('height', 200)
  const singleColor = useSlot<string>('color', '#06b6d4')
  const showGrid = useSlot<boolean>('show_grid', false)
  const horizontal = useSlot<boolean>('horizontal', false)
  const format = useSlot<'percent' | 'currency' | 'number'>('format', 'number')
  const currencySymbol = useSlot<string>('currency_symbol', '$')
  const showLegend = useSlot<boolean>('show_legend', stacked)
  
  // Aggregate from children if no direct data
  const aggregated = useChildAggregation(node, {
    target_key: targetKey,
    group_by: groupBy,
    operation: 'sum',
  })
  
  // Determine series to render (for stacked mode)
  const series: SeriesConfig[] = useMemo(() => {
    if (stacked && seriesConfig && seriesConfig.length > 0) {
      return seriesConfig.map((s, idx) => ({
        key: s.key,
        color: s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        name: s.name || s.key,
      }))
    }
    return [{ key: 'value', color: singleColor, name: 'Value' }]
  }, [stacked, seriesConfig, singleColor])

  // Build chart data
  const chartData = useMemo(() => {
    if (directData && directData.length > 0) {
      // For stacked mode, return data as-is (it should have multiple series keys)
      if (stacked) {
        return directData
      }
      // For single series mode
      return directData.map((d, idx) => ({
        name: d.name,
        value: (d as DataPoint).value,
        color: (d as DataPoint).color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      }))
    }
    
    return aggregated.items.map((item, idx) => ({
      name: item.label,
      value: item.value,
      color: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    }))
  }, [directData, aggregated.items, stacked])
  
  // Format value for tooltip
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
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-100 border border-dark-300 rounded-lg px-3 py-2 shadow-lg">
          <p className="text-xs text-dark-400">{label}</p>
          <p className="text-sm font-semibold text-white">
            {formatValue(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }
  
  const isEmpty = chartData.length === 0
  
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        "bg-dark-100/80 backdrop-blur-sm",
        "border border-dark-200 hover:border-primary/30",
        "transition-colors"
      )}
      data-variant="card_chart_bar"
      data-node-id={node.id}
    >
      {/* Header */}
      <div className="mb-4">
        <h3 className="font-medium text-sm text-white truncate">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs text-dark-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Chart */}
      {isEmpty ? (
        <div 
          className="flex flex-col items-center justify-center text-dark-500"
          style={{ height }}
        >
          <BarChart3 size={32} className="mb-2 opacity-50" />
          <p className="text-sm">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={chartData}
            layout={horizontal ? 'vertical' : 'horizontal'}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            {showGrid && (
              <defs>
                <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#27272a" strokeWidth="0.5" />
                </pattern>
              </defs>
            )}
            
            {horizontal ? (
              <>
                <XAxis 
                  type="number"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  tickFormatter={(v) => formatValue(v)}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  width={80}
                />
              </>
            ) : (
              <>
                <XAxis 
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  interval={0}
                  angle={chartData.length > 6 ? -45 : 0}
                  textAnchor={chartData.length > 6 ? 'end' : 'middle'}
                  height={chartData.length > 6 ? 60 : 30}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#71717a', fontSize: 10 }}
                  tickFormatter={(v) => formatValue(v)}
                  width={50}
                />
              </>
            )}
            
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6, 182, 212, 0.1)' }} />
            
            {/* Render stacked bars or single bar */}
            {stacked && series.length > 1 ? (
              // Stacked bars - render multiple Bar components
              series.map((s, idx) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  stackId="stack"
                  fill={s.color}
                  stroke="none"
                  radius={idx === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={50}
                  style={{
                    filter: `drop-shadow(0 0 4px ${s.color}44)`,
                    outline: 'none',
                  }}
                />
              ))
            ) : (
              // Single bar with cells
              <Bar 
                dataKey="value" 
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
              >
                {chartData.map((entry: any, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || singleColor}
                    stroke="none"
                    style={{
                      filter: `drop-shadow(0 0 6px ${entry.color || singleColor}44)`,
                      outline: 'none',
                    }}
                  />
                ))}
              </Bar>
            )}
            
            {/* Legend for stacked bars */}
            {showLegend && stacked && series.length > 1 && (
              <Legend 
                wrapperStyle={{ fontSize: 10 }}
                formatter={(value: string) => {
                  const s = series.find(ser => ser.key === value)
                  return <span style={{ color: '#a1a1aa' }}>{s?.name || value}</span>
                }}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {/* Custom Legend (outside chart for better styling) */}
      {showLegend && stacked && series.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 justify-center">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-xs text-dark-400">
                {s.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CardChartBar
