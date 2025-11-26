import { HeartPulse, Apple, Dumbbell, Brain, ShowerHead, GraduationCap, Gamepad2, Users, Bed } from 'lucide-react'
import CategoryPane from '@/components/CategoryPane'
import { useAppStore } from '@/store/useAppStore'

const tabs = [
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'exercise', label: 'Exercise', icon: Dumbbell },
  { id: 'brain', label: 'Brain', icon: Brain },
  { id: 'hygiene', label: 'Hygiene', icon: ShowerHead },
]

// Brain view sub-buttons
const brainViews = [
  { id: 'learning', label: 'Learning', icon: GraduationCap },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'sleep', label: 'Sleep', icon: Bed },
]

function NutritionTab() {
  return (
    <div className="p-4 space-y-4">
      {/* Profile Selector + Date Filter */}
      <div className="flex items-center justify-between">
        <select className="bg-dark-200 rounded-lg px-3 py-2 text-sm">
          <option>Me</option>
          <option>Spouse</option>
          <option>Child 1</option>
        </select>
        <div className="flex gap-1">
          {['Day', 'Week', 'Month'].map(period => (
            <button 
              key={period} 
              className="px-3 py-1 text-xs rounded-lg bg-dark-200 hover:bg-dark-300 transition-colors"
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      
      {/* Macro Pie Placeholder */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-3">Macros</h3>
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="40, 100" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eab308" strokeWidth="3" strokeDasharray="35, 100" strokeDashoffset="-40" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="25, 100" strokeDashoffset="-75" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs text-dark-500">1,850 kcal</span>
            </div>
          </div>
        </div>
        <div className="flex justify-center gap-4 mt-3 text-xs">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent-green" />Protein 40%</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent-yellow" />Carbs 35%</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-accent-red" />Fats 25%</span>
        </div>
      </div>
      
      {/* Hydration */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-2">Hydration</h3>
        <div className="h-3 bg-dark-300 rounded-full overflow-hidden">
          <div className="h-full w-3/4 bg-accent-blue rounded-full" />
        </div>
        <p className="text-xs text-dark-500 mt-1">6/8 glasses (75%)</p>
      </div>
      
      {/* Calorie Bar */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-2">Calories</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Base Metabolic</span>
            <span>1,500 kcal</span>
          </div>
          <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
            <div className="h-full w-[68%] bg-accent-yellow rounded-full" />
          </div>
          <div className="flex justify-between text-xs">
            <span>Active Burn</span>
            <span>350 kcal</span>
          </div>
          <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
            <div className="h-full w-[16%] bg-accent-green rounded-full" />
          </div>
        </div>
      </div>
      
      {/* AI Note */}
      <button className="w-full glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
        📝 Show AI Analysis
      </button>
    </div>
  )
}

function ExerciseTab() {
  return (
    <div className="p-4 space-y-4">
      {/* Body Map Placeholder */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-3">Muscle Map</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Dumbbell size={48} className="mx-auto text-dark-400 mb-2" />
            <p className="text-xs text-dark-500">Body heatmap visualization</p>
            <p className="text-xs text-dark-500">based on workout volume</p>
          </div>
        </div>
      </div>
      
      {/* Recent Workouts */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-3">Recent Workouts</h3>
        <div className="space-y-2">
          {['Upper Body - 45min', 'HIIT Cardio - 30min', 'Yoga Flow - 20min'].map((workout, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-dark-100/50 rounded-lg">
              <span className="text-sm">{workout}</span>
              <span className="text-xs text-dark-500">{i === 0 ? 'Today' : i === 1 ? 'Yesterday' : '2d ago'}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Add Workout Button */}
      <button className="w-full glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
        + Add Workout (triggers Chat)
      </button>
    </div>
  )
}

function BrainTab() {
  const { subViews, setSubView } = useAppStore()
  const activeView = subViews.brain
  
  return (
    <div className="p-4 space-y-4">
      {/* Sub-view buttons */}
      <div className="flex gap-1 p-1 bg-dark-100 rounded-xl">
        {brainViews.map((view) => (
          <button
            key={view.id}
            onClick={() => setSubView('brain', view.id as any)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
              activeView === view.id 
                ? 'bg-primary/20 text-primary' 
                : 'text-dark-500 hover:text-white'
            }`}
          >
            <view.icon size={12} />
            <span>{view.label}</span>
          </button>
        ))}
      </div>
      
      {/* Learning View */}
      {activeView === 'learning' && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <GraduationCap size={16} />
            Topics Explored
          </h3>
          <div className="text-3xl font-bold text-primary mb-2">12</div>
          <p className="text-xs text-dark-500">Based on Zep Memory classifications</p>
        </div>
      )}
      
      {/* Games View */}
      {activeView === 'games' && (
        <div className="space-y-3">
          {['Memory Flip', 'Reaction Test', 'Focus Timer'].map((game) => (
            <button key={game} className="w-full glass-card p-4 text-left hover:bg-dark-100/80 transition-colors">
              <span className="font-medium">{game}</span>
              <p className="text-xs text-dark-500 mt-1">Tap to play</p>
            </button>
          ))}
        </div>
      )}
      
      {/* Social View */}
      {activeView === 'social' && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium mb-3">Social Volume</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs">Messages Sent</span>
              <span className="text-sm font-bold">47</span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs">People Talked To</span>
              <span className="text-sm font-bold">8</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Sleep View */}
      {activeView === 'sleep' && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Bed size={16} />
            Last Night's Sleep
          </h3>
          <div className="text-3xl font-bold mb-1">7.2h</div>
          <p className="text-xs text-dark-500">Sleep Score: 82%</p>
          <div className="mt-3 h-2 bg-dark-300 rounded-full overflow-hidden">
            <div className="h-full w-[82%] bg-purple-400 rounded-full" />
          </div>
        </div>
      )}
    </div>
  )
}

function HygieneTab() {
  const habits = [
    { name: 'Brush Teeth', done: true, stock: 'ok' },
    { name: 'Shower', done: true, stock: 'ok' },
    { name: 'Skincare', done: false, stock: 'low' },
    { name: 'Floss', done: false, stock: 'ok' },
  ]
  
  return (
    <div className="p-4 space-y-4">
      <div className="glass-card p-4">
        <h3 className="text-sm font-medium mb-3">Today's Habits</h3>
        <div className="space-y-2">
          {habits.map((habit, i) => (
            <div key={i} className="flex items-center gap-3 p-2 bg-dark-100/50 rounded-lg">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                habit.done ? 'border-accent-green bg-accent-green/20' : 'border-dark-400'
              }`}>
                {habit.done && <div className="w-2 h-2 rounded-full bg-accent-green" />}
              </div>
              <span className="flex-1 text-sm">{habit.name}</span>
              <div className={`w-2 h-2 rounded-full ${
                habit.stock === 'ok' ? 'bg-accent-green' : 'bg-accent-yellow'
              }`} title={`Stock: ${habit.stock}`} />
            </div>
          ))}
        </div>
      </div>
      
      <button className="w-full glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
        + Set Frequency (Routine)
      </button>
    </div>
  )
}

export default function HealthPane() {
  return (
    <CategoryPane
      title="Health"
      icon={HeartPulse}
      tabs={tabs}
      tabKey="health"
    >
      {(activeTab) => (
        <>
          {activeTab === 'nutrition' && <NutritionTab />}
          {activeTab === 'exercise' && <ExerciseTab />}
          {activeTab === 'brain' && <BrainTab />}
          {activeTab === 'hygiene' && <HygieneTab />}
        </>
      )}
    </CategoryPane>
  )
}
