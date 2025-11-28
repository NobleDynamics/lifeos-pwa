import React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { useResourceNavigation } from '@/store/useResourceStore'
import { cn } from '@/lib/utils'

interface ResourceBreadcrumbsProps {
  accentColor?: string
}

/**
 * Breadcrumb navigation component for the resource hierarchy
 * Builds clickable breadcrumbs from the path stack
 */
export function ResourceBreadcrumbs({ accentColor = '#00EAFF' }: ResourceBreadcrumbsProps) {
  const { pathStack, navigateToBreadcrumb, navigateToRoot, isAtRoot } = useResourceNavigation()

  // Don't render if at root
  if (isAtRoot) {
    return null
  }

  return (
    <nav 
      className="flex items-center space-x-1 text-sm overflow-x-auto scrollbar-hide py-1"
      aria-label="Breadcrumb"
    >
      {/* Root/Home button */}
      <button
        onClick={navigateToRoot}
        className={cn(
          "flex items-center space-x-1 px-2 py-1 rounded-md",
          "text-dark-400 hover:text-white hover:bg-dark-200/50",
          "transition-colors whitespace-nowrap flex-shrink-0"
        )}
        aria-label="Go to root"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Root</span>
      </button>

      {/* Path items */}
      {pathStack.map((item, index) => {
        const isLast = index === pathStack.length - 1
        
        return (
          <React.Fragment key={item.id}>
            {/* Separator */}
            <ChevronRight className="w-4 h-4 text-dark-500 flex-shrink-0" />
            
            {/* Breadcrumb item */}
            <button
              onClick={() => navigateToBreadcrumb(index)}
              disabled={isLast}
              className={cn(
                "px-2 py-1 rounded-md transition-colors whitespace-nowrap",
                "max-w-[150px] truncate",
                isLast 
                  ? "text-white font-medium cursor-default" 
                  : "text-dark-400 hover:text-white hover:bg-dark-200/50"
              )}
              style={isLast ? { color: accentColor } : undefined}
              title={item.title}
            >
              {item.title}
            </button>
          </React.Fragment>
        )
      })}
    </nav>
  )
}

/**
 * Compact breadcrumb variant for smaller spaces
 * Shows only the current folder name with a back indicator
 */
export function ResourceBreadcrumbsCompact({ accentColor = '#00EAFF' }: ResourceBreadcrumbsProps) {
  const { pathStack, navigateBack, isAtRoot } = useResourceNavigation()

  if (isAtRoot) {
    return (
      <span className="text-sm text-dark-400">
        Root
      </span>
    )
  }

  const currentItem = pathStack[pathStack.length - 1]
  const parentItem = pathStack.length > 1 ? pathStack[pathStack.length - 2] : null

  return (
    <div className="flex items-center space-x-2 text-sm">
      <button
        onClick={navigateBack}
        className="flex items-center space-x-1 text-dark-400 hover:text-white transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        <span className="truncate max-w-[100px]">
          {parentItem?.title || 'Root'}
        </span>
      </button>
      <ChevronRight className="w-4 h-4 text-dark-500" />
      <span 
        className="font-medium truncate max-w-[150px]"
        style={{ color: accentColor }}
      >
        {currentItem?.title}
      </span>
    </div>
  )
}
