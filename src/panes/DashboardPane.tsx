import { motion } from 'framer-motion'
import { 
  Cloud, 
  Footprints, 
  Flame, 
  Droplets, 
  Moon,
  Mic,
  Paperclip,
  GripHorizontal,
  Activity
} from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

// Mock weather data
const mockWeather = {
  temp: 72,
  condition: 'Partly Cloudy',
  location: 'Denver, CO',
  icon: Cloud
}

// Mock health metrics
const mockHealthMetrics = {
  steps: { current: 7842, goal: 10000, history: [6500, 8200, 7100, 9500, 6800, 7200, 7842] },
  calories: { current: 1850, goal: 2200 },
  water: { current: 6, goal: 8 }, // glasses
  sleep: { hours: 7.2, score: 82 },
}

// Mock agent activity
const mockAgentTasks = [
  { id: '1', title: 'Analyzing meal photo...', status: 'running' as const, timestamp: '2m ago' },
  { id: '2', title: 'Budget report generated', status: 'completed' as const, timestamp: '15m ago' },
  { id: '3', title: 'Recipe suggestion ready', status: 'needing-input' as const, timestamp: '1h ago' },
  { id: '4', title: 'Sync error with calendar', status: 'failed' as const, timestamp: '2h ago' },
  { id: '5', title: 'Workout logged', status: 'completed' as const, timestamp: '3h ago' },
]

// Status colors for traffic light system
const statusConfig: Record<string, { color: string; label: string; pulse?: boolean }> = {
  running: { color: 'bg-accent-green', label: 'Running', pulse: true },
  completed: { color: 'bg-accent-blue', label: 'Done' },
  'needing-input': { color: 'bg-accent-yellow', label: 'Action Needed' },
  failed: { color: 'bg-accent-red', label: 'Failed' },
}

// Health metric display config
const metricConfig = {
  steps: { icon: Footprints, label: 'Steps', format: (v: number) => v.toLocaleString() },
  calories: { icon: Flame, label: 'Calories', format: (v: number) => `${v} kcal` },
  water: { icon: Droplets, label: 'Water', format: (v: number) => `${v} glasses` },
  sleep: { icon: Moon, label: 'Sleep', format: (v: number) => `${v}h` },
}

function HealthMetricsCard() {
  const { activeHealthMetric, cycleHealthMetric } = useAppStore()
  
  const metric = mockHealthMetrics[activeHealthMetric] as { current: number; goal: number }
  const config = metricConfig[activeHealthMetric]
  const Icon = config.icon
  
  // Calculate percentage
  const percentage = activeHealthMetric === 'sleep' 
    ? mockHealthMetrics.sleep.score
    : Math.min(100, Math.round((metric.current / metric.goal) * 100))
  
  // Create bar chart for steps history
  const maxHistory = Math.max(...mockHealthMetrics.steps.history)
  
  return (
    <motion.div 
      className="glass-card p-4 h-full flex flex-col cursor-pointer relative overflow-hidden"
      onClick={cycleHealthMetric}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background gradient based on metric */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute inset-0 bg-gradient-to-br ${
          activeHealthMetric === 'steps' ? 'from-green-500' :
          activeHealthMetric === 'calories' ? 'from-orange-500' :
          activeHealthMetric === 'water' ? 'from-blue-500' :
          'from-purple-500'
        } to-transparent`} />
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={18} className="text-primary" />
            <span className="text-sm font-medium">{config.label}</span>
          </div>
        <span className="text-2xl font-bold">
            {activeHealthMetric === 'sleep' 
              ? config.format(mockHealthMetrics.sleep.hours) 
              : config.format((metric as { current: number }).current)}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-dark-300 rounded-full overflow-hidden mb-2">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              activeHealthMetric === 'steps' ? 'bg-accent-green' :
              activeHealthMetric === 'calories' ? 'bg-accent-yellow' :
              activeHealthMetric === 'water' ? 'bg-accent-blue' :
              'bg-purple-400'
            }`}
          />
        </div>
        
        {/* Goal / Score */}
        <p className="text-xs text-dark-500 mb-3">
          {activeHealthMetric === 'sleep' 
            ? `Sleep score: ${mockHealthMetrics.sleep.score}%`
            : `Goal: ${config.format((metric as { goal: number }).goal)} (${percentage}%)`}
        </p>
        
        {/* Mini bar chart for steps */}
        {activeHealthMetric === 'steps' && (
          <div className="flex-1 flex items-end gap-1">
            {mockHealthMetrics.steps.history.map((val, i) => (
              <div 
                key={i}
                className="flex-1 bg-primary/30 rounded-t"
                style={{ height: `${(val / maxHistory) * 100}%` }}
              />
            ))}
          </div>
        )}
        
        {/* Rings for other metrics */}
        {activeHealthMetric !== 'steps' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full progress-ring" viewBox="0 0 36 36">
                <circle
                  className="fill-none stroke-dark-300"
                  cx="18" cy="18" r="15.9"
                  strokeWidth="3"
                />
                <circle
                  className={`fill-none ${
                    activeHealthMetric === 'calories' ? 'stroke-accent-yellow' :
                    activeHealthMetric === 'water' ? 'stroke-accent-blue' :
                    'stroke-purple-400'
                  }`}
                  cx="18" cy="18" r="15.9"
                  strokeWidth="3"
                  strokeDasharray={`${percentage}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold">{percentage}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tap hint */}
      <p className="text-[10px] text-dark-500/60 text-center mt-2">Tap to switch</p>
    </motion.div>
  )
}

function AgentLogCard() {
  return (
    <div className="glass-card p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={16} className="text-primary" />
        <span className="text-sm font-medium">Agent Activity</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
        {mockAgentTasks.map((task) => {
          const status = statusConfig[task.status]
          return (
            <div 
              key={task.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-dark-100/50"
            >
              <div className="pt-0.5">
                <div className={`w-2 h-2 rounded-full ${status.color} ${status.pulse ? 'animate-pulse' : ''}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">{task.title}</p>
                <p className="text-[10px] text-dark-500">{task.timestamp}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function DashboardPane() {
  const { openDrawer } = useAppStore()
  const now = new Date()
  const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const WeatherIcon = mockWeather.icon
  
  return (
    <div className="h-full flex flex-col bg-dark relative">
      {/* Header: Weather + Clock */}
      <div className="px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center justify-between">
          {/* Weather */}
          <div className="flex items-center gap-2">
            <WeatherIcon size={24} className="text-primary" />
            <div>
              <p className="text-lg font-bold">{mockWeather.temp}°F</p>
              <p className="text-xs text-dark-500">{mockWeather.condition}</p>
            </div>
          </div>
          
          {/* Digital Clock */}
          <div className="text-right">
            <p className="text-2xl font-bold tracking-wider font-mono">{timeString}</p>
            <p className="text-xs text-dark-500">
              {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
      
      {/* Main Stage: Split Row Layout (55% / 45%) */}
      <div className="flex-1 p-4 pt-2">
        <div className="h-full flex gap-3">
          {/* Left Card: Health Metrics (55%) */}
          <div className="w-[55%]">
            <HealthMetricsCard />
          </div>
          
          {/* Right Card: Agent Log (45%) */}
          <div className="w-[45%]">
            <AgentLogCard />
          </div>
        </div>
      </div>
      
      {/* Floating Action Buttons */}
      <div className="absolute bottom-20 right-4 flex flex-col gap-3">
        {/* Voice Waveform Button */}
        <motion.button 
          className="w-14 h-14 rounded-full bg-primary shadow-glow flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Mic size={24} className="text-dark" />
        </motion.button>
        
        {/* File Upload Button */}
        <motion.button 
          className="w-12 h-12 rounded-full bg-dark-200 border border-dark-300 flex items-center justify-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Paperclip size={20} className="text-dark-500" />
        </motion.button>
      </div>
      
      {/* Drawer Handle */}
      <div 
        className="py-3 flex justify-center cursor-pointer hover:bg-dark-100 transition-colors"
        onClick={openDrawer}
      >
        <div className="flex flex-col items-center gap-1">
          <GripHorizontal size={20} className="text-dark-400" />
          <div className="w-10 h-1 rounded-full bg-dark-400" />
        </div>
      </div>
    </div>
  )
}
