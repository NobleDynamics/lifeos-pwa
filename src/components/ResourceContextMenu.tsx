/**
 * ResourceContextMenu
 * 
 * Context menu for resource actions (Edit, Delete).
 * Uses the useResourceContextMenu store for state management.
 * 
 * @module components/ResourceContextMenu
 */

import React, { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { useResourceContextMenu, useResourceForm } from '@/store/useResourceStore'
import { useDeleteResource } from '@/hooks/useResourceData'
import { cn } from '@/lib/utils'

export function ResourceContextMenu() {
  const { contextMenu, hideContextMenu } = useResourceContextMenu()
  const { openEditForm } = useResourceForm()
  
  const deleteResourceMutation = useDeleteResource()
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!contextMenu.show || !contextMenu.resource) return null

  const resource = contextMenu.resource

  const handleEdit = () => {
    openEditForm(resource)
    hideContextMenu()
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!resource) return

    try {
      await deleteResourceMutation.mutateAsync({
        id: resource.id,
        parentId: resource.parent_id,
      })
    } catch (error) {
      console.error('Error deleting resource:', error)
    }

    setShowDeleteConfirm(false)
    hideContextMenu()
  }

  const handleCancel = () => {
    setShowDeleteConfirm(false)
    hideContextMenu()
  }

  const getTypeLabel = () => {
    switch (resource.type) {
      case 'folder': return 'Folder'
      case 'project': return 'Project'
      case 'task': return 'Task'
      default: return 'Item'
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        onClick={handleCancel}
      />

      {/* Context Menu */}
      <div
        className={cn(
          "fixed z-50 min-w-[160px] py-2 rounded-lg shadow-lg",
          "bg-dark-100 border border-dark-300"
        )}
        style={{
          left: Math.min(contextMenu.x, window.innerWidth - 180),
          top: Math.min(contextMenu.y, window.innerHeight - 150)
        }}
      >
        {!showDeleteConfirm ? (
          <>
            <button
              onClick={handleEdit}
              className={cn(
                "w-full px-4 py-2.5 text-left text-sm",
                "flex items-center gap-3",
                "text-white hover:bg-dark-200 transition-colors"
              )}
            >
              <Edit className="w-4 h-4" />
              Edit {getTypeLabel()}
            </button>
            <button
              onClick={handleDeleteClick}
              className={cn(
                "w-full px-4 py-2.5 text-left text-sm",
                "flex items-center gap-3",
                "text-red-400 hover:bg-dark-200 transition-colors"
              )}
            >
              <Trash2 className="w-4 h-4" />
              Delete {getTypeLabel()}
            </button>
          </>
        ) : (
          <div className="px-4 py-2">
            <p className="text-sm text-white mb-3">
              Delete "{resource.title}"?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className={cn(
                  "flex-1 px-3 py-1.5 text-sm rounded",
                  "bg-dark-200 text-dark-500 hover:bg-dark-300"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={cn(
                  "flex-1 px-3 py-1.5 text-sm rounded",
                  "bg-red-600 text-white hover:bg-red-700"
                )}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
