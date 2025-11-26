import { useState } from 'react'
import { Settings, GripHorizontal, GripVertical, User, Palette, Bell, Wallet, Shield, ChevronRight } from 'lucide-react'
import { useAppStore, type PaneType } from '@/store/useAppStore'

// Pane labels for display
const paneLabels: Record<PaneType, string> = {
  household: 'Household',
  health: 'Health',
  agenda: 'Agenda',
  chat: 'Chat',
  dashboard: 'Dashboard',
  feed: 'Feed',
  cloud: 'Cloud',
  finance: 'Finance',
  settings: 'Settings',
}

const settingsSections = [
  { id: 'account', label: 'Account', icon: User, description: 'Profile, sync, and login' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme, accent color, layout' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Agent nags, reminders' },
  { id: 'billing', label: 'Billing', icon: Wallet, description: 'Token balance, usage' },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield, description: 'Data, permissions' },
]

export default function SettingsPane() {
  const { paneOrder, updatePaneOrder, openDrawer } = useAppStore()
  const [showPaneEditor, setShowPaneEditor] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newOrder = [...paneOrder]
    const [dragged] = newOrder.splice(draggedIndex, 1)
    newOrder.splice(index, 0, dragged)
    updatePaneOrder(newOrder)
    setDraggedIndex(index)
  }
  
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }
  
  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 safe-top">
        <div className="flex items-center gap-2">
          <Settings size={24} className="text-primary" />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </div>
      
      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Pane Order Editor Toggle */}
        <button 
          onClick={() => setShowPaneEditor(!showPaneEditor)}
          className="w-full glass-card p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <GripVertical size={20} className="text-primary" />
            <div className="text-left">
              <h3 className="font-medium">Pane Order</h3>
              <p className="text-xs text-dark-500">Customize swipe deck order</p>
            </div>
          </div>
          <ChevronRight size={18} className={`text-dark-500 transition-transform ${showPaneEditor ? 'rotate-90' : ''}`} />
        </button>
        
        {/* Pane Order List */}
        {showPaneEditor && (
          <div className="glass-card p-3 space-y-1">
            {paneOrder.map((pane, index) => (
              <div
                key={pane}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
                  draggedIndex === index ? 'bg-primary/20' : 'bg-dark-100/50 hover:bg-dark-200'
                }`}
              >
                <GripVertical size={16} className="text-dark-500" />
                <span className="text-sm">{paneLabels[pane]}</span>
                <span className="ml-auto text-xs text-dark-500">{index + 1}</span>
              </div>
            ))}
            <p className="text-xs text-dark-500 text-center pt-2">
              Drag to reorder. Changes save automatically.
            </p>
          </div>
        )}
        
        {/* Settings Sections */}
        <div className="space-y-2">
          {settingsSections.map((section) => (
            <button 
              key={section.id}
              className="w-full glass-card p-4 flex items-center gap-3 hover:bg-dark-100/80 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center">
                <section.icon size={20} className="text-primary" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-medium">{section.label}</h3>
                <p className="text-xs text-dark-500">{section.description}</p>
              </div>
              <ChevronRight size={18} className="text-dark-500" />
            </button>
          ))}
        </div>
        
        {/* Version */}
        <div className="text-center py-4">
          <p className="text-xs text-dark-500">LifeOS v0.1.0</p>
        </div>
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
