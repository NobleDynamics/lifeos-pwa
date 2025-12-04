/**
 * CardChartPie Variant Component
 * 
 * A pie/donut chart card using Recharts.
 * Perfect for showing category breakdowns and proportions.
 * 
 * @module engine/components/variants/cards/card_chart_pie
 */

import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { PieChart as PieChartIcon } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { useSlotBasedAggregation } from '../../../hooks/useDataAggregation'
import { cn } from '@/lib/utils'

/**
 * Data point interface
 */
interface DataPoint {
  name: string
  value: number
  color?: string
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
 * CardChartPie - Pie/Donut chart visualization
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────┐
 * │  Spending Breakdown                             │
 * │  ┌─────────────────────────────────────────┐   │
 * │  │         ╭─────────╮                      │   │
 * │  │       ╱           ╲                     │   │
 * │  │      │    $2,450   │                    │   │
 * │  │      │    Total    │                    │   │
 * │  │       ╲           ╱                     │   │
 * │  │         ╰─────────╯                      │   │
 * │  └─────────────────────────────────────────┘   │
 * │  ● Groceries  ● Dining  ● Gas  ● Other         │
 * └─────────────────────────────────────────────────┘
 * 
 * Data Sources:
 * 1. Direct data in metadata.data[]
 * 2. Aggregated from children grouped by category
 * 
 * Slots:
 * - title: Card title (default: node.title)
 * - subtitle: Optional subtitle
 * - data: Direct data array [{name, value, color?}]
 * - target_key: Metadata key to sum (default: 'amount')
 * - group_by: Metadata key to group by (default: 'category')
 * - height: Chart height in pixels (default: 200)
 * - donut: Whether to render as donut (default: true)
 * - inner_radius: Inner radius for donut (default: 60)
 * - outer_radius: Outer radius (default: 80)
 * - show_legend: Whether to show legend (default: true)
 * - show_center: Whether to show center label in donut (default: true)
 * - center_label: Custom center label (default: total)
 * - format: Value format - 'currency' | 'number' | 'percent' (default: 'currency')
 * - currency_symbol: For 'currency' format (default: '$')
 * - show_labels: Whether to show labels on slices (default: false)
 */
export function CardChartPie({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Slot-based configuration
  const title = useSlot<string>('title') ?? node.title
  const subtitle = useSlot<string>('subtitle')
  const directData = useSlot<DataPoint[]>('data')
  const targetKey = useSlot<string>('target_key', 'amount')
  const groupBy = useSlot<string>('group_by', 'category')
  const height = useSlot<number>('height', 200)
  const donut = useSlot<boolean>('donut', true)
  const innerRadius = useSlot<number>('inner_radius', 60)
  const outerRadius = useSlot<number>('outer_radius', 80)
  const showLegend = useSlot<boolean>('show_legend', true)
  const showCenter = useSlot<boolean>('show_center', true)
  const centerLabel = useSlot<string>('center_label')
  const format = useSlot<'percent' | 'currency' | 'number'>('format', 'currency')
  const currencySymbol = useSlot<string>('currency_symbol', '$')
  const showLabels = useSlot<boolean>('show_labels', false)
  
  // Aggregate from source (supports source_id for sibling lookups)
  const aggregated = useSlotBasedAggregation(node, {
    target_key: targetKey,
    group_by: groupBy,
    operation: 'sum',
  })
  
  // Build chart data
  const chartData = useMemo(() => {
    if (directData && directData.length > 0) {
      return directData.map((d, idx) => ({
        name: d.name,
        value: d.value,
        color: d.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
      }))
    }
    
    return aggregated.items.map((item, idx) => ({
      name: item.label,
      value: item.value,
      color: item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
    }))
  }, [directData, aggregated.items])
  
  // Calculate total
  const total = chartData.reduce((sum, d) => sum + d.value, 0)
  
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
  
  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0
      return (
        <div className="bg-dark-100 border border-dark-300 rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-xs text-dark-400">{data.name}</span>
          </div>
          <p className="text-sm font-semibold text-white">
            {formatValue(data.value)}
          </p>
          <p className="text-xs text-dark-500">
            {percentage}% of total
          </p>
        </div>
      )
    }
    return null
  }
  
  // Custom label renderer
  const renderCustomLabel = ({ cx, cy, midAngle, outerRadius, percent, name }: any) => {
    const RADIAN = Math.PI / 180
    const radius = outerRadius + 25
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    
    if (percent < 0.05) return null // Don't show labels for small slices
    
    return (
      <text
        x={x}
        y={y}
        fill="#a1a1aa"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={10}
      >
        {name}
      </text>
    )
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
      data-variant="card_chart_pie"
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
          <PieChartIcon size={32} className="mb-2 opacity-50" />
          <p className="text-sm">No data available</p>
        </div>
      ) : (
        <div className="relative" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={donut ? innerRadius : 0}
                outerRadius={outerRadius}
                paddingAngle={2}
                dataKey="value"
                label={showLabels ? renderCustomLabel : false}
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{
                      filter: `drop-shadow(0 0 4px ${entry.color}44)`,
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Center Label for Donut */}
          {donut && showCenter && (
            <div 
              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            >
              <span className="text-lg font-bold text-white">
                {centerLabel || formatValue(total)}
              </span>
              {!centerLabel && (
                <span className="text-xs text-dark-500">Total</span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Legend */}
      {showLegend && !isEmpty && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 justify-center">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-dark-400">
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CardChartPie
