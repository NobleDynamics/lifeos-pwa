import { useState } from 'react'
import { Settings, GripHorizontal, GripVertical, User, Palette, Bell, Wallet, Shield, ChevronRight, Users, ChevronDown } from 'lucide-react'
import { useAppStore, type PaneType } from '@/store/useAppStore'
import { testUsers, useDevUserStore, useAuth } from '@/lib/supabase'

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
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme, accent color, layout' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Agent nags, reminders' },
  { id: 'billing', label: 'Billing', icon: Wallet, description: 'Token balance, usage' },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield, description: 'Data, permissions' },
]

export default function SettingsPane() {
  const { paneOrder, updatePaneOrder, openDrawer } = useAppStore()
  const { currentUserId, setCurrentUserId } = useDevUserStore()
  const { user } = useAuth()
  const [showPaneEditor, setShowPaneEditor] = useState(false)
  const [showAccountSection, setShowAccountSection] = useState(true)
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

  const handleUserChange = (userId: string) => {
    setCurrentUserId(userId)
    // Force reload to refresh all data with new user
    window.location.reload()
  }

  const currentUser = testUsers.find(u => u.id === currentUserId)
  
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
        {/* Account Section with User Switcher */}
        <div className="glass-card overflow-hidden">
          <button 
            onClick={() => setShowAccountSection(!showAccountSection)}
            className="w-full p-4 flex items-center gap-3 hover:bg-dark-100/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-dark-200 flex items-center justify-center">
              <User size={20} className="text-primary" />
            </div>
            <div className="text-left flex-1">
              <h3 className="font-medium">Account</h3>
              <p className="text-xs text-dark-500">Profile, sync, and login</p>
            </div>
            <ChevronDown size={18} className={`text-dark-500 transition-transform ${showAccountSection ? 'rotate-180' : ''}`} />
          </button>
          
          {showAccountSection && (
            <div className="px-4 pb-4 space-y-3">
              {/* Current User Display */}
              <div className="bg-dark-200/50 rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <User size={24} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{currentUser?.name || 'Unknown User'}</p>
                    <p className="text-xs text-dark-500">{currentUser?.email || user?.email}</p>
                    <p className="text-[10px] text-dark-600 font-mono mt-1">{currentUserId.substring(0, 8)}...</p>
                  </div>
                </div>
              </div>
              
              {/* User Switcher (Development Only) */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users size={14} className="text-yellow-500" />
                  <span className="text-xs font-medium text-yellow-500">DEV MODE: Switch Test User</span>
                </div>
                <select
                  value={currentUserId}
                  onChange={(e) => handleUserChange(e.target.value)}
                  className="w-full bg-dark-300 border border-dark-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {testUsers.map((testUser) => (
                    <option key={testUser.id} value={testUser.id}>
                      {testUser.name} ({testUser.id.substring(0, 8)}...)
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-dark-500 mt-2">
                  Switching users will reload the app to fetch that user's data
                </p>
              </div>
            </div>
          )}
        </div>
        
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
