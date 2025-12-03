/**
 * CardChartRadar Variant Component
 * 
 * A radar chart card using Recharts.
 * Perfect for multi-dimensional comparisons (e.g., skills, stats).
 * 
 * @module engine/components/variants/cards/card_chart_radar
 */

import { useMemo } from 'react'
import { 
  RadarChart, 
  Radar, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis,
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts'
import { Radar as RadarIcon } from 'lucide-react'
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
  fill_opacity?: number
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
 * CardChartRadar - Radar chart visualization
 * 
 * Structure:
 * ┌─────────────────────────────────────────────────┐
 * │  Skills Overview                                │
 * │  ┌─────────────────────────────────────────┐   │
 * │  │           Strength                       │   │
 * │  │              ╱╲                          │   │
 * │  │    Agility ╱    ╲ Defense              │   │
 * │  │           ╱      ╲                      │   │
 * │  │          ╱────────╲                     │   │
 * │  │    Magic          Health               │   │
 * │  └─────────────────────────────────────────┘   │
 * │  ● Current  ● Target                           │
 * └─────────────────────────────────────────────────┘
 * 
 * Data Sources:
 * 1. Direct data in metadata.data[]
 * 2. Children nodes as dimensions
 * 
 * Slots:
 * - title: Card title (default: node.title)
 * - subtitle: Optional subtitle
 * - data: Data array [{name, value, ...otherSeries}]
 * - series: Series config array [{key, color, name, fill_opacity}]
 * - height: Chart height in pixels (default: 250)
 * - color: Fill color for single series (default: primary cyan)
 * - fill_opacity: Fill opacity for radar area (default: 0.3)
 * - show_grid: Whether to show polar grid (default: true)
 * - show_dots: Whether to show data point dots (default: true)
 * - show_legend: Whether to show legend for multi-series (default: true)
 * - max: Maximum value for scale (default: auto)
 * - format: Value format - 'number' | 'percent' (default: 'number')
 */
export function CardChartRadar({ node }: VariantComponentProps) {
  const { depth } = useNode()
  
  // Slot-based configuration
  const title = useSlot<string>('title') ?? node.title
  const subtitle = useSlot<string>('subtitle')
  const directData = useSlot<DataPoint[]>('data')
  const seriesConfig = useSlot<SeriesConfig[]>('series')
  const height = useSlot<number>('height', 250)
  const singleColor = useSlot<string>('color', '#06b6d4')
  const fillOpacity = useSlot<number>('fill_opacity', 0.3)
  const showGrid = useSlot<boolean>('show_grid', true)
  const showDots = useSlot<boolean>('show_dots', true)
  const showLegend = useSlot<boolean>('show_legend', true)
  const maxValue = useSlot<number>('max')
  const format = useSlot<'percent' | 'number'>('format', 'number')
  
  // Build chart data
  const chartData = useMemo(() => {
    if (directData && directData.length > 0) {
      return directData
    }
    
    // Try to build from children
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
        fill_opacity: s.fill_opacity ?? fillOpacity,
      }))
    }
    
    // Default to single 'value' series
    return [{ key: 'value', color: singleColor, name: 'Value', fill_opacity: fillOpacity }]
  }, [seriesConfig, singleColor, fillOpacity])
  
  // Calculate max for domain
  const calculatedMax = useMemo(() => {
    if (maxValue) return maxValue
    
    let max = 0
    for (const point of chartData) {
      for (const s of series) {
        const val = point[s.key]
        if (typeof val === 'number' && val > max) {
          max = val
        }
      }
    }
    // Round up to nice number
    return Math.ceil(max / 10) * 10 || 100
  }, [chartData, series, maxValue])
  
  // Format value for tooltip
  const formatValue = (val: number): string => {
    switch (format) {
      case 'percent':
        return `${Math.round(val)}%`
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
              <span className="text-xs text-dark-500">{entry.name}:</span>
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
  
  return (
    <div
      className={cn(
        "rounded-xl p-4",
        "bg-dark-100/80 backdrop-blur-sm",
        "border border-dark-200 hover:border-primary/30",
        "transition-colors"
      )}
      data-variant="card_chart_radar"
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
          <RadarIcon size={32} className="mb-2 opacity-50" />
          <p className="text-sm">No data available</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <RadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            {showGrid && (
              <PolarGrid 
                stroke="#27272a" 
                strokeDasharray="3 3"
              />
            )}
            
            <PolarAngleAxis 
              dataKey="name" 
              tick={{ fill: '#71717a', fontSize: 10 }}
              tickLine={false}
            />
            
            <PolarRadiusAxis 
              angle={90}
              domain={[0, calculatedMax]}
              tick={{ fill: '#52525b', fontSize: 9 }}
              tickCount={5}
              axisLine={false}
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {series.map((s) => (
              <Radar
                key={s.key}
                name={s.name}
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                fill={s.color}
                fillOpacity={s.fill_opacity}
                dot={showDots ? { fill: s.color, strokeWidth: 0, r: 3 } : false}
                activeDot={{ fill: s.color, strokeWidth: 0, r: 5 }}
                style={{
                  filter: `drop-shadow(0 0 4px ${s.color}44)`,
                }}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      )}
      
      {/* Legend for multiple series */}
      {showLegend && series.length > 1 && !isEmpty && (
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

export default CardChartRadar
