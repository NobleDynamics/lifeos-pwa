import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { DRAWER_HANDLE_HEIGHT } from './Layout'

interface Tab {
  id: string
  label: string
  icon: LucideIcon
}

interface CategoryPaneProps {
  title: string
  icon: LucideIcon
  tabs: Tab[]
  tabKey: 'health' | 'household' | 'agenda' | 'finance' | 'cloud'
  children: (activeTab: string) => ReactNode
}

export default function CategoryPane({ 
  title, 
  icon: Icon, 
  tabs, 
  tabKey,
  children 
}: CategoryPaneProps) {
  const { tabs: tabState, setTab } = useAppStore()
  const activeTab = tabState[tabKey]
  
  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-top flex-shrink-0">
        <div className="flex items-center gap-2">
          <Icon size={24} className="text-primary" />
          <h1 className="text-xl font-bold">{title}</h1>
        </div>
      </div>
      
      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {children(activeTab)}
      </div>
      
      {/* Bottom Tab Bar - with padding for drawer handle */}
      <div 
        className="flex-shrink-0 px-3 pb-2"
        style={{ paddingBottom: `${DRAWER_HANDLE_HEIGHT + 8}px` }}
      >
        <div className="flex p-1 bg-dark-100/80 backdrop-blur rounded-xl">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const TabIcon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tabKey, tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/20 text-primary shadow-sm' 
                    : 'text-dark-500 hover:text-white hover:bg-dark-200/50'
                }`}
              >
                <TabIcon size={16} />
                <span className={`${isActive ? '' : 'hidden sm:inline'}`}>{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
