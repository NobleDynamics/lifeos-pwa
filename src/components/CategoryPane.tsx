import { ReactNode } from 'react'
import { GripHorizontal, LucideIcon } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'

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
  const { tabs: tabState, setTab, openDrawer } = useAppStore()
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
      
      {/* Bottom Tab Bar + Drawer Handle */}
      <div className="flex-shrink-0">
        {/* Tab Bar */}
        <div className="px-3 pb-2">
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
        
        {/* Drawer Handle */}
        <div 
          className="py-2 flex justify-center cursor-pointer hover:bg-dark-100/50 transition-colors safe-bottom"
          onClick={openDrawer}
        >
          <div className="flex flex-col items-center gap-0.5">
            <GripHorizontal size={18} className="text-dark-400" />
            <div className="w-8 h-1 rounded-full bg-dark-400" />
          </div>
        </div>
      </div>
    </div>
  )
}
