import { ReactNode } from 'react'
import { LucideIcon, ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface BreadcrumbItem {
  label: string
  onClick?: () => void
}

export interface ViewShellProps {
  /** Title displayed in the header */
  title: string
  /** Optional icon displayed before the title */
  icon?: LucideIcon
  /** Optional subtitle or description */
  subtitle?: string
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItem[]
  /** Content to render in the main scrollable area */
  children: ReactNode
  /** Action buttons rendered on the right side of the header */
  headerActions?: ReactNode
  /** Footer content (e.g., tab bar, bottom actions) */
  footer?: ReactNode
  /** Additional padding at the bottom for drawer handle */
  bottomPadding?: number
  /** Custom class name for the content area */
  contentClassName?: string
  /** Back button handler - if provided, shows a back button */
  onBack?: () => void
  /** Whether to show the header gradient effect */
  showHeaderGradient?: boolean
  /** Background color/class for the header (default: bg-dark) */
  headerClassName?: string
}

/**
 * ViewShell - Reusable wrapper for all pane layouts
 * 
 * Features:
 * - Consistent header with icon, title, and optional actions
 * - Breadcrumb navigation support
 * - Back button support
 * - Scrollable content area
 * - Optional footer for tab bars or actions
 * - Safe area handling
 * 
 * @example
 * <ViewShell
 *   title="Health"
 *   icon={HeartPulse}
 *   headerActions={<Button>Add</Button>}
 *   footer={<TabBar tabs={tabs} />}
 * >
 *   {children content here}
 * </ViewShell>
 */
export function ViewShell({
  title,
  icon: Icon,
  subtitle,
  breadcrumbs,
  children,
  headerActions,
  footer,
  bottomPadding = 0,
  contentClassName,
  onBack,
  showHeaderGradient = false,
  headerClassName,
}: ViewShellProps) {
  return (
    <div className="h-full flex flex-col bg-dark">
      {/* Header */}
      <div className={cn(
        "px-4 pt-4 pb-2 safe-top flex-shrink-0",
        showHeaderGradient && "bg-gradient-to-b from-dark-100/50 to-transparent",
        headerClassName
      )}>
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 text-xs text-dark-500 mb-2 overflow-x-auto scrollbar-hide">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center gap-1 whitespace-nowrap">
                {index > 0 && <span className="text-dark-600">/</span>}
                {crumb.onClick ? (
                  <button 
                    onClick={crumb.onClick}
                    className="hover:text-primary transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-dark-400">{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
        
        {/* Title Row */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {onBack && (
              <button
                onClick={onBack}
                className="p-1 -ml-1 rounded-lg hover:bg-dark-200 transition-colors"
              >
                <ChevronLeft size={24} className="text-dark-400" />
              </button>
            )}
            {Icon && <Icon size={24} className="text-primary flex-shrink-0" />}
            <div className="min-w-0">
              <h1 className="text-xl font-bold truncate">{title}</h1>
              {subtitle && (
                <p className="text-xs text-dark-500 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          
          {headerActions && (
            <div className="flex items-center gap-2 flex-shrink-0">
              {headerActions}
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content - Scrollable */}
      <div 
        className={cn(
          "flex-1 overflow-y-auto",
          contentClassName
        )}
      >
        {children}
      </div>
      
      {/* Footer */}
      {footer && (
        <div 
          className="flex-shrink-0"
          style={{ paddingBottom: bottomPadding > 0 ? `${bottomPadding}px` : undefined }}
        >
          {footer}
        </div>
      )}
    </div>
  )
}

/**
 * Tab bar component to be used with ViewShell footer
 */
export interface TabItem {
  id: string
  label: string
  icon: LucideIcon
}

export interface TabBarProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
}

export function TabBar({ tabs, activeTab, onTabChange, className }: TabBarProps) {
  return (
    <div className={cn("px-3 pb-2", className)}>
      <div className="flex p-1 bg-dark-100/80 backdrop-blur rounded-xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const TabIcon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-200",
                isActive 
                  ? "bg-primary/20 text-primary shadow-sm" 
                  : "text-dark-500 hover:text-white hover:bg-dark-200/50"
              )}
            >
              <TabIcon size={16} />
              <span className={isActive ? '' : 'hidden sm:inline'}>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
