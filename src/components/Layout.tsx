import { ReactNode, useRef, useState, useCallback, useEffect } from 'react'
import { useAppStore, type PaneType } from '@/store/useAppStore'
import { 
  Home, 
  Dumbbell,
  HeartPulse, 
  Calendar, 
  MessageSquare,
  LayoutDashboard,
  Rss,
  Cloud,
  Wallet,
  Settings,
  X,
  Apple,
  ShoppingCart,
  ClipboardList,
  ChefHat,
  GanttChart,
  ListChecks,
  CalendarDays,
  Banknote,
  PiggyBank,
  Image,
  FileText
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

// Pane configuration with icons
const paneConfig: Record<PaneType, { icon: typeof Home; label: string; color: string }> = {
  household: { icon: Home, label: 'Household', color: 'text-purple-400' },
  health: { icon: HeartPulse, label: 'Health', color: 'text-red-400' },
  agenda: { icon: Calendar, label: 'Agenda', color: 'text-blue-400' },
  chat: { icon: MessageSquare, label: 'Chat', color: 'text-green-400' },
  dashboard: { icon: LayoutDashboard, label: 'Dashboard', color: 'text-primary' },
  feed: { icon: Rss, label: 'Feed', color: 'text-yellow-400' },
  cloud: { icon: Cloud, label: 'Cloud', color: 'text-cyan-400' },
  finance: { icon: Wallet, label: 'Finance', color: 'text-emerald-400' },
  settings: { icon: Settings, label: 'Settings', color: 'text-gray-400' },
}

// Quick links for drawer - organized by category
const drawerQuickLinks = [
  {
    category: 'Health',
    icon: HeartPulse,
    links: [
      { pane: 'health' as PaneType, tab: 'nutrition', label: 'Nutrition', icon: Apple },
      { pane: 'health' as PaneType, tab: 'exercise', label: 'Exercise', icon: Dumbbell },
    ]
  },
  {
    category: 'Household',
    icon: Home,
    links: [
      { pane: 'household' as PaneType, tab: 'todo', label: 'To-Do', icon: ClipboardList },
      { pane: 'household' as PaneType, tab: 'shopping', label: 'Shopping', icon: ShoppingCart },
      { pane: 'household' as PaneType, tab: 'recipes', label: 'Recipes', icon: ChefHat },
    ]
  },
  {
    category: 'Agenda',
    icon: Calendar,
    links: [
      { pane: 'agenda' as PaneType, tab: 'schedule', label: 'Schedule', icon: GanttChart },
      { pane: 'agenda' as PaneType, tab: 'calendar', label: 'Calendar', icon: CalendarDays },
      { pane: 'agenda' as PaneType, tab: 'tasks', label: 'Tasks', icon: ListChecks },
    ]
  },
  {
    category: 'Finance',
    icon: Wallet,
    links: [
      { pane: 'finance' as PaneType, tab: 'budget', label: 'Budget', icon: Banknote },
      { pane: 'finance' as PaneType, tab: 'accounts', label: 'Accounts', icon: PiggyBank },
    ]
  },
  {
    category: 'Cloud',
    icon: Cloud,
    links: [
      { pane: 'cloud' as PaneType, tab: 'photos', label: 'Photos', icon: Image },
      { pane: 'cloud' as PaneType, tab: 'docs', label: 'Docs', icon: FileText },
    ]
  },
]

// Physics-based drawer configuration
const VELOCITY_THRESHOLD = 0.3 // px/ms for flick detection (lower = easier to flick close)
const CLOSE_THRESHOLD = 0.75 // 75% - closes if dragged to 75% or below (only need to drag 25% down)
const ANIMATION_DURATION = 300 // ms

// Combined Drawer + Swipe Handler - drawer follows finger in real-time
function DrawerWithSwipe() {
  const { isDrawerOpen, closeDrawer, openDrawer, navigateToPaneTab, navigateToPane, paneOrder } = useAppStore()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentHeight, setCurrentHeight] = useState(0) // 0-1 representing percentage
  const [isAnimating, setIsAnimating] = useState(false)
  const [isAtScrollTop, setIsAtScrollTop] = useState(true)
  const [isVisible, setIsVisible] = useState(false) // Controls whether drawer renders
  
  // Gesture tracking
  const gestureRef = useRef({
    startY: 0,
    startHeight: 0,
    startTime: 0,
    lastY: 0,
    lastTime: 0,
    isFromContent: false,
    isFromBottomEdge: false, // Track if opening from bottom edge swipe
  })
  
  // Get screen height
  const getMaxHeight = useCallback(() => window.innerHeight, [])
  
  // Animate to snap point with proper cleanup
  const animateToHeight = useCallback((targetHeight: number) => {
    setIsAnimating(true)
    setCurrentHeight(targetHeight)
    
    setTimeout(() => {
      setIsAnimating(false)
      if (targetHeight === 0) {
        setIsVisible(false)
        closeDrawer()
      }
    }, ANIMATION_DURATION)
  }, [closeDrawer])
  
  // Find nearest snap point based on position and velocity
  const findNearestSnap = useCallback((height: number, velocity: number): number => {
    // Strong downward velocity = close
    if (velocity > VELOCITY_THRESHOLD) {
      return 0
    }
    // Strong upward velocity = open
    if (velocity < -VELOCITY_THRESHOLD) {
      return 1
    }
    // Otherwise use position threshold
    return height >= CLOSE_THRESHOLD ? 1 : 0
  }, [])
  
  // Handle drag start (from handle when open, or from bottom edge when closed)
  const handleStart = useCallback((clientY: number, fromContent: boolean = false, fromBottomEdge: boolean = false) => {
    if (isAnimating) return
    
    const now = Date.now()
    gestureRef.current = {
      startY: clientY,
      startHeight: currentHeight,
      startTime: now,
      lastY: clientY,
      lastTime: now,
      isFromContent: fromContent,
      isFromBottomEdge: fromBottomEdge,
    }
    setIsDragging(true)
    
    // If opening from bottom edge, make drawer visible
    if (fromBottomEdge && !isVisible) {
      setIsVisible(true)
    }
  }, [isAnimating, currentHeight, isVisible])
  
  // Handle drag move - drawer follows finger
  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return
    
    const { startY, startHeight, isFromContent, isFromBottomEdge } = gestureRef.current
    const maxHeight = getMaxHeight()
    const deltaY = startY - clientY // Positive = dragging up
    
    // If started from content and not at scroll top, don't resize drawer
    if (isFromContent && !isAtScrollTop && deltaY < 0) {
      return // Let content scroll naturally
    }
    
    let newHeight: number
    
    if (isFromBottomEdge) {
      // Opening from bottom edge - convert pixel drag to percentage
      newHeight = Math.max(0, deltaY / maxHeight)
    } else {
      // Dragging from handle - adjust from start height
      const deltaPercent = deltaY / maxHeight
      newHeight = startHeight + deltaPercent
    }
    
    // Clamp with rubber-band effect
    if (newHeight > 1) {
      const overflow = newHeight - 1
      newHeight = 1 + overflow * 0.15
    }
    if (newHeight < 0) {
      newHeight = newHeight * 0.3
    }
    
    gestureRef.current.lastY = clientY
    gestureRef.current.lastTime = Date.now()
    setCurrentHeight(Math.max(0, Math.min(1.1, newHeight)))
  }, [isDragging, getMaxHeight, isAtScrollTop])
  
  // Handle drag end
  const handleEnd = useCallback(() => {
    if (!isDragging) return
    
    const { startY, startTime, lastY, isFromBottomEdge } = gestureRef.current
    const totalElapsed = Date.now() - startTime
    
    // Calculate velocity - positive = moving down, negative = moving up
    const velocity = (startY - lastY) / Math.max(1, totalElapsed)
    
    setIsDragging(false)
    
    // If barely moved during bottom edge open, close it
    if (isFromBottomEdge && currentHeight < 0.1) {
      animateToHeight(0)
      return
    }
    
    // Find target snap point (0 = closed, 1 = open)
    // velocity: positive = moving down (closing), negative = moving up (opening)
    const targetSnap = findNearestSnap(currentHeight, velocity)
    animateToHeight(targetSnap)
  }, [isDragging, currentHeight, findNearestSnap, animateToHeight])
  
  // Touch events for drawer handle
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY, false, false)
  }, [handleStart])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDragging) {
      e.preventDefault()
      handleMove(e.touches[0].clientY)
    }
  }, [isDragging, handleMove])
  
  const handleTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])
  
  // Touch events for content area (to close when swiping down from top)
  const handleContentTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollEl = scrollRef.current
    setIsAtScrollTop(scrollEl ? scrollEl.scrollTop <= 0 : true)
    handleStart(e.touches[0].clientY, true, false)
  }, [handleStart])
  
  const handleContentTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    
    const { startY, isFromContent } = gestureRef.current
    const deltaY = startY - e.touches[0].clientY
    
    // If from content and dragging down and at scroll top, intercept
    if (isFromContent && isAtScrollTop && deltaY < 0) {
      e.preventDefault()
      handleMove(e.touches[0].clientY)
    } else if (!isFromContent) {
      handleMove(e.touches[0].clientY)
    }
  }, [isDragging, isAtScrollTop, handleMove])
  
  // Touch events for bottom edge (to open)
  const handleBottomEdgeTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDrawerOpen || isVisible) return
    handleStart(e.touches[0].clientY, false, true)
  }, [isDrawerOpen, isVisible, handleStart])
  
  const handleBottomEdgeTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    handleMove(e.touches[0].clientY)
  }, [isDragging, handleMove])
  
  // Mouse events for handle
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleStart(e.clientY, false, false)
  }, [handleStart])
  
  // Global mouse events when dragging
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientY)
    const handleMouseUp = () => handleEnd()
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, handleMove, handleEnd])
  
  // Open drawer with animation when isDrawerOpen changes
  useEffect(() => {
    if (isDrawerOpen && !isVisible) {
      setIsVisible(true)
      // Small delay to ensure visibility is set before animating
      requestAnimationFrame(() => {
        animateToHeight(1)
      })
    }
  }, [isDrawerOpen, isVisible, animateToHeight])
  
  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && currentHeight > 0) {
        animateToHeight(0)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentHeight, animateToHeight])
  
  // Track scroll position
  useEffect(() => {
    const scrollEl = scrollRef.current
    if (!scrollEl) return
    
    const handleScroll = () => setIsAtScrollTop(scrollEl.scrollTop <= 0)
    
    scrollEl.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollEl.removeEventListener('scroll', handleScroll)
  }, [])
  
  // Calculate pixel height
  const heightPx = Math.min(currentHeight, 1) * getMaxHeight()
  const showDrawer = isVisible || isDragging
  
  return (
    <>
      {/* Bottom edge swipe zone - always present when drawer closed */}
      {!showDrawer && (
        <div
          className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center"
          style={{ height: '80px' }}
          onClick={() => openDrawer()}
          onTouchStart={handleBottomEdgeTouchStart}
          onTouchMove={handleBottomEdgeTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Visual indicator - subtle line */}
          <div className="w-16 h-1 rounded-full bg-dark-400/50" />
        </div>
      )}
      
      {/* Backdrop */}
      {showDrawer && (
        <div
          onClick={() => animateToHeight(0)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          style={{
            opacity: Math.min(1, currentHeight * 2),
            transition: isDragging ? 'none' : `opacity ${ANIMATION_DURATION}ms ease-out`,
            pointerEvents: currentHeight > 0.1 ? 'auto' : 'none',
          }}
        />
      )}
      
      {/* Drawer */}
      {showDrawer && (
        <div
          ref={containerRef}
          className="fixed bottom-0 left-0 right-0 z-50 bg-dark-50/98 backdrop-blur-xl rounded-t-3xl border-t border-white/10 overflow-hidden"
          style={{
            height: `${Math.max(heightPx, 0)}px`,
            transition: isDragging ? 'none' : `height ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
            willChange: 'height',
          }}
        >
          {/* Drag Handle Area */}
          <div
            className="cursor-grab active:cursor-grabbing touch-none select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
          >
            {/* Handle visual */}
            <div className="flex justify-center pt-4 pb-3">
              <div className="w-12 h-1.5 rounded-full bg-dark-400" />
            </div>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4">
              <h2 className="text-lg font-semibold">Quick Navigation</h2>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  animateToHeight(0)
                }}
                className="p-2 rounded-full hover:bg-dark-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          {/* Scrollable content */}
          <div 
            ref={scrollRef}
            className="overflow-y-auto px-4 pb-8 overscroll-contain"
            style={{ height: `calc(100% - 88px)` }}
            onTouchStart={handleContentTouchStart}
            onTouchMove={handleContentTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Pane Grid */}
            <div className="mb-6">
              <p className="text-xs text-dark-500 uppercase tracking-wider mb-3 px-2">All Panes</p>
              <div className="grid grid-cols-5 gap-2">
                {paneOrder.map((pane) => {
                  const config = paneConfig[pane]
                  return (
                    <button
                      key={pane}
                      onClick={() => {
                        navigateToPane(pane)
                        animateToHeight(0)
                      }}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-dark-200 transition-colors active:scale-95"
                    >
                      <div className={`w-10 h-10 rounded-xl bg-dark-200 flex items-center justify-center ${config.color}`}>
                        <config.icon size={20} />
                      </div>
                      <span className="text-[10px] text-dark-500">{config.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
            
            {/* Quick Links by Category */}
            {drawerQuickLinks.map((category) => (
              <div key={category.category} className="mb-4">
                <p className="text-xs text-dark-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-2">
                  <category.icon size={12} />
                  {category.category}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.links.map((link) => (
                    <button
                      key={`${link.pane}-${link.tab}`}
                      onClick={() => {
                        navigateToPaneTab(link.pane, link.tab)
                        animateToHeight(0)
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-100/50 hover:bg-dark-200 transition-colors text-sm active:scale-95"
                    >
                      <link.icon size={14} className="text-primary" />
                      <span>{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="h-screen w-screen bg-dark text-white overflow-hidden">
      {/* Main content area */}
      <main className="h-full w-full">
        {children}
      </main>
      
      {/* Drawer with integrated swipe-to-open */}
      <DrawerWithSwipe />
    </div>
  )
}
