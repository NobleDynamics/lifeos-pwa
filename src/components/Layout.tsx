import { ReactNode, useRef, useState, useCallback, useEffect } from 'react'
import { useAppStore, type PaneType } from '@/store/useAppStore'
import { useBackButton } from '@/hooks/useBackButton'
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
  FileText,
  Camera,
  Mic,
  Code
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
  sandbox: { icon: Code, label: 'Sandbox', color: 'text-orange-400' },
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

// Drawer configuration
const VELOCITY_THRESHOLD = 0.5 // px/ms for flick detection
const CLOSE_THRESHOLD = 0.25 // Close if height drops below 25%
const ANIMATION_DURATION = 300 // ms

// Cyan glow style for the handle elements - dark icon with cyan glow behind
const cyanGlowStyle = {
  color: '#0a0a0f', // Dark icon
  filter: 'drop-shadow(0 0 4px #00eaff) drop-shadow(0 0 8px #00eaff) drop-shadow(0 0 12px #00eaff)',
}

const cyanGlowBarStyle = {
  backgroundColor: '#00eaff',
  boxShadow: '0 0 4px #00eaff, 0 0 8px #00eaff, 0 0 12px #00eaff, 0 0 18px rgba(0, 234, 255, 0.7)',
}

// Combined Drawer + Swipe Handler - drawer follows finger in real-time
function DrawerWithSwipe() {
  const { isDrawerOpen, closeDrawer, navigateToPaneTab, navigateToPane, paneOrder } = useAppStore()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [currentHeight, setCurrentHeight] = useState(0) // 0-1 representing percentage
  const [isAnimating, setIsAnimating] = useState(false)
  const [isAtScrollTop, setIsAtScrollTop] = useState(true)
  const [isVisible, setIsVisible] = useState(false) // Controls whether drawer renders
  const [showCameraPopup, setShowCameraPopup] = useState(false)
  const [isMicListening, setIsMicListening] = useState(false)
  
  // Global touch handler for bottom edge detection - now starts a drag instead of instant open
  useEffect(() => {
    const BOTTOM_ZONE_HEIGHT = 80 // px from bottom of screen
    let startY = 0
    let startTime = 0
    let isBottomSwipe = false
    
    const handleGlobalTouchStart = (e: TouchEvent) => {
      // Ignore if drawer is already open/visible
      if (isDrawerOpen || isVisible || isDragging) return
      
      const touch = e.touches[0]
      const screenHeight = window.innerHeight
      
      // Check if touch started in bottom zone
      if (touch.clientY > screenHeight - BOTTOM_ZONE_HEIGHT) {
        startY = touch.clientY
        startTime = Date.now()
        isBottomSwipe = true
      }
    }
    
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (!isBottomSwipe || isDrawerOpen || isVisible) return
      
      const touch = e.touches[0]
      const deltaY = startY - touch.clientY // Positive = swiping up
      
      // Need to swipe up at least 20px to start opening
      if (deltaY > 20) {
        // Start opening drawer - show it and set initial height based on drag
        setIsVisible(true)
        const screenHeight = window.innerHeight
        const height = Math.min(1, deltaY / screenHeight)
        setCurrentHeight(height)
        setIsDragging(true)
        
        // Update gesture ref for proper end handling
        gestureRef.current = {
          startY: startY,
          startHeight: 0,
          startTime: startTime,
          lastY: touch.clientY,
          lastTime: Date.now(),
          isFromContent: false,
          isFromBottomEdge: true,
        }
        
        isBottomSwipe = false // Transition to drawer's own gesture handling
      }
    }
    
    const handleGlobalTouchEnd = () => {
      isBottomSwipe = false
    }
    
    document.addEventListener('touchstart', handleGlobalTouchStart, { passive: true })
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: true })
    document.addEventListener('touchend', handleGlobalTouchEnd, { passive: true })
    
    return () => {
      document.removeEventListener('touchstart', handleGlobalTouchStart)
      document.removeEventListener('touchmove', handleGlobalTouchMove)
      document.removeEventListener('touchend', handleGlobalTouchEnd)
    }
  }, [isDrawerOpen, isVisible, isDragging])
  
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
    // Velocity check: positive = finger moving down (closing), negative = moving up (opening)
    // Note: in handleEnd, velocity is calculated as (startY - lastY) / time
    // If dragging down: lastY > startY, so velocity is negative
    // If dragging up: lastY < startY, so velocity is positive
    
    // Strong velocity in either direction takes priority
    if (Math.abs(velocity) > VELOCITY_THRESHOLD) {
      // Velocity > 0 means finger moved UP (startY > lastY), which is OPENING
      // Velocity < 0 means finger moved DOWN (startY < lastY), which is CLOSING
      return velocity > 0 ? 1 : 0
    }
    
    // Otherwise use position threshold - close if below 25% height
    return height > CLOSE_THRESHOLD ? 1 : 0
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
    
    const { startY, lastY, isFromBottomEdge } = gestureRef.current
    
    // Calculate velocity based on last movement direction
    // Positive velocity = finger moved UP from start (opening direction)
    // Negative velocity = finger moved DOWN from start (closing direction)
    const deltaY = startY - lastY
    const velocity = deltaY / 100 // Normalize
    
    setIsDragging(false)
    
    // If barely opened during bottom edge swipe, close it
    if (isFromBottomEdge && currentHeight < 0.15) {
      animateToHeight(0)
      return
    }
    
    // Find target snap point based on current height and direction
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
  
  // Calculate pixel height - always show at least the handle (60px)
  const HANDLE_HEIGHT = 60
  const fullHeightPx = Math.min(currentHeight, 1) * getMaxHeight()
  const heightPx = currentHeight > 0 ? fullHeightPx : HANDLE_HEIGHT
  const isExpanded = isVisible || isDragging || currentHeight > 0
  
  return (
    <>
      {/* Backdrop - only show when expanded */}
      {isExpanded && currentHeight > 0.05 && (
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
      
      {/* Drawer - always visible, at least showing handle */}
      <div
        ref={containerRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-dark-50/98 backdrop-blur-xl rounded-t-3xl border-t border-white/10 overflow-hidden"
        style={{
          height: `${Math.max(heightPx, HANDLE_HEIGHT)}px`,
          transition: isDragging ? 'none' : `height ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.1, 0.25, 1)`,
          willChange: 'height',
        }}
      >
        {/* Drag Handle Area - with Camera, Handle, Mic */}
        <div className="select-none">
          {/* Handle row with Camera, grip line, Mic */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            {/* Camera button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowCameraPopup(true)
                setTimeout(() => setShowCameraPopup(false), 2000)
              }}
              className="p-2 rounded-full active:scale-95 transition-transform"
              style={cyanGlowStyle}
            >
              <Camera size={22} />
            </button>
            
            {/* Draggable handle area */}
            <div
              className="flex-1 flex justify-center cursor-grab active:cursor-grabbing py-2 mx-4"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleMouseDown}
            >
              <div 
                className="w-16 h-1 rounded-full"
                style={cyanGlowBarStyle}
              />
            </div>
            
            {/* Mic button */}
            <button
              onTouchStart={(e) => {
                e.stopPropagation()
                setIsMicListening(true)
              }}
              onTouchEnd={() => setIsMicListening(false)}
              onMouseDown={(e) => {
                e.stopPropagation()
                setIsMicListening(true)
              }}
              onMouseUp={() => setIsMicListening(false)}
              onMouseLeave={() => setIsMicListening(false)}
              className="p-2 rounded-full active:scale-95 transition-transform"
              style={cyanGlowStyle}
            >
              <Mic size={22} />
            </button>
          </div>
          
          {/* Header - only show when expanded */}
          {currentHeight > 0.1 && (
            <div className="flex items-center justify-between px-6 pb-3">
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
          )}
        </div>
          
        {/* Scrollable content - only show when expanded */}
        {currentHeight > 0.1 && (
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
        )}
      </div>
      
      {/* Camera coming soon popup */}
      {showCameraPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-dark-100 border border-cyan-500/30 rounded-2xl px-6 py-4 shadow-lg" style={{ boxShadow: '0 0 20px rgba(0, 234, 255, 0.3)' }}>
            <p className="text-cyan-400 font-medium">📷 Camera coming soon</p>
          </div>
        </div>
      )}
      
      {/* Mic listening popup */}
      {isMicListening && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="bg-dark-100 border border-cyan-500/30 rounded-2xl px-6 py-4 shadow-lg animate-pulse" style={{ boxShadow: '0 0 20px rgba(0, 234, 255, 0.3)' }}>
            <p className="text-cyan-400 font-medium">🎙️ Listening...</p>
          </div>
        </div>
      )}
    </>
  )
}

// Export drawer height for use in other components
export const DRAWER_HANDLE_HEIGHT = 60

export default function Layout({ children }: LayoutProps) {
  // Initialize back button handler for Android hardware back button
  useBackButton()
  
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
