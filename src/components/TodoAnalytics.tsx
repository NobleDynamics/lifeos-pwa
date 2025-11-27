import { useMemo } from 'react'
import { useCategories, useAllLists, useAllItems } from '@/hooks/useTodoData'
import { useTodoUI } from '@/store/useTodoStore'
import { TrendingUp, TrendingDown, Activity, CheckCircle, Target, List } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TodoAnalyticsProps {
  accentColor?: string
  chartColors?: string[]
}

export function TodoAnalytics({ accentColor = '#00EAFF', chartColors = ['#00EAFF', '#00D4FF', '#00BFFF', '#0099FF', '#0077FF', '#0055FF'] }: TodoAnalyticsProps) {
  const { showAnalytics } = useTodoUI()
  
  // Use TanStack Query hooks
  const { data: categories = [], isLoading: categoriesLoading } = useCategories()
  const { data: allLists = [], isLoading: listsLoading } = useAllLists()
  const { data: allItems = [], isLoading: itemsLoading } = useAllItems()

  const loading = categoriesLoading || listsLoading || itemsLoading

  // Calculate summary stats
  const stats = useMemo(() => {
    const totalCategories = categories.length
    const totalLists = allLists.length
    const totalItems = allItems.length
    const completedItems = allItems.filter(item => item.status === 'completed').length
    const inProgressItems = allItems.filter(item => item.status === 'in_progress' || item.status === 'started').length
    const notStartedItems = allItems.filter(item => item.status === 'not_started').length
    const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

    return {
      totalCategories,
      totalLists,
      totalItems,
      completedItems,
      inProgressItems,
      notStartedItems,
      completionRate
    }
  }, [categories, allLists, allItems])

  if (!showAnalytics) return null

  if (loading) {
    return (
      <div className="bg-dark-100 rounded-lg border border-dark-300 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-dark-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-dark-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Categories"
          value={stats.totalCategories}
          icon={<Target className="w-5 h-5" />}
          color={chartColors[0]}
        />
        <StatCard
          label="Lists"
          value={stats.totalLists}
          icon={<List className="w-5 h-5" />}
          color={chartColors[1]}
        />
        <StatCard
          label="Total Items"
          value={stats.totalItems}
          icon={<Activity className="w-5 h-5" />}
          color={chartColors[2]}
        />
        <StatCard
          label="Completed"
          value={stats.completedItems}
          icon={<CheckCircle className="w-5 h-5" />}
          color="#10B981"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-dark-100 rounded-lg border border-dark-300 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-dark-400">Completion Rate</span>
          <div className="flex items-center gap-1">
            {stats.completionRate >= 50 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-orange-500" />
            )}
            <span className="text-sm font-bold text-white">{stats.completionRate.toFixed(1)}%</span>
          </div>
        </div>
        <div className="w-full h-3 bg-dark-200 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${stats.completionRate}%`,
              backgroundColor: stats.completionRate >= 50 ? '#10B981' : accentColor
            }}
          />
        </div>
        
        {/* Status breakdown */}
        <div className="flex items-center justify-between mt-3 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-dark-400" />
            <span className="text-dark-500">Not Started: {stats.notStartedItems}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-dark-500">In Progress: {stats.inProgressItems}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-dark-500">Completed: {stats.completedItems}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  color: string
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-dark-100 rounded-lg border border-dark-300 p-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-dark-500">{label}</p>
          <p className="text-xl font-bold text-white">{value}</p>
        </div>
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: color + '20' }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
      </div>
    </div>
  )
}
