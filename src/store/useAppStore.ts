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
  
  // === NEW: Per-pane navigation depth (State-First Back Navigation) ===
  activeNodeByPane: Record<string, string | null>  // Current node ID per ViewEngine pane
  nodeStackByPane: Record<string, string[]>        // Navigation trail (for back navigation)
  defaultTabByPane: Record<string, string | null>  // Default tab ID per pane (from shell metadata)
  activeTabByPane: Record<string, string | null>   // Currently active tab ID per pane
  
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
  
  // === NEW: Navigation actions for State-First Back Navigation ===
  // Forward navigation: push to node stack, set active node
  navigateToNode: (paneId: string, nodeId: string | null, isTab?: boolean) => void
  // Back from node: pop stack, update active node, return true if popped
  backFromNode: (paneId: string) => boolean
  // Back from tab: switch to default tab if not there, return true if switched
  backFromTab: (paneId: string) => boolean
  // Back from pane: go to dashboard if not there, return true if moved
  backFromPane: () => boolean
  // Set default tab for a pane (called by shell on mount)
  setDefaultTab: (paneId: string, tabId: string) => void
  // Set active tab for a pane
  setActiveTab: (paneId: string, tabId: string | null) => void
  // Clear navigation state for a pane (on unmount)
  clearPaneNavigation: (paneId: string) => void
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
      
      // === NEW: Per-pane navigation state (State-First Back Navigation) ===
      activeNodeByPane: {},   // { "user.my_home": "node-uuid-123" }
      nodeStackByPane: {},    // { "user.my_home": ["root", "tab-uuid", "folder-uuid"] }
      defaultTabByPane: {},   // { "user.my_home": "default-tab-uuid" }
      activeTabByPane: {},    // { "user.my_home": "current-tab-uuid" }
      
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
      
      // === NEW: Navigation actions for State-First Back Navigation ===
      
      /**
       * Navigate to a node within a pane (forward navigation)
       * @param paneId - The pane identifier (e.g., "user.my_home")
       * @param nodeId - The node to navigate to (null = root)
       * @param isTab - If true, this is a tab navigation (clears node stack, sets activeTab)
       */
      navigateToNode: (paneId, nodeId, isTab = false) => {
        const { activeNodeByPane, nodeStackByPane, activeTabByPane } = get()
        
        if (isTab) {
          // Tab navigation: clear node stack, update active tab
          set({
            activeNodeByPane: { ...activeNodeByPane, [paneId]: nodeId },
            nodeStackByPane: { ...nodeStackByPane, [paneId]: nodeId ? [nodeId] : [] },
            activeTabByPane: { ...activeTabByPane, [paneId]: nodeId },
          })
        } else {
          // Folder navigation: push to stack
          const currentStack = nodeStackByPane[paneId] || []
          const newStack = nodeId ? [...currentStack, nodeId] : currentStack
          
          set({
            activeNodeByPane: { ...activeNodeByPane, [paneId]: nodeId },
            nodeStackByPane: { ...nodeStackByPane, [paneId]: newStack },
          })
        }
      },
      
      /**
       * Go back within the node stack (folder navigation)
       * @returns true if we popped from stack, false if at tab root
       */
      backFromNode: (paneId) => {
        const { activeNodeByPane, nodeStackByPane, activeTabByPane } = get()
        const currentStack = nodeStackByPane[paneId] || []
        const activeTab = activeTabByPane[paneId]
        
        // If stack has more than 1 item (more than just the tab), pop
        if (currentStack.length > 1) {
          const newStack = currentStack.slice(0, -1)
          const newActiveNode = newStack[newStack.length - 1] || null
          
          set({
            activeNodeByPane: { ...activeNodeByPane, [paneId]: newActiveNode },
            nodeStackByPane: { ...nodeStackByPane, [paneId]: newStack },
          })
          return true
        }
        
        // At tab root (stack is empty or has only 1 item)
        // Clear the active node to show tab root
        if (activeNodeByPane[paneId] !== null && activeNodeByPane[paneId] !== activeTab) {
          set({
            activeNodeByPane: { ...activeNodeByPane, [paneId]: activeTab || null },
            nodeStackByPane: { ...nodeStackByPane, [paneId]: activeTab ? [activeTab] : [] },
          })
          return true
        }
        
        return false // Already at tab root, let next handler take over
      },
      
      /**
       * Switch from current tab to default tab
       * @returns true if switched to default tab, false if already at default
       */
      backFromTab: (paneId) => {
        const { activeTabByPane, defaultTabByPane, activeNodeByPane, nodeStackByPane } = get()
        const activeTab = activeTabByPane[paneId]
        const defaultTab = defaultTabByPane[paneId]
        
        // If we're not at the default tab, switch to it
        if (defaultTab && activeTab !== defaultTab) {
          set({
            activeTabByPane: { ...activeTabByPane, [paneId]: defaultTab },
            activeNodeByPane: { ...activeNodeByPane, [paneId]: defaultTab },
            nodeStackByPane: { ...nodeStackByPane, [paneId]: [defaultTab] },
          })
          return true
        }
        
        return false // Already at default tab, let app-level handler take over
      },
      
      /**
       * Navigate from current pane to dashboard
       * @returns true if navigated to dashboard, false if already there (traps)
       */
      backFromPane: () => {
        const { paneOrder, currentPaneIndex, isDrawerOpen } = get()
        
        // Close drawer first if open
        if (isDrawerOpen) {
          set({ isDrawerOpen: false, drawerHeight: 0 })
          return true
        }
        
        // Navigate to dashboard if not there
        const dashboardIndex = paneOrder.indexOf('dashboard')
        if (currentPaneIndex !== dashboardIndex) {
          set({ currentPaneIndex: dashboardIndex })
          return true
        }
        
        // Already at dashboard - TRAP (return true to prevent app exit)
        return true
      },
      
      /**
       * Set the default tab for a pane (called by shell on mount)
       */
      setDefaultTab: (paneId, tabId) => {
        const { defaultTabByPane, activeTabByPane, activeNodeByPane, nodeStackByPane } = get()
        
        // Set default tab
        const newDefaultTabByPane = { ...defaultTabByPane, [paneId]: tabId }
        
        // If no active tab set yet, initialize to default
        const updates: Partial<AppState> = { defaultTabByPane: newDefaultTabByPane }
        
        if (!activeTabByPane[paneId]) {
          updates.activeTabByPane = { ...activeTabByPane, [paneId]: tabId }
          updates.activeNodeByPane = { ...activeNodeByPane, [paneId]: tabId }
          updates.nodeStackByPane = { ...nodeStackByPane, [paneId]: [tabId] }
        }
        
        set(updates as AppState)
      },
      
      /**
       * Set the active tab for a pane (direct tab click)
       */
      setActiveTab: (paneId, tabId) => {
        const { activeTabByPane, activeNodeByPane, nodeStackByPane } = get()
        
        set({
          activeTabByPane: { ...activeTabByPane, [paneId]: tabId },
          activeNodeByPane: { ...activeNodeByPane, [paneId]: tabId },
          nodeStackByPane: { ...nodeStackByPane, [paneId]: tabId ? [tabId] : [] },
        })
      },
      
      /**
       * Clear navigation state for a pane (on unmount)
       */
      clearPaneNavigation: (paneId) => {
        const { activeNodeByPane, nodeStackByPane, defaultTabByPane, activeTabByPane } = get()
        
        // Remove pane from all navigation state
        const { [paneId]: _active, ...restActive } = activeNodeByPane
        const { [paneId]: _stack, ...restStack } = nodeStackByPane
        const { [paneId]: _default, ...restDefault } = defaultTabByPane
        const { [paneId]: _tab, ...restTab } = activeTabByPane
        
        set({
          activeNodeByPane: restActive,
          nodeStackByPane: restStack,
          defaultTabByPane: restDefault,
          activeTabByPane: restTab,
        })
      },
    }),
    {
      name: 'lifeos-app-store',
      partialize: (state) => ({
        paneOrder: state.paneOrder,
        tabs: state.tabs,
        // Don't persist navigation state (ephemeral) or dynamic panes (re-fetched)
      }),
    }
  )
)
