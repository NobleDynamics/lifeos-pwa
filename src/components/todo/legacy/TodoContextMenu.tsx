import React, { useState } from 'react'
import { Edit, Trash2, X } from 'lucide-react'
import { useTodoContextMenu, useTodoUI, useTodoNavigation } from '@/store/useTodoStore'
import { useDeleteCategory, useDeleteList, useDeleteItem } from '@/hooks/useTodoData'
import { TodoCategory, TodoList, TodoItem } from '@/types/database'
import { cn } from '@/lib/utils'

export function TodoContextMenu() {
  const { contextMenu, hideContextMenu } = useTodoContextMenu()
  const { setShowForm, setEditingItem } = useTodoUI()
  const { selectedCategoryId, selectedListId } = useTodoNavigation()
  
  const deleteCategoryMutation = useDeleteCategory()
  const deleteListMutation = useDeleteList()
  const deleteItemMutation = useDeleteItem()
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  if (!contextMenu.show || !contextMenu.item) return null

  const handleEdit = () => {
    setEditingItem(contextMenu.item)
    setShowForm(contextMenu.type as 'category' | 'list' | 'item')
    hideContextMenu()
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    if (!contextMenu.item || !contextMenu.type) return

    try {
      if (contextMenu.type === 'category') {
        await deleteCategoryMutation.mutateAsync(contextMenu.item.id)
      } else if (contextMenu.type === 'list') {
        await deleteListMutation.mutateAsync({
          id: contextMenu.item.id,
          categoryId: selectedCategoryId || ''
        })
      } else if (contextMenu.type === 'item') {
        await deleteItemMutation.mutateAsync({
          id: contextMenu.item.id,
          listId: selectedListId || ''
        })
      }
    } catch (error) {
      console.error('Error deleting:', error)
    }

    setShowDeleteConfirm(false)
    hideContextMenu()
  }

  const handleCancel = () => {
    setShowDeleteConfirm(false)
    hideContextMenu()
  }

  const getItemName = () => {
    if (!contextMenu.item) return ''
    return (contextMenu.item as any).name || 'this item'
  }

  const getTypeLabel = () => {
    switch (contextMenu.type) {
      case 'category': return 'Category'
      case 'list': return 'List'
      case 'item': return 'Task'
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
              Delete "{getItemName()}"?
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
