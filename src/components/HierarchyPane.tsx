import React, { useCallback, useState, useRef, useEffect } from 'react'
import { Plus, ArrowLeft, Folder, CheckSquare, Search, X, Edit, Trash2 } from 'lucide-react'
import { ResourceListView } from './ResourceListView'
import { ResourceBreadcrumbs } from './ResourceBreadcrumbs'
import { ResourceForm } from './ResourceForm'
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
// CONTEXT MENU COMPONENT
// ============================================================================

function ResourceContextMenu({ accentColor }: { accentColor: string }) {
  const { contextMenu, hideContextMenu } = useResourceContextMenu()
  const { openEditForm } = useResourceForm()
  const deleteResourceMutation = useDeleteResource()
  const menuRef = useRef<HTMLDivElement>(null)

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
    return null
  }

  const handleEdit = () => {
    openEditForm(contextMenu.resource!)
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

  // Position the menu, ensuring it stays within viewport
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: Math.min(contextMenu.y, window.innerHeight - 120),
    left: Math.min(contextMenu.x, window.innerWidth - 160),
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        style={menuStyle}
        className="bg-dark-100 border border-dark-300 rounded-lg shadow-xl overflow-hidden min-w-[150px]"
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
          onClick={handleDelete}
          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-red-500/10 transition-colors text-left"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
          <span className="text-sm text-red-400">Delete</span>
        </button>
      </motion.div>
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

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.show && (
          <ResourceContextMenu accentColor={accentColor} />
        )}
      </AnimatePresence>

      {/* Resource Form */}
      <ResourceForm accentColor={accentColor} />
    </div>
  )
}
