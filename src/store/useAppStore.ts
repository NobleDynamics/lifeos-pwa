import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// All available pane types (workout is a tab under Health, not a separate pane)
// Changed to string to support dynamic user apps
export type PaneType = string

// Tab types for each pane
export type HealthTab = 'nutrition' | 'exercise' | 'brain' | 'hygiene'
export type HouseholdTab = 'todo' | 'shopping' | 'stock' | 'recipes'
export type AgendaTab = 'schedule' | 'calendar' | 'tasks' | 'routines'
export type FinanceTab = 'budget' | 'accounts' | 'analytics'
export type CloudTab = 'photos' | 'files' | 'docs'

// Sub-view types (for tab switch buttons)
export type ShoppingView = 'list' | 'items'
export type BrainView = 'learning' | 'games' | 'social' | 'sleep'

// Default pane order (Dashboard in center for easy access)
// Note: 'household' removed - now DB-driven as "My Home" via Context Roots
const DEFAULT_PANE_ORDER: PaneType[] = [
  'health',
  'agenda',
  'chat',
  'dashboard',
  'feed',
  'cloud',
  'finance',
  'settings',
  'sandbox' // Dev tool - swipe right from Settings to access
]

export interface DynamicPane {
  id: string
  title: string
  icon?: string // Lucide icon name or emoji
  context: string // e.g. 'user.gardening'
  isSystem?: boolean
}

interface TabState {
  health: HealthTab
  household: HouseholdTab
  agenda: AgendaTab
  finance: FinanceTab
  cloud: CloudTab
  [key: string]: string // Allow dynamic tabs
}

interface SubViewState {
  shopping: ShoppingView
  brain: BrainView
  [key: string]: string // Allow dynamic sub-views
}

interface AppState {
  // Pane navigation
  paneOrder: PaneType[]
  currentPaneIndex: number
  paneHistory: number[] // History of pane indices for back navigation
  
  // Dynamic Panes
  dynamicPanes: DynamicPane[]
  
  // Tab state per pane
  tabs: TabState
  
  // Sub-view state (for tab switch buttons)
  subViews: SubViewState
  
  // App Drawer
  isDrawerOpen: boolean
  drawerHeight: number // 0 = closed, 0.4 = partial, 0.8 = full
  
  // Health metrics cycling
  activeHealthMetric: 'steps' | 'calories' | 'water' | 'sleep'
  
  // Actions
  setCurrentPaneIndex: (index: number) => void
  navigateToPane: (pane: PaneType) => void
  navigateToPaneTab: (pane: PaneType, tab: string) => void
  swipeLeft: () => void
  swipeRight: () => void
  goBack: () => boolean // Returns true if navigated back, false if at root
  canGoBack: () => boolean
  
  setTab: (pane: string, tab: string) => void
  setSubView: (key: string, view: string) => void
  
  openDrawer: () => void
  closeDrawer: () => void
  setDrawerHeight: (height: number) => void
  
  cycleHealthMetric: () => void
  
  updatePaneOrder: (newOrder: PaneType[]) => void
  resetPaneOrder: () => void
  
  registerDynamicPanes: (panes: DynamicPane[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      paneOrder: DEFAULT_PANE_ORDER,
      currentPaneIndex: DEFAULT_PANE_ORDER.indexOf('dashboard'), // Start at dashboard
      paneHistory: [], // Empty history at start
      dynamicPanes: [],
      
      tabs: {
        health: 'nutrition',
        household: 'todo',
        agenda: 'schedule',
        finance: 'budget',
        cloud: 'photos',
      },
      
      subViews: {
        shopping: 'list',
        brain: 'learning',
      },
      
      isDrawerOpen: false,
      drawerHeight: 0,
      
      activeHealthMetric: 'steps',
      
      // Actions
      setCurrentPaneIndex: (index) => set({ currentPaneIndex: index }),
      
      navigateToPane: (pane) => {
        const { paneOrder, currentPaneIndex, paneHistory } = get()
        const index = paneOrder.indexOf(pane)
        if (index !== -1 && index !== currentPaneIndex) {
          // Add current pane to history before navigating
          const newHistory = [...paneHistory, currentPaneIndex].slice(-10) // Keep last 10
          set({ 
            currentPaneIndex: index, 
            paneHistory: newHistory,
            isDrawerOpen: false, 
            drawerHeight: 0 
          })
        } else if (index !== -1) {
          // Same pane, just close drawer
          set({ isDrawerOpen: false, drawerHeight: 0 })
        }
      },
      
      navigateToPaneTab: (pane, tab) => {
        const { paneOrder, tabs, currentPaneIndex, paneHistory } = get()
        const index = paneOrder.indexOf(pane)
        if (index !== -1) {
          // Update the tab for the target pane
          const newTabs = { ...tabs, [pane]: tab }
          
          // Add current pane to history if navigating to different pane
          const newHistory = index !== currentPaneIndex 
            ? [...paneHistory, currentPaneIndex].slice(-10)
            : paneHistory
          
          set({ 
            currentPaneIndex: index, 
            tabs: newTabs,
            paneHistory: newHistory,
            isDrawerOpen: false, 
            drawerHeight: 0 
          })
        }
      },
      
      swipeLeft: () => {
        const { currentPaneIndex } = get()
        if (currentPaneIndex > 0) {
          set({ currentPaneIndex: currentPaneIndex - 1 })
        }
      },
      
      swipeRight: () => {
        const { currentPaneIndex, paneOrder } = get()
        if (currentPaneIndex < paneOrder.length - 1) {
          set({ currentPaneIndex: currentPaneIndex + 1 })
        }
      },
      
      goBack: () => {
        const { paneOrder, isDrawerOpen, currentPaneIndex } = get()
        
        // Priority 1: Close drawer if open
        if (isDrawerOpen) {
          set({ isDrawerOpen: false, drawerHeight: 0 })
          return true
        }
        
        // Priority 2: Always go to dashboard (simplified - no history tracking)
        const dashboardIndex = paneOrder.indexOf('dashboard')
        if (currentPaneIndex !== dashboardIndex) {
          set({ currentPaneIndex: dashboardIndex })
          return true
        }
        
        // Priority 3: Already at dashboard - trap (return true to prevent app exit)
        // Returning true signals we handled the back press, preventing browser default
        return true
      },
      
      canGoBack: () => {
        const { paneHistory, paneOrder, currentPaneIndex, isDrawerOpen } = get()
        if (isDrawerOpen) return true
        if (paneHistory.length > 0) return true
        const dashboardIndex = paneOrder.indexOf('dashboard')
        return currentPaneIndex !== dashboardIndex
      },
      
      setTab: (pane, tab) => set((state) => ({
        tabs: { ...state.tabs, [pane]: tab }
      })),
      
      setSubView: (key, view) => set((state) => ({
        subViews: { ...state.subViews, [key]: view }
      })),
      
      openDrawer: () => set({ isDrawerOpen: true, drawerHeight: 0.5 }),
      closeDrawer: () => set({ isDrawerOpen: false, drawerHeight: 0 }),
      setDrawerHeight: (height) => set({ 
        drawerHeight: height,
        isDrawerOpen: height > 0.1
      }),
      
      cycleHealthMetric: () => {
        const { activeHealthMetric } = get()
        const metrics: Array<'steps' | 'calories' | 'water' | 'sleep'> = ['steps', 'calories', 'water', 'sleep']
        const currentIndex = metrics.indexOf(activeHealthMetric)
        const nextIndex = (currentIndex + 1) % metrics.length
        set({ activeHealthMetric: metrics[nextIndex] })
      },
      
      updatePaneOrder: (newOrder) => set({ paneOrder: newOrder }),
      
      resetPaneOrder: () => set({ paneOrder: DEFAULT_PANE_ORDER }),
      
      registerDynamicPanes: (panes) => set({ dynamicPanes: panes }),
    }),
    {
      name: 'lifeos-app-store',
      partialize: (state) => ({
        paneOrder: state.paneOrder,
        tabs: state.tabs,
        // Don't persist dynamic panes, we'll re-fetch them
      }),
    }
  )
)
