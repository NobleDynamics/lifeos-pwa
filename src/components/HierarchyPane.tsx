import React, { useCallback, useState, useRef, useEffect } from 'react'
import { Plus, ArrowLeft, Folder, CheckSquare, Search, X, Edit, Trash2, Info, User, Calendar, Clock } from 'lucide-react'
import { ResourceListView } from './ResourceListView'
import { ResourceBreadcrumbs } from './ResourceBreadcrumbs'
import { ResourceForm } from './ResourceForm'
import { FormSheet } from '@/components/shared/FormSheet'
import { useDeleteResource } from '@/hooks/useResourceData'
import { 
  useResourceNavigation, 
  useResourceSearch, 
  useResourceForm,
  useResourceContextMenu 
} from '@/store/useResourceStore'
import { useAuth } from '@/lib/supabase'
import { useBackButton } from '@/hooks/useBackButton'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { Resource } from '@/types/database'

// ============================================================================
// TYPES
// ============================================================================

interface HierarchyPaneProps {
  accentColor?: string
}

// ============================================================================
// CREATE DROPDOWN COMPONENT
// ============================================================================

interface CreateDropdownProps {
  isOpen: boolean
  onClose: () => void
  onCreateFolder: () => void
  onCreateTask: () => void
  accentColor: string
  anchorRef: React.RefObject<HTMLButtonElement>
}

function CreateDropdown({ 
  isOpen, 
  onClose, 
  onCreateFolder, 
  onCreateTask, 
  accentColor,
  anchorRef 
}: CreateDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, anchorRef])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={dropdownRef}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-48 bg-dark-100 border border-dark-300 rounded-lg shadow-xl z-50 overflow-hidden"
        >
          <button
            onClick={() => {
              onCreateFolder()
              onClose()
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-dark-200 transition-colors text-left"
          >
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}20` }}
            >
              <Folder className="w-4 h-4" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-sm font-medium text-white">New Folder</p>
              <p className="text-xs text-dark-500">Organize resources</p>
            </div>
          </button>
          <div className="h-px bg-dark-300" />
          <button
            onClick={() => {
              onCreateTask()
              onClose()
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-dark-200 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-dark-200">
              <CheckSquare className="w-4 h-4 text-dark-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">New Task</p>
              <p className="text-xs text-dark-500">Add an action item</p>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ============================================================================
// RESOURCE DETAILS SHEET COMPONENT
// ============================================================================

interface ResourceDetailsSheetProps {
  resource: Resource | null
  isOpen: boolean
  onClose: () => void
  accentColor: string
}

function ResourceDetailsSheet({ resource, isOpen, onClose, accentColor }: ResourceDetailsSheetProps) {
  const { user } = useAuth()
  
  if (!resource || !isOpen) return null

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isOwner = user?.id === resource.user_id
  const meta = resource.meta_data as Record<string, unknown>

  return (
    <FormSheet title="Details" onClose={onClose} isOpen={isOpen}>
      <div className="p-4 space-y-4">
        {/* Resource Title */}
        <div className="p-4 bg-dark-200 rounded-lg">
          <h3 className="text-lg font-semibold text-white">{resource.title}</h3>
          {resource.description && (
            <p className="text-sm text-dark-400 mt-1">{resource.description}</p>
          )}
          <div className="mt-2">
            <span 
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="space-y-3">
          {/* Created Date */}
          <div className="flex items-start space-x-3 p-3 bg-dark-200 rounded-lg">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Calendar className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-xs text-dark-500 uppercase tracking-wider">Created</p>
              <p className="text-sm text-white mt-0.5">{formatDate(resource.created_at)}</p>
            </div>
          </div>

          {/* Last Modified Date */}
          <div className="flex items-start space-x-3 p-3 bg-dark-200 rounded-lg">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Clock className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-xs text-dark-500 uppercase tracking-wider">Last Modified</p>
              <p className="text-sm text-white mt-0.5">{formatDate(resource.updated_at)}</p>
            </div>
          </div>

          {/* Owner */}
          <div className="flex items-start space-x-3 p-3 bg-dark-200 rounded-lg">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <User className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-xs text-dark-500 uppercase tracking-wider">Owner</p>
              <p className="text-sm text-white mt-0.5">
                {isOwner ? (
                  <span className="flex items-center gap-1.5">
                    Me
                    <span 
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                      style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                    >
                      You
                    </span>
                  </span>
                ) : (
                  <span className="font-mono text-xs text-dark-400">{resource.user_id.slice(0, 8)}...</span>
                )}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-start space-x-3 p-3 bg-dark-200 rounded-lg">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Info className="w-5 h-5" style={{ color: accentColor }} />
            </div>
            <div>
              <p className="text-xs text-dark-500 uppercase tracking-wider">Status</p>
              <p className="text-sm text-white mt-0.5 capitalize">{resource.status}</p>
            </div>
          </div>

          {/* Shared Status */}
          {meta?.is_shared && (
            <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary">
                ✓ Shared with Household
              </p>
            </div>
          )}
        </div>

        {/* Resource ID (small, for debugging) */}
        <div className="pt-2 border-t border-dark-300">
          <p className="text-xs text-dark-500">
            ID: <span className="font-mono">{resource.id}</span>
          </p>
        </div>
      </div>
    </FormSheet>
  )
}

// ============================================================================
// CONTEXT MENU COMPONENT
// ============================================================================

function ResourceContextMenu({ accentColor }: { accentColor: string }) {
  const { contextMenu, hideContextMenu } = useResourceContextMenu()
  const { openEditForm } = useResourceForm()
  const deleteResourceMutation = useDeleteResource()
  const menuRef = useRef<HTMLDivElement>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [detailsResource, setDetailsResource] = useState<Resource | null>(null)

  // Menu dimensions (approximate)
  const MENU_WIDTH = 160
  const MENU_HEIGHT = 160 // 3 items now

  // Close menu when clicking outside
  useEffect(() => {
    if (!contextMenu.show) return
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideContextMenu()
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [contextMenu.show, hideContextMenu])

  if (!contextMenu.show || !contextMenu.resource) {
    return (
      <>
        {/* Details Sheet - rendered even when menu is hidden */}
        <ResourceDetailsSheet
          resource={detailsResource}
          isOpen={showDetails}
          onClose={() => {
            setShowDetails(false)
            setDetailsResource(null)
          }}
          accentColor={accentColor}
        />
      </>
    )
  }

  const handleEdit = () => {
    openEditForm(contextMenu.resource!)
    hideContextMenu()
  }

  const handleDetails = () => {
    setDetailsResource(contextMenu.resource)
    setShowDetails(true)
    hideContextMenu()
  }

  const handleDelete = async () => {
    if (!contextMenu.resource) return
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${contextMenu.resource.title}"?`
    )
    
    if (confirmed) {
      await deleteResourceMutation.mutateAsync({
        id: contextMenu.resource.id,
        parentId: contextMenu.resource.parent_id,
      })
    }
    hideContextMenu()
  }

  // Calculate position: ABOVE and CENTERED on touch point
  // This prevents the menu from being obscured by the user's finger
  const calculatePosition = () => {
    const { x, y } = contextMenu
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // Center horizontally on touch point, with bounds checking
    let left = x - (MENU_WIDTH / 2)
    left = Math.max(8, Math.min(left, viewportWidth - MENU_WIDTH - 8))
    
    // Position ABOVE the touch point (with some offset to clear finger)
    let top = y - MENU_HEIGHT - 20
    
    // If not enough space above, position below instead
    if (top < 8) {
      top = y + 20
    }
    
    // Ensure it doesn't go off bottom
    top = Math.min(top, viewportHeight - MENU_HEIGHT - 8)
    
    return { top, left }
  }

  const position = calculatePosition()

  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.top,
    left: position.left,
    zIndex: 100,
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50" 
        onClick={hideContextMenu}
      />
      
      {/* Menu */}
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.15 }}
        style={menuStyle}
        className={cn(
          "bg-dark-100 border border-dark-300 rounded-lg shadow-xl overflow-hidden min-w-[150px]",
          "shadow-[0_0_20px_rgba(0,0,0,0.5)]"
        )}
      >
        <button
          onClick={handleEdit}
          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-dark-200 transition-colors text-left"
        >
          <Edit className="w-4 h-4 text-dark-400" />
          <span className="text-sm text-white">Edit</span>
        </button>
        <div className="h-px bg-dark-300" />
        <button
          onClick={handleDetails}
          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-dark-200 transition-colors text-left"
        >
          <Info className="w-4 h-4 text-dark-400" />
          <span className="text-sm text-white">Details</span>
        </button>
        <div className="h-px bg-dark-300" />
        <button
          onClick={handleDelete}
          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">Delete</span>
        </button>
      </motion.div>

      {/* Details Sheet */}
      <ResourceDetailsSheet
        resource={detailsResource}
        isOpen={showDetails}
        onClose={() => {
          setShowDetails(false)
          setDetailsResource(null)
        }}
        accentColor={accentColor}
      />
    </>
  )
}

// ============================================================================
// SEARCH BAR COMPONENT
// ============================================================================

function SearchBar() {
  const { searchQuery, setSearchQuery } = useResourceSearch()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleClear = () => {
    setSearchQuery('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-400" />
      <input
        ref={inputRef}
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search resources..."
        className={cn(
          "w-full pl-10 pr-10 py-2.5 bg-dark-200 border border-dark-300 rounded-lg",
          "text-white placeholder:text-dark-500",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "transition-all"
        )}
      />
      {searchQuery && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-dark-300 rounded-full transition-colors"
        >
          <X className="w-4 h-4 text-dark-400" />
        </button>
      )}
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function HierarchyPane({ accentColor = '#00EAFF' }: HierarchyPaneProps) {
  const { user } = useAuth()
  const { isAtRoot, navigateBack, getCurrentTitle } = useResourceNavigation()
  const { openCreateForm } = useResourceForm()
  const { contextMenu } = useResourceContextMenu()
  
  const [showCreateDropdown, setShowCreateDropdown] = useState(false)
  const createButtonRef = useRef<HTMLButtonElement>(null)

  // Handle Android back button - navigate through hierarchy
  const handleBackButton = useCallback(() => {
    return navigateBack()
  }, [navigateBack])

  useBackButton({
    onCloseModal: handleBackButton
  })

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-dark-500">Please log in to access your resources</p>
        </div>
      </div>
    )
  }

  const handleCreateFolder = () => {
    openCreateForm('folder')
  }

  const handleCreateTask = () => {
    openCreateForm('task')
  }

  const toggleCreateDropdown = () => {
    setShowCreateDropdown(!showCreateDropdown)
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="bg-dark-50 border-b border-dark-300 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Back Button */}
            {!isAtRoot && (
              <button
                onClick={() => navigateBack()}
                className="p-2 text-dark-500 hover:text-white rounded-lg hover:bg-dark-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            
            {/* Title */}
            <h2 className="text-lg font-semibold text-white">
              {getCurrentTitle()}
            </h2>
          </div>
          
          {/* Create Button with Dropdown */}
          <div className="relative">
            <button
              ref={createButtonRef}
              onClick={toggleCreateDropdown}
              className={cn(
                "inline-flex items-center px-3 py-2 text-sm font-medium text-white rounded-lg",
                "hover:opacity-90 transition-all",
                showCreateDropdown && "ring-2 ring-white/20"
              )}
              style={{ backgroundColor: accentColor }}
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </button>
            
            <CreateDropdown
              isOpen={showCreateDropdown}
              onClose={() => setShowCreateDropdown(false)}
              onCreateFolder={handleCreateFolder}
              onCreateTask={handleCreateTask}
              accentColor={accentColor}
              anchorRef={createButtonRef}
            />
          </div>
        </div>

        {/* Breadcrumbs */}
        <ResourceBreadcrumbs accentColor={accentColor} />

        {/* Search Bar */}
        <div className="mt-4">
          <SearchBar />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <ResourceListView accentColor={accentColor} />
      </div>

      {/* Context Menu - always render to preserve Details sheet state */}
      <ResourceContextMenu accentColor={accentColor} />

      {/* Resource Form */}
      <ResourceForm accentColor={accentColor} />
    </div>
  )
}
