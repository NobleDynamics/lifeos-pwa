import React, { useMemo } from 'react'
import { 
  Folder, 
  CheckCircle, 
  Circle, 
  PlayCircle, 
  Plus,
  MoreVertical,
  MapPin,
  Users
} from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Resource, ResourceStatus } from '@/types/database'
import { useResources, useAllResources, useCycleResourceStatus } from '@/hooks/useResourceData'
import { 
  useResourceNavigation, 
  useResourceSearch, 
  useResourceContextMenu,
  useResourceForm
} from '@/store/useResourceStore'
import { usePrimaryHousehold, useHouseholdProfiles, Profile } from '@/hooks/useIdentity'
import { useLongPress } from '@/hooks/useLongPress'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/shared'

// ============================================================================
// TYPES
// ============================================================================

interface ResourceListViewProps {
  accentColor?: string
}

interface FolderRowProps {
  resource: Resource
  childCount: number
  accentColor: string
  onClick: () => void
  onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void
}

interface TaskRowProps {
  resource: Resource
  accentColor: string
  profilesMap: Map<string, Profile>
  onTap: () => void
  onContextMenu: (e: React.MouseEvent | React.TouchEvent) => void
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the color from resource metadata or use default
 */
function getResourceColor(resource: Resource, defaultColor: string): string {
  const meta = resource.meta_data as Record<string, unknown>
  return (meta?.color as string) || defaultColor
}

/**
 * Get the icon name from resource metadata
 */
function getResourceIcon(resource: Resource): string | null {
  const meta = resource.meta_data as Record<string, unknown>
  return (meta?.icon as string) || null
}

/**
 * Render a Lucide icon by name dynamically
 */
function DynamicIcon({ name, className, style }: { name: string; className?: string; style?: React.CSSProperties }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name]
  if (!IconComponent) {
    return <Folder className={className} style={style} />
  }
  return <IconComponent className={className} style={style} />
}

/**
 * Check if a resource is a navigable container (folder or project)
 */
function isNavigable(resource: Resource): boolean {
  return resource.type === 'folder' || resource.type === 'project'
}

// ============================================================================
// FOLDER ROW COMPONENT
// ============================================================================

function FolderRow({ 
  resource, 
  childCount, 
  accentColor, 
  onClick, 
  onContextMenu 
}: FolderRowProps) {
  const color = getResourceColor(resource, accentColor)
  
  const longPressHandlers = useLongPress(
    (e) => onContextMenu(e as React.MouseEvent | React.TouchEvent),
    { threshold: 500 }
  )

  return (
    <div
      className={cn(
        "relative bg-dark-100 rounded-lg",
        "p-4 cursor-pointer transition-all duration-300",
        // Cyberpunk neon glow effect for folders
        "border border-opacity-30 hover:border-opacity-60",
        "shadow-[0_0_10px_rgba(0,234,255,0.15)] hover:shadow-[0_0_20px_rgba(0,234,255,0.3)]",
        "before:absolute before:inset-0 before:rounded-lg before:pointer-events-none",
        "before:bg-gradient-to-r before:from-transparent before:via-[rgba(0,234,255,0.03)] before:to-transparent"
      )}
      style={{ 
        borderColor: `${color}50`,
        boxShadow: `0 0 10px ${color}20, inset 0 0 20px ${color}05`
      }}
      onClick={onClick}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e)
      }}
      {...longPressHandlers}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {/* Folder Icon with glow */}
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center relative"
            style={{ 
              backgroundColor: `${color}20`,
              boxShadow: `0 0 8px ${color}30`
            }}
          >
            {getResourceIcon(resource) ? (
              <DynamicIcon
                name={getResourceIcon(resource)!}
                className="w-5 h-5"
                style={{ color }}
              />
            ) : (
              <Folder
                className="w-5 h-5"
                style={{ color }}
              />
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">
              {resource.title}
            </h3>
            {resource.description && (
              <p className="text-xs text-dark-500 mt-0.5 truncate">
                {resource.description}
              </p>
            )}
            <div className="flex items-center space-x-3 mt-1.5">
              <span className="text-xs text-dark-400">
                {childCount} {childCount === 1 ? 'item' : 'items'}
              </span>
              {resource.meta_data && (resource.meta_data as Record<string, unknown>).is_shared && (
                <span 
                  className="inline-flex items-center justify-center w-5 h-5 rounded"
                  style={{ backgroundColor: `${color}20` }}
                  title="Shared with Household"
                >
                  <Users className="w-3 h-3" style={{ color }} />
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Right side: Context menu button */}
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onContextMenu(e)
            }}
            className="p-2 text-dark-400 hover:text-white rounded-full hover:bg-dark-200/50 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// TASK ROW COMPONENT
// ============================================================================

function TaskRow({ 
  resource, 
  accentColor, 
  profilesMap,
  onTap, 
  onContextMenu 
}: TaskRowProps) {
  const longPressHandlers = useLongPress(
    (e) => onContextMenu(e as React.MouseEvent | React.TouchEvent),
    { threshold: 500 }
  )

  // Get assignee profile if exists
  const meta = resource.meta_data as Record<string, unknown>
  const assigneeId = meta?.assignee_id as string | undefined
  const assignee = assigneeId ? profilesMap.get(assigneeId) : undefined

  const getStatusIcon = () => {
    switch (resource.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'archived':
        return <CheckCircle className="w-5 h-5 text-dark-400" />
      case 'active':
      default:
        // Check meta_data for legacy status or in_progress state
        const meta = resource.meta_data as Record<string, unknown>
        if (meta?.legacy_status === 'in_progress' || meta?.started_at) {
          return <PlayCircle className="w-5 h-5 text-blue-500" />
        }
        return <Circle className="w-5 h-5 text-dark-400" />
    }
  }

  const getStatusColor = () => {
    switch (resource.status) {
      case 'completed':
        return 'text-green-500'
      case 'archived':
        return 'text-dark-400'
      case 'active':
      default:
        const meta = resource.meta_data as Record<string, unknown>
        if (meta?.legacy_status === 'in_progress' || meta?.started_at) {
          return 'text-blue-500'
        }
        return 'text-dark-400'
    }
  }

  const getStatusLabel = () => {
    switch (resource.status) {
      case 'completed':
        return 'Completed'
      case 'archived':
        return 'Archived'
      case 'active':
      default:
        const meta = resource.meta_data as Record<string, unknown>
        if (meta?.legacy_status === 'in_progress' || meta?.started_at) {
          return 'In Progress'
        }
        return 'Not Started'
    }
  }

  const isOverdue = () => {
    if (!resource.scheduled_at) return false
    return new Date(resource.scheduled_at) < new Date() && resource.status !== 'completed'
  }

  return (
    <div
      className={cn(
        "bg-dark-100 rounded-lg border border-dark-300",
        "p-4 cursor-pointer transition-all duration-200",
        "hover:shadow-md hover:border-dark-200 active:scale-[0.99]",
        "select-none",
        resource.status === 'completed' && 'opacity-60'
      )}
      onClick={onTap}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(e)
      }}
      {...longPressHandlers}
    >
      <div className="flex items-center space-x-3">
        {/* Checkbox Icon (left side) */}
        <div className="flex-shrink-0 pointer-events-none">
          {getStatusIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-sm font-medium text-white truncate",
            resource.status === 'completed' && 'line-through text-dark-400'
          )}>
            {resource.title}
          </h3>
          {resource.description && (
            <p className="text-xs text-dark-500 mt-0.5 truncate">
              {resource.description}
            </p>
          )}
          <div className="flex items-center space-x-3 mt-1.5 flex-wrap gap-y-1">
            <span className={`text-xs ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
            {resource.scheduled_at && (
              <span className={cn(
                "text-xs",
                isOverdue() ? "text-red-400" : "text-dark-400"
              )}>
                Due: {new Date(resource.scheduled_at).toLocaleDateString()}
              </span>
            )}
            {(resource.meta_data as Record<string, unknown>)?.location_name && (
              <span className="text-xs text-dark-400 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {(resource.meta_data as Record<string, unknown>).location_name as string}
              </span>
            )}
          </div>
        </div>
        
        {/* Assignee Avatar */}
        {assignee && (
          <div 
            className="flex-shrink-0" 
            title={`Assigned to ${assignee.full_name || 'Unknown'}`}
          >
            <Avatar
              src={assignee.avatar_url}
              name={assignee.full_name}
              size="sm"
            />
          </div>
        )}
        
        {/* Context menu button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onContextMenu(e)
          }}
          className="p-2 text-dark-400 hover:text-white rounded-full hover:bg-dark-200 transition-colors flex-shrink-0"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ============================================================================
// LOADING SKELETON
// ============================================================================

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div 
          key={i} 
          className="bg-dark-100 rounded-lg border border-dark-300 p-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-dark-200 rounded-lg" />
              <div className="flex-1">
                <div className="h-4 bg-dark-200 rounded w-32 mb-2" />
                <div className="h-3 bg-dark-200 rounded w-20" />
              </div>
            </div>
            <div className="h-5 w-5 bg-dark-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// EMPTY STATE
// ============================================================================

interface EmptyStateProps {
  isAtRoot: boolean
  accentColor: string
  onCreateFolder: () => void
  onCreateTask: () => void
}

function EmptyState({ isAtRoot, accentColor, onCreateFolder, onCreateTask }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Folder className="w-12 h-12 text-dark-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-white mb-2">
        {isAtRoot ? 'No Resources Yet' : 'This Folder is Empty'}
      </h3>
      <p className="text-dark-500 mb-6">
        {isAtRoot 
          ? 'Create your first folder to start organizing' 
          : 'Add folders or tasks to organize your work'
        }
      </p>
      <div className="flex items-center justify-center space-x-3">
        <button
          onClick={onCreateFolder}
          className={cn(
            "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-white",
            "hover:opacity-90 transition-opacity"
          )}
          style={{ backgroundColor: accentColor }}
        >
          <Folder className="w-4 h-4 mr-2" />
          New Folder
        </button>
        {!isAtRoot && (
          <button
            onClick={onCreateTask}
            className={cn(
              "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg",
              "border border-dark-300 text-white hover:bg-dark-200 transition-colors"
            )}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Task
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ResourceListView({ accentColor = '#00EAFF' }: ResourceListViewProps) {
  const { currentParentId, navigateInto, isAtRoot } = useResourceNavigation()
  const { searchQuery } = useResourceSearch()
  const { showContextMenu } = useResourceContextMenu()
  const { openCreateForm } = useResourceForm()
  
  // Fetch resources for current level
  const { data: rawResources = [], isLoading } = useResources(currentParentId)
  
  // Fetch all resources for counting children
  const { data: allResources = [] } = useAllResources()
  
  // Fetch household profiles for assignee avatars
  const { activeHouseholdId } = usePrimaryHousehold()
  const { data: householdProfiles = [] } = useHouseholdProfiles(activeHouseholdId)
  
  // Create a map for quick profile lookup
  const profilesMap = useMemo(() => {
    const map = new Map<string, Profile>()
    householdProfiles.forEach(profile => map.set(profile.id, profile))
    return map
  }, [householdProfiles])
  
  // Cycle status mutation
  const cycleStatusMutation = useCycleResourceStatus()

  // Filter resources by search query
  const resources = useMemo(() => {
    if (!searchQuery.trim()) return rawResources
    
    const query = searchQuery.toLowerCase()
    return rawResources.filter(resource =>
      resource.title.toLowerCase().includes(query) ||
      resource.description?.toLowerCase().includes(query)
    )
  }, [rawResources, searchQuery])

  // Get child count for a resource
  const getChildCount = (resourceId: string): number => {
    return allResources.filter(r => r.parent_id === resourceId).length
  }

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent | React.TouchEvent, resource: Resource) => {
    e.preventDefault()
    e.stopPropagation()
    
    let x = 0, y = 0
    if ('touches' in e) {
      x = e.touches[0]?.clientX || 0
      y = e.touches[0]?.clientY || 0
    } else {
      x = (e as React.MouseEvent).clientX
      y = (e as React.MouseEvent).clientY
    }
    
    showContextMenu(x, y, resource)
  }

  // Handle task tap (cycle status)
  const handleTaskTap = async (resource: Resource) => {
    await cycleStatusMutation.mutateAsync({ resource })
  }

  // Handle folder click (navigate into)
  const handleFolderClick = (resource: Resource) => {
    navigateInto(resource)
  }

  // Loading state
  if (isLoading && resources.length === 0) {
    return <LoadingSkeleton />
  }

  // Empty state
  if (resources.length === 0) {
    return (
      <EmptyState 
        isAtRoot={isAtRoot}
        accentColor={accentColor}
        onCreateFolder={() => openCreateForm('folder')}
        onCreateTask={() => openCreateForm('task')}
      />
    )
  }

  // Sort: folders first, then tasks, both alphabetically
  const sortedResources = [...resources].sort((a, b) => {
    const aIsFolder = isNavigable(a)
    const bIsFolder = isNavigable(b)
    
    if (aIsFolder && !bIsFolder) return -1
    if (!aIsFolder && bIsFolder) return 1
    
    return a.title.localeCompare(b.title)
  })

  return (
    <div className="space-y-3">
      {sortedResources.map((resource) => (
        isNavigable(resource) ? (
          <FolderRow
            key={resource.id}
            resource={resource}
            childCount={getChildCount(resource.id)}
            accentColor={accentColor}
            onClick={() => handleFolderClick(resource)}
            onContextMenu={(e) => handleContextMenu(e, resource)}
          />
        ) : (
          <TaskRow
            key={resource.id}
            resource={resource}
            accentColor={accentColor}
            profilesMap={profilesMap}
            onTap={() => handleTaskTap(resource)}
            onContextMenu={(e) => handleContextMenu(e, resource)}
          />
        )
      ))}
    </div>
  )
}
