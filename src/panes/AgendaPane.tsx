import { Calendar, GanttChart, CalendarDays, ListChecks, Repeat, ChefHat, Dumbbell, CheckCircle } from 'lucide-react'
import CategoryPane from '@/components/CategoryPane'

const tabs = [
  { id: 'schedule', label: 'Schedule', icon: GanttChart },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'routines', label: 'Routines', icon: Repeat },
]

// Mock events
const mockEvents = [
  { id: 1, title: 'Dentist Appointment', time: '9:00 AM', type: 'blocking', linkedType: null },
  { id: 2, title: 'Team Standup', time: '10:30 AM', type: 'blocking', linkedType: null },
  { id: 3, title: 'Lunch: Chicken Salad', time: '12:00 PM', type: 'event', linkedType: 'recipe' },
  { id: 4, title: 'Window Cleaners', time: '2:00 PM', type: 'nonblocking', linkedType: null },
  { id: 5, title: 'Evening Run', time: '6:00 PM', type: 'event', linkedType: 'workout' },
]

const mockTasks = [
  { id: 1, title: 'Finish project proposal', category: 'Work', due: 'Today' },
  { id: 2, title: 'Buy groceries', category: 'Errand', due: 'Today' },
  { id: 3, title: 'Call insurance company', category: 'Errand', due: 'Tomorrow' },
]

const mockRoutines = [
  { id: 1, name: 'Morning Routine', trigger: '7:00 AM', tasks: 5, enabled: true },
  { id: 2, name: 'Weekly Review', trigger: 'Sun 6:00 PM', tasks: 3, enabled: true },
  { id: 3, name: 'Bill Pay Day', trigger: '1st of month', tasks: 4, enabled: false },
]

function ScheduleTab() {
  const now = new Date()
  const currentHour = now.getHours()
  
  return (
    <div className="p-4 space-y-4">
      {/* Now indicator */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
        <span className="text-xs text-dark-500">
          Now: {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      {/* Timeline */}
      <div className="relative">
        {/* Now line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-dark-300" />
        
        {mockEvents.map((event, i) => {
          const isLinked = event.linkedType !== null
          const Icon = event.linkedType === 'recipe' ? ChefHat : event.linkedType === 'workout' ? Dumbbell : CheckCircle
          
          return (
            <div key={event.id} className="relative flex items-start gap-4 pb-4">
              {/* Time marker */}
              <div className={`w-3 h-3 rounded-full z-10 ${
                event.type === 'blocking' ? 'bg-accent-red' : 
                event.type === 'nonblocking' ? 'bg-dark-400' :
                'bg-primary'
              }`} />
              
              {/* Event card */}
              <div className={`flex-1 glass-card p-3 border-l-2 ${
                event.type === 'blocking' ? 'border-l-accent-red' :
                event.type === 'nonblocking' ? 'border-l-dark-400 opacity-70' :
                'border-l-primary'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-dark-500">{event.time}</span>
                  {isLinked && <Icon size={14} className="text-primary" />}
                </div>
                <p className="font-medium text-sm mt-1">{event.title}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CalendarTab() {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const today = new Date().getDate()
  
  return (
    <div className="p-4 space-y-4">
      {/* View toggle */}
      <div className="flex gap-2">
        {['Month', 'Week', 'Day'].map((view) => (
          <button 
            key={view}
            className={`px-3 py-1 text-xs rounded-lg ${view === 'Month' ? 'bg-primary/20 text-primary' : 'bg-dark-200 text-dark-500'}`}
          >
            {view}
          </button>
        ))}
      </div>
      
      {/* Month header */}
      <div className="flex items-center justify-between">
        <button className="text-dark-500">←</button>
        <span className="font-medium">November 2025</span>
        <button className="text-dark-500">→</button>
      </div>
      
      {/* Calendar grid */}
      <div className="glass-card p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {days.map((day) => (
            <div key={day} className="text-center text-xs text-dark-500 py-1">{day}</div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 5 // offset for month start
            const isToday = day === today
            const hasEvent = [5, 12, 18, 26].includes(day)
            
            return (
              <button 
                key={i}
                className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs ${
                  day < 1 || day > 30 ? 'text-dark-600' :
                  isToday ? 'bg-primary text-dark font-bold' :
                  'hover:bg-dark-200'
                }`}
              >
                {day > 0 && day <= 30 ? day : ''}
                {hasEvent && day > 0 && day <= 30 && (
                  <div className="w-1 h-1 rounded-full bg-accent-blue mt-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      <button className="w-full glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
        + Import Calendar (.ics)
      </button>
    </div>
  )
}

function TasksTab() {
  return (
    <div className="p-4 space-y-4">
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'Due Today', 'Work', 'Errand', 'Near Me'].map((filter) => (
          <button 
            key={filter}
            className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap ${filter === 'All' ? 'bg-primary/20 text-primary' : 'bg-dark-200 text-dark-500'}`}
          >
            {filter}
          </button>
        ))}
      </div>
      
      {/* Task list */}
      <div className="space-y-2">
        {mockTasks.map((task) => (
          <div key={task.id} className="glass-card p-3 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-dark-400" />
            <div className="flex-1">
              <p className="text-sm">{task.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs px-2 py-0.5 bg-dark-200 rounded">{task.category}</span>
                <span className="text-xs text-dark-500">{task.due}</span>
              </div>
            </div>
            <button className="text-xs text-primary">🗓️</button>
          </div>
        ))}
      </div>
      
      <button className="w-full glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
        🤖 Smart Schedule
      </button>
    </div>
  )
}

function RoutinesTab() {
  return (
    <div className="p-4 space-y-4">
      {mockRoutines.map((routine) => (
        <div key={routine.id} className={`glass-card p-4 ${!routine.enabled ? 'opacity-50' : ''}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{routine.name}</span>
            <div className={`w-10 h-5 rounded-full p-0.5 ${routine.enabled ? 'bg-primary' : 'bg-dark-400'}`}>
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${routine.enabled ? 'translate-x-5' : ''}`} />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-dark-500">
            <span>🕐 {routine.trigger}</span>
            <span>📋 {routine.tasks} tasks</span>
          </div>
        </div>
      ))}
      
      <button className="w-full glass-card p-3 text-sm text-primary hover:bg-primary/10 transition-colors">
        + Create Routine
      </button>
    </div>
  )
}

export default function AgendaPane() {
  return (
    <CategoryPane
      title="Agenda"
      icon={Calendar}
      tabs={tabs}
      tabKey="agenda"
    >
      {(activeTab) => (
        <>
          {activeTab === 'schedule' && <ScheduleTab />}
          {activeTab === 'calendar' && <CalendarTab />}
          {activeTab === 'tasks' && <TasksTab />}
          {activeTab === 'routines' && <RoutinesTab />}
        </>
      )}
    </CategoryPane>
  )
}
