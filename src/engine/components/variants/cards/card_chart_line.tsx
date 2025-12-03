/**
 * CardChartLine Variant Component
 * 
 * A line chart card using Recharts.
 * Perfect for showing trends over time.
 * 
 * @module engine/components/variants/cards/card_chart_line
 */

import { useMemo } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts'
import { TrendingUp } from 'lucide-react'
import type { VariantComponentProps } from '../../../registry'
import { useNode } from '../../../context/NodeContext'
import { useSlot } from '../../../hooks/useSlot'
import { cn } from '@/lib/utils'

/**
 * Data point interface
 */
interface DataPoint {
  name: string
  value: number
  [key: string]: string | number // Allow additional series
}

/**
 * Series configuration
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
]

/**
 * CardChartLine - Line chart visualization
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────┐
 * │  Spending Trend                                 │
 * │  ┌─────────────────────────────────────────┐   │
 * │  │         ╭──╮                             │   │
 * │  │    ╭───╯    ╰──╮    ╭──╮               │   │
 * │  │   ╯            ╰───╯    ╰──╮           │   │
 * │  │                             ╰───       │   │
 * │  │   Jan  Feb  Mar  Apr  May  Jun         │   │
 * │  └─────────────────────────────────────────┘   │
 * └─────────────────────────────────────────────────┘
 * 
 * Slots:
 * - title: Card title (default: node.title)
 * - subtitle: Optional subtitle
 * - data: Data array [{name, value, ...otherSeries}]
 * - series: Series config array [{key, color, name}] (default: single 'value' series)
 * - height: Chart height in pixels (default: 200)
 * - color: Line color for single series (default: primary cyan)
 * - show_grid: Whether to show grid lines (default: true)
 * - show_area: Whether to fill area under line (default: true)
 * - curved: Whether to use curved lines (default: true)
 * - show_dots: Whether to show data point dots (default: false)
 * - format: Value format - 'currency' | 'number' | 'percent' (default: 'number')
 * - currency_symbol: For 'currency' format (default: '$')
 */
export function CardChartLine({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Slot-based configuration
  const title = useSlot<string>('title') ?? node.title
  const subtitle = useSlot<string>('subtitle')
  const directData = useSlot<DataPoint[]>('data')
  const seriesConfig = useSlot<SeriesConfig[]>('series')
  const height = useSlot<number>('height', 200)
  const singleColor = useSlot<string>('color', '#06b6d4')
  const showGrid = useSlot<boolean>('show_grid', true)
  const showArea = useSlot<boolean>('show_area', true)
  const curved = useSlot<boolean>('curved', true)
  const showDots = useSlot<boolean>('show_dots', false)
  const format = useSlot<'percent' | 'currency' | 'number'>('format', 'number')
  const currencySymbol = useSlot<string>('currency_symbol', '$')
  
  // Build chart data
  const chartData = useMemo(() => {
    if (directData && directData.length > 0) {
      return directData
    }
    
    // Try to build from children (using title as name, value from metadata)
    if (node.children && node.children.length > 0) {
      return node.children.map(child => ({
        name: child.title,
        value: extractNumber(child.metadata.value ?? child.metadata.amount ?? 0),
      }))
    }
    
    return []
  }, [directData, node.children])
  
  // Determine series to render
  const series: SeriesConfig[] = useMemo(() => {
    if (seriesConfig && seriesConfig.length > 0) {
      return seriesConfig.map((s, idx) => ({
        key: s.key,
        color: s.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
        name: s.name || s.key,
      }))
    }
    
    // Default to single 'value' series
    return [{ key: 'value', color: singleColor, name: 'Value' }]
  }, [seriesConfig, singleColor])
  
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
          <p className="text-xs text-dark-400 mb-1">{label}</p>
          {payload.map((entry: any, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-semibold text-white">
                {formatValue(entry.value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }
  
  const isEmpty = chartData.length === 0
  
  // Use AreaChart if showing area, LineChart otherwise
  const ChartComponent = showArea ? AreaChart : LineChart
  const DataComponent = showArea ? Area : Line
  
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        "bg-dark-100/80 backdrop-blur-sm",
        "border border-dark-200 hover:border-primary/30",
        "transition-colors"
      )}
      data-variant="card_chart_line"
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
          <TrendingUp size={32} className="mb-2 opacity-50" />
          <p className="text-sm">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <ChartComponent
            data={chartData}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            {/* Gradient definitions for area fill */}
            <defs>
              {series.map((s, idx) => (
                <linearGradient key={s.key} id={`gradient-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#27272a" 
                vertical={false}
              />
            )}
            
            <XAxis 
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickFormatter={(v) => formatValue(v)}
              width={50}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {series.map((s) => (
              showArea ? (
                <Area
                  key={s.key}
                  type={curved ? 'monotone' : 'linear'}
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  fill={`url(#gradient-${s.key})`}
                  dot={showDots ? { fill: s.color, strokeWidth: 0, r: 3 } : false}
                  activeDot={{ fill: s.color, strokeWidth: 0, r: 5 }}
                  style={{
                    filter: `drop-shadow(0 0 4px ${s.color}66)`,
                  }}
                />
              ) : (
                <Line
                  key={s.key}
                  type={curved ? 'monotone' : 'linear'}
                  dataKey={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={showDots ? { fill: s.color, strokeWidth: 0, r: 3 } : false}
                  activeDot={{ fill: s.color, strokeWidth: 0, r: 5 }}
                  style={{
                    filter: `drop-shadow(0 0 4px ${s.color}66)`,
                  }}
                />
              )
            ))}
          </ChartComponent>
        </ResponsiveContainer>
      )}
      
      {/* Legend for multiple series */}
      {series.length > 1 && !isEmpty && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 justify-center">
          {series.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5">
              <div 
                className="w-2 h-2 rounded-full"
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

/**
 * Extract numeric value from unknown type
 */
function extractNumber(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : parsed
  }
  return 0
}

export default CardChartLine
