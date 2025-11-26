import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// All available pane types (workout is a tab under Health, not a separate pane)
export type PaneType = 
  | 'household'
  | 'health'
  | 'agenda'
  | 'chat'
  | 'dashboard'
  | 'feed'
  | 'cloud'
  | 'finance'
  | 'settings'

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
const DEFAULT_PANE_ORDER: PaneType[] = [
  'household',
  'health',
  'agenda',
  'chat',
  'dashboard',
  'feed',
  'cloud',
  'finance',
  'settings'
]

interface TabState {
  health: HealthTab
  household: HouseholdTab
  agenda: AgendaTab
  finance: FinanceTab
  cloud: CloudTab
}

interface SubViewState {
  shopping: ShoppingView
  brain: BrainView
}

interface AppState {
  // Pane navigation
  paneOrder: PaneType[]
  currentPaneIndex: number
  
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
  
  setTab: <K extends keyof TabState>(pane: K, tab: TabState[K]) => void
  setSubView: <K extends keyof SubViewState>(key: K, view: SubViewState[K]) => void
  
  openDrawer: () => void
  closeDrawer: () => void
  setDrawerHeight: (height: number) => void
  
  cycleHealthMetric: () => void
  
  updatePaneOrder: (newOrder: PaneType[]) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      paneOrder: DEFAULT_PANE_ORDER,
      currentPaneIndex: DEFAULT_PANE_ORDER.indexOf('dashboard'), // Start at dashboard
      
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
        const { paneOrder } = get()
        const index = paneOrder.indexOf(pane)
        if (index !== -1) {
          set({ currentPaneIndex: index, isDrawerOpen: false, drawerHeight: 0 })
        }
      },
      
      navigateToPaneTab: (pane, tab) => {
        const { paneOrder, tabs } = get()
        const index = paneOrder.indexOf(pane)
        if (index !== -1) {
          // Update the tab for the target pane
          const newTabs = { ...tabs }
          if (pane === 'health') newTabs.health = tab as HealthTab
          if (pane === 'household') newTabs.household = tab as HouseholdTab
          if (pane === 'agenda') newTabs.agenda = tab as AgendaTab
          if (pane === 'cloud') newTabs.cloud = tab as CloudTab
          
          set({ 
            currentPaneIndex: index, 
            tabs: newTabs,
            isDrawerOpen: false, 
            drawerHeight: 0 
          })
        }
      },
      
      swipeLeft: () => {
        const { currentPaneIndex, paneOrder } = get()
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
    }),
    {
      name: 'lifeos-app-store',
      partialize: (state) => ({
        paneOrder: state.paneOrder,
        tabs: state.tabs,
      }),
    }
  )
)
