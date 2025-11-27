import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { useTodoData } from '@/hooks/useTodoData'
import { useTodoUI } from '@/store/useTodoStore'
import { format, subDays } from 'date-fns'
import { TrendingUp, TrendingDown, Activity, CheckCircle, Target } from 'lucide-react'

interface TodoAnalyticsProps {
  accentColor?: string
  chartColors?: string[]
}

export function TodoAnalytics({ accentColor = '#00EAFF', chartColors = ['#00EAFF', '#00D4FF', '#00BFFF', '#0099FF', '#0077FF', '#0055FF'] }: TodoAnalyticsProps) {
  const { analytics, fetchAnalytics, fetchPieData } = useTodoData()
  const { showAnalytics } = useTodoUI()
  const [dateRange] = useState({ start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchAnalytics(dateRange.start, dateRange.end),
        fetchPieData()
      ])
      setLoading(false)
    }
    loadData()
  }, [dateRange.start, dateRange.end, fetchAnalytics, fetchPieData])

  if (!showAnalytics) return null

  // Calculate summary stats
  const totalLists = analytics.reduce((sum, day) => sum + day.lists_created, 0)
  const totalItems = analytics.reduce((sum, day) => sum + day.items_created, 0)
  const completedItems = analytics.reduce((sum, day) => sum + day.items_completed, 0)
  const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  // Prepare line chart data
  const lineChartData = analytics.map(day => ({
    date: format(new Date(day.date), 'MMM dd'),
    lists: day.lists_created,
    items: day.items_created,
    completed: day.items_completed
  }))

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Lists</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalLists}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalItems}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completedItems}</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{completionRate.toFixed(1)}%</p>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              {completionRate >= 50 ? (
                <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Line Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Activity Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="lists" stroke={chartColors[0]} strokeWidth={2} name="Lists Created" />
            <Line type="monotone" dataKey="items" stroke={chartColors[1]} strokeWidth={2} name="Items Created" />
            <Line type="monotone" dataKey="completed" stroke={chartColors[2]} strokeWidth={2} name="Items Completed" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
